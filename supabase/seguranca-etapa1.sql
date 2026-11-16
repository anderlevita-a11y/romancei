-- ==============================================================================
-- SEGURANÇA — ETAPA 1 (NÃO QUEBRA NADA: pode rodar com o site antigo no ar)
-- Cria: tabela de administradores, senhas criptografadas, sessões da vendedora
-- e as funções seguras que o site novo usa.
-- Execute no Supabase: SQL Editor → New query → cole tudo → Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------- Tabelas da vendedora (criadas só se ainda não existirem) ----------
-- 11. TABELA: reseller_sales_profiles (Perfis de Vendas para Montagem da Sacola pelo Distribuidor)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reseller_sales_profiles (
    id TEXT PRIMARY KEY,
    reseller_id TEXT NOT NULL,
    reseller_cpf VARCHAR(20) NOT NULL,
    reseller_name TEXT NOT NULL,
    reseller_phone VARCHAR(30) NOT NULL,
    reseller_city TEXT,
    
    -- 1. Cuecas masculinas
    sells_mens_underwear BOOLEAN DEFAULT false,
    mens_underwear_sizes JSONB DEFAULT '[]'::jsonb,
    
    -- 2. Bermuda e camiseta masculino
    sells_mens_apparel BOOLEAN DEFAULT false,
    
    -- 3. Roupas infantil
    sells_kids_clothing BOOLEAN DEFAULT false,
    
    -- 4. Calcinha e cueca infantil
    sells_kids_underwear BOOLEAN DEFAULT false,
    
    -- 5. Soutien sem bojo
    sells_bralette_no_padding BOOLEAN DEFAULT false,
    
    -- 6. Vende mais tanga ou fio
    panty_preference VARCHAR(30) DEFAULT 'equilibrado',
    
    -- 7. Vende mais P, M, G ou GG
    top_selling_sizes JSONB DEFAULT '["M", "G"]'::jsonb,
    
    -- 8. Roupas em geral (13 itens oficiais)
    general_clothing_items JSONB DEFAULT '[]'::jsonb,
    
    -- 9. Recado salvo para o distribuidor
    distributor_message TEXT DEFAULT '',

    -- 10. Data de Retorno do Atendimento e Notificação Web Push Automática
    return_date DATE,
    return_time VARCHAR(10) DEFAULT '10:00',
    return_notes TEXT DEFAULT '',
    push_scheduled BOOLEAN DEFAULT true,
    push_notification_title TEXT DEFAULT 'Romance Itapema: Retorno do Mostruário',
    push_notification_body TEXT DEFAULT '',
    push_sent_at TIMESTAMPTZ,
    push_status VARCHAR(30) DEFAULT 'agendado',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migração segura caso a tabela já exista:
ALTER TABLE public.reseller_sales_profiles ADD COLUMN IF NOT EXISTS return_date DATE;
ALTER TABLE public.reseller_sales_profiles ADD COLUMN IF NOT EXISTS return_time VARCHAR(10) DEFAULT '10:00';
ALTER TABLE public.reseller_sales_profiles ADD COLUMN IF NOT EXISTS return_notes TEXT DEFAULT '';
ALTER TABLE public.reseller_sales_profiles ADD COLUMN IF NOT EXISTS push_scheduled BOOLEAN DEFAULT true;
ALTER TABLE public.reseller_sales_profiles ADD COLUMN IF NOT EXISTS push_notification_title TEXT DEFAULT 'Romance Itapema: Retorno do Mostruário';
ALTER TABLE public.reseller_sales_profiles ADD COLUMN IF NOT EXISTS push_notification_body TEXT DEFAULT '';
ALTER TABLE public.reseller_sales_profiles ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ;
ALTER TABLE public.reseller_sales_profiles ADD COLUMN IF NOT EXISTS push_status VARCHAR(30) DEFAULT 'agendado';

CREATE INDEX IF NOT EXISTS idx_sales_profiles_cpf ON public.reseller_sales_profiles(reseller_cpf);
CREATE INDEX IF NOT EXISTS idx_sales_profiles_reseller_id ON public.reseller_sales_profiles(reseller_id);
CREATE INDEX IF NOT EXISTS idx_sales_profiles_return_date ON public.reseller_sales_profiles(return_date);
CREATE INDEX IF NOT EXISTS idx_sales_profiles_updated_at ON public.reseller_sales_profiles(updated_at DESC);

-- 10. TABELA: reseller_devices (Aparelhos vinculados e autorização de Web Push)
CREATE TABLE IF NOT EXISTS public.reseller_devices (
    id TEXT PRIMARY KEY,
    reseller_id TEXT NOT NULL,
    reseller_name TEXT NOT NULL,
    reseller_cpf VARCHAR(20) NOT NULL,
    reseller_phone VARCHAR(30),
    device_name TEXT NOT NULL,
    device_model TEXT,
    device_type VARCHAR(20) DEFAULT 'mobile',
    browser TEXT,
    os TEXT,
    permission_status VARCHAR(20) DEFAULT 'granted',
    push_token TEXT,
    user_agent TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_reseller_devices_reseller_id ON public.reseller_devices(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_devices_cpf ON public.reseller_devices(reseller_cpf);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_sales_profiles, public.reseller_devices TO authenticated;

-- colunas usadas pelas funções (já existem na maioria das instalações)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referral_coupon_code VARCHAR(50);

-- ---------- Administradores (login pelo Supabase Auth) ----------
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nome TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "admins: admin gerencia" ON public.admins;
CREATE POLICY "admins: admin gerencia" ON public.admins
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- Senhas das vendedoras: criptografadas ----------
ALTER TABLE public.reseller_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.reseller_users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE public.reseller_users ADD COLUMN IF NOT EXISTS device_authorized BOOLEAN DEFAULT true;
ALTER TABLE public.reseller_users ADD COLUMN IF NOT EXISTS last_device_name TEXT;

UPDATE public.reseller_users
   SET password_hash = extensions.crypt(COALESCE(NULLIF(password, ''), '123'), extensions.gen_salt('bf')),
       must_change_password = (COALESCE(NULLIF(password, ''), '123') = '123')
 WHERE password_hash IS NULL;

-- ---------- Sessões do portal da vendedora ----------
CREATE TABLE IF NOT EXISTS public.reseller_sessions (
    token TEXT PRIMARY KEY,
    reseller_id TEXT NOT NULL REFERENCES public.reseller_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '60 days'
);
ALTER TABLE public.reseller_sessions ENABLE ROW LEVEL SECURITY;
-- (sem políticas: só as funções abaixo acessam)

-- ---------- Auxiliares ----------
CREATE OR REPLACE FUNCTION public._digitos(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$ SELECT regexp_replace(COALESCE(t, ''), '\D', '', 'g') $$;

CREATE OR REPLACE FUNCTION public._reseller_publico(r public.reseller_users) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT to_jsonb(r) - 'password' - 'password_hash';
$$;

CREATE OR REPLACE FUNCTION public._reseller_por_token(p_token text) RETURNS public.reseller_users
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reseller_users;
BEGIN
  SELECT u.* INTO r FROM public.reseller_sessions s JOIN public.reseller_users u ON u.id = s.reseller_id
   WHERE s.token = p_token AND s.expires_at > now() AND u.active IS NOT FALSE;
  IF NOT FOUND THEN RAISE EXCEPTION 'sessao_invalida'; END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public._nova_sessao(p_reseller_id text) RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE t text := encode(extensions.gen_random_bytes(32), 'hex');
BEGIN
  DELETE FROM public.reseller_sessions WHERE expires_at < now();
  INSERT INTO public.reseller_sessions (token, reseller_id) VALUES (t, p_reseller_id);
  RETURN t;
END $$;

-- ==============================================================================
-- FUNÇÕES PÚBLICAS (usadas pelo site sem login)
-- ==============================================================================

-- Telefone do lead: alguns bancos usam a coluna "phone", outros "whatsapp"
CREATE OR REPLACE FUNCTION public._tel_lead(l public.leads) RETURNS text
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT COALESCE(NULLIF(to_jsonb(l)->>'phone', ''), to_jsonb(l)->>'whatsapp');
$$;

-- Pré-cadastro: grava o lead SEM poder ler os outros
CREATE OR REPLACE FUNCTION public.submit_lead(p jsonb) RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.leads; tel text := COALESCE(NULLIF(p->>'phone',''), p->>'whatsapp');
BEGIN
  -- grava o telefone na coluna que existir (phone ou whatsapp)
  p := p || jsonb_build_object('phone', tel, 'whatsapp', tel);
  r := jsonb_populate_record(NULL::public.leads, p);
  IF r.id IS NULL OR r.full_name IS NULL OR r.cpf IS NULL OR tel IS NULL THEN
    RAISE EXCEPTION 'dados_incompletos';
  END IF;
  r.status := 'novo';
  INSERT INTO public.leads SELECT r.* ON CONFLICT (id) DO NOTHING;
  RETURN r.id;
END $$;

-- Indique & Ganhe: cria ou atualiza o PRÓPRIO cupom (pelo CPF) e devolve o cupom
CREATE OR REPLACE FUNCTION public.coupon_save_public(p jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.referral_coupons; novo public.referral_coupons;
BEGIN
  novo := jsonb_populate_record(NULL::public.referral_coupons, p);
  IF length(public._digitos(novo.cpf)) <> 11 THEN RAISE EXCEPTION 'cpf_invalido'; END IF;
  SELECT * INTO c FROM public.referral_coupons WHERE public._digitos(cpf) = public._digitos(novo.cpf);
  IF FOUND THEN
    UPDATE public.referral_coupons
       SET pix_key = COALESCE(novo.pix_key, pix_key),
           pix_key_type = COALESCE(novo.pix_key_type, pix_key_type),
           bank_name = COALESCE(novo.bank_name, bank_name),
           phone = COALESCE(novo.phone, phone),
           city = COALESCE(novo.city, city),
           updated_at = now()
     WHERE id = c.id RETURNING * INTO c;
  ELSE
    -- campos financeiros sempre começam zerados
    novo.credit_balance := 0; novo.paid_balance := 0;
    novo.total_referrals_count := 0; novo.delivered_referrals_count := 0;
    novo.status := 'ativo'; novo.notes := NULL;
    novo.created_at := now(); novo.updated_at := now();
    INSERT INTO public.referral_coupons SELECT novo.* RETURNING * INTO c;
  END IF;
  RETURN to_jsonb(c);
END $$;

-- Indique & Ganhe: consulta do cupom pelo CPF + indicações (só nome e status)
CREATE OR REPLACE FUNCTION public.coupon_lookup(p_cpf text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.referral_coupons; indicadas jsonb;
BEGIN
  SELECT * INTO c FROM public.referral_coupons WHERE public._digitos(cpf) = public._digitos(p_cpf);
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', l.id,
           'full_name', split_part(l.full_name, ' ', 1),
           'city', l.city,
           'status', l.status,
           'created_at', l.created_at,
           'referral_coupon_code', l.referral_coupon_code) ORDER BY l.created_at DESC), '[]'::jsonb)
    INTO indicadas
    FROM public.leads l WHERE upper(l.referral_coupon_code) = upper(c.code);
  RETURN jsonb_build_object('coupon', to_jsonb(c), 'leads', indicadas);
END $$;

-- ==============================================================================
-- PORTAL DA VENDEDORA
-- ==============================================================================

-- Diz se existe vendedora / pré-cadastro para o CPF ou telefone (sem expor dados)
CREATE OR REPLACE FUNCTION public.reseller_check(p_id text) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d text := public._digitos(p_id);
BEGIN
  IF length(d) < 10 THEN RETURN 'nenhum'; END IF;
  IF EXISTS (SELECT 1 FROM public.reseller_users WHERE public._digitos(cpf) = d OR public._digitos(phone) = d) THEN RETURN 'vendedora'; END IF;
  IF EXISTS (SELECT 1 FROM public.leads l WHERE public._digitos(l.cpf) = d OR public._digitos(public._tel_lead(l)) = d) THEN RETURN 'pre_cadastro'; END IF;
  RETURN 'nenhum';
END $$;

CREATE OR REPLACE FUNCTION public._resposta_login(r public.reseller_users) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE perfil jsonb;
BEGIN
  SELECT to_jsonb(sp) INTO perfil FROM public.reseller_sales_profiles sp
   WHERE sp.reseller_id = r.id OR public._digitos(sp.reseller_cpf) = public._digitos(r.cpf)
   ORDER BY sp.updated_at DESC NULLS LAST LIMIT 1;
  RETURN jsonb_build_object(
    'token', public._nova_sessao(r.id),
    'reseller', public._reseller_publico(r),
    'profile', perfil,
    'must_change_password', COALESCE(r.must_change_password, false));
END $$;

-- Login: CPF ou telefone + senha (conferida no servidor, criptografada)
CREATE OR REPLACE FUNCTION public.reseller_login(p_id text, p_password text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reseller_users; d text := public._digitos(p_id);
BEGIN
  SELECT * INTO r FROM public.reseller_users
   WHERE (public._digitos(cpf) = d OR public._digitos(phone) = d) AND active IS NOT FALSE
   LIMIT 1;
  IF FOUND AND COALESCE(r.must_change_password, false) THEN
    RAISE EXCEPTION 'precisa_ativar';
  END IF;
  IF NOT FOUND OR r.password_hash IS NULL
     OR r.password_hash <> extensions.crypt(COALESCE(p_password, ''), r.password_hash) THEN
    PERFORM pg_sleep(0.5);
    RAISE EXCEPTION 'login_invalido';
  END IF;
  UPDATE public.reseller_users SET last_login = now() WHERE id = r.id RETURNING * INTO r;
  RETURN public._resposta_login(r);
END $$;

-- Primeiro acesso: cria a conta (CPF ainda sem senha própria)
CREATE OR REPLACE FUNCTION public.reseller_register(p jsonb, p_password text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reseller_users; novo public.reseller_users;
BEGIN
  IF length(COALESCE(p_password, '')) < 6 THEN RAISE EXCEPTION 'senha_curta'; END IF;
  novo := jsonb_populate_record(NULL::public.reseller_users, p);
  IF length(public._digitos(novo.cpf)) <> 11 OR novo.full_name IS NULL OR novo.phone IS NULL THEN
    RAISE EXCEPTION 'dados_incompletos';
  END IF;
  SELECT * INTO r FROM public.reseller_users WHERE public._digitos(cpf) = public._digitos(novo.cpf);
  IF FOUND THEN
    IF NOT COALESCE(r.must_change_password, false) THEN RAISE EXCEPTION 'ja_cadastrada'; END IF;
    IF public._digitos(r.phone) <> public._digitos(novo.phone) THEN
      PERFORM pg_sleep(0.5);
      RAISE EXCEPTION 'telefone_nao_confere';
    END IF;
    UPDATE public.reseller_users
       SET password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
           must_change_password = false, password = '', last_login = now(),
           phone = COALESCE(novo.phone, phone), email = COALESCE(novo.email, email), city = COALESCE(novo.city, city)
     WHERE id = r.id RETURNING * INTO r;
  ELSE
    IF EXISTS (SELECT 1 FROM public.leads WHERE public._digitos(cpf) = public._digitos(novo.cpf))
       AND NOT EXISTS (SELECT 1 FROM public.leads l WHERE public._digitos(l.cpf) = public._digitos(novo.cpf)
                                                   AND public._digitos(public._tel_lead(l)) = public._digitos(novo.phone)) THEN
      PERFORM pg_sleep(0.5);
      RAISE EXCEPTION 'telefone_nao_confere';
    END IF;
    novo.password := '';
    novo.password_hash := extensions.crypt(p_password, extensions.gen_salt('bf'));
    novo.must_change_password := false;
    novo.active := true;
    novo.created_at := now(); novo.last_login := now();
    INSERT INTO public.reseller_users SELECT novo.* RETURNING * INTO r;
  END IF;
  RETURN public._resposta_login(r);
END $$;

-- Dados atuais da sessão (ao reabrir o portal)
CREATE OR REPLACE FUNCTION public.reseller_me(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reseller_users; perfil jsonb;
BEGIN
  r := public._reseller_por_token(p_token);
  SELECT to_jsonb(sp) INTO perfil FROM public.reseller_sales_profiles sp
   WHERE sp.reseller_id = r.id ORDER BY sp.updated_at DESC NULLS LAST LIMIT 1;
  RETURN jsonb_build_object('reseller', public._reseller_publico(r), 'profile', perfil,
                            'must_change_password', COALESCE(r.must_change_password, false));
END $$;

-- Vendedora atualiza os próprios dados (e troca a senha)
CREATE OR REPLACE FUNCTION public.reseller_update_self(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reseller_users;
BEGIN
  r := public._reseller_por_token(p_token);
  UPDATE public.reseller_users SET
      phone = COALESCE(p->>'phone', phone),
      email = COALESCE(p->>'email', email),
      city = COALESCE(p->>'city', city),
      device_authorized = COALESCE((p->>'device_authorized')::boolean, device_authorized),
      last_device_name = COALESCE(p->>'last_device_name', last_device_name),
      last_login = now()
   WHERE id = r.id RETURNING * INTO r;
  IF length(COALESCE(p->>'new_password', '')) > 0 THEN
    IF length(p->>'new_password') < 6 THEN RAISE EXCEPTION 'senha_curta'; END IF;
    UPDATE public.reseller_users
       SET password_hash = extensions.crypt(p->>'new_password', extensions.gen_salt('bf')),
           must_change_password = false, password = ''
     WHERE id = r.id RETURNING * INTO r;
  END IF;
  RETURN public._reseller_publico(r);
END $$;

-- Vendedora salva o próprio perfil de vendas
CREATE OR REPLACE FUNCTION public.reseller_save_profile(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reseller_users; sp public.reseller_sales_profiles; atual public.reseller_sales_profiles;
BEGIN
  r := public._reseller_por_token(p_token);
  sp := jsonb_populate_record(NULL::public.reseller_sales_profiles, p);
  SELECT * INTO atual FROM public.reseller_sales_profiles WHERE reseller_id = r.id LIMIT 1;
  sp.id := COALESCE(atual.id, sp.id, 'perfil-' || r.id);
  sp.reseller_id := r.id; sp.reseller_cpf := r.cpf; sp.reseller_name := r.full_name;
  sp.reseller_phone := r.phone; sp.reseller_city := r.city;
  sp.created_at := COALESCE(atual.created_at, now()); sp.updated_at := now();
  IF atual.id IS NOT NULL THEN
    -- campos que só a distribuidora define continuam como estão
    sp.distributor_message := atual.distributor_message;
    sp.return_date := atual.return_date; sp.return_time := atual.return_time; sp.return_notes := atual.return_notes;
    sp.push_scheduled := atual.push_scheduled; sp.push_notification_title := atual.push_notification_title;
    sp.push_notification_body := atual.push_notification_body; sp.push_sent_at := atual.push_sent_at;
    sp.push_status := atual.push_status;
    DELETE FROM public.reseller_sales_profiles WHERE id = atual.id;
  END IF;
  INSERT INTO public.reseller_sales_profiles SELECT sp.*;
  RETURN to_jsonb(sp);
END $$;

-- Vendedora registra o próprio aparelho (notificações)
CREATE OR REPLACE FUNCTION public.reseller_save_device(p_token text, p jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reseller_users; d public.reseller_devices;
BEGIN
  r := public._reseller_por_token(p_token);
  d := jsonb_populate_record(NULL::public.reseller_devices, p);
  IF d.id IS NULL THEN RAISE EXCEPTION 'dados_incompletos'; END IF;
  d.reseller_id := r.id; d.reseller_name := r.full_name; d.reseller_cpf := r.cpf; d.reseller_phone := r.phone;
  d.last_active_at := now();
  DELETE FROM public.reseller_devices WHERE id = d.id AND reseller_id = r.id;
  IF EXISTS (SELECT 1 FROM public.reseller_devices WHERE id = d.id) THEN RAISE EXCEPTION 'aparelho_de_outra_conta'; END IF;
  INSERT INTO public.reseller_devices SELECT d.*;
END $$;

CREATE OR REPLACE FUNCTION public.reseller_logout(p_token text) RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.reseller_sessions WHERE token = p_token;
$$;

-- ---------- Permissões das funções ----------
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'submit_lead(jsonb)', 'coupon_save_public(jsonb)', 'coupon_lookup(text)',
    'reseller_check(text)', 'reseller_login(text,text)', 'reseller_register(jsonb,text)',
    'reseller_me(text)', 'reseller_update_self(text,jsonb)', 'reseller_save_profile(text,jsonb)',
    'reseller_save_device(text,jsonb)', 'reseller_logout(text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM public', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO anon, authenticated', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY[
    '_reseller_por_token(text)', '_nova_sessao(text)', '_resposta_login(public.reseller_users)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM public, anon, authenticated', f);
  END LOOP;
END $$;
