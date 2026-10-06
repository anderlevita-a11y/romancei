import React, { useEffect, useRef } from 'react';
import { 
  X, 
  TrendingUp, 
  Star, 
  Store, 
  ShoppingBag, 
  MessageSquareHeart, 
  Instagram, 
  Gift, 
  BookOpen, 
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Camera,
  PlayCircle,
  HelpCircle,
  Percent
} from 'lucide-react';
import { BusinessSettings, CommercialLine, TestimonialItem, MediaItem } from '../types';

// The Packaged Section Components
import { ProfitCalculator } from './ProfitCalculator';
import { BusinessRuleHighlights } from './BusinessRuleHighlights';
import { RomanceEstrelas } from './RomanceEstrelas';
import { RedeLojasFisicas } from './RedeLojasFisicas';
import { ProductShowcase } from './ProductShowcase';
import { Testimonials } from './Testimonials';
import { InstagramPromoSection } from './InstagramPromoSection';
import { SharePromoSection } from './SharePromoSection';
import { HowItWorks } from './HowItWorks';
import { CatalogExplanation } from './CatalogExplanation';
import { MediaCarousel } from './MediaCarousel';
import { VideoShowcase } from './VideoShowcase';
import { FaqSection } from './FaqSection';

export interface SectionMeta {
  id: string;
  title: string;
  badge: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeColor: string;
}

export const PACKAGED_SECTIONS: SectionMeta[] = [
  {
    id: 'romance-estrelas',
    title: 'Romance Estrela Regra de Parcelamento & Segredo do Lucro',
    badge: 'Crisdu • Lucro & Parcelamento',
    sub: 'O Segredo Máximo do Lucro + Até 3x sem juros e Prêmios 2026',
    icon: Star,
    color: 'text-amber-500',
    activeColor: 'bg-amber-400 text-stone-950 font-bold',
  },
  {
    id: 'catalogo-favorita',
    title: 'Catálogo Favorita: 40% de Lucro & Regras',
    badge: '40% de Lucro Imediato',
    sub: 'Pedido Mínimo R$ 400 - R$ 600 • Tabela de Prazos & Contatos',
    icon: Percent,
    color: 'text-rose-600',
    activeColor: 'bg-rose-600 text-white font-bold',
  },
  {
    id: 'linhas-comerciais',
    title: 'Nossas Linhas Comerciais Oficiais',
    badge: 'Mix Completo',
    sub: 'Lingerie, Fitness, Casa & Favorita',
    icon: ShoppingBag,
    color: 'text-purple-600',
    activeColor: 'bg-purple-600 text-white font-bold',
  },
  {
    id: 'lojas-fisicas',
    title: 'Rede de Lojas Físicas & Vendedora Favorita',
    badge: 'Itapema • Joinville • Floripa',
    sub: 'Atendimento & WhatsApp Direto',
    icon: Store,
    color: 'text-rose-600',
    activeColor: 'bg-rose-600 text-white font-bold',
  },
  {
    id: 'guia-revendedora',
    title: 'Guia Completo da Revendedora Romance Itapema',
    badge: 'Passo a Passo',
    sub: 'Do cadastro ao 1º acerto de 40 dias',
    icon: BookOpen,
    color: 'text-blue-600',
    activeColor: 'bg-blue-600 text-white font-bold',
  },
  {
    id: 'faq-duvidas',
    title: 'Dúvidas Frequentes & Perguntas (FAQ)',
    badge: 'Tire suas Dúvidas',
    sub: 'Consignação, Lucros, Prazos de 40 dias e Suporte',
    icon: HelpCircle,
    color: 'text-indigo-600',
    activeColor: 'bg-indigo-600 text-white font-bold',
  },
  {
    id: 'depoimentos-avaliacoes',
    title: 'Depoimentos e Avaliações Verificadas',
    badge: 'Nota 5.0 • Google & SC',
    sub: 'Histórias Reais de Sucesso',
    icon: MessageSquareHeart,
    color: 'text-emerald-600',
    activeColor: 'bg-emerald-600 text-white font-bold',
  },
  {
    id: 'bonus-instagram',
    title: 'Bônus Exclusivo de Boas-Vindas Instagram',
    badge: 'Brinde Especial',
    sub: 'Presente no 1º Pedido Oficial',
    icon: Instagram,
    color: 'text-pink-600',
    activeColor: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold',
  },
  {
    id: 'indique-ganhe',
    title: 'Programa Oficial Indique e Ganhe Romance',
    badge: 'R$ 10 no Pix',
    sub: 'Ganhe por cada kit entregue',
    icon: Gift,
    color: 'text-orange-600',
    activeColor: 'bg-orange-500 text-white font-bold',
  },
];

