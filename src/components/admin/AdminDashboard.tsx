import { useState } from 'react';
import { 
  Users, 
  PackageCheck, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft,
  Film,
  Menu,
  X,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  PackagePlus,
  Video,
  MessageSquareHeart,
  Layers,
  Bell,
  Volume2,
  VolumeX,
  Gift,
  UserCheck
} from 'lucide-react';
import { Lead, ConsignmentOrder, BusinessSettings, LeadStatus, AdminUser, MediaItem, AdminTabType, TestimonialItem, TestimonialStatus, CommercialLine, RealtimeLeadNotification, ReferralCoupon, ResellerUser, ResellerSalesProfile } from '../../types';
import { AdminLeadsTab } from './AdminLeadsTab';
import { AdminOrdersTab } from './AdminOrdersTab';
import { AdminResellerProfilesTab } from './AdminResellerProfilesTab';
import { AdminReferralsTab } from './AdminReferralsTab';
import { AdminLinesTab } from './AdminLinesTab';
import { AdminMediaTab } from './AdminMediaTab';
import { AdminTestimonialsTab } from './AdminTestimonialsTab';
import { AdminMetricsTab } from './AdminMetricsTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminLeadDetailModal } from './AdminLeadDetailModal';
import { AdminNewLeadModal } from './AdminNewLeadModal';
import { AdminNewOrderModal } from './AdminNewOrderModal';
import { AdminMediaModal } from './AdminMediaModal';
import { AdminTestimonialModal } from './AdminTestimonialModal';
import { AdminSettlementModal } from './AdminSettlementModal';
import { AdminReceiptModal } from './AdminReceiptModal';
import { AdminMobileBottomNav } from './AdminMobileBottomNav';
import { AdminLeadToastContainer, NotificationDrawer } from './AdminLeadToast';

interface AdminDashboardProps {
  leads: Lead[];
  orders: ConsignmentOrder[];
  coupons?: ReferralCoupon[];
  resellers?: ResellerUser[];
  salesProfiles?: ResellerSalesProfile[];
  settings: BusinessSettings;
  commercialLines?: CommercialLine[];
  mediaItems?: MediaItem[];
  testimonials?: TestimonialItem[];
  adminUsers?: AdminUser[];
  currentAdminUser?: AdminUser | null;
  isSyncing?: boolean;
  realtimeStatus?: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  notifications?: RealtimeLeadNotification[];
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onDismissNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  onTriggerTestNotification?: () => void;
  onForceSyncLeads?: () => void;
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => void;
  onAddLeadNote: (leadId: string, text: string) => void;
  onDeleteLead: (leadId: string) => void;
  onAddLead: (lead: Lead) => void;
  onSaveOrder: (order: ConsignmentOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
  onSaveCoupon?: (coupon: ReferralCoupon) => void;
  onDeleteCoupon?: (couponId: string) => void;
  onSettlementComplete: (
    orderId: string,
    soldAmount: number,
    returnedAmount: number,
    resellerProfit: number,
    netCompanyAmount: number,
    notes: string
  ) => void;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
  onAddLine?: (line: CommercialLine) => void;
  onUpdateLine?: (line: CommercialLine) => void;
  onDeleteLine?: (lineId: string) => void;
  onReorderLines?: (lines: CommercialLine[]) => void;
  onSyncLinesWithSupabase?: () => Promise<void>;
  onSyncMediaWithSupabase?: () => Promise<void>;
  onSaveMediaItem?: (item: MediaItem) => void;
  onDeleteMediaItem?: (itemId: string) => void;
  onToggleMediaActive?: (item: MediaItem) => void;
  onToggleMediaFeatured?: (item: MediaItem) => void;
  onSaveTestimonial?: (item: TestimonialItem) => void;
  onDeleteTestimonial?: (itemId: string) => void;
  onUpdateTestimonialStatus?: (testimonialId: string, status: TestimonialStatus) => void;
  onToggleTestimonialFeatured?: (item: TestimonialItem) => void;
  onToggleTestimonialVerified?: (item: TestimonialItem) => void;
  onSaveAdminUser?: (user: AdminUser) => void;
  onDeleteAdminUser?: (userId: string) => void;
  onSaveProfile?: (profile: ResellerSalesProfile) => void;
  onResetToDemoData: () => void;
  onBackToPublicSite: () => void;
  onLogout: () => void;
}

export function AdminDashboard({
  leads,
  orders,
  coupons = [],
  resellers = [],
  salesProfiles = [],
  settings,
  commercialLines = [],
  mediaItems = [],
  testimonials = [],
  adminUsers = [],
  currentAdminUser,
  isSyncing = false,
  realtimeStatus = 'CONNECTED',
  notifications = [],
  soundEnabled = true,
  onToggleSound = () => {},
  onDismissNotification = () => {},
  onClearAllNotifications = () => {},
  onTriggerTestNotification,
  onForceSyncLeads,
  onUpdateLeadStatus,
  onAddLeadNote,
  onDeleteLead,
  onAddLead,
  onSaveOrder,
  onDeleteOrder,
  onSaveCoupon = () => {},
  onDeleteCoupon = () => {},
  onSettlementComplete,
  onUpdateSettings,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
  onReorderLines,
  onSyncLinesWithSupabase,
  onSyncMediaWithSupabase,
  onSaveMediaItem,
  onDeleteMediaItem,
  onToggleMediaActive,
  onToggleMediaFeatured,
  onSaveTestimonial,
  onDeleteTestimonial,
  onUpdateTestimonialStatus,
  onToggleTestimonialFeatured,
  onToggleTestimonialVerified,
  onSaveAdminUser,
  onDeleteAdminUser,
  onSaveProfile,
  onResetToDemoData,
  onBackToPublicSite,
  onLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTabType>('leads');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Modals state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderInitialLead, setNewOrderInitialLead] = useState<Lead | null>(null);
  
  // Media Modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [editingMediaItem, setEditingMediaItem] = useState<MediaItem | null>(null);

  // Testimonial Modal state
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);

