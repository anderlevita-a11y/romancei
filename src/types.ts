export type LeadStatus = 
  | 'novo'
  | 'em_analise'
  | 'aprovado'
  | 'kit_entregue'
  | 'acerto_realizado'
  | 'recusado'
  | 'arquivado';

export interface Note {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  protocol: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  age?: number;
  phone: string;
  city: string;
  neighborhood?: string;
  hasExperience: 'sim' | 'nao';
  wantsFavorita40: 'sim' | 'nao';
  consentLgpd: boolean;
  termsAccepted: boolean;
  consentTimestamp?: string;
  createdAt: string;
  status: LeadStatus;
  notes: Note[];
  score?: 'alto' | 'medio' | 'baixo';
  source?: string;
  referralCouponCode?: string; // Código do cupom de indicação utilizado no cadastro
}

export type OrderStatus = 
  | 'ativo' 
  | 'acerto_proximo' 
  | 'acerto_atrasado' 
  | 'finalizado' 
  | 'cancelado';

export interface ConsignmentOrder {
  id: string;
  code: string;
  leadId: string;
  resellerName: string;
  resellerCpf: string;
  resellerPhone: string;
  resellerCity: string;
  kitAmount: number; // Consigned lingerie kit value
  favoritaAmount: number; // Catálogo Favorita purchase/order amount (min 400, max 600 first order)
  totalConsigned: number; // Total goods in hands
  commissionRate: 0.30 | 0.40; // 30% default, 40% if Favorita >= 400
  deliveryDate: string; // ISO string
  dueDate: string; // ISO string (Delivery + 40 days)
  status: OrderStatus;
  
  // Settlement fields (preenchidos no acerto)
  settlementDate?: string;
  soldAmount?: number; // Total sold
  returnedAmount?: number; // Total returned to stock
  resellerProfit?: number; // Money retained by reseller
  netCompanyAmount?: number; // Money paid to Romance Moda Itajaí
  settlementNotes?: string;
}

export interface BusinessSettings {
  businessName: string;
  distributorName: string; // Nome do distribuidor oficial e.g. "Anderson Rodrigues"
  brandSubtitle: string;
  officialWhatsApp: string; // Digits only e.g. "5547997626121"
  displayWhatsApp: string; // Formatted e.g. "(47) 99762-6121"
  instagramHandle: string;
  cityRegion: string;
  cycleDays: number; // 40
  baseCommission: number; // 30
  maxCommission: number; // 40
  favoritaMinOrder: number; // 400
  favoritaMaxFirstOrder: number; // 600
  catalogoFavoritaUrl?: string; // Link direto para folhear o catálogo online (ex: https://catalogofavorita.com.br/)
  lojaFisicaWhatsApp?: string; // e.g. "5547997626121"
  lojaFisicaDisplayWhatsApp?: string; // e.g. "(47) 99762-6121"
  lojaFisicaVendedora?: string; // e.g. "Luana"
  lojaFisicaMapsUrl?: string; // e.g. "https://maps.google.com/..."
  lojaFisicaEndereco?: string; // e.g. "Rua 230, Meia Praia, Itapema - SC"
  googleReviewsUrl?: string; // e.g. "https://maps.app.goo.gl/..."
  // Lojas Favorita Regionais Parceiras
  lojaJoinvilleVendedora?: string; // e.g. "Hevilin"
  lojaJoinvilleWhatsApp?: string; // e.g. "5547988407904"
  lojaJoinvilleDisplayWhatsApp?: string; // e.g. "(47) 98840-7904"
  lojaFlorianopolisVendedora?: string; // e.g. "Warla"
  lojaFlorianopolisWhatsApp?: string; // e.g. "5548996927999"
  lojaFlorianopolisDisplayWhatsApp?: string; // e.g. "(48) 99692-7999"
  heroBannerUrl?: string; // Custom hero image banner URL
  heroBannerTitle?: string;
  logoUrl?: string; // Custom Brand Logo URL
  supabaseUrl?: string; // Supabase Project URL
  supabaseAnonKey?: string; // Supabase Anon Public Key
  supabaseConnected?: boolean;
  supabaseLastSync?: string;
  adminPin: string;
  welcomeTemplate: string;
  kitReadyTemplate: string;
  settlementReminderTemplate: string;
  leadRejectedTemplate?: string;
}

