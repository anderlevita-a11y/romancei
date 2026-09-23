-- ==============================================================================
-- ROMANCE ITAPEMA - ESQUEMA COMPLETO DE BANCO DE DADOS SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Execute este script no SQL Editor do seu Painel Supabase (https://app.supabase.com)
-- Todas as tabelas, índices, políticas de segurança (RLS) e triggers serão criados automaticamente.

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELA: leads (Pré-cadastros de Revendedoras Sem Investimento)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    birth_date VARCHAR(20),
    phone VARCHAR(30) NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    cep VARCHAR(20),
    wants_favorita_40 VARCHAR(10) DEFAULT 'sim',
    has_experience TEXT DEFAULT 'nao',
    status VARCHAR(30) DEFAULT 'novo',
    notes TEXT,
    protocol VARCHAR(50) NOT NULL,
    terms_accepted BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida de leads
CREATE INDEX IF NOT EXISTS idx_leads_cpf ON public.leads(cpf);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- ==============================================================================
-- 3. TABELA: consignment_orders (Sacolas Consignadas & Acertos de 40 Dias)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.consignment_orders (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
    reseller_name TEXT NOT NULL,
    reseller_phone VARCHAR(30) NOT NULL,
    reseller_cpf VARCHAR(20),
    reseller_city TEXT,
    kit_amount NUMERIC(10,2) DEFAULT 0.00,
    favorita_amount NUMERIC(10,2) DEFAULT 0.00,
    total_consigned NUMERIC(10,2) DEFAULT 0.00,
    commission_rate NUMERIC(4,2) DEFAULT 0.30,
    delivery_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    settlement_date TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'ativo',
    sold_amount NUMERIC(10,2),
    returned_amount NUMERIC(10,2),
    reseller_profit NUMERIC(10,2),
    net_company_amount NUMERIC(10,2),
    settlement_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.consignment_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON public.consignment_orders(due_date);

-- ==============================================================================
-- 4. TABELA: admin_users (Logins & Senhas de Administradores do Painel)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role VARCHAR(30) DEFAULT 'administrador',
    password TEXT NOT NULL,
    phone VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_default_test BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- ==============================================================================
-- 5. TABELA: business_settings (Configurações Gerais da Distribuidora)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.business_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_settings',
    business_name TEXT DEFAULT 'Romance Itapema',
    distributor_name TEXT DEFAULT 'Anderson Rodrigues',
    brand_subtitle TEXT,
    official_whatsapp VARCHAR(30) DEFAULT '5547997626121',
    display_whatsapp VARCHAR(30) DEFAULT '(47) 99762-6121',
    instagram_handle VARCHAR(100) DEFAULT '@romanceitapema',
    city_region TEXT,
    cycle_days INTEGER DEFAULT 40,
    base_commission INTEGER DEFAULT 30,
    max_commission INTEGER DEFAULT 40,
    favorita_min_order NUMERIC(10,2) DEFAULT 400.00,
    favorita_max_first_order NUMERIC(10,2) DEFAULT 600.00,
    catalogo_favorita_url TEXT DEFAULT 'https://catalogofavorita.com.br/',
    loja_fisica_whatsapp VARCHAR(30),
    loja_fisica_display_whatsapp VARCHAR(30),
    loja_fisica_vendedora TEXT DEFAULT 'Luana',
    loja_fisica_maps_url TEXT,
    loja_fisica_endereco TEXT,
    google_reviews_url TEXT DEFAULT '',
    loja_joinville_vendedora TEXT DEFAULT 'Hevilin',
    loja_joinville_whatsapp VARCHAR(30),
    loja_joinville_display_whatsapp VARCHAR(30),
    loja_florianopolis_vendedora TEXT DEFAULT 'Warla',
    loja_florianopolis_whatsapp VARCHAR(30),
    loja_florianopolis_display_whatsapp VARCHAR(30),
    hero_banner_url TEXT,
    admin_pin VARCHAR(50) DEFAULT 'romance2026',
    welcome_template TEXT,
    kit_ready_template TEXT,
    settlement_reminder_template TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. TABELA: media_items (Galeria de Fotos, Vídeos & Novidades 2026)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.media_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    type VARCHAR(20) NOT NULL, -- 'photo' ou 'video'
    category VARCHAR(50) NOT NULL,
    category_label TEXT NOT NULL,
    media_url TEXT NOT NULL,
    poster_url TEXT,
    description TEXT,
    tag VARCHAR(50),
    badge_color VARCHAR(30) DEFAULT 'rose',
    duration VARCHAR(20),
    link_text VARCHAR(100),
    link_action VARCHAR(30) DEFAULT 'form',
    external_url TEXT,
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_active ON public.media_items(active, order_index);

-- ==============================================================================
-- 7. TABELA: commercial_lines (Linhas Comerciais Oficiais & Mix de Produtos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.commercial_lines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    badge VARCHAR(100) NOT NULL,
    tagline TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    profit_highlight TEXT NOT NULL,
    image TEXT NOT NULL,
    accent_color VARCHAR(50) DEFAULT 'rose',
    is_favorita BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lines_order ON public.commercial_lines(order_index ASC);
CREATE INDEX IF NOT EXISTS idx_lines_active ON public.commercial_lines(active, order_index ASC);

-- Compatibilidade Retroativa: Garante migração de colunas e remove NOT NULL de colunas antigas (ex: subtitle, description)
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT 'rose';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS profit_highlight TEXT DEFAULT '';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS badge VARCHAR(100) DEFAULT '';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS is_favorita BOOLEAN DEFAULT false;
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'commercial_lines' AND column_name = 'subtitle'
  ) THEN
    ALTER TABLE public.commercial_lines ALTER COLUMN subtitle DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'commercial_lines' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.commercial_lines ALTER COLUMN description DROP NOT NULL;
  END IF;
END $$;

-- ==============================================================================
-- 8. TABELA: testimonials (Depoimentos & Avaliações Reais com Moderação)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone VARCHAR(30),
    city TEXT NOT NULL,
    role VARCHAR(100) DEFAULT 'Revendedora',
    quote TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    avatar_url TEXT,
    profit TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    featured BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    source VARCHAR(30) DEFAULT 'form',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON public.testimonials(featured);

-- ==============================================================================
-- 9. TABELA: referral_coupons (Programa Indique e Ganhe, Cupons e Bonificações)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.referral_coupons (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    cpf VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(30),
    city TEXT,
    pix_key TEXT,
    pix_key_type VARCHAR(20),
    bank_name TEXT,
    credit_balance NUMERIC(10,2) DEFAULT 0.00,
    paid_balance NUMERIC(10,2) DEFAULT 0.00,
    total_referrals_count INTEGER DEFAULT 0,
    delivered_referrals_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ativo',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_coupons_code ON public.referral_coupons(code);
CREATE INDEX IF NOT EXISTS idx_referral_coupons_cpf ON public.referral_coupons(cpf);

-- ==============================================================================
-- 10. TABELA: reseller_users (Contas de Acesso das Vendedoras ao Portal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reseller_users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    password TEXT NOT NULL DEFAULT '123',
    city TEXT,
    lead_id TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resellers_cpf ON public.reseller_users(cpf);
CREATE INDEX IF NOT EXISTS idx_resellers_phone ON public.reseller_users(phone);

-- ==============================================================================
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

-- ==============================================================================
-- 12. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_sales_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Permitir acesso completo a leads" ON public.leads;
CREATE POLICY "Permitir acesso completo a leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a consignment_orders" ON public.consignment_orders;
CREATE POLICY "Permitir acesso completo a consignment_orders" ON public.consignment_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a referral_coupons" ON public.referral_coupons;
CREATE POLICY "Permitir acesso completo a referral_coupons" ON public.referral_coupons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a admin_users" ON public.admin_users;
CREATE POLICY "Permitir acesso completo a admin_users" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso a business_settings" ON public.business_settings;
CREATE POLICY "Permitir acesso a business_settings" ON public.business_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso a media_items" ON public.media_items;
CREATE POLICY "Permitir acesso a media_items" ON public.media_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso a testimonials" ON public.testimonials;
CREATE POLICY "Permitir acesso a testimonials" ON public.testimonials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso a commercial_lines" ON public.commercial_lines;
CREATE POLICY "Permitir acesso a commercial_lines" ON public.commercial_lines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a reseller_users" ON public.reseller_users;
CREATE POLICY "Permitir acesso completo a reseller_users" ON public.reseller_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a reseller_sales_profiles" ON public.reseller_sales_profiles;
CREATE POLICY "Permitir acesso completo a reseller_sales_profiles" ON public.reseller_sales_profiles FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 8. TRIGGER AUTOMÁTICO DE ATUALIZAÇÃO DE TIMESTAMPS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leads_updated_at ON public.leads;
CREATE TRIGGER trigger_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.consignment_orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON public.consignment_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_settings_updated_at ON public.business_settings;
CREATE TRIGGER trigger_settings_updated_at
    BEFORE UPDATE ON public.business_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 13. HABILITAÇÃO DO REALTIME (IDEMPOTENTE)
-- ==============================================================================
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.consignment_orders REPLICA IDENTITY FULL;
ALTER TABLE public.business_settings REPLICA IDENTITY FULL;
ALTER TABLE public.media_items REPLICA IDENTITY FULL;
ALTER TABLE public.testimonials REPLICA IDENTITY FULL;
ALTER TABLE public.commercial_lines REPLICA IDENTITY FULL;
ALTER TABLE public.admin_users REPLICA IDENTITY FULL;
ALTER TABLE public.referral_coupons REPLICA IDENTITY FULL;
ALTER TABLE public.reseller_users REPLICA IDENTITY FULL;
ALTER TABLE public.reseller_sales_profiles REPLICA IDENTITY FULL;

DO $$
DECLARE
  t text;
  tbls text[] := ARRAY['leads', 'consignment_orders', 'business_settings', 'media_items', 'testimonials', 'commercial_lines', 'admin_users', 'referral_coupons', 'reseller_users', 'reseller_sales_profiles'];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- 9. DADOS INICIAIS (SEED DATA)
-- ==============================================================================
-- Insere configurações padrão caso a tabela esteja vazia
INSERT INTO public.business_settings (
    id,
    business_name,
    distributor_name,
    brand_subtitle,
    official_whatsapp,
    display_whatsapp,
    instagram_handle,
    city_region,
    cycle_days,
    base_commission,
    max_commission,
    favorita_min_order,
    favorita_max_first_order,
    catalogo_favorita_url,
    loja_fisica_whatsapp,
    loja_fisica_display_whatsapp,
    loja_fisica_vendedora,
    loja_fisica_maps_url,
    loja_fisica_endereco,
    google_reviews_url,
    loja_joinville_vendedora,
    loja_joinville_whatsapp,
    loja_joinville_display_whatsapp,
    loja_florianopolis_vendedora,
    loja_florianopolis_whatsapp,
    loja_florianopolis_display_whatsapp,
    admin_pin,
    welcome_template,
    kit_ready_template,
    settlement_reminder_template
) VALUES (
    'current_settings',
    'Romance Itapema',
    'Anderson Rodrigues',
    'Distribuição Oficial de Lingerie Sem Investimento & Catálogo Favorita',
    '5547997626121',
    '(47) 99762-6121',
    '@romanceitapema',
    'Itapema, Itajaí, Balneário Camboriú, Camboriú, Navegantes, Penha, Piçarras, Araquari & Joinville',
    40,
    30,
    40,
    400.00,
    600.00,
    'https://catalogofavorita.com.br/',
    '5547997626121',
    '(47) 99762-6121',
    'Luana',
    '',
    '',
    '',
    'Hevilin',
    '5547988407904',
    '(47) 98840-7904',
    'Warla',
    '5548996927999',
    '(48) 99692-7999',
    'romance2026',
    'Olá {nome}! Aqui é o Anderson da Distribuição Romance Itapema. Recebemos seu pré-cadastro (Protocolo: {protocolo}). Vamos agendar a liberação do seu Mostruário Sem Investimento de Lingerie?',
    'Oi {nome}! Seu Mostruário Sem Investimento Romance com lucro de {lucro}% está pronto para entrega/retirada. Você tem 40 dias para vender sem risco!',
    'Olá {nome}! Tudo bem? Passando para lembrar que o acerto do seu ciclo de 40 dias do Mostruário Romance vence em {dias} dias ({data}). Como foram as vendas?'
) ON CONFLICT (id) DO NOTHING;

-- Insere Administrador Oficial Master
INSERT INTO public.admin_users (
    id,
    name,
    email,
    role,
    password,
    phone,
    is_default_test
) VALUES (
    'admin-master',
    'Anderson Rodrigues',
    'admin@romanceitapema.com.br',
    'distribuidor',
    'admin',
    '(47) 99762-6121',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_users (
    id,
    name,
    email,
    role,
    password,
    phone,
    is_default_test
) VALUES (
    'admin-demo-teste',
    'Administrador de Teste',
    'teste@romance.com.br',
    'administrador',
    'romance2026',
    '(47) 99762-6121',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insere Linhas Comerciais Iniciais
INSERT INTO public.commercial_lines (id, title, badge, tagline, items, profit_highlight, image, accent_color, is_favorita, active, order_index)
VALUES
('fitness', 'Fitness', 'Alta Performance', 'Moda fitness com tecnologia de compressão e zero transparência', '["Leggings Power Modeladoras", "Tops com Alta Sustentação", "Shorts e Bermudas de Treino", "Macacões e Conjuntos Fit"]'::jsonb, 'Lucro de R$ 35 a R$ 70 por conjunto', '/images/lines/line_fitness_product.jpg', 'rose', false, true, 1),
('seamless', 'Seamless', 'Sem Costura', 'Tecnologia que não marca a roupa e traz conforto anatômico absoluto', '["Calcinhas Laser Invisíveis", "Tops e Sutiãs sem Costura", "Bermudas Modeladoras", "Bodies Segunda Pele"]'::jsonb, 'Giro rápido e recompra recorrente', '/images/lines/line_seamless_product.jpg', 'pink', false, true, 2),
('casual', 'Casual', 'Estilo & Conforto', 'Moda dia a dia versátil para compor looks modernos e práticos', '["Croppeds e T-shirts Modernas", "Bodies Tendência", "Shorts e Saias Confort", "Vestidos e Conjuntos Casuais"]'::jsonb, 'Excelente apelo visual para vendas rápidas', '/images/lines/line_casual_product.jpg', 'amber', false, true, 3),
('intima', 'Moda Íntima', 'Lingerie Nobre', 'Lingeries finas em renda nobre, bojos estruturados e linha noite sensual', '["Conjuntos Renda Francesa", "Modelos Strappy & Sensuais", "Sutiãs com Aro e Sustentação", "Baby Dolls & Camisolas"]'::jsonb, 'Lucro de 30% a 40% em cada peça', '/images/lines/line_intima_product.jpg', 'rose', false, true, 4),
('cosmeticos', 'Cosméticos', 'Catálogo Favorita', 'Perfumaria fina, maquiagem e cuidados corporais que liberam 40% de lucro', '["Perfumaria Fina Masculina & Feminina", "Maquiagem & Skincare", "Hidratantes e Cuidados Pessoais", "Pedido mín. R$ 400 / máx R$ 600"]'::jsonb, 'Ativa o lucro máximo de 40% nas lingeries sem investimento', '/images/lines/line_cosmeticos_product.jpg', 'emerald', true, true, 5),
('rmc_casa', 'RMC Casa', 'Lar & Conforto', 'Cama, mesa, banho, aromas de ambiente e utilidades práticas para o lar', '["Jogos de Cama e Toalhas Nobres", "Aromatizadores & Difusores", "Capas e Almofadas Decorativas", "Utilidades Domésticas Práticas"]'::jsonb, 'Ticket médio elevado e compras para família', '/images/lines/line_rmc_casa_product.jpg', 'blue', false, true, 6),
('sex_shop', 'Sex Shop', 'Boutique Sensual', 'Linha sensual sofisticada, cosméticos estimulantes e produtos para momentos a dois', '["Óleos de Massagem Beijáveis", "Géis Térmicos (Quente / Frio)", "Velas de Massagem Aromáticas", "Acessórios & Cosméticos Sensuais"]'::jsonb, 'Altíssima margem e procura espontânea', '/images/lines/line_sex_shop_product.jpg', 'purple', false, true, 7)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    badge = EXCLUDED.badge,
    tagline = EXCLUDED.tagline,
    items = EXCLUDED.items,
    profit_highlight = EXCLUDED.profit_highlight,
    accent_color = EXCLUDED.accent_color,
    is_favorita = EXCLUDED.is_favorita;

-- ==============================================================================
-- FIM DO SCRIPT SUPABASE
-- ==============================================================================
