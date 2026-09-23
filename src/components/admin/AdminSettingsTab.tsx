import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  MessageSquare, 
  Key, 
  Phone, 
  MapPin, 
  Percent, 
  CheckCircle2,
  AlertCircle,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Lock,
  Store,
  Image as ImageIcon,
  KeyRound,
  Fingerprint,
  ScanFace,
  Smartphone,
  ShieldAlert,
  ExternalLink,
  Code,
  Copy,
  Check
} from 'lucide-react';
import { BusinessSettings, AdminUser } from '../../types';
import { formatMediaUrl } from '../../utils/mediaUrlHelper';
import heroBannerAsset from '../../assets/images/hero_distribuidor_banner_1787665220498.jpg';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  getBiometricConfig,
  saveBiometricConfig,
  clearBiometricConfig,
  registerDeviceBiometrics,
  authenticateDeviceBiometrics,
  setAutoBiometricLogin,
  BiometricSecurityConfig
} from '../../utils/webauthn';

interface AdminSettingsTabProps {
  settings: BusinessSettings;
  adminUsers?: AdminUser[];
  currentAdminUser?: AdminUser | null;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onSaveAdminUser?: (user: AdminUser) => void;
  onDeleteAdminUser?: (userId: string) => void;
  onResetToDemoData: () => void;
}