export interface FaqItem {
  id: string;
  category: 'consignacao' | 'lucros' | 'cuidados' | 'produtos' | 'cadastro';
  categoryLabel: string;
  q: string;
  a: string;
  highlight?: string;
  tags?: string[];
}

export interface VideoItem {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  category: 'institucional' | 'lucros' | 'passo_a_passo' | 'depoimento';
  categoryLabel: string;
  videoUrl?: string; // Direct video url or fallback stream
  posterUrl: string;
  description: string;
  highlights: string[];
  featured?: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'distribuidor' | 'administrador' | 'gerente' | 'atendimento';
  password: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  isDefaultTest?: boolean;
}

export interface CommercialLine {
  id: string;
  title: string;
  badge: string;
  tagline: string;
  items: string[];
  profitHighlight: string;
  image: string;
  accentColor?: string; // 'rose' | 'pink' | 'amber' | 'emerald' | 'blue' | 'purple' | string
  isFavorita?: boolean;
  order?: number;
  active?: boolean;
  createdAt?: string;
}

export type AdminTabType = 'leads' | 'orders' | 'vendedoras' | 'referrals' | 'lines' | 'media' | 'testimonials' | 'metrics' | 'settings';

export interface ReferralCoupon {
  id: string;
  code: string;
  fullName: string;
  cpf: string;
  phone: string;
  city?: string;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'telefone' | 'email' | 'aleatoria' | 'cnpj';
  bankName?: string;
  creditBalance: number; // Saldo total gerado acumulado (R$ 10 * kits entregues)
  paidBalance?: number; // Saldo de bônus já pago / transferido pelo distribuidor
  totalReferralsCount: number; // Quantidade de amigas cadastradas com este cupom
  deliveredReferralsCount: number; // Quantidade de kits aprovados e entregues
  status?: 'ativo' | 'inativo' | 'bloqueado';
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export type TestimonialStatus = 'pending' | 'approved' | 'rejected';

export interface TestimonialItem {
  id: string;
  name: string;
  phone?: string;
  city: string;
  role: string; // Ex: "Revendedora há 1 ano", "Revendedora Diamante", "Cliente"
  quote: string;
  rating: number; // 1 a 5
  avatarUrl?: string; // Foto real ou null (se null, avatar gerado com iniciais)
  profit?: string; // Ex: "R$ 2.450 / ciclo" ou vazio
  status: TestimonialStatus; // 'pending' | 'approved' | 'rejected'
  featured?: boolean;
  verified?: boolean; // Selo de verificado (Google / Distribuição Oficial)
  source?: 'form' | 'google' | 'admin' | 'whatsapp';
  notes?: string; // Anotações internas do distribuidor
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type MediaType = 'photo' | 'video';
export type MediaCategory = 
  | 'fitness' 
  | 'seamless' 
  | 'casual' 
  | 'intima' 
  | 'cosmeticos' 
  | 'rmc_casa' 
  | 'sex_shop'
  | 'novidades' 
  | 'lingerie' 
  | 'favorita' 
  | 'campanha' 
  | 'depoimento';

export interface MediaItem {
  id: string;
  title: string;
  subtitle?: string;
  type: MediaType;
  category: MediaCategory;
  categoryLabel: string;
  mediaUrl: string; // Image URL or Video URL
  posterUrl?: string; // Cover thumbnail (especialmente para vídeos)
  description: string;
  tag?: string; // Ex: "Lançamento 2026", "Mais Vendido", "40% Lucro", "Top Destaque"
  badgeColor?: 'rose' | 'amber' | 'emerald' | 'purple' | 'blue';
  duration?: string; // Ex: "01:15"
  linkText?: string; // Ex: "Quero no Meu Kit", "Pedir Peças"
  linkAction?: 'form' | 'whatsapp' | 'external';
  externalUrl?: string;
  featured: boolean; // Destaque prioritário no carrossel de novidades
  active: boolean; // Publicado no site
  order: number; // Ordem de exibição
  createdAt: string;
}

export interface RealtimeLeadNotification {
  id: string;
  lead: Lead;
  timestamp: string;
  read: boolean;
  sourceType: 'realtime_api' | 'form_submission' | 'test';
}

// ---------------------------------------------------------------------------
// Módulo de Vendedoras e Perfil de Vendas (Montagem de Mostruário)
// ---------------------------------------------------------------------------

export interface ResellerUser {
  id: string;
  fullName: string;
  cpf: string;
  phone: string;
  email?: string;
  password?: string;
  city?: string;
  leadId?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
  hasSalesProfile?: boolean;
  updatedAt?: string;
  deviceAuthorized?: boolean;
  lastDeviceName?: string;
}

export type PantyPreference = 'tanga' | 'fio' | 'equilibrado';
export type DominantSize = 'P' | 'M' | 'G' | 'GG';

export interface ResellerSalesProfile {
  id: string;
  resellerId: string;
  resellerCpf: string;
  resellerName: string;
  resellerPhone: string;
  resellerCity?: string;

