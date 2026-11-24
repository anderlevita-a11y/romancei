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
ALTER TABLE public.ce_status_robo ADD COLUMN IF NOT EXISTS desligado_em TIMESTAMPTZ;

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
    token TEXT PRIMARY KEY,            -- SHA-256 do token (o token em si só fica no navegador)
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

-- Migração única: sessões antigas (token puro) passam a ser guardadas como SHA-256
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ce_config WHERE chave = 'sessoes_hash_v1') THEN
    UPDATE public.ce_sessoes SET token = encode(extensions.digest(token, 'sha256'), 'hex');
    INSERT INTO public.ce_config (chave, valor) VALUES ('sessoes_hash_v1', now()::text);
  END IF;
END $$;

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
   WHERE s.token = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') AND s.expira_em > now();
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
       SET ultimo_sinal = now(), whatsapp_conectado = EXCLUDED.whatsapp_conectado, robo_ativo = EXCLUDED.robo_ativo,
           desligado_em = NULL;
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

-- O robô avisa que está sendo encerrado (painel mostra INATIVO na hora)
CREATE OR REPLACE FUNCTION public.ce_robo_desligar(p_token text, p_instancias text[])
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  UPDATE public.ce_status_robo SET desligado_em = now() WHERE instancia = ANY(coalesce(p_instancias, '{}'));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Online = sinal nos últimos 90 s (o robô manda a cada 20 s) e não avisou que desligou
CREATE OR REPLACE FUNCTION public._ce_robo_json(d public.ce_distribuidores)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE st public.ce_status_robo; online boolean; liberado boolean;
BEGIN
  liberado := public._ce_liberado(d);
  SELECT * INTO st FROM public.ce_status_robo WHERE instancia = d.instancia;
  online := d.instancia IS NOT NULL AND st.instancia IS NOT NULL AND st.desligado_em IS NULL
            AND st.ultimo_sinal > now() - interval '90 seconds';
  RETURN jsonb_build_object('configurado', d.instancia IS NOT NULL, 'online', coalesce(online, false),
      'whatsapp_conectado', st.whatsapp_conectado, 'robo_ativo', st.robo_ativo, 'ultimo_sinal', st.ultimo_sinal,
      'desligado_em', st.desligado_em, 'liberado', liberado, 'agora', now(),
      'ativo', coalesce(online, false) AND coalesce(st.whatsapp_conectado, false) AND coalesce(st.robo_ativo, false) AND liberado);
END $$;

-- Consulta leve que o painel faz a cada poucos segundos (sincronização do status do robô)
CREATE OR REPLACE FUNCTION public.ce_robo_status(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores;
BEGIN
  d := public._ce_sessao(p_token);
  RETURN public._ce_robo_json(d) || jsonb_build_object('prov_status', d.prov_status);
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

  cod := lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint & 2147483647) % 1000000)::text, 6, '0');
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
  INSERT INTO public.ce_sessoes (token, distribuidor_id) VALUES (encode(extensions.digest(t, 'sha256'), 'hex'), d.id);
  RETURN jsonb_build_object('token', t);
END $$;

CREATE OR REPLACE FUNCTION public.ce_sair(p_token text)
RETURNS void LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
  DELETE FROM public.ce_sessoes WHERE token = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
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
    'robo', public._ce_robo_json(d),
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
    'chave_publica', (SELECT valor FROM public.ce_config WHERE chave = 'robo_chave_publica'),
    'social', (SELECT jsonb_build_object('status', so.status, 'dados', so.dados, 'nota', so.nota_admin,
        'assinatura_status', so.assinatura_status, 'ultimo_pagamento_em', so.ultimo_pagamento_em,
        'enviado_em', so.enviado_em, 'ativa_em', so.ativa_em, 'atualizado_em', so.atualizado_em)
        FROM public.ce_social so WHERE so.distribuidor_id = d.id),
    'config', jsonb_build_object(
        'social_preco', (SELECT nullif(valor, '')::int FROM public.ce_config WHERE chave = 'social_preco_centavos'),
        'social_bm_id', (SELECT valor FROM public.ce_config WHERE chave = 'social_bm_id'),
        'social_bm_nome', (SELECT valor FROM public.ce_config WHERE chave = 'social_bm_nome')),
    'admin', public._ce_eh_admin(d));
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
    'qtd_numeros', d.qtd_numeros,
    'social_preco', (SELECT nullif(valor, '')::int FROM public.ce_config WHERE chave = 'social_preco_centavos'),
    'social_status', (SELECT status FROM public.ce_social WHERE distribuidor_id = d.id),
    'social_assinatura', (SELECT assinatura_status FROM public.ce_social WHERE distribuidor_id = d.id));
