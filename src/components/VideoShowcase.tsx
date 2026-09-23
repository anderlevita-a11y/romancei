import { useState, useRef, useEffect, useMemo, type MouseEvent } from 'react';
import { 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Maximize2, 
  Minimize2, 
  X, 
  Tv, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  RotateCcw, 
  Loader2, 
  AlertCircle, 
  MessageCircle 
} from 'lucide-react';
import { VideoItem, MediaItem, BusinessSettings } from '../types';
import { 
  formatMediaUrl, 
  getMediaThumbnailUrl, 
  isIframeVideo, 
  getVideoEmbedUrl, 
  FALLBACK_IMAGE_URL 
} from '../utils/mediaUrlHelper';
import { buildWhatsAppLink } from '../utils/validators';

interface VideoShowcaseProps {
  settings: BusinessSettings;
  customVideos?: MediaItem[];
  onScrollToForm: (presetMessage?: string) => void;
}

interface SmartVideoPlayerProps {
  videoUrl: string;
  posterUrl: string;
  title: string;
  autoPlay?: boolean;
  className?: string;
  onClose?: () => void;
  onExpandTheater?: () => void;
  requestNativeFullscreenOnMount?: boolean;
}

/**
 * Format seconds into MM:SS string
 */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Fluid, unobstructed video player with custom autohiding controls.
 * Guarantees zero dark overlays blocking the video while playing.
 */