interface PackagedSectionModalProps {
  activeSection: string | null;
  onClose: () => void;
  onSelectSection: (sectionId: string) => void;
  settings: BusinessSettings;
  onScrollToForm: (reason?: string) => void;
  onSelectPlanAndScroll: (wantsFavorita: 'sim' | 'nao') => void;
  commercialLines?: CommercialLine[];
  testimonials?: TestimonialItem[];
  onSubmitTestimonial?: (data: Omit<TestimonialItem, 'id' | 'status' | 'createdAt'>) => Promise<boolean> | boolean;
  onOpenInstagramModal?: () => void;
  onOpenReferralModal?: () => void;
  onOpenShareModal?: () => void;
  mediaItems?: MediaItem[];
}

export function PackagedSectionModal({
  activeSection,
  onClose,
  onSelectSection,
  settings,
  onScrollToForm,
  onSelectPlanAndScroll,
  commercialLines,
  testimonials,
  onSubmitTestimonial,
  onOpenInstagramModal,
  onOpenReferralModal,
  onOpenShareModal,
  mediaItems,
}: PackagedSectionModalProps) {
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const prevSectionRef = useRef<string | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Trava rolagem do body apenas enquanto o modal estiver de fato aberto
  useEffect(() => {
    if (!activeSection) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [Boolean(activeSection)]);

  // Rola para o topo do modal SOMENTE quando o usuário de fato trocar para uma seção diferente
  useEffect(() => {
    if (!activeSection) {
      prevSectionRef.current = null;
      return;
    }

    if (prevSectionRef.current !== activeSection) {
      prevSectionRef.current = activeSection;
      if (modalContainerRef.current) {
        modalContainerRef.current.scrollTop = 0;
      }
    }
  }, [activeSection]);

  if (!activeSection) return null;

  const currentMeta = PACKAGED_SECTIONS.find((s) => s.id === activeSection) || PACKAGED_SECTIONS[0];
  const CurrentIcon = currentMeta.icon;

  const handleCtaClick = (reason?: string) => {
    onClose();
    setTimeout(() => {
      onScrollToForm(reason);
    }, 150);
  };

  const handlePlanSelect = (wantsFavorita: 'sim' | 'nao') => {
    onClose();
    setTimeout(() => {
      onSelectPlanAndScroll(wantsFavorita);
    }, 150);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-stone-950/80 backdrop-blur-xl animate-in fade-in duration-200 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={currentMeta.title}
    >
      {/* Top Fixed Header with Section Switcher */}
      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-2xl border-b border-white/10 px-3 sm:px-6 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Back button + Active Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition-all border border-white/10 cursor-pointer shrink-0"
              title="Voltar para a página principal"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar ao Início</span>
              <span className="sm:hidden">Voltar</span>
            </button>

            <div className="flex items-center gap-2 min-w-0 truncate">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <CurrentIcon className={`w-4 h-4 ${currentMeta.color}`} />
              </div>
              <div className="min-w-0 truncate">
                <span className="text-[10px] uppercase font-bold text-amber-300 block truncate">
                  {currentMeta.badge}
                </span>
                <h1 className="text-xs sm:text-sm font-bold text-white truncate">
                  {currentMeta.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Quick CTA and Close Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCtaClick(currentMeta.title)}
              className="hidden md:inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Quero Revender</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-600/80 active:bg-rose-700 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
              aria-label="Fechar sessão"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Pills (All 8 Packaged Sections) */}
        <div className="max-w-7xl mx-auto pt-2.5 overflow-x-auto no-scrollbar flex items-center gap-1.5 sm:gap-2">
          {PACKAGED_SECTIONS.map((sec) => {
            const SecIcon = sec.icon;
            const isActive = sec.id === activeSection;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectSection(sec.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive 
                    ? `${sec.activeColor} shadow-md shadow-black/40 scale-102` 
                    : 'bg-white/5 hover:bg-white/10 text-stone-300 border border-white/5 hover:border-white/20'
                }`}
              >
                <SecIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{sec.title}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area where the active section is rendered */}
      <div 
        ref={modalContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-8 overscroll-contain bg-[#fcf5f8] text-stone-900"
      >
        <div className="max-w-7xl mx-auto">
          
          {/* 1. Romance Estrela Regra de Parcelamento & O Segredo Máximo do Lucro (Campanha Oficial Crisdu Romance e Favorita) */}
          {(activeSection === 'romance-estrelas' || activeSection === 'segredo-lucro') && (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-200">
              
              {/* O Segredo Máximo do Lucro Integrado */}
              <div className="bg-white/95 rounded-3xl p-4 sm:p-8 shadow-xl border border-amber-200/80">
                <div className="mb-6 pb-4 border-b border-stone-200/80">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-emerald-100 text-amber-900 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-amber-300">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                    <span>O Segredo Máximo do Lucro • Integrado à Campanha Crisdu</span>
                  </div>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
                    O Segredo Máximo do Lucro: Como Lucrar de 30% a 40% a Cada 40 Dias
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1">
                    Simule seus rendimentos, conheça os 4 pilares do modelo sem investimento inicial e veja como aliar o lucro às regras de parcelamento em até 3x sem juros!
                  </p>
                </div>

                <BusinessRuleHighlights onScrollToForm={() => handleCtaClick('O Segredo Máximo do Lucro')} />
                
                <div className="mt-8">
                  <ProfitCalculator onSelectPlanAndScroll={handlePlanSelect} />
                </div>
              </div>

              {/* Romance Estrelas & Regras de Parcelamento (Campanha Oficial Crisdu Romance & Favorita) */}
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <RomanceEstrelas 
                  settings={settings} 
                  onScrollToForm={handleCtaClick} 
                />
              </div>

            </div>
          )}

          {/* 2. Catálogo Favorita: 40% de Lucro & Regras */}
          {activeSection === 'catalogo-favorita' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl">
              <CatalogExplanation 
                settings={settings} 
                onScrollToForm={() => handleCtaClick('Catálogo Favorita')} 
              />
            </div>
          )}

          {/* 3. Coleções 2026 & Fotos Oficiais (Carrossel Exclusivo) */}
          {activeSection === 'fotos-colecoes' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl bg-white p-3 sm:p-6 border border-stone-200/80">
              <div className="mb-4 pb-3 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    Galeria Fotográfica Oficial
                  </span>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
                    Coleções 2026 & Lingeries de Alto Padrão
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                    Fotos em alta definição de conjuntos, calcinhas, sutiãs, fitness e catálogo Favorita
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectSection('videos-romance-play')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200 transition-all cursor-pointer shrink-0"
                >
                  <PlayCircle className="w-4 h-4 text-rose-600" />
                  <span>Ver Vídeos Romance Play</span>
                </button>
              </div>

              <MediaCarousel 
                mediaItems={mediaItems || []} 
                settings={settings} 
                onScrollToForm={handleCtaClick} 
                onScrollToVideos={() => onSelectSection('videos-romance-play')} 
              />
            </div>
          )}

          {/* 4. Romance Play: Vídeos Oficiais & Dicas */}
          {activeSection === 'videos-romance-play' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl">
              <VideoShowcase 
                settings={settings} 
                customVideos={mediaItems?.filter((m) => m.type === 'video') || []} 
                onScrollToForm={handleCtaClick} 
              />
            </div>
          )}

          {/* 5. Nossas Linhas Comerciais Oficiais */}
          {activeSection === 'linhas-comerciais' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl">
              <ProductShowcase 
                settings={settings} 
                commercialLines={commercialLines} 
                onScrollToForm={handleCtaClick} 
              />
            </div>
          )}

          {/* 6. Rede de Lojas Físicas & Vendedora Favorita */}
          {activeSection === 'lojas-fisicas' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl">
              <RedeLojasFisicas 
                settings={settings} 
                onScrollToForm={() => handleCtaClick('Rede de Lojas Físicas')} 
              />
            </div>
          )}

          {/* 7. Guia Completo da Revendedora Romance Itapema */}
          {activeSection === 'guia-revendedora' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl">
              <HowItWorks onScrollToForm={() => handleCtaClick('Guia da Revendedora')} />
            </div>
          )}

          {/* 8. Dúvidas Frequentes & Perguntas (FAQ) */}
          {activeSection === 'faq-duvidas' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl bg-white p-3 sm:p-6 border border-stone-200/80">
              <FaqSection 
                settings={settings} 
                onScrollToForm={handleCtaClick} 
              />
            </div>
          )}

          {/* 5. Depoimentos e Avaliações Verificadas */}
          {activeSection === 'depoimentos-avaliacoes' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl">
              <Testimonials 
                settings={settings} 
                testimonialsList={testimonials} 
                onSubmitTestimonial={onSubmitTestimonial} 
              />
            </div>
          )}

          {/* 6. Bônus Exclusivo de Boas-Vindas Instagram */}
          {activeSection === 'bonus-instagram' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl">
              <InstagramPromoSection 
                settings={settings} 
                onScrollToForm={() => handleCtaClick('Bônus Instagram')} 
                onOpenModal={onOpenInstagramModal}
              />
            </div>
          )}

          {/* 11. Programa Oficial Indique e Ganhe Romance */}
          {activeSection === 'indique-ganhe' && (
            <div className="animate-in fade-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-2xl">
              <SharePromoSection 
                settings={settings} 
                onOpenReferralModal={onOpenReferralModal}
                onOpenShareModal={onOpenShareModal}
              />
            </div>
          )}

          {/* Bottom Bar inside Modal with Next / Close / Register Action */}
          <div className="mt-12 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 pb-8">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para a Página Principal</span>
            </button>

            <button
              type="button"
              onClick={() => handleCtaClick(currentMeta.title)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm px-7 py-3 rounded-2xl shadow-xl shadow-rose-950/20 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Quero Começar Agora • Fazer Pré-Cadastro</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