  const [settlementOrder, setSettlementOrder] = useState<ConsignmentOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<ConsignmentOrder | null>(null);

  // Badges count
  const newLeadsCount = leads.filter((l) => l.status === 'novo').length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'finalizado').length;
  const totalCouponsCount = coupons.length;
  const activeCommercialLinesCount = commercialLines.filter((l) => l.active !== false).length;
  const totalActiveMedia = mediaItems.filter((m) => m.active).length;
  const pendingTestimonialsCount = testimonials.filter((t) => t.status === 'pending').length;

  // Handlers for modal workflows
  const handleOpenLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCreateOrderFromLead = (lead: Lead) => {
    setNewOrderInitialLead(lead);
    setIsNewOrderModalOpen(true);
  };

  const handleOpenSettlement = (order: ConsignmentOrder) => {
    setSettlementOrder(order);
  };

  const handleSettlementDone = (
    orderId: string,
    soldAmount: number,
    returnedAmount: number,
    resellerProfit: number,
    netCompanyAmount: number,
    notes: string
  ) => {
    onSettlementComplete(orderId, soldAmount, returnedAmount, resellerProfit, netCompanyAmount, notes);
    
    // Find updated order to show receipt immediately
    const updated = orders.find((o) => o.id === orderId);
    if (updated) {
      setReceiptOrder({
        ...updated,
        soldAmount,
        returnedAmount,
        resellerProfit,
        netCompanyAmount,
        settlementNotes: notes,
        status: 'finalizado',
      });
    }
    setSettlementOrder(null);
  };

  // CSV Export for Brazilian Excel
  const handleExportLeadsCsv = () => {
    const headers = [
      'Protocolo',
      'Nome Completo',
      'CPF',
      'Data de Nascimento',
      'Telefone',
      'Regiao',
      'Status',
      'Catalogo Favorita (40%)',
      'Experiencia Previa',
      'Data de Cadastro',
    ];

    const rows = leads.map((l) => [
      l.protocol || '',
      `"${(l.fullName || '').replace(/"/g, '""')}"`,
      l.cpf || '',
      l.birthDate || '',
      l.phone || '',
      `"${(l.city || '').replace(/"/g, '""')}"`,
      l.status || '',
      l.wantsFavorita40 === 'sim' ? 'Sim (40%)' : 'Nao (30%)',
      l.hasExperience || '',
      l.createdAt || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_romance_modaitajai_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navTabs = [
    { id: 'leads' as const, label: 'Pré-Cadastros', icon: Users, badge: newLeadsCount },
    { id: 'orders' as const, label: 'Sacolas & Acertos', icon: PackageCheck, badge: activeOrdersCount },
    { id: 'vendedoras' as const, label: 'Vendedoras & Perfis', icon: UserCheck, badge: resellers.length },
    { id: 'referrals' as const, label: 'Cupons & Indicação', icon: Gift, badge: totalCouponsCount },
    { id: 'lines' as const, label: 'Linhas Comerciais', icon: Layers, badge: activeCommercialLinesCount },
    { id: 'testimonials' as const, label: 'Depoimentos', icon: MessageSquareHeart, badge: pendingTestimonialsCount },
    { id: 'media' as const, label: 'Fotos & Vídeos', icon: Film, badge: totalActiveMedia },
    { id: 'metrics' as const, label: 'Métricas', icon: BarChart3 },
    { id: 'settings' as const, label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/70 via-stone-50/80 to-rose-100/40 text-stone-900 flex flex-col font-sans relative pb-20 md:pb-8">
      
      {/* Decorative ambient glass orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="bg-stone-950/95 backdrop-blur-2xl text-white border-b border-white/10 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Brand */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-md border border-white/20 font-bold shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-rose-200" />
              </div>
              <div className="truncate min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-serif-luxury text-sm sm:text-xl font-bold text-white tracking-tight truncate">
                    {settings.businessName || 'Romance Itapema'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-rose-900/60 text-rose-300 px-1.5 sm:px-2 py-0.5 rounded-md border border-rose-500/30 shrink-0">
                    Admin
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-stone-400 hidden sm:block truncate">
                  Gestão Sem Investimento & Catálogo Favorita
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {currentAdminUser && (
                <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-left">
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs">
                    {currentAdminUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                      <span>{currentAdminUser.name}</span>
                      {currentAdminUser.isDefaultTest && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                          Teste
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 capitalize">{currentAdminUser.role}</span>
                  </div>
                </div>
              )}

              {/* Realtime Live Status Badge */}
              <div 
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold select-none ${
                  realtimeStatus === 'CONNECTED'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : realtimeStatus === 'CONNECTING'
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    : 'bg-stone-900/60 border-white/10 text-stone-400'
                }`}
                title={
                  realtimeStatus === 'CONNECTED' 
                    ? 'Conexão Realtime Supabase (WebSocket) ativa e sincronizando em tempo real'
                    : realtimeStatus === 'CONNECTING'
                    ? 'Estabelecendo conexão realtime com o Supabase...'
                    : 'Modo offline ou polling ativo'
                }
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  realtimeStatus === 'CONNECTED' 
                    ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50' 
                    : realtimeStatus === 'CONNECTING'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-stone-500'
                }`} />
                <span className="hidden lg:inline">
                  {realtimeStatus === 'CONNECTED' ? 'Realtime Supabase' : realtimeStatus === 'CONNECTING' ? 'Conectando...' : 'Reconectando'}
                </span>
              </div>

              {/* Realtime Lead Notifications Bell */}
              <button
                type="button"
                onClick={() => setIsNotificationDrawerOpen(true)}
                className={`relative p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                  notifications.length > 0
                    ? 'bg-rose-950/60 hover:bg-rose-900/80 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300'
                }`}
                title={`Notificações de Leads em Tempo Real (${notifications.length})`}
                aria-label="Abrir Notificações de Leads"
              >
                <div className="relative">
                  <Bell className={`w-4 h-4 ${notifications.length > 0 ? 'text-rose-400 animate-bounce' : 'text-stone-300'}`} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline">Alertas</span>
              </button>

              {/* Sound Alert Toggle Button */}
              <button
                type="button"
                onClick={onToggleSound}
                className={`p-2 rounded-xl border text-xs flex items-center justify-center cursor-pointer transition-all ${
                  soundEnabled
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-emerald-400'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-500'
                }`}
                title={soundEnabled ? 'Som de Notificação Ativado' : 'Som de Notificação Silenciado'}
                aria-label={soundEnabled ? 'Desativar som' : 'Ativar som'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Sync Button on Top (Desktop & Mobile) */}
              {onForceSyncLeads && (
                <button
                  type="button"
                  onClick={onForceSyncLeads}
                  disabled={isSyncing}
                  className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
                    isSyncing 
                      ? 'bg-rose-900/50 border-rose-500/50 text-rose-300' 
                      : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-500/40 text-emerald-300'
                  }`}
                  title="Sincronizar dados em tempo real"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-rose-300' : 'text-emerald-400'}`} />
                  <span className="hidden md:inline">{isSyncing ? 'Sincronizando' : 'Sincronizar'}</span>
                </button>
              )}

              {/* Back to Public Site */}
              <button
                type="button"
                onClick={onBackToPublicSite}
                className="bg-white/10 hover:bg-white/15 active:bg-white/20 text-stone-200 text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-white/15 backdrop-blur-md flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Voltar para a página pública"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Página Pública</span>
                <span className="sm:hidden text-[11px]">Site</span>
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={onLogout}
                className="text-stone-400 hover:text-white p-1.5 sm:p-2 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1"
                title="Sair do Painel"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-medium hidden lg:inline">Sair</span>
              </button>

              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 flex items-center justify-center border border-white/15 transition-all cursor-pointer"
                title="Menu Completo do Painel"
                aria-label="Abrir Menu Admin"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4 text-rose-400" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Tabs Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-stone-200/80 shadow-xs sticky top-14 sm:top-16 z-20">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none touch-pan-x">
            
            {navTabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`text-[10px] font-black px-1.5 sm:px-2 py-0.2 rounded-full ${
                      isActive ? 'bg-white text-rose-700' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full">
        {activeTab === 'leads' && (
          <AdminLeadsTab
            leads={leads}
            settings={settings}
            isSyncing={isSyncing}
            onForceSyncLeads={onForceSyncLeads}
            onSelectLead={handleOpenLeadDetails}
            onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
            onCreateOrderFromLead={handleCreateOrderFromLead}
            onExportLeadsCsv={handleExportLeadsCsv}
            onDeleteLead={onDeleteLead}
            onUpdateStatus={onUpdateLeadStatus}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrdersTab
            orders={orders}
            settings={settings}
            onOpenNewOrderModal={() => {
              setNewOrderInitialLead(null);
              setIsNewOrderModalOpen(true);
            }}
            onOpenSettlementModal={handleOpenSettlement}
            onOpenReceiptModal={(ord) => setReceiptOrder(ord)}
            onDeleteOrder={onDeleteOrder}
          />
        )}

        {activeTab === 'vendedoras' && (
          <AdminResellerProfilesTab
            resellers={resellers}
            salesProfiles={salesProfiles}
            settings={settings}
            onSaveProfile={onSaveProfile}
          />
        )}

        {activeTab === 'referrals' && (
          <AdminReferralsTab
            coupons={coupons}
            leads={leads}
            settings={settings}
            onSaveCoupon={onSaveCoupon}
            onDeleteCoupon={onDeleteCoupon}
            onUpdateLeadStatus={onUpdateLeadStatus}
          />
        )}

        {activeTab === 'lines' && (
          <AdminLinesTab
            lines={commercialLines}
            onAddLine={onAddLine || (() => {})}
            onUpdateLine={onUpdateLine || (() => {})}
            onDeleteLine={onDeleteLine || (() => {})}
            onReorderLines={onReorderLines || (() => {})}
            onSyncWithSupabase={onSyncLinesWithSupabase}
            supabaseConnected={Boolean(settings.supabaseConnected || (settings.supabaseUrl && settings.supabaseAnonKey))}
          />
        )}

        {activeTab === 'testimonials' && (
          <AdminTestimonialsTab
            testimonials={testimonials}
            settings={settings}
            onOpenNewTestimonialModal={() => {
              setEditingTestimonial(null);
              setIsTestimonialModalOpen(true);
            }}
            onOpenEditTestimonialModal={(item) => {
              setEditingTestimonial(item);
              setIsTestimonialModalOpen(true);
            }}
            onUpdateStatus={(id, status) => {
              if (onUpdateTestimonialStatus) {
                onUpdateTestimonialStatus(id, status);
              } else if (onSaveTestimonial) {
                const target = testimonials.find((t) => t.id === id);
                if (target) onSaveTestimonial({ ...target, status });
              }
            }}
            onToggleFeatured={(item) => {
              if (onToggleTestimonialFeatured) {
                onToggleTestimonialFeatured(item);
              } else if (onSaveTestimonial) {
                onSaveTestimonial({ ...item, featured: !item.featured });
              }
            }}
            onToggleVerified={(item) => {
              if (onToggleTestimonialVerified) {
                onToggleTestimonialVerified(item);
              } else if (onSaveTestimonial) {
                onSaveTestimonial({ ...item, verified: !item.verified });
              }
            }}
            onDeleteTestimonial={(id) => {
              if (onDeleteTestimonial) onDeleteTestimonial(id);
            }}
          />
        )}

        {activeTab === 'media' && (
          <AdminMediaTab
            mediaItems={mediaItems}
            settings={settings}
            onOpenNewMediaModal={() => {
              setEditingMediaItem(null);
              setIsMediaModalOpen(true);
            }}
            onOpenEditMediaModal={(item) => {
              setEditingMediaItem(item);
              setIsMediaModalOpen(true);
            }}
            onToggleActive={(item) => {
              if (onToggleMediaActive) {
                onToggleMediaActive(item);
              } else if (onSaveMediaItem) {
                onSaveMediaItem({ ...item, active: !item.active });
              }
            }}
            onToggleFeatured={(item) => {
              if (onToggleMediaFeatured) {
                onToggleMediaFeatured(item);
              } else if (onSaveMediaItem) {
                onSaveMediaItem({ ...item, featured: !item.featured });
              }
            }}
            onDeleteMediaItem={(itemId) => {
              if (onDeleteMediaItem) onDeleteMediaItem(itemId);
            }}
            onSyncWithSupabase={onSyncMediaWithSupabase}
          />
        )}

        {activeTab === 'metrics' && (
          <AdminMetricsTab
            leads={leads}
            orders={orders}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettingsTab
            settings={settings}
            adminUsers={adminUsers}
            currentAdminUser={currentAdminUser}
            onUpdateSettings={onUpdateSettings}
            onSaveAdminUser={onSaveAdminUser}
            onDeleteAdminUser={onDeleteAdminUser}
            onResetToDemoData={onResetToDemoData}
          />
        )}
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <AdminMobileBottomNav
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        newLeadsCount={newLeadsCount}
        activeOrdersCount={activeOrdersCount}
        totalActiveMedia={totalActiveMedia}
        onOpenQuickActionModal={() => setIsQuickActionModalOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Drawer (Admin Navigation & Shortcuts) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm ml-auto bg-stone-900 text-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-white/10">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-stone-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center font-bold text-white shadow-md">
                  <Sparkles className="w-4 h-4 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-white text-sm leading-none">Painel Distribuidor</h3>
                  <span className="text-[10px] text-rose-400 font-semibold">{settings.businessName || 'Romance Itapema'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 text-stone-300 flex items-center justify-center hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current User Info */}
            {currentAdminUser && (
              <div className="p-3 bg-white/5 border-b border-white/10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs">
                  {currentAdminUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-bold text-white truncate">{currentAdminUser.name}</div>
                  <div className="text-[10px] text-stone-400 capitalize">{currentAdminUser.role} • {currentAdminUser.email}</div>
                </div>
              </div>
            )}

            {/* Quick Actions Shortcuts */}
            <div className="p-3 border-b border-white/10 bg-stone-950/40 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">Ações Rápidas</p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsNewLeadModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Novo Lead</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setNewOrderInitialLead(null);
                    setIsNewOrderModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Nova Sacola</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {onForceSyncLeads && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onForceSyncLeads();
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/20 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sincronizar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleExportLeadsCsv();
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="p-3 space-y-1 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">Módulos do Sistema</p>
              
              {navTabs.map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-rose-600 text-white shadow-md' 
                        : 'text-stone-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-white text-rose-700' : 'bg-white/20 text-white'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-white/10 bg-stone-950 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onBackToPublicSite();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Site Público</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-800/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da Sessão Admin</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quick Action Modal (Mobile Center + Button) */}
      {isQuickActionModalOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/70 backdrop-blur-sm p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 animate-in slide-in-from-bottom-6 duration-200">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm">O que deseja cadastrar?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickActionModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsQuickActionModalOpen(false);
                  setIsNewLeadModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-50/70 hover:bg-rose-100 border border-rose-200/80 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs group-hover:text-rose-700">Novo Pré-Cadastro (Lead)</h4>
                  <p className="text-[11px] text-stone-500">Cadastre uma nova revendedora manualmente</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionModalOpen(false);
                  setNewOrderInitialLead(null);
                  setIsNewOrderModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100 border border-amber-200/80 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs group-hover:text-amber-700">Nova Sacola / Mostruário</h4>
                  <p className="text-[11px] text-stone-500">Entregar kit consignado de 40 dias</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionModalOpen(false);
                  setEditingMediaItem(null);
                  setIsMediaModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-purple-50/70 hover:bg-purple-100 border border-purple-200/80 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs group-hover:text-purple-700">Nova Foto ou Vídeo</h4>
                  <p className="text-[11px] text-stone-500">Publicar novidade ou vídeo Romance Play</p>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modals */}
      <AdminLeadDetailModal
        lead={selectedLead}
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={onUpdateLeadStatus}
        onAddNote={onAddLeadNote}
        onDeleteLead={onDeleteLead}
        onCreateOrderFromLead={handleCreateOrderFromLead}
        settings={settings}
      />

      <AdminNewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onAddLead={onAddLead}
      />

      <AdminNewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSaveOrder={onSaveOrder}
        initialLead={newOrderInitialLead}
        settings={settings}
      />

      {/* Media Management Modal */}
      <AdminMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          setEditingMediaItem(null);
        }}
        onSaveMediaItem={(item) => {
          if (onSaveMediaItem) onSaveMediaItem(item);
          setIsMediaModalOpen(false);
          setEditingMediaItem(null);
        }}
        editingItem={editingMediaItem}
        totalItemsCount={mediaItems.length}
      />

      {/* Testimonial Management Modal */}
      <AdminTestimonialModal
        isOpen={isTestimonialModalOpen}
        onClose={() => {
          setIsTestimonialModalOpen(false);
          setEditingTestimonial(null);
        }}
        onSave={(item) => {
          if (onSaveTestimonial) onSaveTestimonial(item);
          setIsTestimonialModalOpen(false);
          setEditingTestimonial(null);
        }}
        onDelete={(id) => {
          if (onDeleteTestimonial) onDeleteTestimonial(id);
          setIsTestimonialModalOpen(false);
          setEditingTestimonial(null);
        }}
        initialData={editingTestimonial}
      />

      <AdminSettlementModal
        order={settlementOrder}
        isOpen={Boolean(settlementOrder)}
        onClose={() => setSettlementOrder(null)}
        onConfirmSettlement={handleSettlementDone}
      />

      <AdminReceiptModal
        order={receiptOrder}
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        settings={settings}
      />

      {/* Realtime Lead Toast Floating Container */}
      <AdminLeadToastContainer
        notifications={notifications}
        onDismiss={onDismissNotification}
        onOpenLead={(lead) => handleOpenLeadDetails(lead)}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
      />

      {/* Realtime Notifications History Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onDismiss={onDismissNotification}
        onClearAll={onClearAllNotifications}
        onOpenLead={(lead) => {
          handleOpenLeadDetails(lead);
          setIsNotificationDrawerOpen(false);
        }}
        onTriggerTestNotification={onTriggerTestNotification}
      />

    </div>
  );
}
