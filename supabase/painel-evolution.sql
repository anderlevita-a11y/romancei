-- ==============================================================================
-- CONSIGNA EVOLUTION — PAINEL DO DISTRIBUIDOR
-- Execute UMA vez no Supabase: SQL Editor → New query → cole tudo → Run.
-- Pode rodar de novo sem problema (atualiza as funções).
--
-- Tabelas fechadas (RLS sem acesso público). O site e o robô só usam as funções:
--   • robô  → funções ce_robo_*  (exigem o TOKEN DO ROBÔ)
--   • site  → ce_pedir_codigo / ce_entrar / ce_painel / ce_sair
--   • Netlify Functions (chave de serviço) → ce_sessao_info / ce_webhook_aplicar
-- Nenhum dado de cliente (CPF, nome, telefone da cliente) vai para estas tabelas:
-- o robô envia só contagens (tipo do evento + horário).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------- Distribuidores (quem paga e usa o robô) ----------
CREATE TABLE IF NOT EXISTS public.ce_distribuidores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    telefone TEXT NOT NULL UNIQUE,                 -- só dígitos, com 55 (login + envio do código)
    nome TEXT,
    nome_operacao TEXT,
    email TEXT,
    instancia TEXT UNIQUE,                         -- instância da Evolution no robô
    cadastro_id UUID,                              -- automacao_cadastros.id (formulário)
    isento BOOLEAN NOT NULL DEFAULT false,         -- não paga (ex.: a própria Romance Itapema)
    ativacao_paga_em TIMESTAMPTZ,
    assinatura_id TEXT,                            -- subs_... do AbacatePay
    assinatura_status TEXT NOT NULL DEFAULT 'SEM_ASSINATURA',  -- SEM_ASSINATURA | ACTIVE | CANCELLED
    assinatura_metodo TEXT,                        -- PIX | CARD
    ultimo_pagamento_em TIMESTAMPTZ,
    falhas_pagamento INT NOT NULL DEFAULT 0
);

-- Cadastro feito dentro do painel + ativação automática + cashback
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS whatsapp_automacao TEXT;      -- número que o robô vai atender
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS whatsapp_avisos TEXT;         -- recebe avisos de aprovadas
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS vp_usuario TEXT;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS vp_senha_cripto TEXT;         -- trancada no navegador; só o robô abre
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS atendente TEXT;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS aceite_termos BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS cadastro_completo_em TIMESTAMPTZ;
-- aguardando_cadastro | aguardando_pagamento | pendente | criando | testando_login | aguardando_conexao | reconectar | ativo | erro
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS prov_status TEXT NOT NULL DEFAULT 'aguardando_cadastro';
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS prov_erro TEXT;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS prov_codigo TEXT;             -- código de conexão do WhatsApp
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS prov_atualizado_em TIMESTAMPTZ;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS cashback_codigo TEXT UNIQUE;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS cashback_valor_centavos INT;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS cashback_gerado_em TIMESTAMPTZ;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS cashback_usado_em TIMESTAMPTZ;
-- Dados que antes vinham do "Formulário para Automação" (agora tudo no cadastro do painel)
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS tipo_whatsapp TEXT;
-- Quantos números de WhatsApp o distribuidor automatiza (preço: R$ 149 de ativação e R$ 50/mês por número)
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS qtd_numeros INT NOT NULL DEFAULT 1;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ce_distribuidores_qtd_numeros_check') THEN
    ALTER TABLE public.ce_distribuidores ADD CONSTRAINT ce_distribuidores_qtd_numeros_check CHECK (qtd_numeros BETWEEN 1 AND 50);
  END IF;
END $$;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS aparelhos_conectados TEXT;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS vp_analise_credito TEXT;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS apos_aprovacao TEXT;
ALTER TABLE public.ce_distribuidores ADD COLUMN IF NOT EXISTS horario_atendimento TEXT;

