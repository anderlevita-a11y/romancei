import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, Clock, Percent, RefreshCw, Star, Play, Film, Smartphone, ExternalLink, MapPin, Search, Gift, Share2 } from 'lucide-react';
import { BusinessSettings } from '../types';
import { formatMediaUrl } from '../utils/mediaUrlHelper';
import { AppDownloadBadges, ROMANCE_APP_PLAYSTORE_URL, ROMANCE_APP_APPSTORE_URL, GooglePlayIcon, AppleIcon } from './AppDownloadBadges';
import heroBannerAsset from '../assets/images/hero_distribuidor_banner_1787665220498.jpg';

const DEFAULT_HERO_BANNER = heroBannerAsset;

interface HeroProps {
  settings: BusinessSettings;
  onScrollToForm: () => void;
  onScrollToHowItWorks: () => void;
  onScrollToVideos?: () => void;
  onOpenSearch?: () => void;
  onOpenReferralModal?: () => void;
  onOpenShare?: () => void;
}

export function Hero({ settings, onScrollToForm, onScrollToHowItWorks, onScrollToVideos, onOpenSearch, onOpenReferralModal, onOpenShare }: HeroProps) {
  const heroImageSrc = settings.heroBannerUrl ? formatMediaUrl(settings.heroBannerUrl, 'photo') : DEFAULT_HERO_BANNER;
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background Hero Banner Subtle Ambient Image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={heroImageSrc}
          alt="Romance Itapema - Distribuição Oficial de Lingerie Sem Investimento"
          aria-hidden="true"
          className="w-full h-full object-cover object-center opacity-8 blur-2xl scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100/80 via-transparent to-stone-100/90" />
      </div>

      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 -ml-24 w-80 h-80 rounded-full bg-pink-100/40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines and Value Proposition */}
          <div className="lg:col-span-7 space-y-7 text-left">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/80 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-rose-900 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>Distribuição Oficial Romance Itapema & Região</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-950 leading-[1.15] sm:leading-[1.12]">
                Ganhe até <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-700 to-rose-900 underline decoration-rose-200 decoration-wavy decoration-2">40% de Lucro</span> com Lingerie Sem Investimento.
              </h1>
              <p className="text-base sm:text-xl text-stone-600 font-normal leading-relaxed max-w-2xl">
                <strong className="text-stone-900 font-semibold">Zero investimento inicial:</strong> você só paga o que vender, devolve sem custos o que não vendeu e realiza os acertos com tranquilidade a cada <span className="text-rose-700 font-semibold">40 dias</span>!
              </p>
            </div>

            {/* Quick 3 Key Highlights Checkmarks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
              <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/80 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-rose-50/90 flex items-center justify-center text-rose-600 shrink-0 border border-rose-100/60">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-stone-900">Sem Investimento</p>
                  <p className="text-stone-500">Pague só o vendido</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/80 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-50/90 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100/60">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-stone-900">Prazo de 40 Dias</p>
                  <p className="text-stone-500">Tempo para demonstrar</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/80 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50/90 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/60">
                  <Percent className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-stone-900">30% a 40% Lucro</p>
                  <p className="text-stone-500">+ Catálogo Favorita</p>
                </div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2">
              <button
                id="hero-cta-register"
                onClick={onScrollToForm}
                className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold text-sm sm:text-base px-5 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-rose-600/30 hover:shadow-rose-600/40 border border-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer group"
              >
                <span>Quero Ser Revendedora Romance</span>
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onScrollToHowItWorks}
                className="bg-white/80 hover:bg-white backdrop-blur-md text-stone-800 font-semibold text-sm sm:text-base px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl border border-white/80 hover:border-rose-200/80 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Entenda Como Funciona</span>
              </button>

              {onOpenReferralModal && (
                <button
                  type="button"
                  onClick={onOpenReferralModal}
                  className="bg-gradient-to-r from-amber-50 to-amber-100/90 hover:from-amber-100 hover:to-amber-200 active:from-amber-200 backdrop-blur-md text-amber-950 font-bold text-sm sm:text-base px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl border border-amber-300/80 hover:border-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
                  title="Indique amigas e ganhe R$ 10 por kit entregue"
                >
                  <Gift className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
                  <span>Indique & Ganhe (R$ 10)</span>
                </button>
              )}
            </div>

            {/* Official App Download Bar (Parte Superior) */}
            <div className="bg-white/70 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-stone-900 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Smartphone className="w-5 h-5 text-rose-200" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                    Aplicativo Oficial Romance
                  </span>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">
                    Baixe grátis para consultar catálogo e pontuar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <a
                  href={ROMANCE_APP_PLAYSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs border border-white/10 transition-all transform hover:-translate-y-0.5"
                >
                  <GooglePlayIcon className="w-4 h-4 text-emerald-400" />
                  <span>Google Play</span>
                </a>

                <a
                  href={ROMANCE_APP_APPSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs border border-white/10 transition-all transform hover:-translate-y-0.5"
                >
                  <AppleIcon className="w-4 h-4 text-white" />
                  <span>App Store</span>
                </a>
              </div>
            </div>

            {/* Quick Interactive Search Bar in Hero */}
            <div 
              onClick={onOpenSearch}
              className="bg-white/85 hover:bg-white backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-stone-200/80 hover:border-rose-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 group-hover:scale-105 transition-transform">
                  <Search className="w-4 h-4" />
                </div>
                <div className="truncate text-left">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 group-hover:text-rose-950 truncate">
                    Pesquisar assunto: <span className="font-normal text-stone-500">40 dias, 40% lucro, SPC, catálogo, fotos...</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200/60">
                  Buscar no site 🔍
                </span>
              </div>
            </div>

            {/* Social Trust & Google Reviews Indicators */}
            <div className="space-y-3 pt-2">
              <a
                href={settings.googleReviewsUrl?.trim().startsWith('http') ? settings.googleReviewsUrl.trim() : '#depoimentos'}
                target={settings.googleReviewsUrl?.trim().startsWith('http') ? '_blank' : '_self'}
                rel={settings.googleReviewsUrl?.trim().startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-4 text-xs text-stone-500 flex-wrap bg-white/70 hover:bg-white backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white/80 hover:border-rose-300 shadow-xs hover:shadow-md transition-all group cursor-pointer"
                title="Ver avaliações verificadas"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-stone-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden">
                    <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80" alt="Revendedora Romance Oficial" />
                    <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80" alt="Revendedora Romance Oficial" />
                    <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&h=100&q=80" alt="Revendedora Romance Oficial" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-stone-900 ml-1">5.0 Estrelas</span>
                    {settings.googleReviewsUrl?.trim().startsWith('http') ? (
                      <span className="text-[11px] font-bold text-rose-700 underline group-hover:text-rose-900 ml-1 inline-flex items-center gap-0.5">
                        Ver no Google <ExternalLink className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-700 underline group-hover:text-rose-900 ml-1 inline-flex items-center gap-0.5">
                        Ver Depoimentos
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-stone-600 font-medium">Avaliações verificadas de revendedoras</p>
                </div>
              </a>

              {/* Automatic Video Quick-Action Card */}
              <div 
                onClick={() => {
                  if (onScrollToVideos) onScrollToVideos();
                  else {
                    const el = document.getElementById('sessao-videos') || document.getElementById('videos-oficiais');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-gradient-to-r from-rose-900/90 via-stone-900/90 to-purple-950/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/20 shadow-lg text-white flex items-center justify-between gap-3 cursor-pointer hover:border-rose-400/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-black bg-rose-500/40 text-rose-200 px-2 py-0.2 rounded-full border border-rose-400/30">
                        Sessão de Vídeos
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Romance Play
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5 group-hover:text-rose-200 transition-colors">
                      Assista aos vídeos demonstrativos e veja a mala sem investimento real
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-rose-300 group-hover:text-white shrink-0 pr-1">
                  <span className="hidden sm:inline">Assistir</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>


          </div>

          {/* Right Column: Visual Card Showcase */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Card Glass Frame */}
              <div className="bg-white/65 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-white/80 shadow-2xl shadow-rose-950/10 relative overflow-hidden">
                
                {/* Main Hero Photo Container */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-stone-900 shadow-inner">
                  <img
                    src={heroImageSrc}
                    alt="Distribuidor Oficial Romance Itapema - Renda Extra Sem Investimento"
                    className="w-full h-full object-cover object-center opacity-95 transition-transform duration-700 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent pointer-events-none" />

                  {/* Badge on Photo */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-stone-900 px-3.5 py-1.5 rounded-full text-xs font-black shadow-md flex items-center gap-1.5 border border-white/80">
                    <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                    <span>Empreenda Sem Investimento</span>
                  </div>

                  {/* Highlight Floating Card on Photo Bottom */}
                  <div className="absolute bottom-4 inset-x-4 bg-stone-900/85 backdrop-blur-xl border border-white/20 p-4 rounded-2xl text-white space-y-2 shadow-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-300 font-semibold">Regra de Negócio Clara</span>
                      <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-[11px]">
                        Até 40% Lucro
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-stone-200">
                      <p className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Mostruário sem investimento entregue em mãos</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Acerto a cada 40 dias: pague só o que vendeu</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Catálogo Favorita (pedido R$ 400 - 600) ativa 40%</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge Left */}
                <div className="absolute -left-3 top-1/3 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/90 flex items-center gap-3 animate-bounce duration-1000 hidden sm:flex">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/90 flex items-center justify-center text-emerald-700 font-bold text-lg border border-emerald-200/60">
                    R$ 0
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-stone-900">Zero Risco</p>
                    <p className="text-[10px] text-stone-500">Sem taxa de adesão</p>
                  </div>
                </div>

                {/* Floating Badge Right */}
                <div className="absolute -right-3 bottom-24 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/90 flex items-center gap-3 hidden sm:flex">
                  <div className="w-10 h-10 rounded-xl bg-rose-100/90 flex items-center justify-center text-rose-700 font-bold text-sm border border-rose-200/60">
                    40d
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-stone-900">Ciclo Confortável</p>
                    <p className="text-[10px] text-stone-500">40 dias para acertar</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