function SmartVideoPlayer({
  videoUrl,
  posterUrl,
  title,
  autoPlay = true,
  className = '',
  onClose,
  onExpandTheater,
  requestNativeFullscreenOnMount = false,
}: SmartVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [actionPulse, setActionPulse] = useState<'play' | 'pause' | null>(null);

  const isIframe = isIframeVideo(videoUrl);
  const formattedSrc = formatMediaUrl(videoUrl, 'video');
  const formattedPoster = getMediaThumbnailUrl(videoUrl, posterUrl);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Autohide controls when user stops moving mouse/touching while playing
  const resetControlsTimer = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2200);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    } else {
      resetControlsTimer();
    }
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isPlaying]);

  const toggleNativeFullscreen = () => {
    const el = containerRef.current || videoRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any)?.webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleTogglePlay = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setActionPulse('play');
        setTimeout(() => setActionPulse(null), 500);
      }).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setActionPulse('pause');
      setTimeout(() => setActionPulse(null), 500);
    }
  };

  const handleToggleMute = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current || !videoRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsVideoReady(false);
    setIsPlaying(false);

    if (!isIframe && videoRef.current) {
      const videoEl = videoRef.current;
      
      const handleCanPlay = () => {
        setIsLoading(false);
        setIsVideoReady(true);
        if (autoPlay) {
          videoEl.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            setIsPlaying(false);
          });
        }

        if (requestNativeFullscreenOnMount) {
          try {
            if (videoEl.requestFullscreen) {
              videoEl.requestFullscreen().catch(() => {});
            } else if ((videoEl as any).webkitEnterFullscreen) {
              (videoEl as any).webkitEnterFullscreen();
            }
          } catch {
            // Ignore
          }
        }
      };

      const handleTimeUpdate = () => {
        setCurrentTime(videoEl.currentTime);
      };

      const handleLoadedMetadata = () => {
        setDuration(videoEl.duration || 0);
      };

      const handlePlayEvent = () => setIsPlaying(true);
      const handlePauseEvent = () => setIsPlaying(false);

      videoEl.addEventListener('canplay', handleCanPlay);
      videoEl.addEventListener('timeupdate', handleTimeUpdate);
      videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.addEventListener('play', handlePlayEvent);
      videoEl.addEventListener('pause', handlePauseEvent);

      return () => {
        videoEl.removeEventListener('canplay', handleCanPlay);
        videoEl.removeEventListener('timeupdate', handleTimeUpdate);
        videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoEl.removeEventListener('play', handlePlayEvent);
        videoEl.removeEventListener('pause', handlePauseEvent);
      };
    }
  }, [videoUrl, isIframe, autoPlay, requestNativeFullscreenOnMount]);

  // Iframe player for YouTube, Vimeo, Drive
  if (isIframe) {
    return (
      <div 
        ref={containerRef} 
        onMouseMove={resetControlsTimer}
        onTouchStart={resetControlsTimer}
        className={`w-full h-full relative bg-black ${className}`}
      >
        <iframe
          src={getVideoEmbedUrl(videoUrl)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="w-full h-full border-0"
        />

        {/* Floating Top Clean Bar - Autohides on inactivity */}
        <div className={`absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto bg-stone-900/80 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
              title="Voltar à capa"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-300" />
              <span>Voltar</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={toggleNativeFullscreen}
            className="pointer-events-auto bg-stone-900/80 hover:bg-black text-white p-2 rounded-xl border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg"
            title={isNativeFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isNativeFullscreen ? <Minimize2 className="w-4 h-4 text-rose-300" /> : <Maximize2 className="w-4 h-4 text-rose-300" />}
          </button>
        </div>
      </div>
    );
  }

  // HTML5 Video with Crystal Clean Custom Fluid Controls
  return (
    <div 
      ref={containerRef} 
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={handleTogglePlay}
      className={`w-full h-full relative bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none ${className}`}
    >
      {/* Native Video Tag (WITHOUT default browser controls overlay) */}
      <video
        ref={videoRef}
        src={formattedSrc}
        poster={formattedPoster}
        preload="auto"
        playsInline
        className="w-full h-full object-contain"
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsVideoReady(true);
          setIsPlaying(true);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {/* Action Pulse Indicator (Flashes in the center on play/pause tap) */}
      {actionPulse && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-out fade-out zoom-out duration-500">
          <div className="w-16 h-16 rounded-full bg-stone-950/75 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-2xl">
            {actionPulse === 'play' ? (
              <Play className="w-7 h-7 fill-current ml-1 text-rose-400" />
            ) : (
              <Pause className="w-7 h-7 fill-current text-white" />
            )}
          </div>
        </div>
      )}

      {/* Discrete Non-Blocking Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-12 h-12 rounded-full bg-stone-950/80 backdrop-blur-md text-rose-500 flex items-center justify-center shadow-xl border border-rose-500/30">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-stone-950/95 flex flex-col items-center justify-center p-6 text-center z-40 space-y-3"
        >
          <AlertCircle className="w-9 h-9 text-rose-400" />
          <p className="text-sm font-bold text-white">Não foi possível carregar o vídeo diretamente.</p>
          <div className="flex items-center gap-2">
            <a
              href={formattedSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              Abrir link externo
            </a>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Voltar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Floating Controls - Clean & Auto-hiding */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-3 left-3 right-3 flex items-center justify-between z-20 transition-opacity duration-300 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto bg-stone-950/80 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer shadow-lg hover:border-rose-500/50"
            title="Voltar à capa"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-300" />
            <span>Voltar à capa</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-2 pointer-events-auto">
          {onExpandTheater && (
            <button
              type="button"
              onClick={onExpandTheater}
              className="bg-stone-950/80 hover:bg-black text-white p-2 rounded-xl border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:text-rose-300"
              title="Expandir modo cinema"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sleek Custom Floating Bottom Control Bar (Completely fades out when playing) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 z-20 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="bg-stone-950/85 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-2.5 shadow-2xl flex flex-col gap-2">
          {/* Progress Timeline Scrubber */}
          <div 
            ref={progressBarRef}
            onClick={handleSeek}
            className="w-full h-2 hover:h-3.5 bg-white/20 rounded-full cursor-pointer relative group/bar transition-all flex items-center"
          >
            <div 
              className="h-full bg-gradient-to-r from-rose-600 via-pink-500 to-rose-400 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Scrubber Knob */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/bar:scale-100 transition-transform" />
            </div>
          </div>

          {/* Controls & Time Display */}
          <div className="flex items-center justify-between gap-3 text-white text-xs">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Volume / Mute */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {/* Time */}
              <span className="font-mono text-[11px] text-stone-300">
                {formatTime(currentTime)} <span className="text-stone-500">/</span> {formatTime(duration)}
              </span>
            </div>

            {/* Right: Fullscreen Switch */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleNativeFullscreen}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-600 text-stone-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isNativeFullscreen ? 'Sair da tela cheia' : 'Tela cheia nativa'}
              >
                {isNativeFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-rose-300" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoShowcase({ settings, customVideos = [], onScrollToForm }: VideoShowcaseProps) {
  // Use exclusively videos loaded/managed in the admin panel
  const videoList = useMemo(() => {
    return customVideos
      .filter((v) => v.active && v.type === 'video')
      .map((customV) => ({
        id: customV.id,
        title: customV.title,
        subtitle: customV.subtitle || 'Destaque Romance & Favorita',
        duration: customV.duration || '01:00',
        category: (customV.category as any) || 'institucional',
        categoryLabel: customV.categoryLabel || 'Vídeo Exclusivo',
        videoUrl: customV.mediaUrl,
        rawMediaUrl: customV.mediaUrl,
        posterUrl: customV.posterUrl || customV.mediaUrl,
        description: customV.description || '',
        highlights: [
          '100% sem investimento e sem taxa de adesão',
          'Acerto a cada 40 dias com comodidade',
          'Lucro de 30% a 40%',
        ],
        featured: customV.featured,
        isCustom: true,
      }));
  }, [customVideos]);

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [theaterModalVideo, setTheaterModalVideo] = useState<typeof videoList[0] | null>(null);
  const [theaterControlsVisible, setTheaterControlsVisible] = useState(true);
  const theaterTimerRef = useRef<NodeJS.Timeout | null>(null);

  const categories = useMemo(() => {
    const list = [
      { id: 'todos', label: 'Todos os Vídeos', count: videoList.length },
      { 
        id: 'campanha', 
        label: 'Campanhas & Vídeos Oficiais', 
        count: videoList.filter(v => ['campanha', 'institucional'].includes(v.category as string)).length 
      },
      { 
        id: 'novidades', 
        label: 'Lançamentos & Novidades', 
        count: videoList.filter(v => ['novidades', 'passo_a_passo', 'fitness', 'intima', 'casual', 'seamless'].includes(v.category as string)).length 
      },
      { 
        id: 'lucros', 
        label: 'Lucro 40% & Catálogo Favorita', 
        count: videoList.filter(v => ['lucros', 'cosmeticos', 'favorita'].includes(v.category as string)).length 
      },
      { 
        id: 'depoimento', 
        label: 'Depoimentos de Revendedoras', 
        count: videoList.filter(v => v.category === 'depoimento').length 
      },
    ];
    return list.filter(c => c.id === 'todos' || c.count > 0);
  }, [videoList]);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'todos') return videoList;
    if (selectedCategory === 'campanha') {
      return videoList.filter(v => ['campanha', 'institucional'].includes(v.category as string));
    }
    if (selectedCategory === 'novidades') {
      return videoList.filter(v => ['novidades', 'passo_a_passo', 'fitness', 'intima', 'casual', 'seamless'].includes(v.category as string));
    }
    if (selectedCategory === 'lucros') {
      return videoList.filter(v => ['lucros', 'cosmeticos', 'favorita'].includes(v.category as string));
    }
    if (selectedCategory === 'depoimento') {
      return videoList.filter(v => v.category === 'depoimento');
    }
    return videoList.filter(v => v.category === selectedCategory);
  }, [videoList, selectedCategory]);

  const resetTheaterTimer = () => {
    setTheaterControlsVisible(true);
    if (theaterTimerRef.current) {
      clearTimeout(theaterTimerRef.current);
    }
    theaterTimerRef.current = setTimeout(() => {
      setTheaterControlsVisible(false);
    }, 2800);
  };

  // Open video immediately in Fullscreen mode when play is clicked
  const handlePlayFullscreen = (video: typeof videoList[0], e?: MouseEvent<HTMLElement>) => {
    if (e) e.stopPropagation();
    setTheaterModalVideo(video);
    setTheaterControlsVisible(true);
    resetTheaterTimer();
  };

  const handleCloseTheater = () => {
    if (theaterTimerRef.current) {
      clearTimeout(theaterTimerRef.current);
    }
    setTheaterModalVideo(null);
  };

  const currentTheaterIndex = useMemo(() => {
    if (!theaterModalVideo) return -1;
    return filteredVideos.findIndex(v => v.id === theaterModalVideo.id);
  }, [theaterModalVideo, filteredVideos]);

  const handleNextVideo = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentTheaterIndex >= 0 && filteredVideos.length > 0) {
      const nextIndex = (currentTheaterIndex + 1) % filteredVideos.length;
      setTheaterModalVideo(filteredVideos[nextIndex]);
      resetTheaterTimer();
    }
  };

  const handlePrevVideo = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentTheaterIndex >= 0 && filteredVideos.length > 0) {
      const prevIndex = (currentTheaterIndex - 1 + filteredVideos.length) % filteredVideos.length;
      setTheaterModalVideo(filteredVideos[prevIndex]);
      resetTheaterTimer();
    }
  };

  // Keyboard navigation for Fullscreen Modal (Esc to close, arrows to switch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!theaterModalVideo) return;
      if (e.key === 'Escape') {
        handleCloseTheater();
      } else if (e.key === 'ArrowRight') {
        handleNextVideo();
      } else if (e.key === 'ArrowLeft') {
        handlePrevVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theaterModalVideo, currentTheaterIndex, filteredVideos]);

  if (videoList.length === 0) {
    return null;
  }

  return (
    <section 
      id="sessao-videos" 
      className="py-16 sm:py-24 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-white relative overflow-hidden"
    >
      {/* Decorative subtle ambient lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-amber-500/20 border border-rose-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-rose-300 shadow-md">
            <Tv className="w-3.5 h-3.5 text-rose-400" />
            <span>Sessão de Vídeos • Reprodução Automática em Tela Cheia</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Assista aos Vídeos & Demonstrações da <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300">Romance Itapema</span>
          </h2>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Dê o play em qualquer vídeo para assistir em tela cheia com alta definição e visual 100% limpo e fluido.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar px-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400'
                    : 'bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-white/25 text-white' : 'bg-white/10 text-stone-400'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* VIDEO GRID (CLICK TO LAUNCH DIRECTLY IN FULLSCREEN) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredVideos.map((video) => {
            const targetUrl = video.videoUrl || video.rawMediaUrl || '';

            return (
              <div
                key={video.id}
                className="rounded-3xl border bg-stone-900/70 hover:bg-stone-900 border-white/10 hover:border-rose-500/40 shadow-xl hover:shadow-2xl transition-all overflow-hidden flex flex-col justify-between group"
              >
                {/* VIDEO DISPLAY AREA (CLICK LAUNCHES FULLSCREEN THEATER) */}
                <div 
                  onClick={(e) => handlePlayFullscreen(video, e)}
                  className="relative aspect-video bg-black overflow-hidden flex items-center justify-center cursor-pointer group/poster"
                >
                  <img
                    src={getMediaThumbnailUrl(targetUrl, video.posterUrl)}
                    alt={video.title}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                    }}
                    className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Subtle Gradient Tint */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20 group-hover/poster:bg-stone-950/20 transition-colors" />

                  {/* Category & Duration Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-rose-600/90 backdrop-blur-md text-white border border-white/20">
                      {video.categoryLabel}
                    </span>
                    {video.featured && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Destaque
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold bg-black/80 text-stone-200 px-2 py-1 rounded-md border border-white/10 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" />
                      {video.duration}
                    </span>
                  </div>

                  {/* Central Animated Play Button (Click Launches Fullscreen) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/60 border-2 border-white/50 group-hover/poster:scale-115 transition-transform duration-300">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                    <span className="bg-black/85 backdrop-blur-md text-[11px] font-extrabold text-white px-3.5 py-1.5 rounded-full border border-white/25 shadow-xl flex items-center gap-1.5 group-hover/poster:bg-rose-600 group-hover/poster:border-rose-400 transition-colors">
                      <Maximize2 className="w-3.5 h-3.5 text-rose-300 group-hover/poster:text-white" />
                      <span>Assistir em Tela Cheia</span>
                    </span>
                  </div>

                  {/* Bottom Title on Poster */}
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="text-xs text-rose-300 font-semibold">{video.subtitle}</p>
                    <h3 className="text-base sm:text-lg font-bold leading-tight line-clamp-1">{video.title}</h3>
                  </div>
                </div>

                {/* VIDEO DETAILS & CALL TO ACTION */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-white leading-tight">
                        {video.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                      {video.description}
                    </p>

                    {/* Highlights */}
                    {video.highlights && video.highlights.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        {video.highlights.slice(0, 3).map((h, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-stone-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => handlePlayFullscreen(video, e)}
                      className="w-full sm:w-auto bg-gradient-to-r from-stone-800 to-stone-700 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer group/btn shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-rose-400 group-hover/btn:text-white" />
                      <span>Assistir em Tela Cheia</span>
                      <Maximize2 className="w-3.5 h-3.5 text-stone-400 group-hover/btn:text-white ml-0.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onScrollToForm(`Interesse após assistir vídeo: ${video.title}`)}
                      className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-rose-600/25 border border-white/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <span>Quero Revender</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Security & Conditions Guarantee Banner */}
        <div className="mt-10 sm:mt-12 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-300">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Mostruário Sem Investimento Sujeito a Análise Cadastral</p>
              <p className="text-xs text-stone-400">Todos os cadastros passam por análise do setor responsável. Após a aprovação, receba sua maleta com lingeries selecionadas e acerte somente após 40 dias.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onScrollToForm()}
            className="bg-white text-stone-950 hover:bg-rose-50 font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            Começar Agora
          </button>
        </div>

      </div>

      {/* FULLSCREEN IMMERSIVE CINEMA THEATER */}
      {theaterModalVideo && (
        <div 
          onMouseMove={resetTheaterTimer}
          onTouchStart={resetTheaterTimer}
          className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 select-none"
        >
          {/* Top Floating Glass Header (Auto-hides during playback for a 100% clean view) */}
          <div className={`p-3 sm:p-4 z-40 flex items-center justify-between transition-all duration-300 ${
            theaterControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15">
              <span className="text-[10px] sm:text-[11px] uppercase font-extrabold px-2.5 py-1 rounded-lg bg-rose-600 text-white shrink-0">
                {theaterModalVideo.categoryLabel}
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-md">
                  {theaterModalVideo.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Previous / Next buttons */}
              {filteredVideos.length > 1 && (
                <div className="flex items-center gap-1 bg-stone-950/80 backdrop-blur-md p-1 rounded-2xl border border-white/15">
                  <button
                    type="button"
                    onClick={handlePrevVideo}
                    className="p-1.5 rounded-xl hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
                    title="Vídeo Anterior (Seta Esquerda)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono px-1.5 text-stone-300">
                    {currentTheaterIndex + 1}/{filteredVideos.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextVideo}
                    className="p-1.5 rounded-xl hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
                    title="Próximo Vídeo (Seta Direita)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleCloseTheater}
                className="px-3 py-2 rounded-2xl bg-stone-950/80 hover:bg-rose-600 text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold border border-white/15 backdrop-blur-md shadow-xl"
                title="Fechar (ESC)"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Fechar</span>
              </button>
            </div>
          </div>

          {/* Central Edge-to-Edge Pure Video Area */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
            <SmartVideoPlayer
              videoUrl={theaterModalVideo.videoUrl || theaterModalVideo.rawMediaUrl || ''}
              posterUrl={theaterModalVideo.posterUrl}
              title={theaterModalVideo.title}
              autoPlay={true}
              onClose={handleCloseTheater}
            />

            {/* Left / Right Screen Arrows for quick video flicking */}
            {filteredVideos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevVideo}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-stone-950/70 hover:bg-rose-600 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-30 shadow-2xl ${
                    theaterControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  title="Vídeo Anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextVideo}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-stone-950/70 hover:bg-rose-600 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-30 shadow-2xl ${
                    theaterControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  title="Próximo Vídeo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Floating Glass Action Bar (Auto-hides during playback) */}
          <div className={`p-3 sm:p-4 z-40 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300 ${
            theaterControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}>
            <div className="hidden sm:block text-left bg-stone-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
              <p className="text-xs text-stone-300 leading-tight max-w-lg truncate">
                {theaterModalVideo.description}
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                Revenda sem investimento inicial • 30% a 40% de lucro • Acerto em 40 dias
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const url = buildWhatsAppLink(
                    settings.officialWhatsApp,
                    `Olá! Assisti ao vídeo "${theaterModalVideo.title}" no site da Romance Moda e gostaria de tirar uma dúvida para revender.`
                  );
                  window.open(url, '_blank');
                }}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCloseTheater();
                  onScrollToForm(`Interesse após assistir vídeo: ${theaterModalVideo.title}`);
                }}
                className="flex-1 sm:flex-none bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-xl border border-white/20 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-transform active:scale-95"
              >
                <span>Fazer Pré-Cadastro</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

    </section>
  );
}
