import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Maximize2, 
  X, 
  SlidersHorizontal,
  Layers,
  Heart,
  Eye,
  ExternalLink,
  BookOpen,
  Film
} from 'lucide-react';
import { MediaItem, BusinessSettings } from '../types';
import { 
  formatMediaUrl, 
  getMediaThumbnailUrl, 
  FALLBACK_IMAGE_URL,
  FALLBACK_FAVORITA_URL 
} from '../utils/mediaUrlHelper';

interface MediaCarouselProps {
  mediaItems: MediaItem[];
  settings: BusinessSettings;
  onScrollToForm: (presetMessage?: string) => void;
  onScrollToVideos?: () => void;
}

export function MediaCarousel({ mediaItems, settings, onScrollToForm, onScrollToVideos }: MediaCarouselProps) {
  // Exclusively filter for PHOTOS (decoupled from videos)
  const photoItems = mediaItems.filter(item => item.active && item.type === 'photo');
  
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  
  // Lightbox / Detail Modal state
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Filter items based on active category
  const filteredItems = photoItems.filter(item => {
    if (activeCategory === 'todos') return true;
    return item.category === activeCategory;
  });

  // Autoplay slider effect for photo carousel
  useEffect(() => {
    if (!isAutoplay || isHovered || viewMode === 'grid' || filteredItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isAutoplay, isHovered, viewMode, filteredItems.length]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const handleOpenMediaDetail = (item: MediaItem) => {
    setSelectedMedia(item);
  };

  const handleCtaClick = (item: MediaItem) => {
    if (selectedMedia) setSelectedMedia(null);
    if (item.linkAction === 'external' && item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onScrollToForm(`Interesse na peça/coleção: ${item.title}`);
  };

  const getBadgeColorClasses = (color?: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-500/90 text-white border-rose-400';
      case 'amber':
        return 'bg-amber-500/90 text-white border-amber-400';
      case 'emerald':
        return 'bg-emerald-600/90 text-white border-emerald-400';
      case 'purple':
        return 'bg-purple-600/90 text-white border-purple-400';
      case 'blue':
        return 'bg-blue-600/90 text-white border-blue-400';
      default:
        return 'bg-rose-600/90 text-white border-rose-400';
    }
  };

  if (photoItems.length === 0) {
    return null;
  }

  const currentItem = filteredItems[currentIndex] || filteredItems[0] || photoItems[0];

  const categoryTabs = [
    { id: 'todos', label: 'Todas as Fotos', count: photoItems.length },
    { id: 'fitness', label: 'Fitness', count: photoItems.filter(i => i.category === 'fitness').length },
    { id: 'seamless', label: 'Seamless', count: photoItems.filter(i => i.category === 'seamless').length },
    { id: 'casual', label: 'Casual', count: photoItems.filter(i => i.category === 'casual').length },
    { id: 'intima', label: 'Moda Íntima', count: photoItems.filter(i => i.category === 'intima' || i.category === 'lingerie').length },
    { id: 'cosmeticos', label: 'Cosméticos', count: photoItems.filter(i => i.category === 'cosmeticos' || i.category === 'favorita').length },
    { id: 'rmc_casa', label: 'RMC Casa', count: photoItems.filter(i => i.category === 'rmc_casa').length },
    { id: 'sex_shop', label: 'Sex Shop', count: photoItems.filter(i => i.category === 'sex_shop').length },
    { id: 'novidades', label: 'Lançamentos', count: photoItems.filter(i => i.category === 'novidades').length },
  ].filter(tab => tab.id === 'todos' || tab.count > 0);

  return (
    <section id="galeria-fotos" className="py-16 sm:py-20 relative overflow-hidden bg-gradient-to-b from-stone-50 via-rose-50/25 to-white">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-rose-200/25 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-rose-100/90 text-rose-800 text-xs uppercase font-extrabold tracking-widest px-3.5 py-1.5 rounded-full border border-rose-200 shadow-xs">
              <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
              <span>Galeria de Fotos & Coleções 2026</span>
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
              Mostruário Fotográfico Romance & Favorita
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Folheie os modelos em alta resolução que acompanham a sua maleta sem investimento. Peças nobres, sustentação perfeita e cosméticos de alto giro.
            </p>
          </div>

          {/* Quick Actions: View Mode + Link to Exclusive Video Showcase */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
            {onScrollToVideos && (
              <button
                type="button"
                onClick={onScrollToVideos}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Film className="w-3.5 h-3.5 text-rose-600" />
                <span>Ir para Sessão de Vídeos</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-stone-200 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('carousel')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'carousel'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Carrossel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Grade Completa ({photoItems.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filters (Photos Only) */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar px-1">
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-stone-950 text-white shadow-md shadow-stone-950/20'
                    : 'bg-white text-stone-600 hover:text-stone-950 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* VIEW 1: HERO SPOTLIGHT CAROUSEL (FOTOS) */}
        {viewMode === 'carousel' && currentItem && (
          <div 
            className="relative bg-white rounded-3xl border border-stone-200/80 shadow-xl overflow-hidden transition-all"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[460px] lg:min-h-[520px]">
              
              {/* Left Photo Stage (7 Cols) */}
              <div className="lg:col-span-7 relative bg-stone-950 flex items-center justify-center overflow-hidden min-h-[340px] lg:min-h-full group">
                <div className="w-full h-full relative cursor-pointer" onClick={() => handleOpenMediaDetail(currentItem)}>
                  <img
                    src={formatMediaUrl(currentItem.mediaUrl, 'photo')}
                    alt={currentItem.title}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                  
                  {/* Expand Lightbox Button Overlay */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white p-2.5 rounded-full border border-white/20 shadow-lg transition-transform active:scale-95">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Left Badge */}
                {currentItem.tag && (
                  <div className="absolute top-4 left-4">
                    <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border shadow-sm ${getBadgeColorClasses(currentItem.badgeColor)}`}>
                      {currentItem.tag}
                    </span>
                  </div>
                )}

                {/* Bottom Photo Title Overlay for Mobile */}
                <div className="absolute bottom-3 left-4 right-4 lg:hidden text-white drop-shadow">
                  <p className="text-xs text-rose-300 font-semibold uppercase tracking-wider">{currentItem.categoryLabel}</p>
                  <p className="text-sm font-bold truncate">{currentItem.title}</p>
                </div>
              </div>

              {/* Right Details Column (5 Cols) */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 bg-gradient-to-br from-white via-rose-50/20 to-stone-50">
                
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                      {currentItem.categoryLabel}
                    </span>

                    <div className="flex items-center gap-1 text-xs text-stone-500 font-mono">
                      <span>{currentIndex + 1}</span>
                      <span>/</span>
                      <span>{filteredItems.length}</span>
                    </div>
                  </div>

                  <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                    {currentItem.title}
                  </h3>

                  {currentItem.subtitle && (
                    <p className="text-xs sm:text-sm font-semibold text-rose-700">
                      {currentItem.subtitle}
                    </p>
                  )}

                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed pt-1">
                    {currentItem.description}
                  </p>
                </div>

                {/* Key Benefits of this item */}
                <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-stone-200/70 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Incluso na mala sem investimento inicial</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{currentItem.category === 'favorita' ? 'Libera lucro máximo de 40%' : 'Lucro de 30% a 40% com 40 dias de prazo'}</span>
                  </div>
                </div>

                {/* Action CTA & Navigation */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5">
                    {currentItem.linkAction === 'external' && currentItem.externalUrl ? (
                      <a
                        href={currentItem.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-lg shadow-amber-500/20 border border-white/40 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>{currentItem.linkText || 'Ver Catálogo Digital'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCtaClick(currentItem)}
                        className="flex-1 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-lg shadow-rose-600/25 border border-white/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
                      >
                        <span>{currentItem.linkText || 'Quero no Meu Mostruário'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenMediaDetail(currentItem)}
                      className="p-3.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-xs cursor-pointer"
                      title="Ver Foto Ampliada"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Slider Prev / Next Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 gap-2">
                    <div className="flex items-center gap-1.5 max-w-[140px] sm:max-w-[200px] overflow-hidden">
                      {filteredItems.slice(0, 15).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                            currentIndex === idx ? 'w-5 sm:w-6 bg-rose-600' : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                          }`}
                          title={`Foto ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 transition-all cursor-pointer active:scale-95 shadow-2xs"
                        title="Foto Anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 transition-all cursor-pointer active:scale-95 shadow-2xs"
                        title="Próxima Foto"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: FULL GRID OF ALL PHOTOS */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Photo Thumbnail */}
                <div 
                  className="relative aspect-[4/3] bg-stone-950 overflow-hidden cursor-pointer"
                  onClick={() => handleOpenMediaDetail(item)}
                >
                  <img
                    src={getMediaThumbnailUrl(item.mediaUrl, item.posterUrl)}
                    alt={item.title}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                  
                  {item.tag && (
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getBadgeColorClasses(item.badgeColor)}`}>
                        {item.tag}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full border border-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">
                      {item.categoryLabel}
                    </span>
                    <h4 className="font-bold text-sm leading-snug line-clamp-1">
                      {item.title}
                    </h4>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenMediaDetail(item)}
                      className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-400" />
                      <span>Ver Detalhes</span>
                    </button>

                    {item.linkAction === 'external' && item.externalUrl ? (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200/80 flex items-center gap-1"
                      >
                        <span>Folhear</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCtaClick(item)}
                        className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200/80 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Quero no Kit</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* LIGHTBOX MODAL FOR HIGH-RES PHOTOS */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedMedia(null)}
        >
          <div 
            className="relative w-full max-w-4xl bg-stone-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-stone-950/60">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-md bg-rose-600 text-white">
                  {selectedMedia.categoryLabel}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
                  {selectedMedia.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Stage */}
            <div className="relative bg-black aspect-[4/3] max-h-[62vh] flex items-center justify-center overflow-hidden">
              <img
                src={formatMediaUrl(selectedMedia.mediaUrl, 'photo')}
                alt={selectedMedia.title}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE_URL;
                }}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer & CTA */}
            <div className="p-4 sm:p-6 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs text-stone-300 leading-relaxed max-w-xl">
                  {selectedMedia.description}
                </p>
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center sm:justify-start gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Disponível para revenda sem custo inicial</span>
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedMedia.linkAction === 'external' && selectedMedia.externalUrl ? (
                  <a
                    href={selectedMedia.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg border border-white/20 flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Acessar Catálogo Oficial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCtaClick(selectedMedia)}
                    className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg border border-white/20 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>{selectedMedia.linkText || 'Quero no Meu Kit Sem Investimento'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
