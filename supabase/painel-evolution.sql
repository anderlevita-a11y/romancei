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

-- ---------- Eventos do robô (só contagem, sem dados pessoais) ----------
CREATE TABLE IF NOT EXISTS public.ce_eventos (
    id BIGSERIAL PRIMARY KEY,
    instancia TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('conversa_iniciada','consulta_aprovada','consulta_reprovada',
                                       'consulta_analise','consulta_erro','endereco_recebido')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ce_eventos_inst_data_idx ON public.ce_eventos (instancia, criado_em DESC);

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
  INSERT INTO public.ce_distribuidores (telefone, nome, instancia, isento)
  VALUES (tel, p_nome, p_instancia, coalesce(p_isento, false))
  ON CONFLICT (telefone) DO UPDATE
     SET instancia = EXCLUDED.instancia,
         nome = coalesce(public.ce_distribuidores.nome, EXCLUDED.nome),
         isento = public.ce_distribuidores.isento OR EXCLUDED.isento;
END $$;

CREATE OR REPLACE FUNCTION public.ce_robo_evento(p_token text, p_instancia text, p_tipo text)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public._ce_robo_ok(p_token) THEN RAISE EXCEPTION 'token_invalido'; END IF;
  INSERT INTO public.ce_eventos (instancia, tipo) VALUES (p_instancia, p_tipo);
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
    IF d.id IS NOT NULL THEN res := res || jsonb_build_object(d.instancia, public._ce_liberado(d)); END IF;
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
CREATE OR REPLACE FUNCTION public.ce_pedir_codigo(p_telefone text)
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
      PERFORM pg_sleep(0.3);
      RETURN 'ok';
    END IF;
    INSERT INTO public.ce_distribuidores (telefone, nome, nome_operacao, email, cadastro_id, instancia)
    VALUES (tel, cad.nome_completo, cad.nome_operacao, cad.email, cad.id,
            CASE WHEN cad.instancia IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.ce_distribuidores x WHERE x.instancia = cad.instancia)
                 THEN cad.instancia END)
    RETURNING * INTO d;
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
  IF d.cadastro_id IS NOT NULL THEN
    SELECT nome_operacao, cidade_uf, status, whatsapp_automacao, created_at INTO cad
      FROM public.automacao_cadastros WHERE id = d.cadastro_id;
  END IF;

  SELECT coalesce(jsonb_object_agg(tipo, n), '{}'::jsonb) INTO semana FROM (
    SELECT tipo, count(*) n FROM public.ce_eventos
     WHERE instancia = d.instancia AND criado_em > now() - interval '7 days' GROUP BY tipo) x;
  SELECT coalesce(jsonb_object_agg(tipo, n), '{}'::jsonb) INTO mes FROM (
    SELECT tipo, count(*) n FROM public.ce_eventos
     WHERE instancia = d.instancia AND criado_em > now() - interval '30 days' GROUP BY tipo) x;
  SELECT coalesce(jsonb_agg(jsonb_build_object('dia', dia, 'conversas', c, 'aprovadas', a, 'reprovadas', r) ORDER BY dia), '[]'::jsonb)
    INTO serie FROM (
      SELECT g.dia::date AS dia,
             count(e.id) FILTER (WHERE e.tipo = 'conversa_iniciada') c,
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
        'telefone', d.telefone, 'instancia', d.instancia, 'cidade', cad.cidade_uf,
        'cadastro_status', cad.status, 'cadastro_em', cad.created_at, 'whatsapp_automacao', cad.whatsapp_automacao),
    'plano', jsonb_build_object('isento', d.isento, 'liberado', liberado,
        'ativacao_paga', d.ativacao_paga_em IS NOT NULL, 'ativacao_paga_em', d.ativacao_paga_em,
        'assinatura_status', d.assinatura_status, 'assinatura_metodo', d.assinatura_metodo,
        'ultimo_pagamento_em', d.ultimo_pagamento_em, 'falhas_pagamento', d.falhas_pagamento),
    'robo', jsonb_build_object('configurado', d.instancia IS NOT NULL, 'online', online,
        'whatsapp_conectado', st.whatsapp_conectado, 'robo_ativo', st.robo_ativo, 'ultimo_sinal', st.ultimo_sinal,
        'ativo', online AND coalesce(st.whatsapp_conectado, false) AND coalesce(st.robo_ativo, false) AND liberado),
    'semana', semana, 'mes', mes, 'serie', serie, 'pagamentos', pags);
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
    'isento', d.isento, 'ativacao_paga', d.ativacao_paga_em IS NOT NULL, 'assinatura_status', d.assinatura_status);
END $$;

-- Aplica um evento de webhook do AbacatePay (já validado pela function). Idempotente.
CREATE OR REPLACE FUNCTION public.ce_webhook_aplicar(p jsonb)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
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
  ELSIF ev = 'subscription.completed' AND did IS NOT NULL THEN
    tipo := 'mensalidade';
    UPDATE public.ce_distribuidores SET assinatura_id = subs, assinatura_status = 'ACTIVE', assinatura_metodo = metodo,
           ultimo_pagamento_em = now(), falhas_pagamento = 0 WHERE id = did;
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

-- ---------- Permissões ----------
REVOKE ALL ON FUNCTION public.ce_robo_registrar(text, text, text, text, boolean) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_evento(text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_sinal(text, jsonb) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_codigos(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_robo_codigo_enviado(text, bigint) FROM public;
REVOKE ALL ON FUNCTION public.ce_pedir_codigo(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_entrar(text, text) FROM public;
REVOKE ALL ON FUNCTION public.ce_sair(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_painel(text) FROM public;
REVOKE ALL ON FUNCTION public.ce_sessao_info(text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.ce_webhook_aplicar(jsonb) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ce_robo_registrar(text, text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_evento(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_sinal(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_codigos(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_robo_codigo_enviado(text, bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ce_pedir_codigo(text) TO anon, authenticated;
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