  // 1. Cuecas masculinas
  sellsMensUnderwear: boolean;
  mensUnderwearSizes: ('P' | 'M' | 'G' | 'GG')[];

  // 2. Bermuda e camiseta masculino
  sellsMensApparel: boolean;

  // 3. Roupas infantil
  sellsKidsClothing: boolean;

  // 4. Calcinha e cueca infantil
  sellsKidsUnderwear: boolean;

  // 5. Soutien sem bojo
  sellsBraletteNoPadding: boolean;

  // 6. Vende mais tanga ou fio
  pantyPreference: PantyPreference;

  // 7. Vende mais P, M, G ou GG
  topSellingSizes: DominantSize[];

  // 8. Roupas em geral (13 itens oficiais solicitados)
  // 'Bermuda' | 'Blusa' | 'Calça' | 'Camiseta' | 'Casaco' | 'Conjunto' | 'Top e cropped' | 'Legg' | 'Meias' | 'Pijamas' | 'Short doll' | 'Soutien avulso' | 'Vestido'
  generalClothingItems: string[];

  // 9. Recado salvo para o distribuidor
  distributorMessage: string;

  // 10. Data de Retorno do Atendimento e Notificação Web Push Automática
  returnDate?: string; // Formato YYYY-MM-DD
  returnTime?: string; // Formato HH:mm
  returnNotes?: string; // Observações do distribuidor para o retorno
  pushScheduled?: boolean; // Se o disparo automático para o aparelho está ativo
  pushNotificationTitle?: string;
  pushNotificationBody?: string;
  pushSentAt?: string;
  pushStatus?: 'agendado' | 'enviado' | 'pendente_autorizacao' | 'desativado';

  updatedAt: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Módulo Web Push & Dispositivos das Vendedoras
// ---------------------------------------------------------------------------

export interface ResellerDeviceSubscription {
  id: string;
  resellerId: string;
  resellerName: string;
  resellerCpf: string;
  resellerPhone: string;
  deviceName: string;
  deviceModel: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  permissionStatus: 'granted' | 'denied' | 'default';
  pushToken: string;
  endpoint?: string;
  userAgent?: string;
  registeredAt: string;
  lastActiveAt: string;
  active: boolean;
  expiresAt?: string;
  tokenStatus?: 'active' | 'expired' | 'revoked' | 'deactivated_by_user';
  deactivatedByUser?: boolean;
  deactivatedAt?: string;
  messagesSentCount?: number;
  messagesDeliveredCount?: number;
  messagesFailedCount?: number;
  lastMessageSentAt?: string;
  receivingStatus?: 'active_receiving' | 'tolerance_phase' | 'purge_eligible';
  pendingNotifications?: {
    id: string;
    title: string;
    body: string;
    scheduledFor: string;
    createdDate: string;
  }[];
}

export interface WebPushLog {
  id: string;
  resellerId: string;
  resellerName: string;
  resellerCpf: string;
  deviceId?: string;
  deviceName?: string;
  title: string;
  body: string;
  sentAt: string;
  scheduledFor?: string;
  triggerType: 'automatic_schedule' | 'manual_distributor' | 'welcome_test';
  status: 'delivered' | 'clicked' | 'queued' | 'permission_denied';
}

export interface PushSanitizationLog {
  id: string;
  timestamp: string;
  triggeredBy: 'automatic_schedule' | 'manual_distributor';
  totalTokensScanned: number;
  validTokensRetained: number;
  expiredTokensRemoved: number;
  revokedTokensRemoved: number;
  duplicateTokensRemoved: number;
  unreachableAfter10thRemoved?: number;
  totalPurged: number;
  details: string;
  status: 'success' | 'no_purge_needed';
  executorName?: string;
}


