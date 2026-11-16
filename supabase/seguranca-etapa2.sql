-- ==============================================================================
-- SEGURANÇA — ETAPA 2 (FECHA O BANCO)
-- Rode SOMENTE depois que o site novo estiver publicado e você já tiver
-- entrado no painel com o login novo (ver GUIA-SEGURANCA.md).
-- ==============================================================================

-- 1) Remove todas as políticas antigas "acesso completo" das tabelas do app
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('leads','consignment_orders','admin_users','business_settings','media_items',
                         'commercial_lines','testimonials','referral_coupons','reseller_users',
                         'reseller_sales_profiles','reseller_devices','automacao_cadastros')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- garante RLS ligado em todas
ALTER TABLE public.leads                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignment_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_lines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_sales_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_devices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automacao_cadastros     ENABLE ROW LEVEL SECURITY;

-- 2) Conteúdo público do site: qualquer visitante LÊ; só o admin altera
CREATE POLICY "publico le" ON public.business_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin altera" ON public.business_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "publico le" ON public.media_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin altera" ON public.media_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "publico le" ON public.commercial_lines FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin altera" ON public.commercial_lines FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3) Depoimentos: público vê os aprovados e ENVIA novos (sempre pendentes)
CREATE POLICY "publico le aprovados" ON public.testimonials FOR SELECT TO anon, authenticated USING (status = 'approved' OR public.is_admin());
CREATE POLICY "publico envia pendente" ON public.testimonials FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND COALESCE(featured, false) = false AND COALESCE(verified, false) = false);
CREATE POLICY "admin altera" ON public.testimonials FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin exclui" ON public.testimonials FOR DELETE TO authenticated USING (public.is_admin());

-- 4) Formulário para Automação: público só ENVIA; admin vê e gerencia
CREATE POLICY "publico envia" ON public.automacao_cadastros FOR INSERT TO anon, authenticated WITH CHECK (status = 'novo');
CREATE POLICY "admin gerencia" ON public.automacao_cadastros FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5) Dados sensíveis: SÓ o admin (o público usa as funções seguras da etapa 1)
CREATE POLICY "admin gerencia" ON public.leads                   FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin gerencia" ON public.consignment_orders      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin gerencia" ON public.admin_users             FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin gerencia" ON public.referral_coupons        FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin gerencia" ON public.reseller_users          FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin gerencia" ON public.reseller_sales_profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin gerencia" ON public.reseller_devices        FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6) Apaga as senhas em texto puro que ainda existirem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'business_settings' AND column_name = 'admin_pin') THEN
    EXECUTE 'UPDATE public.business_settings SET admin_pin = NULL';
    EXECUTE 'ALTER TABLE public.business_settings ALTER COLUMN admin_pin DROP DEFAULT';
  END IF;
END $$;
UPDATE public.reseller_users SET password = '' WHERE password <> '';
ALTER TABLE public.reseller_users ALTER COLUMN password SET DEFAULT '';
UPDATE public.admin_users SET password = '' WHERE password <> '';
ALTER TABLE public.admin_users ALTER COLUMN password SET DEFAULT '';
