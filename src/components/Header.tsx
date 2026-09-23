import { useState } from 'react';
import { 
  Lock, 
  Search, 
  Menu, 
  X, 
  Sparkles, 
  Camera, 
  Film, 
  HelpCircle, 
  Calculator, 
  Trophy, 
  BookOpen, 
  Instagram, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Gift,
  Download,
  UserCheck
} from 'lucide-react';
import { BusinessSettings, ResellerUser } from '../types';
import { ROMANCE_APP_PLAYSTORE_URL, ROMANCE_APP_APPSTORE_URL, GooglePlayIcon, AppleIcon } from './AppDownloadBadges';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  settings: BusinessSettings;
  onOpenAdmin: () => void;
  onScrollToForm: () => void;
  onOpenLgpd: () => void;
  onOpenInstagramPromo?: () => void;
  onOpenSearch?: () => void;
  onOpenShare?: () => void;
  onOpenReferralModal?: () => void;
  onOpenResellerPortal?: () => void;
  currentReseller?: ResellerUser | null;
}

export function Header({
  settings,
  onOpenAdmin,
  onScrollToForm,
  onOpenLgpd,
  onOpenInstagramPromo,
  onOpenSearch,
  onOpenShare,
  onOpenReferralModal,
  onOpenResellerPortal,
  currentReseller,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFormClick = () => {
    setIsMobileMenuOpen(false);
    onScrollToForm();
  };

  const navLinks = [
    { label: 'Fotos & Novidades', id: 'galeria-fotos', icon: Camera },
    { label: 'Vídeos', id: 'sessao-videos', icon: Film },
    { label: 'Como Funciona', id: 'como-funciona', icon: HelpCircle },
    { label: 'Simulador', id: 'simulador-lucro', icon: Calculator },
    { label: 'Catálogo 40%', id: 'catalogo-favorita', icon: BookOpen },
    { label: 'Prêmios 2026', id: 'estrelas-romance', icon: Trophy },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-stone-200/80 shadow-xs transition-all">
        {/* Top Banner Notice with Official App Download Links */}
        <div className="bg-gradient-to-r from-rose-950 via-stone-950 to-rose-950 text-rose-100 text-xs py-1.5 sm:py-2 px-2.5 sm:px-4 font-medium border-b border-white/10 w-full overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
            
            {/* Left: Key Value Proposition */}
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs truncate min-w-0">
              <span className="font-bold text-rose-200 shrink-0">Zero investimento</span>
              <span className="text-stone-500 shrink-0">•</span>
              <span className="text-amber-300 font-bold shrink-0">30% a 40% Lucro</span>
              <span className="text-stone-500 hidden sm:inline shrink-0">•</span>
              <span className="hidden sm:inline text-stone-300 truncate">Pague só o que vender</span>
            </div>

            {/* Right: Direct App Store & Google Play Download Links + Share Button */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {onOpenShare && (
                <button
                  type="button"
                  onClick={onOpenShare}
                  className="inline-flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-amber-500/25 to-rose-500/25 hover:from-amber-500/40 hover:to-rose-500/40 text-amber-200 hover:text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-amber-300/40 hover:border-amber-300/80 transition-all cursor-pointer shadow-2xs group shrink-0"
                  title="Compartilhar página com amigas e ganhar brindes"
                >
                  <Share2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="hidden xs:inline">Compartilhar</span>
                  <span className="text-[9px] bg-amber-400 text-stone-950 font-black px-1 rounded">
                    +Brindes
                  </span>
                </button>
              )}

              {/* Mobile compact store icons */}
              <div className="flex items-center gap-1 bg-white/10 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg border border-white/20 sm:hidden shrink-0">
                <span className="text-stone-400 text-[9px] mr-0.5">App:</span>
                <a
                  href={ROMANCE_APP_PLAYSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-0.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Google Play Store"
                >
                  <GooglePlayIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href={ROMANCE_APP_APPSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-0.5 text-white hover:text-rose-200 transition-colors"
                  title="Apple App Store"
                >
                  <AppleIcon className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Desktop / Tablet full store buttons */}
              <span className="text-[10px] sm:text-[11px] text-stone-400 font-medium hidden md:inline">
                Baixar APP:
              </span>

              <a
                href={ROMANCE_APP_PLAYSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-lg border border-white/20 hover:border-emerald-400/60 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Baixar App Romance na Google Play Store"
              >
                <GooglePlayIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap">Play Store</span>
              </a>

              <a
                href={ROMANCE_APP_APPSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-lg border border-white/20 hover:border-rose-300/60 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Baixar App Romance na Apple App Store"
              >
                <AppleIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white shrink-0" />
                <span className="whitespace-nowrap">App Store</span>
              </a>
            </div>

          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-18 gap-1.5 sm:gap-2">
            
            {/* Left: Logo Brand */}
            <a href="#" className="flex items-center gap-1.5 sm:gap-3 group shrink-0 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-sm sm:shadow-md shadow-rose-950/10 border border-stone-200 group-hover:scale-105 transition-transform shrink-0">
                <img
                  src={settings.logoUrl || 'https://bminunltftkmfmsnjpea.supabase.co/storage/v1/object/sign/logo/e8bbfd68-4456-452c-ab67-ee284960fd02.jfif?token=eyJraWQiOiJlZDc2YzAxMi0xN2I2LTRjZWMtYjhlMy1iNTA4MTUxODlmZTMiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJsb2dvL2U4YmJmZDY4LTQ0NTYtNDUyYy1hYjY3LWVlMjg0OTYwZmQwMi5qZmlmIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4ODEwMzU0OSwiZXhwIjoxODE5NjM5NTQ5fQ.Qefo2xyIUBJ8P3UnKReyQ9UYaD4pUuRB-KsscKTkli2u6EDvI_nywYpue33nbjlJ95EH9GoGqtV7MNPH6dhR3Q'}
                  alt="Romance Moda Íntima"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="font-serif-luxury text-base sm:text-2xl font-bold tracking-tight text-stone-900 leading-none truncate">
                  Romance
                </span>
                <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded-md shadow-2xs shrink-0">
                  Itapema
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className="text-xs xl:text-sm font-semibold text-stone-600 hover:text-rose-700 hover:bg-rose-50/80 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Action Buttons: Indique & Ganhe, Search, Admin, CTA & Mobile Hamburger Menu */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              
              {/* Referral Coupon / Indique & Ganhe Button */}
              {onOpenReferralModal && (
                <button
                  type="button"
                  onClick={onOpenReferralModal}
                  className="bg-gradient-to-r from-amber-50 to-amber-100/80 hover:from-amber-100 hover:to-amber-200 active:from-amber-200 text-amber-950 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 sm:gap-2 transition-all border border-amber-300/80 shadow-2xs cursor-pointer text-xs font-bold group shrink-0"
                  title="Gerar cupom de indicação ou consultar seus créditos (R$ 10 por kit entregue)"
                >
                  <Gift className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-700 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="hidden sm:inline">Indique & Ganhe</span>
                  <span className="text-[10px] bg-amber-600 text-white font-black px-1 sm:px-1.5 py-0.2 rounded-md shadow-2xs">
                    R$ 10
                  </span>
                </button>
              )}

              {/* PWA Install Button (Shown on sm+ when browser supports PWA installation) */}
              {isInstallable && !isInstalled && (
                <button
                  type="button"
                  onClick={install}
                  className="hidden sm:inline-flex bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl items-center gap-1 sm:gap-1.5 transition-all border border-rose-200 shadow-2xs cursor-pointer text-xs font-bold shrink-0"
                  title="Instalar App no Celular ou Computador"
                >
                  <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-rose-600 animate-bounce" />
                  <span className="hidden md:inline">Instalar App</span>
                </button>
              )}

              {/* Search Bar Trigger */}
              <button
                type="button"
                onClick={onOpenSearch}
                className="bg-stone-100/90 hover:bg-stone-200/80 active:bg-stone-300 text-stone-700 hover:text-stone-900 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 sm:gap-2 transition-all border border-stone-200/80 shadow-2xs cursor-pointer text-xs font-medium group shrink-0"
                title="Buscar assuntos, regras e dúvidas (Ctrl + K)"
              >
                <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
                <span className="hidden sm:inline text-stone-600 group-hover:text-stone-900 font-semibold">Buscar</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 bg-white border border-stone-300/80 px-1 py-0.5 rounded text-[9px] text-stone-400 font-mono shadow-2xs">
                  ⌘K
                </kbd>
              </button>

              {/* Reseller Portal Button */}
              {onOpenResellerPortal && (
                <button
                  type="button"
                  onClick={onOpenResellerPortal}
                  className="bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-800 hover:text-rose-950 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all border border-rose-200 shadow-2xs cursor-pointer text-xs font-bold shrink-0"
                  title="Acesso da Revendedora: faça login e crie seu perfil de vendas da sacola"
                >
                  <UserCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="hidden md:inline">
                    {currentReseller ? `Perfil de Vendas` : `Área da Vendedora`}
                  </span>
                  <span className="md:hidden text-[10px]">Vendedora</span>
                </button>
              )}

              {/* Admin Panel Shortcut (Biometric / Password) */}
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-xs text-stone-700 hover:text-stone-950 font-semibold bg-white hover:bg-stone-100 active:bg-stone-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all border border-stone-200 shadow-2xs cursor-pointer shrink-0"
                title="Acesso ao Painel do Distribuidor (com Biometria / Senha)"
              >
                <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </button>

              {/* Primary CTA (Desktop) */}
              <button
                type="button"
                onClick={onScrollToForm}
                className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer shrink-0"
              >
                <span>Quero Revender</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Mobile Hamburger Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 flex items-center justify-center border border-stone-200/80 transition-all cursor-pointer shrink-0"
                title="Abrir Menu de Navegação"
                aria-label="Abrir Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-rose-600" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Slide-Over Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md ml-auto bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-stone-200">
                  <img
                    src={settings.logoUrl || 'https://bminunltftkmfmsnjpea.supabase.co/storage/v1/object/sign/logo/e8bbfd68-4456-452c-ab67-ee284960fd02.jfif?token=eyJraWQiOiJlZDc2YzAxMi0xN2I2LTRjZWMtYjhlMy1iNTA4MTUxODlmZTMiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJsb2dvL2U4YmJmZDY4LTQ0NTYtNDUyYy1hYjY3LWVlMjg0OTYwZmQwMi5qZmlmIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4ODEwMzU0OSwiZXhwIjoxODE5NjM5NTQ5fQ.Qefo2xyIUBJ8P3UnKReyQ9UYaD4pUuRB-KsscKTkli2u6EDvI_nywYpue33nbjlJ95EH9GoGqtV7MNPH6dhR3Q'}
                    alt="Romance"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-stone-900 text-base leading-none">Romance Itapema</h3>
                  <span className="text-[10px] text-rose-700 font-bold uppercase">Sem Investimento Inicial</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-white border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Primary Banner */}
            <div className="p-4 bg-gradient-to-br from-rose-50 via-amber-50/40 to-rose-50 border-b border-rose-100 space-y-3">
              <button
                type="button"
                onClick={handleFormClick}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>Quero Ser Revendedora (Grátis)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between gap-2 text-[11px] text-stone-600">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sem investimento
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  30% a 40% Lucro
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  40 dias
                </span>
              </div>
            </div>

            {/* Navigation List Buttons */}
            <div className="p-4 space-y-1 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-3 py-1">Navegação Rápida</p>
              
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => handleNavClick(link.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 active:bg-rose-50 text-stone-800 font-semibold text-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-rose-600">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span>{link.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400" />
                  </button>
                );
              })}

              {onOpenResellerPortal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenResellerPortal();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50/90 hover:bg-rose-100 active:bg-rose-200 text-rose-950 font-bold text-sm transition-all border border-rose-200 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <UserCheck className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="leading-tight">
                        {currentReseller ? `Meu Perfil de Vendas` : `Área da Revendedora`}
                      </p>
                      <p className="text-[10px] font-normal text-rose-800">
                        {currentReseller ? currentReseller.fullName : `Defina preferências da sua sacola`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200">
                    Acessar
                  </span>
                </button>
              )}

              {onOpenReferralModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenReferralModal();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/90 hover:bg-amber-100 active:bg-amber-200 text-stone-900 font-bold text-sm transition-all border border-amber-200 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Gift className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="leading-tight">Indique & Ganhe (Cupons)</p>
                      <p className="text-[10px] font-normal text-amber-900">R$ 10,00 por kit entregue</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-amber-950 bg-amber-300 px-2 py-0.5 rounded-full">R$ 10</span>
                </button>
              )}

              {onOpenInstagramPromo && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenInstagramPromo();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 active:bg-pink-100 text-stone-800 font-semibold text-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <span>Promoção Instagram & Brinde</span>
                  </div>
                  <span className="text-[10px] font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">Prêmio</span>
                </button>
              )}
            </div>

            {/* Official App Downloads & Admin Links in Drawer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
              {isInstallable && !isInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    install();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-98 transition-all"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Instalar Aplicativo (PWA)</span>
                </button>
              )}

              <p className="text-xs font-bold text-stone-700">Baixe o Aplicativo Oficial Romance:</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={ROMANCE_APP_PLAYSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all"
                >
                  <GooglePlayIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Play</span>
                </a>
                <a
                  href={ROMANCE_APP_APPSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all"
                >
                  <AppleIcon className="w-3.5 h-3.5 text-white" />
                  <span>App Store</span>
                </a>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-stone-500">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="flex items-center gap-1 text-stone-700 hover:text-stone-900 font-semibold"
                >
                  <Lock className="w-3.5 h-3.5 text-stone-500" />
                  <span>Painel Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenLgpd();
                  }}
                  className="flex items-center gap-1 text-stone-500 hover:text-stone-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Privacidade (LGPD)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