-- ---------- Eventos do robô (só contagem, sem dados pessoais) ----------
CREATE TABLE IF NOT EXISTS public.ce_eventos (
    id BIGSERIAL PRIMARY KEY,
    instancia TEXT NOT NULL,
    tipo TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ce_eventos_inst_data_idx ON public.ce_eventos (instancia, criado_em DESC);
-- contato_novo = primeira mensagem de um número novo; conversa_iniciada = lead mandou CPF/nascimento/telefone
DO $$ DECLARE c text; BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.ce_eventos'::regclass AND contype = 'c' LOOP
    EXECUTE format('ALTER TABLE public.ce_eventos DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE public.ce_eventos ADD CONSTRAINT ce_eventos_tipo_check CHECK (tipo IN ('contato_novo','conversa_iniciada',
  'consulta_aprovada','consulta_reprovada','consulta_analise','consulta_erro','endereco_recebido',
  -- CRM: origem, motivo do 1º contato (só a categoria), boas-vindas, lembretes e kit entregue (#entregue)
  'contato_anuncio','boas_vindas','lembrete_enviado','kit_entregue',
  'motivo_como_funciona','motivo_ganhos','motivo_catalogo','motivo_ja_revende','motivo_outro'));

-- ---------- Sinal de vida do robô por instância ----------
CREATE TABLE IF NOT EXISTS public.ce_status_robo (
    instancia TEXT PRIMARY KEY,
    ultimo_sinal TIMESTAMPTZ NOT NULL DEFAULT now(),
    whatsapp_conectado BOOLEAN,
    robo_ativo BOOLEAN
);

-- ---------- Códigos de login (enviados pelo robô no WhatsApp) ----------
CREATE TABLE IF NOT EXISTS public.ce_codigos (
    id BIGSERIAL PRIMARY KEY,
    telefone TEXT NOT NULL,
    codigo_hash TEXT NOT NULL,
    codigo_envio TEXT,                 -- texto puro só até o robô enviar; depois é apagado
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_em TIMESTAMPTZ NOT NULL DEFAULT now() + interval '10 minutes',
    enviado_em TIMESTAMPTZ,
    tentativas INT NOT NULL DEFAULT 0,
    usado BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ce_codigos_tel_idx ON public.ce_codigos (telefone, criado_em DESC);

-- ---------- Sessões do painel ----------
CREATE TABLE IF NOT EXISTS public.ce_sessoes (
    token TEXT PRIMARY KEY,
    distribuidor_id UUID NOT NULL REFERENCES public.ce_distribuidores(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_em TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days'
);

-- ---------- Pagamentos / eventos do AbacatePay ----------
CREATE TABLE IF NOT EXISTS public.ce_pagamentos (
    id BIGSERIAL PRIMARY KEY,
    abacate_evento_id TEXT UNIQUE,     -- id do webhook (descarta repetidos)
    distribuidor_id UUID REFERENCES public.ce_distribuidores(id) ON DELETE SET NULL,
    evento TEXT NOT NULL,
    tipo TEXT,                          -- ativacao | mensalidade
    valor_centavos INT,
    metodo TEXT,
    recibo_url TEXT,
    dev_mode BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Configuração (hash do token do robô) ----------
CREATE TABLE IF NOT EXISTS public.ce_config (
    chave TEXT PRIMARY KEY,
    valor TEXT
);

ALTER TABLE public.ce_distribuidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ce_eventos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ce_status_robo    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ce_codigos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ce_sessoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ce_pagamentos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ce_config         ENABLE ROW LEVEL SECURITY;

-- Só o administrador logado no painel do site enxerga as tabelas diretamente
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ce_distribuidores','ce_eventos','ce_status_robo','ce_pagamentos'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "admin gerencia" ON public.%I', t);
    EXECUTE format('CREATE POLICY "admin gerencia" ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
  END LOOP;
END $$;

-- ==============================================================================
-- AJUDANTES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public._ce_tel(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN length(d) IN (10, 11) THEN '55' || d
    ELSE d END
  FROM (SELECT regexp_replace(coalesce(t, ''), '\D', '', 'g') AS d) x;
$$;

CREATE OR REPLACE FUNCTION public._ce_robo_ok(p_token text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT EXISTS (SELECT 1 FROM public.ce_config
                  WHERE chave = 'robo_token_hash' AND valor IS NOT NULL
                    AND valor = extensions.crypt(coalesce(p_token, ''), valor));
$$;
REVOKE ALL ON FUNCTION public._ce_robo_ok(text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public._ce_liberado(d public.ce_distribuidores) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT d.isento OR (d.ativacao_paga_em IS NOT NULL AND d.assinatura_status = 'ACTIVE');
$$;

-- Decide o próximo passo da ativação automática
CREATE OR REPLACE FUNCTION public._ce_avaliar(p_id uuid) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores;
BEGIN
  SELECT * INTO d FROM public.ce_distribuidores WHERE id = p_id;
  IF d.id IS NULL OR d.cadastro_completo_em IS NULL THEN RETURN; END IF;
  IF d.prov_status IN ('aguardando_cadastro', 'aguardando_pagamento') THEN
    UPDATE public.ce_distribuidores
       SET prov_status = CASE WHEN d.isento OR d.ativacao_paga_em IS NOT NULL THEN 'pendente' ELSE 'aguardando_pagamento' END,
           prov_erro = NULL, prov_atualizado_em = now()
     WHERE id = p_id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public._ce_avaliar(uuid) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public._ce_slug(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' from left(regexp_replace(lower(translate(coalesce(t, ''),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn')),
    '[^a-z0-9]+', '-', 'g'), 22));
$$;

CREATE OR REPLACE FUNCTION public._ce_sessao(p_token text) RETURNS public.ce_distribuidores
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores;
BEGIN
  SELECT di.* INTO d FROM public.ce_sessoes s JOIN public.ce_distribuidores di ON di.id = s.distribuidor_id
   WHERE s.token = p_token AND s.expira_em > now();
  IF d.id IS NULL THEN RAISE EXCEPTION 'sessao_invalida'; END IF;
  RETURN d;
END $$;
REVOKE ALL ON FUNCTION public._ce_sessao(text) FROM public, anon, authenticated;

-- Gera um NOVO token para o robô (rode no SQL Editor: SELECT public.ce_gerar_token_robo();)
-- Guarde o valor no .env do robô em PAINEL_ROBO_TOKEN. O banco guarda só o hash.
CREATE OR REPLACE FUNCTION public.ce_gerar_token_robo() RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE t text := 'ce_robo_' || encode(extensions.gen_random_bytes(24), 'hex');
BEGIN
  INSERT INTO public.ce_config (chave, valor) VALUES ('robo_token_hash', extensions.crypt(t, extensions.gen_salt('bf')))
  ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;
  RETURN t;
END $$;
REVOKE ALL ON FUNCTION public.ce_gerar_token_robo() FROM public, anon, authenticated;

-- ==============================================================================
-- FUNÇÕES DO ROBÔ (todas exigem o token)
-- ==============================================================================

-- Registra/atualiza o distribuidor quando ele é cadastrado no robô (./admin.sh novo)
CREATE OR REPLACE FUNCTION public.ce_robo_registrar(p_token text, p_instancia text, p_telefone text, p_nome text, p_isento boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE tel text := public._ce_tel(p_telefone);
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  IF length(tel) < 12 THEN RAISE EXCEPTION 'telefone_invalido'; END IF;
  UPDATE public.ce_distribuidores SET instancia = NULL WHERE instancia = p_instancia AND telefone <> tel;
  -- cadastrado à mão no robô (./admin.sh): já está configurado
  INSERT INTO public.ce_distribuidores (telefone, nome, instancia, isento, prov_status, prov_atualizado_em)
  VALUES (tel, p_nome, p_instancia, coalesce(p_isento, false), 'ativo', now())
  ON CONFLICT (telefone) DO UPDATE
     SET instancia = EXCLUDED.instancia,
         nome = coalesce(public.ce_distribuidores.nome, EXCLUDED.nome),
         isento = public.ce_distribuidores.isento OR EXCLUDED.isento,
         prov_status = 'ativo', prov_erro = NULL, prov_atualizado_em = now();
END $$;

CREATE OR REPLACE FUNCTION public.ce_robo_evento(p_token text, p_instancia text, p_tipo text)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  INSERT INTO public.ce_eventos (instancia, tipo) VALUES (p_instancia, p_tipo);
END $$;

-- Importa o histórico que o robô já tinha (data/conversas.json) quando o painel ainda não existia.
-- p_itens = [{"tipo":"contato_novo","em":"2026-11-16T10:00:00Z"}, ...]. Não duplica:
--   • contato_novo só entra se a instância ainda não tem nenhum;
--   • os demais só entram se forem anteriores ao primeiro evento já registrado ao vivo.
CREATE OR REPLACE FUNCTION public.ce_robo_importar(p_token text, p_instancia text, p_itens jsonb)
RETURNS int LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE tem_contato boolean; primeiro timestamptz; n int := 0; it jsonb; t text; em timestamptz;
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  IF jsonb_typeof(p_itens) <> 'array' OR jsonb_array_length(p_itens) > 5000 THEN RAISE EXCEPTION 'itens_invalidos'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.ce_eventos WHERE instancia = p_instancia AND tipo = 'contato_novo') INTO tem_contato;
  SELECT min(criado_em) INTO primeiro FROM public.ce_eventos WHERE instancia = p_instancia AND tipo <> 'contato_novo';
  FOR it IN SELECT * FROM jsonb_array_elements(p_itens) LOOP
    t := it->>'tipo';
    BEGIN em := (it->>'em')::timestamptz; EXCEPTION WHEN others THEN CONTINUE; END;
    IF em IS NULL OR em > now() OR em < now() - interval '400 days' THEN CONTINUE; END IF;
    IF t = 'contato_novo' THEN
      IF tem_contato THEN CONTINUE; END IF;
    ELSIF t IN ('conversa_iniciada','consulta_aprovada','consulta_reprovada','consulta_analise','consulta_erro','endereco_recebido') THEN
      IF primeiro IS NOT NULL AND em >= primeiro THEN CONTINUE; END IF;
    ELSE CONTINUE;
    END IF;
    INSERT INTO public.ce_eventos (instancia, tipo, criado_em) VALUES (p_instancia, t, em);
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

-- Sinal de vida. p_itens = [{"instancia":"x","conectado":true,"ativo":true}, ...]
-- Devolve {"instancia": true/false} = se o plano está liberado (só para instâncias cadastradas no painel)
CREATE OR REPLACE FUNCTION public.ce_robo_sinal(p_token text, p_itens jsonb)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE it jsonb; res jsonb := '{}'::jsonb; d public.ce_distribuidores;
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) LOOP
    INSERT INTO public.ce_status_robo (instancia, ultimo_sinal, whatsapp_conectado, robo_ativo)
    VALUES (it->>'instancia', now(), (it->>'conectado')::boolean, (it->>'ativo')::boolean)
    ON CONFLICT (instancia) DO UPDATE
       SET ultimo_sinal = now(), whatsapp_conectado = EXCLUDED.whatsapp_conectado, robo_ativo = EXCLUDED.robo_ativo;
    SELECT * INTO d FROM public.ce_distribuidores WHERE instancia = it->>'instancia';
    IF d.id IS NOT NULL THEN
      res := res || jsonb_build_object(d.instancia, public._ce_liberado(d));
      IF (it->>'conectado')::boolean AND d.prov_status = 'aguardando_conexao' THEN
        UPDATE public.ce_distribuidores SET prov_status = 'ativo', prov_codigo = NULL, prov_erro = NULL, prov_atualizado_em = now() WHERE id = d.id;
        UPDATE public.automacao_cadastros SET status = 'ativado' WHERE id = d.cadastro_id AND status <> 'cancelado';
      END IF;
    END IF;
  END LOOP;
  -- limpeza leve
  DELETE FROM public.ce_codigos WHERE criado_em < now() - interval '1 day';
  DELETE FROM public.ce_sessoes WHERE expira_em < now();
  RETURN res;
END $$;

-- Códigos de login esperando envio
CREATE OR REPLACE FUNCTION public.ce_robo_codigos(p_token text)
RETURNS TABLE (id bigint, telefone text, codigo text) LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  RETURN QUERY SELECT c.id, c.telefone, c.codigo_envio FROM public.ce_codigos c
    WHERE c.codigo_envio IS NOT NULL AND c.enviado_em IS NULL AND c.expira_em > now()
    ORDER BY c.id LIMIT 20;
END $$;

CREATE OR REPLACE FUNCTION public.ce_robo_codigo_enviado(p_token text, p_id bigint)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  UPDATE public.ce_codigos SET enviado_em = now(), codigo_envio = NULL WHERE id = p_id;
END $$;

-- ==============================================================================
-- FUNÇÕES DO SITE (painel do distribuidor)
-- ==============================================================================

-- Pede um código. Resposta sempre 'ok' (não revela se o número existe), ou 'aguarde'.
DROP FUNCTION IF EXISTS public.ce_pedir_codigo(text);
CREATE OR REPLACE FUNCTION public.ce_pedir_codigo(p_telefone text, p_novo boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE tel text := public._ce_tel(p_telefone); d public.ce_distribuidores; cad record; cod text;
BEGIN
  IF length(tel) < 12 OR length(tel) > 13 THEN RAISE EXCEPTION 'telefone_invalido'; END IF;
  IF (SELECT count(*) FROM public.ce_codigos WHERE telefone = tel AND criado_em > now() - interval '15 minutes') >= 3 THEN
    RETURN 'aguarde';
  END IF;

  SELECT * INTO d FROM public.ce_distribuidores WHERE telefone = tel;
  IF d.id IS NULL THEN
    -- Primeiro acesso de quem preencheu o "Formulário para Automação"
    SELECT * INTO cad FROM public.automacao_cadastros a
     WHERE coalesce(a.status, '') <> 'cancelado'
       AND tel IN (public._ce_tel(a.whatsapp_pessoal), public._ce_tel(a.whatsapp_avisos), public._ce_tel(a.whatsapp_automacao))
     ORDER BY a.created_at DESC LIMIT 1;
    IF cad.id IS NULL THEN
      IF NOT coalesce(p_novo, false) THEN PERFORM pg_sleep(0.3); RETURN 'ok'; END IF;
      -- Conta nova pelo painel. Limite geral para ninguém usar o robô para mandar mensagens em massa.
      IF (SELECT count(*) FROM public.ce_distribuidores WHERE created_at > now() - interval '1 hour' AND cadastro_completo_em IS NULL) >= 20 THEN
        RETURN 'aguarde';
      END IF;
      INSERT INTO public.ce_distribuidores (telefone) VALUES (tel) RETURNING * INTO d;
    ELSE
      INSERT INTO public.ce_distribuidores (telefone, nome, nome_operacao, email, cadastro_id, cidade, whatsapp_automacao, whatsapp_avisos, vp_usuario,
              tipo_whatsapp, aparelhos_conectados, vp_analise_credito, apos_aprovacao, horario_atendimento, instancia, prov_status)
      VALUES (tel, cad.nome_completo, cad.nome_operacao, cad.email, cad.id, cad.cidade_uf,
              public._ce_tel(cad.whatsapp_automacao), public._ce_tel(cad.whatsapp_avisos), cad.vp_usuario,
              cad.tipo_whatsapp, cad.aparelhos_conectados, cad.vp_analise_credito, cad.apos_aprovacao, cad.horario_atendimento,
              CASE WHEN cad.instancia IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.ce_distribuidores x WHERE x.instancia = cad.instancia)
                   THEN cad.instancia END,
              CASE WHEN cad.instancia IS NOT NULL THEN 'ativo' ELSE 'aguardando_cadastro' END)
      RETURNING * INTO d;
    END IF;
  END IF;

  cod := lpad((floor(random() * 1000000))::int::text, 6, '0');
  UPDATE public.ce_codigos SET usado = true WHERE telefone = tel AND NOT usado;
  INSERT INTO public.ce_codigos (telefone, codigo_hash, codigo_envio)
  VALUES (tel, extensions.crypt(cod, extensions.gen_salt('bf')), cod);
  RETURN 'ok';
END $$;

-- Confere o código e abre a sessão (30 dias)
CREATE OR REPLACE FUNCTION public.ce_entrar(p_telefone text, p_codigo text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE tel text := public._ce_tel(p_telefone); c public.ce_codigos; d public.ce_distribuidores; t text;
BEGIN
  SELECT * INTO c FROM public.ce_codigos
   WHERE telefone = tel AND NOT usado AND expira_em > now()
   ORDER BY id DESC LIMIT 1;
  -- Erros são DEVOLVIDOS (não lançados) para a contagem de tentativas não ser desfeita
  IF c.id IS NULL THEN PERFORM pg_sleep(0.5); RETURN jsonb_build_object('erro', 'codigo_invalido'); END IF;
  IF c.tentativas >= 5 THEN
    UPDATE public.ce_codigos SET usado = true WHERE id = c.id;
    RETURN jsonb_build_object('erro', 'codigo_bloqueado');
  END IF;
  IF c.codigo_hash <> extensions.crypt(regexp_replace(coalesce(p_codigo, ''), '\D', '', 'g'), c.codigo_hash) THEN
    UPDATE public.ce_codigos SET tentativas = tentativas + 1 WHERE id = c.id;
    PERFORM pg_sleep(0.5);
    RETURN jsonb_build_object('erro', 'codigo_invalido');
  END IF;
  UPDATE public.ce_codigos SET usado = true, codigo_envio = NULL WHERE id = c.id;
  SELECT * INTO d FROM public.ce_distribuidores WHERE telefone = tel;
  IF d.id IS NULL THEN RETURN jsonb_build_object('erro', 'codigo_invalido'); END IF;
  t := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.ce_sessoes (token, distribuidor_id) VALUES (t, d.id);
  RETURN jsonb_build_object('token', t);
END $$;

CREATE OR REPLACE FUNCTION public.ce_sair(p_token text)
RETURNS void LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.ce_sessoes WHERE token = p_token;
$$;

-- Tudo que o painel mostra
CREATE OR REPLACE FUNCTION public.ce_painel(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores; st public.ce_status_robo; cad record;
        semana jsonb; mes jsonb; serie jsonb; pags jsonb; online boolean; liberado boolean;
BEGIN
  d := public._ce_sessao(p_token);
  liberado := public._ce_liberado(d);
  SELECT * INTO st FROM public.ce_status_robo WHERE instancia = d.instancia;
  online := st.instancia IS NOT NULL AND st.ultimo_sinal > now() - interval '5 minutes';
  IF d.instancia IS NULL THEN online := false; END IF;
  -- sempre executa (sem linha, os campos ficam nulos e o registro fica definido)
  SELECT a.nome_operacao, a.cidade_uf, a.status, a.whatsapp_automacao, a.created_at INTO cad
    FROM public.automacao_cadastros a WHERE a.id = d.cadastro_id;

  SELECT coalesce(jsonb_object_agg(tipo, n), '{}'::jsonb) INTO semana FROM (
    SELECT tipo, count(*) n FROM public.ce_eventos
     WHERE instancia = d.instancia AND criado_em > now() - interval '7 days' GROUP BY tipo) x;
  SELECT coalesce(jsonb_object_agg(tipo, n), '{}'::jsonb) INTO mes FROM (
    SELECT tipo, count(*) n FROM public.ce_eventos
     WHERE instancia = d.instancia AND criado_em > now() - interval '30 days' GROUP BY tipo) x;
  SELECT coalesce(jsonb_agg(jsonb_build_object('dia', dia, 'conversas', c, 'dados', dd, 'aprovadas', a, 'reprovadas', r) ORDER BY dia), '[]'::jsonb)
    INTO serie FROM (
      SELECT g.dia::date AS dia,
             count(e.id) FILTER (WHERE e.tipo = 'contato_novo') c,
             count(e.id) FILTER (WHERE e.tipo = 'conversa_iniciada') dd,
             count(e.id) FILTER (WHERE e.tipo = 'consulta_aprovada') a,
             count(e.id) FILTER (WHERE e.tipo = 'consulta_reprovada') r
        FROM generate_series((now() AT TIME ZONE 'America/Sao_Paulo')::date - 29,
                             (now() AT TIME ZONE 'America/Sao_Paulo')::date, interval '1 day') g(dia)
        LEFT JOIN public.ce_eventos e ON e.instancia = d.instancia
              AND (e.criado_em AT TIME ZONE 'America/Sao_Paulo')::date = g.dia::date
       GROUP BY g.dia) s;
  SELECT coalesce(jsonb_agg(jsonb_build_object('data', criado_em, 'tipo', tipo, 'valor', valor_centavos,
                                               'metodo', metodo, 'recibo', recibo_url, 'evento', evento) ORDER BY criado_em DESC), '[]'::jsonb)
    INTO pags FROM (SELECT * FROM public.ce_pagamentos WHERE distribuidor_id = d.id
                     AND evento IN ('checkout.completed','subscription.completed','subscription.renewed','subscription.payment_failed','subscription.cancelled')
                     ORDER BY criado_em DESC LIMIT 12) p;

  RETURN jsonb_build_object(
    'distribuidor', jsonb_build_object('nome', d.nome, 'nome_operacao', coalesce(d.nome_operacao, cad.nome_operacao),
        'telefone', d.telefone, 'instancia', d.instancia, 'cidade', coalesce(d.cidade, cad.cidade_uf),
        'cadastro_status', cad.status, 'cadastro_em', cad.created_at, 'whatsapp_automacao', coalesce(d.whatsapp_automacao, cad.whatsapp_automacao),
        'qtd_numeros', d.qtd_numeros),
    'plano', jsonb_build_object('isento', d.isento, 'liberado', liberado,
        'ativacao_paga', d.ativacao_paga_em IS NOT NULL, 'ativacao_paga_em', d.ativacao_paga_em,
        'assinatura_status', d.assinatura_status, 'assinatura_metodo', d.assinatura_metodo,
        'ultimo_pagamento_em', d.ultimo_pagamento_em, 'falhas_pagamento', d.falhas_pagamento),
    'robo', jsonb_build_object('configurado', d.instancia IS NOT NULL, 'online', online,
        'whatsapp_conectado', st.whatsapp_conectado, 'robo_ativo', st.robo_ativo, 'ultimo_sinal', st.ultimo_sinal,
        'ativo', online AND coalesce(st.whatsapp_conectado, false) AND coalesce(st.robo_ativo, false) AND liberado),
    'semana', semana, 'mes', mes, 'serie', serie, 'pagamentos', pags,
    'cadastro', jsonb_build_object('nome', d.nome, 'nome_operacao', d.nome_operacao, 'email', d.email, 'cidade', d.cidade,
        'whatsapp_automacao', d.whatsapp_automacao, 'whatsapp_avisos', d.whatsapp_avisos, 'vp_usuario', d.vp_usuario,
        'tem_senha_vp', d.vp_senha_cripto IS NOT NULL, 'atendente', d.atendente, 'observacoes', d.observacoes,
        'aceite_termos', d.aceite_termos, 'completo', d.cadastro_completo_em IS NOT NULL,
        'tipo_whatsapp', d.tipo_whatsapp, 'aparelhos_conectados', d.aparelhos_conectados,
        'vp_analise_credito', d.vp_analise_credito, 'apos_aprovacao', d.apos_aprovacao,
        'horario_atendimento', d.horario_atendimento),
    'ativacao', jsonb_build_object('status', d.prov_status, 'erro', d.prov_erro, 'codigo', d.prov_codigo,
        'atualizado_em', d.prov_atualizado_em),
    'cashback', jsonb_build_object('codigo', d.cashback_codigo, 'valor', d.cashback_valor_centavos,
        'gerado_em', d.cashback_gerado_em, 'usado_em', d.cashback_usado_em),
    'chave_publica', (SELECT valor FROM public.ce_config WHERE chave = 'robo_chave_publica'));
END $$;

-- ==============================================================================
-- FUNÇÕES DAS NETLIFY FUNCTIONS (só com a chave de serviço)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.ce_sessao_info(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores;
BEGIN
  d := public._ce_sessao(p_token);
  RETURN jsonb_build_object('id', d.id, 'telefone', d.telefone, 'nome', d.nome, 'email', d.email,
    'isento', d.isento, 'ativacao_paga', d.ativacao_paga_em IS NOT NULL, 'assinatura_status', d.assinatura_status,
    'qtd_numeros', d.qtd_numeros);
END $$;

-- Aplica um evento de webhook do AbacatePay (já validado pela function). Idempotente.
CREATE OR REPLACE FUNCTION public.ce_webhook_aplicar(p jsonb)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE ev text := p->>'event'; dt jsonb := p->'data'; ext text; did uuid; subs text; tipo text := NULL;
        valor int; metodo text; recibo text;
BEGIN
  IF p->>'id' IS NOT NULL AND EXISTS (SELECT 1 FROM public.ce_pagamentos WHERE abacate_evento_id = p->>'id') THEN
    RETURN 'repetido';
  END IF;
  ext := coalesce(dt#>>'{checkout,externalId}', dt#>>'{payment,externalId}');
  subs := dt#>>'{subscription,id}';
  metodo := coalesce(dt#>>'{payerInformation,method}', dt#>>'{subscription,method}');
  valor := coalesce((dt#>>'{payment,paidAmount}')::int, (dt#>>'{checkout,paidAmount}')::int, (dt#>>'{checkout,amount}')::int, (dt#>>'{subscription,amount}')::int);
  recibo := coalesce(dt#>>'{payment,receiptUrl}', dt#>>'{checkout,receiptUrl}');

  -- externalId = ce-ativ-<uuid>[-sufixo] ou ce-mens-<uuid>[-sufixo]
  IF ext ~ '^ce-(ativ|mens)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-[a-z0-9-]+)?$' THEN
    did := substring(ext from '^ce-(?:ativ|mens)-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')::uuid;
  ELSIF subs IS NOT NULL THEN
    SELECT id INTO did FROM public.ce_distribuidores WHERE assinatura_id = subs;
  END IF;

  IF ev = 'checkout.completed' AND coalesce(dt#>>'{checkout,frequency}', 'ONE_TIME') = 'ONE_TIME' AND ext LIKE 'ce-ativ-%' THEN
    tipo := 'ativacao';
    UPDATE public.ce_distribuidores SET ativacao_paga_em = coalesce(ativacao_paga_em, now()) WHERE id = did;
    PERFORM public._ce_avaliar(did);
  ELSIF ev = 'subscription.completed' AND did IS NOT NULL THEN
    tipo := 'mensalidade';
    UPDATE public.ce_distribuidores SET assinatura_id = subs, assinatura_status = 'ACTIVE', assinatura_metodo = metodo,
           ultimo_pagamento_em = now(), falhas_pagamento = 0,
           cashback_valor_centavos = coalesce(cashback_valor_centavos, 5000),
           cashback_gerado_em = coalesce(cashback_gerado_em, now()),
           cashback_codigo = coalesce(cashback_codigo,
             'CE50-' || upper(substr(translate(encode(extensions.gen_random_bytes(8), 'base64'), '+/=0O1Il', ''), 1, 5)))
     WHERE id = did;
  ELSIF ev = 'subscription.renewed' AND did IS NOT NULL THEN
    tipo := 'mensalidade';
    UPDATE public.ce_distribuidores SET assinatura_status = 'ACTIVE', ultimo_pagamento_em = now(), falhas_pagamento = 0 WHERE id = did;
  ELSIF ev = 'subscription.payment_failed' AND did IS NOT NULL THEN
    tipo := 'mensalidade';
    UPDATE public.ce_distribuidores SET falhas_pagamento = falhas_pagamento + 1 WHERE id = did;
  ELSIF ev = 'subscription.cancelled' AND did IS NOT NULL THEN
    tipo := 'mensalidade';
    UPDATE public.ce_distribuidores SET assinatura_status = 'CANCELLED' WHERE id = did AND assinatura_id = subs;
  END IF;

  INSERT INTO public.ce_pagamentos (abacate_evento_id, distribuidor_id, evento, tipo, valor_centavos, metodo, recibo_url, dev_mode)
  VALUES (p->>'id', did, ev, tipo, valor, metodo, recibo, coalesce((p->>'devMode')::boolean, false))
  ON CONFLICT (abacate_evento_id) DO NOTHING;
  RETURN CASE WHEN did IS NULL THEN 'ignorado' ELSE 'ok' END;
END $$;

-- ==============================================================================
-- CADASTRO NO PAINEL + ATIVAÇÃO AUTOMÁTICA
-- ==============================================================================

-- O robô publica a chave pública dele; o navegador tranca a senha do Vendas Plus com ela
CREATE OR REPLACE FUNCTION public.ce_robo_publicar_chave(p_token text, p_pem text)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  IF p_pem NOT LIKE '-----BEGIN PUBLIC KEY-----%' THEN RAISE EXCEPTION 'chave_invalida'; END IF;
  INSERT INTO public.ce_config (chave, valor) VALUES ('robo_chave_publica', p_pem)
  ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;
END $$;

-- Salva o cadastro do distribuidor (substitui o Formulário para Automação)
CREATE OR REPLACE FUNCTION public.ce_salvar_cadastro(p_token text, p jsonb)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores; wa text; av text; inst text; senha text; mudou_senha boolean; cid uuid;
BEGIN
  d := public._ce_sessao(p_token);
  wa := public._ce_tel(p->>'whatsapp_automacao');
  av := coalesce(nullif(public._ce_tel(p->>'whatsapp_avisos'), ''), d.telefone);
  senha := nullif(p->>'vp_senha_cripto', '');
  IF length(coalesce(trim(p->>'nome'), '')) < 3 THEN RETURN jsonb_build_object('erro', 'nome'); END IF;
  IF length(coalesce(trim(p->>'nome_operacao'), '')) < 3 THEN RETURN jsonb_build_object('erro', 'nome_operacao'); END IF;
  IF length(wa) NOT IN (12, 13) THEN RETURN jsonb_build_object('erro', 'whatsapp_automacao'); END IF;
  IF length(coalesce(trim(p->>'vp_usuario'), '')) < 2 THEN RETURN jsonb_build_object('erro', 'vp_usuario'); END IF;
  IF senha IS NULL AND d.vp_senha_cripto IS NULL THEN RETURN jsonb_build_object('erro', 'vp_senha'); END IF;
  IF length(coalesce(senha, '')) > 2000 THEN RETURN jsonb_build_object('erro', 'vp_senha'); END IF;
  IF coalesce(p->>'tipo_whatsapp', '') NOT IN ('WhatsApp Business', 'WhatsApp comum') THEN RETURN jsonb_build_object('erro', 'tipo_whatsapp'); END IF;
  IF coalesce(p->>'aparelhos_conectados', '') NOT IN ('0', '1', '2', '3', '4 (cheio)') THEN RETURN jsonb_build_object('erro', 'aparelhos_conectados'); END IF;
  IF p->>'aparelhos_conectados' = '4 (cheio)' THEN RETURN jsonb_build_object('erro', 'aparelhos_cheio'); END IF;
  IF coalesce(p->>'vp_analise_credito', '') NOT IN ('Sim', 'Não', 'Não sei') THEN RETURN jsonb_build_object('erro', 'vp_analise_credito'); END IF;
  IF p->>'vp_analise_credito' = 'Não' THEN RETURN jsonb_build_object('erro', 'vp_sem_analise'); END IF;
  IF length(coalesce(trim(p->>'apos_aprovacao'), '')) < 3 OR length(p->>'apos_aprovacao') > 120 THEN RETURN jsonb_build_object('erro', 'apos_aprovacao'); END IF;
  IF length(coalesce(trim(p->>'horario_atendimento'), '')) < 3 OR length(p->>'horario_atendimento') > 300 THEN RETURN jsonb_build_object('erro', 'horario_atendimento'); END IF;
  IF NOT coalesce((p->>'aceite_termos')::boolean, false) THEN RETURN jsonb_build_object('erro', 'aceite_termos'); END IF;
  IF EXISTS (SELECT 1 FROM public.ce_distribuidores x WHERE x.whatsapp_automacao = wa AND x.id <> d.id) THEN
    RETURN jsonb_build_object('erro', 'whatsapp_em_uso');
  END IF;
  mudou_senha := senha IS NOT NULL OR coalesce(trim(p->>'vp_usuario'), '') <> coalesce(d.vp_usuario, '')
                 OR wa <> coalesce(d.whatsapp_automacao, '');

  inst := d.instancia;
  IF inst IS NULL THEN
    inst := 'ce-' || coalesce(nullif(public._ce_slug(p->>'nome_operacao'), ''), 'dist') || '-' || substr(replace(d.id::text, '-', ''), 1, 4);
  END IF;

  UPDATE public.ce_distribuidores SET
    nome = trim(p->>'nome'), nome_operacao = trim(p->>'nome_operacao'), email = nullif(trim(p->>'email'), ''),
    cidade = nullif(trim(p->>'cidade'), ''), whatsapp_automacao = wa, whatsapp_avisos = av,
    vp_usuario = trim(p->>'vp_usuario'), vp_senha_cripto = coalesce(senha, vp_senha_cripto),
    atendente = nullif(trim(p->>'atendente'), ''), observacoes = nullif(trim(p->>'observacoes'), ''),
    tipo_whatsapp = p->>'tipo_whatsapp', aparelhos_conectados = p->>'aparelhos_conectados',
    vp_analise_credito = p->>'vp_analise_credito', apos_aprovacao = trim(p->>'apos_aprovacao'),
    horario_atendimento = trim(p->>'horario_atendimento'),
    aceite_termos = true, instancia = inst, cadastro_completo_em = coalesce(cadastro_completo_em, now()),
    -- dados de acesso mudaram num robô já configurado: reconfigura
    prov_status = CASE WHEN mudou_senha AND prov_status IN ('ativo', 'aguardando_conexao', 'erro', 'reconectar') THEN 'pendente' ELSE prov_status END,
    prov_erro = CASE WHEN mudou_senha THEN NULL ELSE prov_erro END
  WHERE id = d.id RETURNING * INTO d;

  -- Espelha no painel administrativo do site (aba Automação), sem a senha
  IF d.cadastro_id IS NULL THEN
    INSERT INTO public.automacao_cadastros (status, nome_completo, nome_operacao, cidade_uf, email, whatsapp_pessoal,
        whatsapp_automacao, whatsapp_avisos, vp_usuario, observacoes, aceite_login, aceite_lgpd, aceite_whatsapp, instancia,
        tipo_whatsapp, aparelhos_conectados, vp_analise_credito, apos_aprovacao, horario_atendimento)
    VALUES ('novo', d.nome, d.nome_operacao, d.cidade, d.email, d.telefone, d.whatsapp_automacao, d.whatsapp_avisos,
        d.vp_usuario, d.observacoes, true, true, true, d.instancia,
        d.tipo_whatsapp, d.aparelhos_conectados, d.vp_analise_credito, d.apos_aprovacao, d.horario_atendimento)
    RETURNING id INTO cid;
    UPDATE public.ce_distribuidores SET cadastro_id = cid WHERE id = d.id;
  ELSE
    UPDATE public.automacao_cadastros SET nome_completo = d.nome, nome_operacao = d.nome_operacao, cidade_uf = d.cidade,
        email = d.email, whatsapp_automacao = d.whatsapp_automacao, whatsapp_avisos = d.whatsapp_avisos,
        vp_usuario = d.vp_usuario, observacoes = d.observacoes, instancia = d.instancia,
        tipo_whatsapp = d.tipo_whatsapp, aparelhos_conectados = d.aparelhos_conectados, vp_analise_credito = d.vp_analise_credito,
        apos_aprovacao = d.apos_aprovacao, horario_atendimento = d.horario_atendimento
     WHERE id = d.cadastro_id;
  END IF;

  PERFORM public._ce_avaliar(d.id);
  RETURN jsonb_build_object('ok', true);
END $$;

-- Distribuidor pede um código de conexão novo (o anterior vence em poucos minutos)
CREATE OR REPLACE FUNCTION public.ce_pedir_reconexao(p_token text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores;
BEGIN
  d := public._ce_sessao(p_token);
  IF d.instancia IS NULL OR d.prov_status NOT IN ('aguardando_conexao', 'ativo', 'erro') THEN
    RETURN jsonb_build_object('erro', 'indisponivel');
  END IF;
  IF d.prov_status = 'erro' THEN
    UPDATE public.ce_distribuidores SET prov_status = 'pendente', prov_erro = NULL, prov_atualizado_em = now() WHERE id = d.id;
  ELSE
    UPDATE public.ce_distribuidores SET prov_status = 'reconectar', prov_codigo = NULL, prov_atualizado_em = now() WHERE id = d.id;
  END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Fila do robô: distribuidores para configurar (pendente) ou gerar novo código (reconectar)
CREATE OR REPLACE FUNCTION public.ce_robo_ativacoes(p_token text)
RETURNS TABLE (id uuid, acao text, instancia text, nome text, nome_operacao text, cidade text, telefone text,
               whatsapp_automacao text, whatsapp_avisos text, atendente text, vp_usuario text, vp_senha_cripto text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  -- trava os itens para não serem pegos duas vezes; itens presos há 10 min voltam para a fila
  UPDATE public.ce_distribuidores SET prov_status = 'pendente', prov_atualizado_em = now()
   WHERE prov_status IN ('criando', 'testando_login') AND prov_atualizado_em < now() - interval '10 minutes';
  RETURN QUERY
  WITH alvo AS (
    SELECT d.id, CASE d.prov_status WHEN 'reconectar' THEN 'reconectar' ELSE 'configurar' END AS acao
      FROM public.ce_distribuidores d
     WHERE d.prov_status IN ('pendente', 'reconectar') AND d.instancia IS NOT NULL
     ORDER BY d.prov_atualizado_em NULLS FIRST LIMIT 5
     FOR UPDATE SKIP LOCKED)
  UPDATE public.ce_distribuidores d SET prov_status = 'criando', prov_atualizado_em = now()
    FROM alvo WHERE d.id = alvo.id
  RETURNING d.id, alvo.acao, d.instancia, d.nome, d.nome_operacao, d.cidade, d.telefone,
            d.whatsapp_automacao, d.whatsapp_avisos, d.atendente, d.vp_usuario, d.vp_senha_cripto;
END $$;

-- Robô informa o andamento: testando_login | aguardando_conexao (+ código) | ativo | erro (+ mensagem)
CREATE OR REPLACE FUNCTION public.ce_robo_ativacao_status(p_token text, p_id uuid, p_status text, p_erro text DEFAULT NULL, p_codigo text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  IF p_status NOT IN ('testando_login', 'aguardando_conexao', 'ativo', 'erro') THEN RAISE EXCEPTION 'status_invalido'; END IF;
  UPDATE public.ce_distribuidores
     SET prov_status = p_status, prov_erro = left(p_erro, 300),
         prov_codigo = CASE WHEN p_status = 'aguardando_conexao' THEN p_codigo ELSE NULL END,
         prov_atualizado_em = now()
   WHERE id = p_id;
  IF p_status = 'ativo' THEN
    UPDATE public.automacao_cadastros a SET status = 'ativado'
      FROM public.ce_distribuidores d WHERE d.id = p_id AND a.id = d.cadastro_id AND a.status <> 'cancelado';
  ELSIF p_status IN ('aguardando_conexao', 'testando_login') THEN
    UPDATE public.automacao_cadastros a SET status = 'em_ativacao'
      FROM public.ce_distribuidores d WHERE d.id = p_id AND a.id = d.cadastro_id AND a.status = 'novo';
  END IF;
END $$;

-- ---------- Permissões ----------
REVOKE ALL ON FUNCTION public.ce_robo_registrar(text, text, text, text, boolean) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_evento(text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_importar(text, text, jsonb) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_sinal(text, jsonb) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_codigos(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_codigo_enviado(text, bigint) FROM public;
REVOKE ALL ON FUNCTION public.ce_pedir_codigo(text, boolean) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_publicar_chave(text, text) FROM public;
REVOKE ALL ON FUNCTION public.ce_salvar_cadastro(text, jsonb) FROM public;
REVOKE ALL ON FUNCTION public.ce_pedir_reconexao(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_ativacoes(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_ativacao_status(text, uuid, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.ce_entrar(text, text) FROM public;
REVOKE ALL ON FUNCTION public.ce_sair(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_painel(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_sessao_info(text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.ce_webhook_aplicar(jsonb) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ce_robo_registrar(text, text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_evento(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_importar(text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_sinal(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_codigos(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_codigo_enviado(text, bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_pedir_codigo(text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_publicar_chave(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_salvar_cadastro(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_pedir_reconexao(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_ativacoes(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_ativacao_status(text, uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_entrar(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_sair(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_painel(text) TO anon, authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.ce_sessao_info(text) TO service_role';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.ce_webhook_aplicar(jsonb) TO service_role';
  END IF;
END $$;

-- ==============================================================================
-- DEPOIS DE RODAR:
-- 1) SELECT public.ce_gerar_token_robo();   → copie o resultado para o .env do robô (PAINEL_ROBO_TOKEN)
-- 2) Marque a Romance Itapema como isenta (troque o número se precisar):
--    UPDATE public.ce_distribuidores SET isento = true WHERE telefone = '5547997626121';
--    (a linha aparece depois que o robô atualizado iniciar, ou insira manualmente:)
--    INSERT INTO public.ce_distribuidores (telefone, nome, instancia, isento)
--    VALUES ('5547997626121', 'Romance Itapema', 'romanceitapema', true)
--    ON CONFLICT (telefone) DO UPDATE SET isento = true, instancia = 'romanceitapema';
-- ==============================================================================