export function AdminSettingsTab({
  settings,
  adminUsers = [],
  currentAdminUser,
  onUpdateSettings,
  onSaveAdminUser,
  onDeleteAdminUser,
  onResetToDemoData,
}: AdminSettingsTabProps) {
  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [isDirty, setIsDirty] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  // Keep formData synchronized when settings change externally or on load, but only if user has not edited locally
  useEffect(() => {
    if (!isDirty) {
      setFormData({ ...settings });
    }
  }, [settings, isDirty]);

  // Quick password change for current user
  const [quickPassword, setQuickPassword] = useState('');
  const [quickPasswordConfirm, setQuickPasswordConfirm] = useState('');
  const [showQuickPass, setShowQuickPass] = useState(false);
  const [quickPassMsg, setQuickPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin user edit/create modal/form state
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<'distribuidor' | 'administrador' | 'gerente' | 'atendimento'>('administrador');
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userError, setUserError] = useState('');

  // WebAuthn Biometrics State
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);
  const [bioConfig, setBioConfig] = useState<BiometricSecurityConfig>({ enabled: false, requireOnLogin: false, requireOnSettlement: false });
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [bioFeedback, setBioFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // SQL Script Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const BUSINESS_SETTINGS_SQL = `-- ==============================================================================
-- DISTRIBUIÇÃO ROMANCE & FAVORITA - SCHEMA & MIGRAÇÃO SUPABASE
-- Execute no SQL Editor do seu Painel Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. CRIAÇÃO DAS TABELAS (SE NÃO EXISTIREM)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100),
    experience VARCHAR(50),
    preferred_contact VARCHAR(50),
    status VARCHAR(50) DEFAULT 'NOVO',
    notes TEXT,
    protocol VARCHAR(50),
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consignment_orders (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    reseller_name VARCHAR(255) NOT NULL,
    reseller_whatsapp VARCHAR(50) NOT NULL,
    reseller_city VARCHAR(100) NOT NULL,
    kit_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    commission_rate INTEGER DEFAULT 30,
    items_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'SEPARACAO',
    delivery_date TIMESTAMPTZ,
    settlement_date TIMESTAMPTZ,
    amount_sold NUMERIC(10,2) DEFAULT 0.00,
    amount_returned NUMERIC(10,2) DEFAULT 0.00,
    reseller_profit NUMERIC(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_settings',
    business_name VARCHAR(255) DEFAULT 'Romance Itapema',
    distributor_name VARCHAR(255) DEFAULT 'Anderson Rodrigues',
    brand_subtitle TEXT DEFAULT 'Distribuição Oficial de Lingerie Sem Investimento & Catálogo Favorita',
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
    loja_fisica_whatsapp VARCHAR(30) DEFAULT '5547997626121',
    loja_fisica_display_whatsapp VARCHAR(30) DEFAULT '(47) 99762-6121',
    loja_fisica_vendedora TEXT DEFAULT 'Luana',
    loja_fisica_maps_url TEXT DEFAULT '',
    loja_fisica_endereco TEXT DEFAULT '',
    google_reviews_url TEXT DEFAULT '',
    loja_joinville_vendedora TEXT DEFAULT 'Hevilin',
    loja_joinville_whatsapp VARCHAR(30) DEFAULT '5547988407904',
    loja_joinville_display_whatsapp VARCHAR(30) DEFAULT '(47) 98840-7904',
    loja_florianopolis_vendedora TEXT DEFAULT 'Warla',
    loja_florianopolis_whatsapp VARCHAR(30) DEFAULT '5548996927999',
    loja_florianopolis_display_whatsapp VARCHAR(30) DEFAULT '(48) 99692-7999',
    hero_banner_url TEXT,
    logo_url TEXT,
    admin_pin VARCHAR(50) DEFAULT 'romance2026',
    welcome_template TEXT,
    kit_ready_template TEXT,
    settlement_reminder_template TEXT,
    lead_rejected_template TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'consultor',
    active BOOLEAN DEFAULT true,
    passkey_credential_id TEXT,
    passkey_public_key TEXT,
    passkey_counter INTEGER DEFAULT 0,
    passkey_created_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_items (
    id TEXT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_type VARCHAR(20) NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category VARCHAR(50) DEFAULT 'GERAL',
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) DEFAULT 'Revendedora Romance',
    author_city VARCHAR(100),
    author_avatar_url TEXT,
    rating INTEGER DEFAULT 5,
    content TEXT NOT NULL,
    earnings_highlight VARCHAR(100),
    time_as_reseller VARCHAR(50),
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commercial_lines (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    tag VARCHAR(100),
    description TEXT,
    image_url TEXT,
    features TEXT[],
    catalog_source VARCHAR(50) DEFAULT 'AMBOS',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referral_coupons (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    reseller_name VARCHAR(255) NOT NULL,
    reseller_whatsapp VARCHAR(50) NOT NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    bonus_value NUMERIC(10,2) DEFAULT 0.00,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GARANTIR QUE TODAS AS COLUNAS EXISTEM EM TODAS AS TABELAS (MIGRAÇÃO TOTAL)
-- 2.1 Colunas de business_settings
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS business_name VARCHAR(255) DEFAULT 'Romance Itapema';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS distributor_name VARCHAR(255) DEFAULT 'Anderson Rodrigues';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS brand_subtitle TEXT DEFAULT 'Distribuição Oficial de Lingerie Sem Investimento & Catálogo Favorita';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS official_whatsapp VARCHAR(30) DEFAULT '5547997626121';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS display_whatsapp VARCHAR(30) DEFAULT '(47) 99762-6121';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(100) DEFAULT '@romanceitapema';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS city_region TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS cycle_days INTEGER DEFAULT 40;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS base_commission INTEGER DEFAULT 30;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS max_commission INTEGER DEFAULT 40;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS favorita_min_order NUMERIC(10,2) DEFAULT 400.00;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS favorita_max_first_order NUMERIC(10,2) DEFAULT 600.00;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS catalogo_favorita_url TEXT DEFAULT 'https://catalogofavorita.com.br/';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS google_reviews_url TEXT DEFAULT '';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_fisica_maps_url TEXT DEFAULT '';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_fisica_endereco TEXT DEFAULT '';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_fisica_whatsapp VARCHAR(30) DEFAULT '5547997626121';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_fisica_display_whatsapp VARCHAR(30) DEFAULT '(47) 99762-6121';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_fisica_vendedora TEXT DEFAULT 'Luana';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_joinville_vendedora TEXT DEFAULT 'Hevilin';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_joinville_whatsapp VARCHAR(30) DEFAULT '5547988407904';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_joinville_display_whatsapp VARCHAR(30) DEFAULT '(47) 98840-7904';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_florianopolis_vendedora TEXT DEFAULT 'Warla';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_florianopolis_whatsapp VARCHAR(30) DEFAULT '5548996927999';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS loja_florianopolis_display_whatsapp VARCHAR(30) DEFAULT '(48) 99692-7999';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS hero_banner_url TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS admin_pin VARCHAR(50) DEFAULT 'romance2026';
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS welcome_template TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS kit_ready_template TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS settlement_reminder_template TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS lead_rejected_template TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2.2 Colunas de admin_users
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'consultor';
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS passkey_credential_id TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS passkey_public_key TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS passkey_counter INTEGER DEFAULT 0;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS passkey_created_at TIMESTAMPTZ;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2.3 Colunas de leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS experience VARCHAR(50);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(50);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'NOVO';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS protocol VARCHAR(50);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2.4 Colunas de consignment_orders
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS lead_id TEXT;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS reseller_name VARCHAR(255);
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS reseller_whatsapp VARCHAR(50);
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS reseller_city VARCHAR(100);
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS kit_value NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS commission_rate INTEGER DEFAULT 30;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SEPARACAO';
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS settlement_date TIMESTAMPTZ;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS amount_sold NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS amount_returned NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS reseller_profit NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.consignment_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. INSERIR OU ATUALIZAR CONFIGURAÇÃO PADRÃO
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
    admin_pin
) VALUES (
    'current_settings',
    'Romance Itapema',
    'Anderson Rodrigues',
    'Distribuição Oficial de Lingerie Sem Investimento & Catálogo Favorita',
    '5547997626121',
    '(47) 99762-6121',
    '@romanceitapema',
    'Itapema, Balneário Camboriú, Porto Belo, Itajaí e Região',
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
    'romance2026'
) ON CONFLICT (id) DO NOTHING;

-- Inserir usuário Administrador Master
INSERT INTO public.admin_users (id, name, email, role, active)
VALUES ('admin_master', 'Anderson Rodrigues', 'anderlevita@gmail.com', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_coupons ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['leads', 'consignment_orders', 'business_settings', 'admin_users', 'media_items', 'testimonials', 'commercial_lines', 'referral_coupons'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Acesso público leitura %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Acesso público leitura %I" ON public.%I FOR SELECT USING (true);', tbl, tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Acesso irrestrito mutação %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Acesso irrestrito mutação %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- 5. HABILITAR REALTIME (WEBSOCKETS)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['leads', 'consignment_orders', 'business_settings', 'admin_users', 'media_items', 'testimonials', 'commercial_lines', 'referral_coupons'])
    LOOP
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

-- 6. CRIAR BUCKETS DE STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('media', 'media', true),
    ('banner', 'banner', true),
    ('logo', 'logo', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Acesso público aos arquivos de mídia" ON storage.objects;
CREATE POLICY "Acesso público aos arquivos de mídia" ON storage.objects
    FOR SELECT USING (bucket_id IN ('media', 'banner', 'logo', 'avatars'));

DROP POLICY IF EXISTS "Upload livre para buckets de mídia" ON storage.objects;
CREATE POLICY "Upload livre para buckets de mídia" ON storage.objects
    FOR ALL USING (bucket_id IN ('media', 'banner', 'logo', 'avatars'))
    WITH CHECK (bucket_id IN ('media', 'banner', 'logo', 'avatars'));`;

  useEffect(() => {
    const supported = isWebAuthnSupported();
    setHasWebAuthn(supported);
    if (supported) {
      isPlatformAuthenticatorAvailable().then((avail) => {
        setHasPlatformAuth(avail);
      });
    }
    const currentConfig = getBiometricConfig();
    setBioConfig(currentConfig);
  }, []);

  const handleRegisterDeviceBiometrics = async () => {
    setIsBioLoading(true);
    setBioFeedback(null);

    const targetUser = currentAdminUser || adminUsers.find(u => u.role === 'distribuidor') || adminUsers[0] || {
      id: 'admin-master',
      name: settings.distributorName || 'Anderson Rodrigues',
      email: 'admin@romanceitapema.com.br',
    };

    try {
      const res = await registerDeviceBiometrics({
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      });

      setIsBioLoading(false);

      if (res.success) {
        const updated = getBiometricConfig();
        setBioConfig(updated);
        setBioFeedback({
          type: 'success',
          message: 'Biometria deste aparelho cadastrada com sucesso! Touch ID / Face ID / Digital prontos para uso.',
        });
      } else if (!res.canceled) {
        setBioFeedback({
          type: 'error',
          message: res.error || 'Falha ao registrar a biometria.',
        });
      }
    } catch (err: any) {
      setIsBioLoading(false);
      setBioFeedback({
        type: 'error',
        message: 'Erro durante o cadastro biométrico.',
      });
    }
  };

  const handleTestBiometrics = async () => {
    setIsBioLoading(true);
    setBioFeedback(null);

    try {
      const res = await authenticateDeviceBiometrics({
        promptReason: `Teste de validação biométrica do Painel ${formData.businessName || 'Romance Itapema'}`,
      });

      setIsBioLoading(false);

      if (res.success) {
        setBioFeedback({
          type: 'success',
          message: 'Excelente! O leitor biométrico respondeu perfeitamente e autenticou com sucesso.',
        });
      } else if (!res.canceled) {
        setBioFeedback({
          type: 'error',
          message: res.error || 'Não foi possível validar a biometria.',
        });
      }
    } catch (err: any) {
      setIsBioLoading(false);
      setBioFeedback({
        type: 'error',
        message: 'Erro no teste de biometria.',
      });
    }
  };

  const handleToggleBioRequirement = (key: 'requireOnLogin' | 'requireOnSettlement', value: boolean) => {
    const updated = saveBiometricConfig({ [key]: value });
    setBioConfig(updated);
    setBioFeedback({
      type: 'info',
      message: `Regra de biometria para ${key === 'requireOnLogin' ? 'Login' : 'Acerto de 40 Dias'} ${value ? 'ativada' : 'desativada'}.`,
    });
  };

  const handleToggleAutoBioLogin = (value: boolean) => {
    const updated = setAutoBiometricLogin(value);
    setBioConfig(updated);
    setBioFeedback({
      type: 'success',
      message: value 
        ? 'Login biométrico direto salvo com sucesso! Ao abrir o login do distribuidor, o leitor acionará a biometria diretamente sem pedir senha.'
        : 'Login biométrico direto desativado. O painel solicitará senha normalmente.',
    });
  };

  const handleClearBiometrics = () => {
    if (confirm('Deseja realmente desvincular a biometria deste aparelho?')) {
      clearBiometricConfig();
      setBioConfig({ enabled: false, requireOnLogin: false, requireOnSettlement: false });
      setBioFeedback({
        type: 'info',
        message: 'Biometria deste aparelho removida com sucesso.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateSettings(formData);
      setIsDirty(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickPassMsg(null);

    if (!quickPassword || quickPassword.length < 3) {
      setQuickPassMsg({ type: 'error', text: 'A nova senha deve ter no mínimo 3 caracteres.' });
      return;
    }

    if (quickPassword !== quickPasswordConfirm) {
      setQuickPassMsg({ type: 'error', text: 'A confirmação de senha não coincide com a nova senha digitada.' });
      return;
    }

    // Target the current logged in user, or master user
    const targetUser = currentAdminUser || adminUsers.find(u => u.role === 'distribuidor') || adminUsers[0];
    if (targetUser && onSaveAdminUser) {
      const updatedUser: AdminUser = {
        ...targetUser,
        password: quickPassword.trim(),
        isDefaultTest: false,
      };
      onSaveAdminUser(updatedUser);

      // Also update admin pin if preferred
      const newSettings = { ...formData, adminPin: quickPassword.trim() };
      setFormData(newSettings);
      onUpdateSettings(newSettings);

      setQuickPassMsg({ type: 'success', text: `Senha do administrador (${updatedUser.name}) alterada com sucesso!` });
      setQuickPassword('');
      setQuickPasswordConfirm('');
      setTimeout(() => setQuickPassMsg(null), 5000);
    }
  };

  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPhone(settings.displayWhatsApp || '');
    setUserRole('administrador');
    setUserPassword('');
    setUserError('');
    setIsEditingUser(true);
  };

  const handleOpenEditUser = (user: AdminUser) => {
    setEditingUserId(user.id);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPhone(user.phone || '');
    setUserRole(user.role);
    setUserPassword(user.password || '');
    setUserError('');
    setIsEditingUser(true);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');

    if (!userName.trim()) {
      setUserError('Informe o nome do administrador.');
      return;
    }

    if (!userEmail.trim() || !userEmail.includes('@')) {
      setUserError('Informe um e-mail válido.');
      return;
    }

    if (!userPassword.trim() || userPassword.length < 3) {
      setUserError('A senha deve ter pelo menos 3 dígitos.');
      return;
    }

    const userObj: AdminUser = {
      id: editingUserId || `admin-${Date.now()}`,
      name: userName.trim(),
      email: userEmail.trim().toLowerCase(),
      phone: userPhone.trim(),
      role: userRole,
      password: userPassword.trim(),
      createdAt: editingUserId ? (adminUsers.find(u => u.id === editingUserId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      isDefaultTest: false, // Once edited, it's customized!
    };

    if (onSaveAdminUser) {
      onSaveAdminUser(userObj);
      setAdminSuccessMsg(editingUserId ? 'Administrador atualizado com sucesso!' : 'Novo administrador cadastrado!');
      setTimeout(() => setAdminSuccessMsg(''), 4000);
    }

    setIsEditingUser(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (adminUsers.length <= 1) {
      alert('Não é possível excluir o único administrador do sistema.');
      return;
    }
    if (confirm('Tem certeza que deseja remover este acesso de administrador?')) {
      onDeleteAdminUser?.(userId);
      setAdminSuccessMsg('Administrador removido com sucesso.');
      setTimeout(() => setAdminSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      
      {/* Top Banner Alert & SQL Script Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 text-white p-4 rounded-2xl border border-stone-800 shadow-md">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <Code className="w-4 h-4" />
            <span>Sincronização & Banco Supabase</span>
          </div>
          <p className="text-xs text-stone-300">
            Precisa atualizar as colunas do banco (Google Maps, Avaliações, WhatsApp e Endereço)?
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsSqlModalOpen(true)}
          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Code className="w-3.5 h-3.5 text-rose-400" />
          <span>Ver / Copiar SQL Supabase</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Configurações salvas com sucesso no sistema da {formData.businessName || 'Romance Itapema'}!</span>
        </div>
      )}

      {adminSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{adminSuccessMsg}</span>
        </div>
      )}

      {/* Card: GESTÃO DE ADMINISTRADORES & LOGINS */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                Gestão de Logins & Administradores
              </h3>
              <p className="text-[11px] text-stone-500">
                Gerencie quem pode acessar o painel da distribuidora, edite senhas e customize o login de teste.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddUser}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Adicionar Novo Administrador</span>
          </button>
        </div>

        {/* User Edit / Create Inline Modal/Card */}
        {isEditingUser && (
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{editingUserId ? 'Editar Administrador / Alterar Senha' : 'Cadastrar Novo Administrador'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingUser(false)}
                className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do administrador"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-medium text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">E-mail / Login</label>
                <input
                  type="email"
                  required
                  placeholder="admin@romancemodaitajai.com.br"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-medium text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Cargo / Função</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-medium text-xs"
                >
                  <option value="distribuidor">Distribuidor Oficial</option>
                  <option value="administrador">Administrador Geral</option>
                  <option value="gerente">Gerente de Vendas</option>
                  <option value="atendimento">Atendimento & Logística</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Senha de Acesso</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Digite a nova senha"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full p-2.5 pr-8 rounded-xl border border-stone-300 bg-white font-medium text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {userError && (
                <div className="sm:col-span-2 text-rose-600 text-xs font-semibold bg-rose-100 p-2 rounded-lg">
                  {userError}
                </div>
              )}

              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingUser(false)}
                  className="px-3.5 py-2 rounded-xl text-stone-600 hover:bg-stone-200/50 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Dados de Acesso</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Change Password Box for Active Distributor */}
        <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-600" />
              <h4 className="font-bold text-rose-950 text-xs">
                Alteração Rápida de Senha do Distribuidor ({currentAdminUser?.name || settings.distributorName || 'Anderson Rodrigues'})
              </h4>
            </div>
            <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-md">
              Acesso Master
            </span>
          </div>

          <form onSubmit={handleQuickPasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700">Nova Senha</label>
              <div className="relative">
                <input
                  type={showQuickPass ? 'text' : 'password'}
                  required
                  placeholder="Digite a nova senha"
                  value={quickPassword}
                  onChange={(e) => setQuickPassword(e.target.value)}
                  className="w-full p-2.5 pr-8 rounded-xl border border-stone-300 bg-white font-medium text-xs text-stone-900"
                />
                <button
                  type="button"
                  onClick={() => setShowQuickPass(!showQuickPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showQuickPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700">Confirmar Nova Senha</label>
              <input
                type={showQuickPass ? 'text' : 'password'}
                required
                placeholder="Repita a nova senha"
                value={quickPasswordConfirm}
                onChange={(e) => setQuickPasswordConfirm(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-medium text-xs text-stone-900"
              />
            </div>

            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 h-[38px]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Atualizar Senha Agora</span>
            </button>
          </form>

          {quickPassMsg && (
            <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              quickPassMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {quickPassMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{quickPassMsg.text}</span>
            </div>
          )}
        </div>

        {/* List of Registered Administrators */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 gap-2.5">
            {adminUsers.map((user) => (
              <div 
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-stone-200/80 hover:border-rose-300 bg-stone-50/50 transition-all gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-xs">{user.name}</span>
                      {user.id === currentAdminUser?.id && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                          Você (Logado)
                        </span>
                      )}
                      {user.isDefaultTest && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          Login de Teste
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                      <span>{user.email}</span>
                      <span>•</span>
                      <span className="capitalize font-semibold text-stone-700">{user.role}</span>
                      <span>•</span>
                      <span className="font-mono text-stone-400">Senha: {user.password ? '••••••••' : '(PIN)'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenEditUser(user)}
                    className="p-2 text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer border border-stone-200"
                    title="Editar ou Alterar Senha"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar / Trocar Senha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Excluir Administrador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="space-y-6 text-xs">
        
        {/* Card 1: Informações de Contato e Distribuição */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
            <Phone className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              Canais de Atendimento & WhatsApp Oficial
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-stone-700">Distribuidor Responsável</label>
              <input
                type="text"
                required
                value={formData.distributorName || ''}
                onChange={(e) => setFormData({ ...formData, distributorName: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800"
                placeholder="Ex: Anderson Rodrigues"
              />
              <p className="text-[10px] text-stone-400">Nome do distribuidor oficial exibido nos contatos, WhatsApp e termos.</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">WhatsApp Oficial (Apenas Dígitos com 55)</label>
              <input
                type="text"
                required
                value={formData.officialWhatsApp}
                onChange={(e) => setFormData({ ...formData, officialWhatsApp: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono"
              />
              <p className="text-[10px] text-stone-400">Ex: 5547997626121 (Usado nos links de envio direto)</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">WhatsApp Formatado para Exibição</label>
              <input
                type="text"
                required
                value={formData.displayWhatsApp}
                onChange={(e) => setFormData({ ...formData, displayWhatsApp: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs"
              />
              <p className="text-[10px] text-stone-400">Ex: (47) 99762-6121</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Região de Atendimento</label>
              <input
                type="text"
                required
                value={formData.cityRegion}
                onChange={(e) => setFormData({ ...formData, cityRegion: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Instagram Oficial</label>
              <input
                type="text"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Card: Loja Física & Ponto de Atendimento */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              Loja Física & Ponto de Atendimento Catálogo
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Vendedora / Responsável na Loja</label>
              <input
                type="text"
                value={formData.lojaFisicaVendedora || ''}
                onChange={(e) => setFormData({ ...formData, lojaFisicaVendedora: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold"
                placeholder="Ex: Luana"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">WhatsApp da Loja Física (Dígitos com 55)</label>
              <input
                type="text"
                value={formData.lojaFisicaWhatsApp || ''}
                onChange={(e) => setFormData({ ...formData, lojaFisicaWhatsApp: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono"
                placeholder="5547997626121"
              />
              <p className="text-[10px] text-stone-400">Ex: 5547997626121</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">WhatsApp Loja Formatado para Exibição</label>
              <input
                type="text"
                value={formData.lojaFisicaDisplayWhatsApp || ''}
                onChange={(e) => setFormData({ ...formData, lojaFisicaDisplayWhatsApp: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                placeholder="(47) 99762-6121"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700">Link do Google Maps</label>
                {formData.lojaFisicaMapsUrl && formData.lojaFisicaMapsUrl.trim().startsWith('http') && (
                  <a
                    href={formData.lojaFisicaMapsUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Testar Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={formData.lojaFisicaMapsUrl || ''}
                onChange={(e) => setFormData({ ...formData, lojaFisicaMapsUrl: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono"
                placeholder="https://maps.google.com/?q=..."
              />
              <p className="text-[10px] text-stone-400">Link direto da sua localização no Google Maps.</p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700">Link de Avaliações Google (Google Reviews)</label>
                {formData.googleReviewsUrl && formData.googleReviewsUrl.trim().startsWith('http') && (
                  <a
                    href={formData.googleReviewsUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Testar Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={formData.googleReviewsUrl || ''}
                onChange={(e) => setFormData({ ...formData, googleReviewsUrl: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono"
                placeholder="https://maps.app.goo.gl/..."
              />
              <p className="text-[10px] text-stone-400">Link das avaliações do Google Maps exibido nos badges de depoimentos e no topo do site.</p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-stone-700">Endereço Completo da Loja Física / Ponto de Atendimento</label>
              <input
                type="text"
                value={formData.lojaFisicaEndereco || ''}
                onChange={(e) => setFormData({ ...formData, lojaFisicaEndereco: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                placeholder="Ex: Rua 230, Meia Praia, Itapema - SC (ou seu endereço)"
              />
              <p className="text-[10px] text-stone-400">Exibido na seção do Catálogo Favorita e rodapés de localização.</p>
            </div>
          </div>
        </div>

        {/* Card: Lojas Parceiras Favorita (Joinville & Florianópolis) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
            <Store className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              Lojas Favorita Regionais (Joinville & Florianópolis)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Joinville */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <h4 className="font-bold text-xs text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                Loja Favorita Joinville
              </h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">Vendedora Responsável</label>
                <input
                  type="text"
                  value={formData.lojaJoinvilleVendedora || ''}
                  onChange={(e) => setFormData({ ...formData, lojaJoinvilleVendedora: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                  placeholder="Ex: Hevilin"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">WhatsApp (Dígitos com 55)</label>
                <input
                  type="text"
                  value={formData.lojaJoinvilleWhatsApp || ''}
                  onChange={(e) => setFormData({ ...formData, lojaJoinvilleWhatsApp: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs font-mono"
                  placeholder="5547988407904"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">WhatsApp Formatado</label>
                <input
                  type="text"
                  value={formData.lojaJoinvilleDisplayWhatsApp || ''}
                  onChange={(e) => setFormData({ ...formData, lojaJoinvilleDisplayWhatsApp: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs"
                  placeholder="(47) 98840-7904"
                />
              </div>
            </div>

            {/* Florianópolis */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
              <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                Loja Favorita Florianópolis
              </h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">Vendedora Responsável</label>
                <input
                  type="text"
                  value={formData.lojaFlorianopolisVendedora || ''}
                  onChange={(e) => setFormData({ ...formData, lojaFlorianopolisVendedora: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                  placeholder="Ex: Warla"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">WhatsApp (Dígitos com 55)</label>
                <input
                  type="text"
                  value={formData.lojaFlorianopolisWhatsApp || ''}
                  onChange={(e) => setFormData({ ...formData, lojaFlorianopolisWhatsApp: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs font-mono"
                  placeholder="5548996927999"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">WhatsApp Formatado</label>
                <input
                  type="text"
                  value={formData.lojaFlorianopolisDisplayWhatsApp || ''}
                  onChange={(e) => setFormData({ ...formData, lojaFlorianopolisDisplayWhatsApp: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs"
                  placeholder="(48) 99692-7999"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Regras de Negócio Oficiais */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
            <Percent className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              Parâmetros de Margens de Lucro e Ciclo de 40 Dias
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Ciclo de Acerto (Dias)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.cycleDays}
                onChange={(e) => setFormData({ ...formData, cycleDays: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-center"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Lucro Base (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={formData.baseCommission}
                onChange={(e) => setFormData({ ...formData, baseCommission: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-center"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Lucro Máx. Favorita (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={formData.maxCommission}
                onChange={(e) => setFormData({ ...formData, maxCommission: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-center text-amber-700"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">Pedido Mín. Favorita (R$)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.favoritaMinOrder}
                onChange={(e) => setFormData({ ...formData, favoritaMinOrder: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-center"
              />
            </div>

            <div className="space-y-1 sm:col-span-4">
              <label className="font-bold text-stone-700 flex items-center gap-1.5">
                <span>Link do Catálogo Favorita Digital</span>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md font-semibold">Oficial</span>
              </label>
              <input
                type="url"
                value={formData.catalogoFavoritaUrl || ''}
                onChange={(e) => setFormData({ ...formData, catalogoFavoritaUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono text-stone-800"
                placeholder="https://catalogofavorita.com.br/"
              />
              <p className="text-[10px] text-stone-400">Link direto que as consultoras e clientes usam no site para ver o catálogo online (ex: https://catalogofavorita.com.br/)</p>
            </div>
          </div>
        </div>

        {/* Card 3: Modelos de Mensagens do WhatsApp */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              Modelos de Mensagens Prontas para WhatsApp
            </h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-bold text-stone-700">1. Mensagem de Boas-Vindas para Novo Lead</label>
              <textarea
                rows={2}
                value={formData.welcomeTemplate}
                onChange={(e) => setFormData({ ...formData, welcomeTemplate: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs leading-relaxed"
              />
              <p className="text-[10px] text-stone-400">Variáveis disponíveis: <code className="bg-stone-100 px-1">{'{nome}'}</code>, <code className="bg-stone-100 px-1">{'{protocolo}'}</code></p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">2. Mensagem de Kit Sem Investimento Pronto</label>
              <textarea
                rows={2}
                value={formData.kitReadyTemplate}
                onChange={(e) => setFormData({ ...formData, kitReadyTemplate: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700">3. Lembrete do Acerto de 40 Dias</label>
              <textarea
                rows={2}
                value={formData.settlementReminderTemplate}
                onChange={(e) => setFormData({ ...formData, settlementReminderTemplate: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-rose-800 flex items-center gap-1.5">
                  <span>4. Mensagem Amigável para Cadastro Não Aprovado</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-semibold">Retorno Acolhedor</span>
                </label>
              </div>
              <textarea
                rows={3}
                value={formData.leadRejectedTemplate || ''}
                onChange={(e) => setFormData({ ...formData, leadRejectedTemplate: e.target.value })}
                placeholder="Olá {nome}! Tudo bem? Agradecemos seu interesse na Distribuição Romance..."
                className="w-full p-3 rounded-xl border border-rose-200 bg-rose-50/30 text-xs leading-relaxed focus:bg-white"
              />
              <p className="text-[10px] text-stone-400">Enviada via atalho no painel de leads para dar um retorno cordial e profissional. Variáveis: <code className="bg-stone-100 px-1">{'{nome}'}</code>, <code className="bg-stone-100 px-1">{'{protocolo}'}</code></p>
            </div>
          </div>
        </div>

        {/* Card: Banner Hero Principal & Identidade Visual */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-stone-900 text-sm">
                Identidade Visual, Logo e Banner Hero
              </h3>
            </div>
            <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200/60">
              Personalização da Marca
            </span>
          </div>

          {/* Logo da Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pb-4 border-b border-stone-100">
            <div className="sm:col-span-2 space-y-2">
              <label className="font-bold text-stone-700 block">URL do Logotipo Oficial</label>
              <input
                type="url"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono"
                placeholder="https://... URL do logotipo da marca"
              />
              <p className="text-[10px] text-stone-400">
                Logotipo exibido no cabeçalho, gaveta mobile e rodapé da aplicação.
              </p>
            </div>

            <div className="flex items-center justify-center p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-md border border-stone-200">
                <img
                  src={formData.logoUrl || 'https://bminunltftkmfmsnjpea.supabase.co/storage/v1/object/sign/logo/e8bbfd68-4456-452c-ab67-ee284960fd02.jfif?token=eyJraWQiOiJlZDc2YzAxMi0xN2I2LTRjZWMtYjhlMy1iNTA4MTUxODlmZTMiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJsb2dvL2U4YmJmZDY4LTQ0NTYtNDUyYy1hYjY3LWVlMjg0OTYwZmQwMi5qZmlmIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4ODEwMzU0OSwiZXhwIjoxODE5NjM5NTQ5fQ.Qefo2xyIUBJ8P3UnKReyQ9UYaD4pUuRB-KsscKTkli2u6EDvI_nywYpue33nbjlJ95EH9GoGqtV7MNPH6dhR3Q'}
                  alt="Prévia do Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Banner Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-2 space-y-2">
              <label className="font-bold text-stone-700 block">URL da Imagem do Banner Hero</label>
              <input
                type="url"
                value={formData.heroBannerUrl || ''}
                onChange={(e) => setFormData({ ...formData, heroBannerUrl: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono"
                placeholder="Ex: Playbook (playbook.com), Google Drive ou link direto (ou vazio para o padrão)"
              />
              <p className="text-[10px] text-stone-400">
                Você pode colar a URL de fotos do <strong>Playbook (playbook.com)</strong>, <strong>Google Drive</strong> ou links de imagem direta, ou deixar em branco para a foto oficial.
              </p>
              {formData.heroBannerUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, heroBannerUrl: '' })}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold underline cursor-pointer"
                >
                  Restaurar foto de banner padrão do distribuidor
                </button>
              )}
            </div>

            <div className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 shadow-inner group">
              <img
                src={formData.heroBannerUrl ? formatMediaUrl(formData.heroBannerUrl, 'photo') : heroBannerAsset}
                alt="Prévia do Banner Hero"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-stone-950/40 flex items-center justify-center text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Prévia do Banner
              </div>
            </div>
          </div>
        </div>

        {/* Card: Segurança Biométrica & WebAuthn */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <Fingerprint className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-stone-900 text-sm">
                Segurança Biométrica do Aparelho (WebAuthn / Passkey)
              </h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              bioConfig.enabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : hasWebAuthn
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}>
              {bioConfig.enabled ? '● Biometria Ativa' : hasWebAuthn ? 'Disponível' : 'Não Suportado'}
            </span>
          </div>

          <p className="text-xs text-stone-500">
            Permite autenticar acessos ao painel e autorizar acertos financeiros usando a biometria nativa deste aparelho (Touch ID, Face ID, Windows Hello ou Sensor Digital Android).
          </p>

          {/* Feedback Notice */}
          {bioFeedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              bioFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : bioFeedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-stone-50 text-stone-800 border border-stone-200'
            }`}>
              {bioFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : bioFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 shrink-0 text-stone-600" />
              )}
              <span>{bioFeedback.message}</span>
            </div>
          )}

          {/* Device Status & Registration info */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-stone-600" />
                <span className="font-bold text-xs text-stone-900">
                  {bioConfig.deviceName || 'Aparelho Atual'}
                </span>
                {bioConfig.registeredAt && (
                  <span className="text-[10px] text-stone-400">
                    (Vinculado em {new Date(bioConfig.registeredAt).toLocaleDateString('pt-BR')})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegisterDeviceBiometrics}
                  disabled={isBioLoading || !hasWebAuthn}
                  className="bg-stone-900 hover:bg-black text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-rose-400" />
                  <span>{bioConfig.enabled ? 'Re-cadastrar Biometria' : 'Cadastrar Biometria Deste Aparelho'}</span>
                </button>

                {bioConfig.enabled && (
                  <>
                    <button
                      type="button"
                      onClick={handleTestBiometrics}
                      disabled={isBioLoading}
                      className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ScanFace className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Testar Sensor</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearBiometrics}
                      className="text-rose-600 hover:text-rose-800 text-xs px-2 py-1 hover:underline cursor-pointer"
                      title="Desvincular biometria deste navegador"
                    >
                      Desvincular
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Chave Seletora: Entrada Direta com Cadastro Biométrico */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-emerald-500/10 border border-rose-200/80 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold text-xs text-stone-900">
                    Entrar diretamente com o cadastro biométrico (Chave Seletora)
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    bioConfig.autoBiometricLogin
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-stone-200 text-stone-600 border-stone-300'
                  }`}>
                    {bioConfig.autoBiometricLogin ? '● Salvo e Ativo' : 'Desativado'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  Selecione uma vez nesta chave e fica salvo: ao abrir a tela de login do distribuidor, o leitor de digital ou Face ID autentica diretamente sem você precisar digitar senha.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={!!bioConfig.autoBiometricLogin}
                onClick={() => handleToggleAutoBioLogin(!bioConfig.autoBiometricLogin)}
                disabled={!bioConfig.enabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
                  bioConfig.autoBiometricLogin ? 'bg-emerald-600' : 'bg-stone-300'
                }`}
                title={!bioConfig.enabled ? 'Cadastre a biometria deste aparelho primeiro' : (bioConfig.autoBiometricLogin ? 'Desativar entrada direta' : 'Ativar entrada direta')}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    bioConfig.autoBiometricLogin ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Optional Security Rules Toggles */}
            <div className="pt-2 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bioConfig.requireOnLogin}
                  onChange={(e) => handleToggleBioRequirement('requireOnLogin', e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-xs text-stone-900 block">Exigir no Login do Painel</span>
                  <span className="text-[10px] text-stone-500 block leading-tight">Prioriza a tela biométrica ao abrir a tela de login</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bioConfig.requireOnSettlement}
                  onChange={(e) => handleToggleBioRequirement('requireOnSettlement', e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-xs text-stone-900 block">Exigir em Acertos de 40 Dias</span>
                  <span className="text-[10px] text-stone-500 block leading-tight">Solicita autenticação biométrica para concluir transações de acerto</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Card: PIN Master de Contingência */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
            <Key className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-stone-900 text-sm">
              PIN Master de Contingência
            </h3>
          </div>

          <div className="max-w-xs space-y-1">
            <label className="font-bold text-stone-700">PIN Master de Emergência</label>
            <input
              type="text"
              required
              value={formData.adminPin}
              onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
              className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono font-bold tracking-widest text-center"
            />
            <p className="text-[10px] text-stone-400">PIN rápido para autorizações e desbloqueio de emergência.</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 active:scale-[0.98] text-white font-bold text-sm py-4 px-8 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sincronizando em Tempo Real...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Configurações Salvas com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Todas as Configurações</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja recarregar os dados de demonstração iniciais da Distribuição Romance Itapema?')) {
                onResetToDemoData();
              }
            }}
            className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Dados Padrão</span>
          </button>
        </div>

      </form>

      {/* MODAL CÓDIGO SQL SUPABASE */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Código SQL Supabase - Configurações & Mapas</h3>
                  <p className="text-xs text-stone-400">Copie e cole no SQL Editor do seu Painel Supabase (https://supabase.com/dashboard)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <span className="font-bold">Passo a passo:</span>
              <span>1. Clique em "Copiar Código SQL" abaixo ➔ 2. Acesse seu projeto no Supabase ➔ 3. Vá em "SQL Editor" ➔ 4. Cole e clique em "RUN".</span>
            </div>

            {/* SQL Code Block */}
            <div className="p-6 overflow-y-auto flex-1 bg-stone-950 text-emerald-400 font-mono text-xs leading-relaxed selection:bg-rose-600 selection:text-white">
              <pre className="whitespace-pre-wrap">{BUSINESS_SETTINGS_SQL}</pre>
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-3">
              <span className="text-xs text-stone-500 font-medium">
                Garante todas as colunas: <code className="bg-stone-200 px-1 rounded">google_reviews_url</code>, <code className="bg-stone-200 px-1 rounded">loja_fisica_maps_url</code>, etc.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 cursor-pointer"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(BUSINESS_SETTINGS_SQL);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>SQL Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