END $$;

-- Aplica um evento de webhook do AbacatePay (já validado pela function). Idempotente.
CREATE OR REPLACE FUNCTION public.ce_webhook_aplicar(p jsonb)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE ev text := p->>'event'; dt jsonb := p->'data'; ext text; did uuid; subs text; tipo text := NULL; social boolean := false;
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

  -- externalId = ce-ativ-<uuid>[-sufixo], ce-mens-<uuid>[-sufixo] ou ce-soc-<uuid>[-sufixo] (gestão de tráfego)
  IF ext ~ '^ce-(ativ|mens|soc)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-[a-z0-9-]+)?$' THEN
    did := substring(ext from '^ce-(?:ativ|mens|soc)-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')::uuid;
    social := ext LIKE 'ce-soc-%';
  ELSIF subs IS NOT NULL THEN
    SELECT id INTO did FROM public.ce_distribuidores WHERE assinatura_id = subs;
    IF did IS NULL THEN
      SELECT distribuidor_id INTO did FROM public.ce_social WHERE assinatura_id = subs;
      social := did IS NOT NULL;
    END IF;
  END IF;

  IF social AND ev IN ('subscription.completed', 'subscription.renewed', 'subscription.payment_failed', 'subscription.cancelled') THEN
    tipo := 'social';
    INSERT INTO public.ce_social (distribuidor_id) VALUES (did) ON CONFLICT (distribuidor_id) DO NOTHING;
    IF ev = 'subscription.completed' THEN
      UPDATE public.ce_social SET assinatura_id = subs, assinatura_status = 'ACTIVE', ultimo_pagamento_em = now(), atualizado_em = now(),
             status = CASE WHEN status = 'rascunho' THEN status WHEN status IN ('enviado', 'pausada') THEN 'em_configuracao' ELSE status END
       WHERE distribuidor_id = did;
    ELSIF ev = 'subscription.renewed' THEN
      UPDATE public.ce_social SET assinatura_status = 'ACTIVE', ultimo_pagamento_em = now(), atualizado_em = now() WHERE distribuidor_id = did;
    ELSIF ev = 'subscription.cancelled' THEN
      UPDATE public.ce_social SET assinatura_status = 'CANCELLED', atualizado_em = now() WHERE distribuidor_id = did AND assinatura_id = subs;
    END IF;
  ELSIF ev = 'checkout.completed' AND coalesce(dt#>>'{checkout,frequency}', 'ONE_TIME') = 'ONE_TIME' AND ext LIKE 'ce-ativ-%' THEN
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
  IF nullif(trim(p->>'email'), '') IS NOT NULL AND trim(p->>'email') !~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' THEN
    RETURN jsonb_build_object('erro', 'email');
  END IF;
  IF coalesce(p->>'qtd_numeros', '1') !~ '^[0-9]{1,2}$' OR coalesce((p->>'qtd_numeros')::int, 1) NOT BETWEEN 1 AND 10 THEN
    RETURN jsonb_build_object('erro', 'qtd_numeros');
  END IF;
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
    qtd_numeros = coalesce((p->>'qtd_numeros')::int, qtd_numeros),
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
REVOKE ALL ON FUNCTION public.ce_robo_status(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_desligar(text, text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.ce_robo_status(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_desligar(text, text[]) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._ce_robo_json(public.ce_distribuidores) FROM PUBLIC, anon, authenticated;
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


-- ==============================================================================
-- v2 · SOCIAL MEDIA (gestão de tráfego pago) + ÁREA DO ADMINISTRADOR
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ce_admins (
    telefone TEXT PRIMARY KEY            -- só dígitos, com 55 (mesmo login do painel)
);
INSERT INTO public.ce_admins (telefone) VALUES ('5547997626121') ON CONFLICT DO NOTHING;
ALTER TABLE public.ce_admins ENABLE ROW LEVEL SECURITY;

-- Um pedido de gestão de tráfego por distribuidor
CREATE TABLE IF NOT EXISTS public.ce_social (
    distribuidor_id UUID PRIMARY KEY REFERENCES public.ce_distribuidores(id) ON DELETE CASCADE,
    dados JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- rascunho | enviado | em_configuracao | ativa | pausada | cancelada
    status TEXT NOT NULL DEFAULT 'rascunho',
    nota_admin TEXT,                     -- recado do administrador para a cliente
    enviado_em TIMESTAMPTZ,
    ativa_em TIMESTAMPTZ,
    alterado_apos_ativar BOOLEAN NOT NULL DEFAULT false,
    assinatura_id TEXT,
    assinatura_status TEXT NOT NULL DEFAULT 'SEM_ASSINATURA',
    ultimo_pagamento_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ce_social_status_check') THEN
    ALTER TABLE public.ce_social ADD CONSTRAINT ce_social_status_check
      CHECK (status IN ('rascunho', 'enviado', 'em_configuracao', 'ativa', 'pausada', 'cancelada'));
  END IF;
END $$;
ALTER TABLE public.ce_social ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public._ce_eh_admin(d public.ce_distribuidores) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ce_admins a WHERE a.telefone = d.telefone);
$$;

CREATE OR REPLACE FUNCTION public._ce_admin(p_token text) RETURNS public.ce_distribuidores
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores;
BEGIN
  d := public._ce_sessao(p_token);
  IF NOT public._ce_eh_admin(d) THEN RAISE EXCEPTION 'sem_permissao'; END IF;
  RETURN d;
END $$;

-- A cliente salva (rascunho) ou envia o pedido de campanha. Erros são devolvidos, não lançados.
CREATE OR REPLACE FUNCTION public.ce_social_salvar(p_token text, p jsonb, p_enviar boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores; so public.ce_social; x jsonb := '{}'::jsonb; k text; v text; n numeric;
        campos text[] := ARRAY['objetivo','facebook_pagina','instagram','bm_id','conta_anuncios_id','pagamento_meta',
          'verba_diaria','inicio','regiao_cidades','raio_km','idade_min','idade_max','genero','interesses',
          'whatsapp_destino','mensagem_inicial','oferta','criativos_link','horario','observacoes'];
BEGIN
  d := public._ce_sessao(p_token);
  IF octet_length(coalesce(p::text, '')) > 20000 THEN RETURN jsonb_build_object('erro', 'grande_demais'); END IF;
  FOREACH k IN ARRAY campos LOOP
    v := nullif(trim(coalesce(p->>k, '')), '');
    IF v IS NOT NULL THEN
      IF length(v) > 1500 THEN RETURN jsonb_build_object('erro', k); END IF;
      x := x || jsonb_build_object(k, v);
    END IF;
  END LOOP;
  x := x || jsonb_build_object('acesso_parceiro', coalesce((p->>'acesso_parceiro')::boolean, false),
                               'aceite', coalesce((p->>'aceite')::boolean, false));
  IF x ? 'whatsapp_destino' THEN x := x || jsonb_build_object('whatsapp_destino', public._ce_tel(x->>'whatsapp_destino')); END IF;
  IF x ? 'conta_anuncios_id' THEN x := x || jsonb_build_object('conta_anuncios_id', regexp_replace(x->>'conta_anuncios_id', '\D', '', 'g')); END IF;
  IF x ? 'bm_id' THEN x := x || jsonb_build_object('bm_id', regexp_replace(x->>'bm_id', '\D', '', 'g')); END IF;

  IF coalesce(p_enviar, false) THEN
    IF coalesce(x->>'objetivo', '') NOT IN ('Mensagens no WhatsApp', 'Cadastro de revendedoras', 'Seguidores no Instagram', 'Visitas ao site / catálogo') THEN
      RETURN jsonb_build_object('erro', 'objetivo'); END IF;
    IF length(coalesce(x->>'facebook_pagina', '')) < 3 THEN RETURN jsonb_build_object('erro', 'facebook_pagina'); END IF;
    IF length(coalesce(x->>'conta_anuncios_id', '')) NOT BETWEEN 8 AND 20 THEN RETURN jsonb_build_object('erro', 'conta_anuncios_id'); END IF;
    IF coalesce(x->>'pagamento_meta', '') NOT IN ('Cartão cadastrado no Meta', 'Pix / saldo pré-pago no Meta', 'Ainda não configurei') THEN
      RETURN jsonb_build_object('erro', 'pagamento_meta'); END IF;
    n := CASE WHEN replace(coalesce(x->>'verba_diaria', ''), ',', '.') ~ '^[0-9]+(\.[0-9]{1,2})?$' THEN replace(x->>'verba_diaria', ',', '.')::numeric END;
    IF n IS NULL OR n < 6 OR n > 10000 THEN RETURN jsonb_build_object('erro', 'verba_diaria'); END IF;
    IF length(coalesce(x->>'regiao_cidades', '')) < 3 THEN RETURN jsonb_build_object('erro', 'regiao_cidades'); END IF;
    IF coalesce(x->>'raio_km', '') !~ '^[0-9]{1,2}$' OR (x->>'raio_km')::int NOT BETWEEN 1 AND 80 THEN RETURN jsonb_build_object('erro', 'raio_km'); END IF;
    IF coalesce(x->>'idade_min', '') !~ '^[0-9]{2}$' OR coalesce(x->>'idade_max', '') !~ '^[0-9]{2}$'
       OR (x->>'idade_min')::int < 18 OR (x->>'idade_max')::int > 65 OR (x->>'idade_min')::int > (x->>'idade_max')::int THEN
      RETURN jsonb_build_object('erro', 'idade'); END IF;
    IF coalesce(x->>'genero', '') NOT IN ('Mulheres', 'Homens', 'Todos') THEN RETURN jsonb_build_object('erro', 'genero'); END IF;
    IF x->>'objetivo' IN ('Mensagens no WhatsApp', 'Cadastro de revendedoras') AND length(coalesce(x->>'whatsapp_destino', '')) NOT IN (12, 13) THEN
      RETURN jsonb_build_object('erro', 'whatsapp_destino'); END IF;
    IF length(coalesce(x->>'oferta', '')) < 10 THEN RETURN jsonb_build_object('erro', 'oferta'); END IF;
    IF x ? 'criativos_link' AND x->>'criativos_link' !~* '^https?://' THEN RETURN jsonb_build_object('erro', 'criativos_link'); END IF;
    IF NOT (x->>'aceite')::boolean THEN RETURN jsonb_build_object('erro', 'aceite'); END IF;
  END IF;

  INSERT INTO public.ce_social (distribuidor_id) VALUES (d.id) ON CONFLICT (distribuidor_id) DO NOTHING;
  SELECT * INTO so FROM public.ce_social WHERE distribuidor_id = d.id;
  UPDATE public.ce_social SET dados = x, atualizado_em = now(),
         status = CASE WHEN coalesce(p_enviar, false) AND so.status IN ('rascunho', 'cancelada') THEN 'enviado' ELSE so.status END,
         enviado_em = CASE WHEN coalesce(p_enviar, false) THEN now() ELSE so.enviado_em END,
         alterado_apos_ativar = so.alterado_apos_ativar OR (coalesce(p_enviar, false) AND so.status IN ('em_configuracao', 'ativa', 'pausada'))
   WHERE distribuidor_id = d.id;
  RETURN jsonb_build_object('ok', true);
END $$;

-- A cliente pede para pausar ou cancelar a gestão
CREATE OR REPLACE FUNCTION public.ce_social_cancelar(p_token text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.ce_distribuidores;
BEGIN
  d := public._ce_sessao(p_token);
  UPDATE public.ce_social SET status = 'cancelada', atualizado_em = now() WHERE distribuidor_id = d.id AND status <> 'cancelada';
  RETURN jsonb_build_object('ok', true);
END $$;

-- ---------- ADMIN ----------
CREATE OR REPLACE FUNCTION public.ce_admin_clientes(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.ce_distribuidores; res jsonb;
BEGIN
  a := public._ce_admin(p_token);
  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'criado_em') DESC), '[]'::jsonb) INTO res FROM (
    SELECT jsonb_build_object(
      'id', d.id, 'criado_em', d.created_at, 'nome', d.nome, 'nome_operacao', d.nome_operacao, 'cidade', d.cidade,
      'email', d.email, 'telefone', d.telefone, 'whatsapp_automacao', d.whatsapp_automacao, 'whatsapp_avisos', d.whatsapp_avisos,
      'cadastro_completo', d.cadastro_completo_em IS NOT NULL, 'qtd_numeros', d.qtd_numeros, 'isento', d.isento,
      'admin', public._ce_eh_admin(d),
      'ativacao_paga_em', d.ativacao_paga_em, 'assinatura_status', d.assinatura_status, 'assinatura_metodo', d.assinatura_metodo,
      'ultimo_pagamento_em', d.ultimo_pagamento_em, 'falhas_pagamento', d.falhas_pagamento,
      'liberado', public._ce_liberado(d), 'prov_status', d.prov_status, 'prov_erro', d.prov_erro, 'instancia', d.instancia,
      'robo', public._ce_robo_json(d),
      'conversas_30d', (SELECT count(*) FROM public.ce_eventos e WHERE e.instancia = d.instancia AND e.tipo = 'contato_novo' AND e.criado_em > now() - interval '30 days'),
      'aprovadas_30d', (SELECT count(*) FROM public.ce_eventos e WHERE e.instancia = d.instancia AND e.tipo = 'consulta_aprovada' AND e.criado_em > now() - interval '30 days'),
      'social', (SELECT jsonb_build_object('status', so.status, 'dados', so.dados, 'nota', so.nota_admin,
                   'assinatura_status', so.assinatura_status, 'ultimo_pagamento_em', so.ultimo_pagamento_em,
                   'enviado_em', so.enviado_em, 'ativa_em', so.ativa_em, 'atualizado_em', so.atualizado_em,
                   'alterado_apos_ativar', so.alterado_apos_ativar)
                 FROM public.ce_social so WHERE so.distribuidor_id = d.id)
    ) x FROM public.ce_distribuidores d) t;
  RETURN res;
END $$;

-- O administrador muda o status da campanha (e deixa um recado que a cliente vê no painel)
CREATE OR REPLACE FUNCTION public.ce_admin_social(p_token text, p_id uuid, p_status text, p_nota text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.ce_distribuidores;
BEGIN
  a := public._ce_admin(p_token);
  IF p_status NOT IN ('enviado', 'em_configuracao', 'ativa', 'pausada', 'cancelada') THEN RETURN jsonb_build_object('erro', 'status'); END IF;
  IF length(coalesce(p_nota, '')) > 1000 THEN RETURN jsonb_build_object('erro', 'nota'); END IF;
  UPDATE public.ce_social SET status = p_status, nota_admin = nullif(trim(coalesce(p_nota, '')), ''), atualizado_em = now(),
         ativa_em = CASE WHEN p_status = 'ativa' THEN coalesce(ativa_em, now()) ELSE ativa_em END,
         alterado_apos_ativar = CASE WHEN p_status = 'ativa' THEN false ELSE alterado_apos_ativar END
   WHERE distribuidor_id = p_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('erro', 'sem_pedido'); END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Configurações que o administrador ajusta pelo painel
CREATE OR REPLACE FUNCTION public.ce_admin_config(p_token text, p_chave text, p_valor text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.ce_distribuidores; v text := nullif(trim(coalesce(p_valor, '')), '');
BEGIN
  a := public._ce_admin(p_token);
  IF p_chave NOT IN ('social_preco_centavos', 'social_bm_id', 'social_bm_nome') THEN RETURN jsonb_build_object('erro', 'chave'); END IF;
  IF p_chave = 'social_preco_centavos' AND v IS NOT NULL AND (v !~ '^[0-9]{3,7}$' OR v::int < 500) THEN RETURN jsonb_build_object('erro', 'valor'); END IF;
  IF p_chave = 'social_bm_id' AND v IS NOT NULL AND v !~ '^[0-9]{8,20}$' THEN RETURN jsonb_build_object('erro', 'valor'); END IF;
  IF length(coalesce(v, '')) > 120 THEN RETURN jsonb_build_object('erro', 'valor'); END IF;
  INSERT INTO public.ce_config (chave, valor) VALUES (p_chave, v) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public._ce_eh_admin(public.ce_distribuidores) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public._ce_admin(text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.ce_social_salvar(text, jsonb, boolean) FROM public;
REVOKE ALL ON FUNCTION public.ce_social_cancelar(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_admin_clientes(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_admin_social(text, uuid, text, text) FROM public;
REVOKE ALL ON FUNCTION public.ce_admin_config(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.ce_social_salvar(text, jsonb, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_social_cancelar(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_admin_clientes(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_admin_social(text, uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_admin_config(text, text, text) TO anon, authenticated;
