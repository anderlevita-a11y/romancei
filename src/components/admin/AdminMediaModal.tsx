import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Film, 
  Image as ImageIcon, 
  Star, 
  Check, 
  AlertCircle, 
  Link2, 
  Tag, 
  Clock, 
  Layers,
  Palette,
  Eye,
  Sliders,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Play
} from 'lucide-react';
import { MediaItem, MediaType, MediaCategory } from '../../types';
import { 
  parseGoogleDriveUrl, 
  parsePlaybookUrl,
  formatMediaUrl, 
  getMediaThumbnailUrl, 
  isIframeVideo, 
  getVideoEmbedUrl, 
  FALLBACK_IMAGE_URL 
} from '../../utils/mediaUrlHelper';

interface AdminMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMediaItem: (item: MediaItem) => void;
  editingItem: MediaItem | null;
  totalItemsCount: number;
}

const CATEGORY_OPTIONS: { id: MediaCategory; label: string }[] = [
  { id: 'fitness', label: '🏃‍♀️ 1. Fitness (Moda Fitness, Leggings & Tops)' },
  { id: 'seamless', label: '✨ 2. Seamless (Tecnologia Sem Costura & Laser)' },
  { id: 'casual', label: '👗 3. Casual (Moda Dia a Dia & Looks)' },
  { id: 'intima', label: '👙 4. Moda Íntima (Lingerie Nobre, Rendas & Noite)' },
  { id: 'cosmeticos', label: '💄 5. Cosméticos (Catálogo Favorita - 40% Lucro)' },
  { id: 'rmc_casa', label: '🏡 6. RMC Casa (Cama, Mesa, Banho & Lar)' },
  { id: 'sex_shop', label: '🔥 7. Sex Shop (Boutique Sensual & Cuidados a Dois)' },
  { id: 'favorita', label: '⭐ Catálogo Favorita Oficial (40% de Lucro & Mix Completo)' },
  { id: 'lingerie', label: '👙 Lingerie & Linhas Romance' },
  { id: 'novidades', label: '⭐ Lançamentos & Novidades 2026' },
  { id: 'campanha', label: '📢 Campanhas Oficiais & Vídeos' },
  { id: 'depoimento', label: '💬 Depoimentos de Revendedoras' },
];

const PRESET_SUGGESTIONS = [
  {
    title: 'Nova Coleção Romance 2026: Rendas Nobres & Luxo',
    type: 'photo' as MediaType,
    category: 'novidades' as MediaCategory,
    mediaUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80',
    tag: 'Lançamento 2026',
    badgeColor: 'rose' as const,
    description: 'Conjuntos anatômicos em renda nobre e bojos que não amassam. Peças exclusivas de alta procura para revenda sem investimento.',
  },
  {
    title: 'Catálogo Favorita: Cosméticos, Perfumaria & Linha Lar (40% Lucro)',
    type: 'photo' as MediaType,
    category: 'favorita' as MediaCategory,
    mediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    tag: '40% de Lucro',
    badgeColor: 'emerald' as const,
    description: 'Linha completa com hidratação, sabonetes, maquiagens e utilidades do lar que ativam o lucro de até 40% sem investimento.',
  },
  {
    title: 'Vídeo Oficial: Como Funciona a Revenda Sem Investimento',
    type: 'video' as MediaType,
    category: 'campanha' as MediaCategory,
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-shopping-at-a-clothing-store-41584-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=80',
    duration: '01:05',
    tag: 'Vídeo Oficial',
    badgeColor: 'purple' as const,
    description: 'Vídeo demonstrando a entrega do kit pronto em casa, mostruário completo e lucros de R$ 300 a R$ 600 por semana.',
  },
  {
    title: 'Moda Fitness: Leggings Power Compressão Zero Transparência',
    type: 'photo' as MediaType,
    category: 'fitness' as MediaCategory,
    mediaUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    tag: 'Fitness Best-Seller',
    badgeColor: 'amber' as const,
    description: 'Leggings e tops confortáveis de alta compressão para treino e dia a dia.',
  },
  {
    title: 'Linha Seamless: Tecnologia Sem Costura & Corte a Laser',
    type: 'photo' as MediaType,
    category: 'seamless' as MediaCategory,
    mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    tag: 'Tecnologia Laser',
    badgeColor: 'blue' as const,
    description: 'Calcinhas e sutiãs invisíveis sob a roupa com aderência perfeita ao corpo.',
  }
];

export function AdminMediaModal({
  isOpen,
  onClose,
  onSaveMediaItem,
  editingItem,
  totalItemsCount,
}: AdminMediaModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState<MediaType>('photo');
  const [category, setCategory] = useState<MediaCategory>('novidades');
  const [mediaUrl, setMediaUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('Lançamento 2026');
  const [badgeColor, setBadgeColor] = useState<'rose' | 'amber' | 'emerald' | 'purple' | 'blue'>('rose');
  const [duration, setDuration] = useState('');
  const [linkText, setLinkText] = useState('Quero no Meu Mostruário');
  const [featured, setFeatured] = useState(true);
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setSubtitle(editingItem.subtitle || '');
      setType(editingItem.type);
      setCategory(editingItem.category);
      setMediaUrl(editingItem.mediaUrl);
      setPosterUrl(editingItem.posterUrl || '');
      setDescription(editingItem.description);
      setTag(editingItem.tag || '');
      setBadgeColor(editingItem.badgeColor || 'rose');
      setDuration(editingItem.duration || '');
      setLinkText(editingItem.linkText || 'Quero no Meu Mostruário');
      setFeatured(editingItem.featured);
      setActive(editingItem.active);
      setOrder(editingItem.order || 1);
    } else {
      // Default new item state
      setTitle('');
      setSubtitle('');
      setType('photo');
      setCategory('novidades');
      setMediaUrl('https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80');
      setPosterUrl('');
      setDescription('');
      setTag('Lançamento 2026');
      setBadgeColor('rose');
      setDuration('');
      setLinkText('Quero no Meu Mostruário');
      setFeatured(true);
      setActive(true);
      setOrder(totalItemsCount + 1);
    }
    setError('');
  }, [editingItem, isOpen, totalItemsCount]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_SUGGESTIONS[0]) => {
    setTitle(preset.title);
    setType(preset.type);
    setCategory(preset.category);
    setMediaUrl(preset.mediaUrl);
    setPosterUrl(preset.posterUrl || '');
    setDescription(preset.description);
    setTag(preset.tag);
    setBadgeColor(preset.badgeColor);
    if (preset.duration) setDuration(preset.duration);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Por favor, informe o título da mídia.');
      return;
    }

    if (!mediaUrl.trim()) {
      setError('Por favor, informe a URL da foto ou vídeo.');
      return;
    }

    const categoryOption = CATEGORY_OPTIONS.find((c) => c.id === category);
    const categoryLabel = categoryOption ? categoryOption.label.replace(/^[^\s]+\s/, '') : 'Geral';

    // Auto-format and normalize media URL (converts Google Drive, Dropbox, YouTube, etc.)
    const cleanMediaUrl = formatMediaUrl(mediaUrl.trim(), type);
    const cleanPosterUrl = posterUrl.trim()
      ? formatMediaUrl(posterUrl.trim(), 'photo')
      : (type === 'video' ? getMediaThumbnailUrl(cleanMediaUrl) : undefined);

    const item: MediaItem = {
      id: editingItem ? editingItem.id : `media-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      type,
      category,
      categoryLabel,
      mediaUrl: cleanMediaUrl,
      posterUrl: cleanPosterUrl,
      description: description.trim() || 'Destaque exclusivo Romance Moda para revenda sem investimento.',
      tag: tag.trim() || undefined,
      badgeColor,
      duration: duration.trim() || undefined,
      linkText: linkText.trim() || 'Quero no Meu Mostruário',
      linkAction: 'form',
      featured,
      active,
      order: Number(order) || 1,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    };

    onSaveMediaItem(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-stone-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-white/80 relative text-stone-900 overflow-hidden">
        
        {/* Top Gradient Banner */}
        <div className="h-1 sm:h-1.5 bg-gradient-to-r from-rose-500 via-purple-500 to-amber-500 shrink-0 w-full" />

        {/* Fixed Header */}
        <div className="px-4 sm:px-6 pt-3.5 sm:pt-4 pb-3 border-b border-stone-100 flex items-start justify-between gap-3 shrink-0 bg-white">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[10px] sm:text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{editingItem ? 'Editar Mídia Existente' : 'Nova Foto, Vídeo ou Novidade'}</span>
            </div>
            <h3 className="font-serif-luxury text-lg sm:text-2xl font-bold text-stone-900 leading-tight truncate">
              {editingItem ? 'Atualizar Detalhes da Mídia' : 'Cadastrar Mídia no Carrossel'}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 hidden sm:block">
              Configure fotos de lingeries, lançamentos ou vídeos para exibir na galeria do site.
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer shrink-0 -mr-1"
            title="Fechar formulário"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body & Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4 text-left flex-1 overscroll-contain">
            
            {/* Preset Templates Bar (when creating new) */}
            {!editingItem && (
              <div className="bg-rose-50/60 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-rose-100">
                <span className="text-[10px] sm:text-[11px] font-bold text-rose-900 block mb-1.5 sm:mb-2">
                  💡 Modelos Prontos para Testar Rápido:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {PRESET_SUGGESTIONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="bg-white hover:bg-rose-100 text-stone-700 hover:text-rose-800 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      {preset.type === 'video' ? <Film className="w-3 h-3 text-purple-600 shrink-0" /> : <ImageIcon className="w-3 h-3 text-rose-600 shrink-0" />}
                      <span className="truncate max-w-[140px] sm:max-w-none">{preset.title.split(':')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type Selector (Photo vs Video) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Tipo de Conteúdo</label>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setType('photo')}
                  className={`py-2.5 sm:py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 border transition-all cursor-pointer ${
                    type === 'photo'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Foto / Imagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('video')}
                  className={`py-2.5 sm:py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 border transition-all cursor-pointer ${
                    type === 'video'
                      ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-500/20 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Film className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Vídeo Oficial</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Título Principal *</label>
              <input
                type="text"
                required
                placeholder="Ex: Nova Coleção Romance 2026: Rendas Nobres"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Subtítulo (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Conjuntos com sustentação anatômica e bojos resistentes"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all"
              />
            </div>

            {/* Category & Tag Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MediaCategory)}
                  className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Tag em Destaque</label>
                <input
                  type="text"
                  placeholder="Ex: Lançamento 2026, 40% Lucro"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>
            </div>

            {/* Media URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                <span>URL da Foto ou Vídeo *</span>
                {mediaUrl && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> URL informada
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={type === 'video' ? "Ex: https://playbook.com/... , Google Drive, YouTube ou MP4" : "Ex: https://playbook.com/... , Google Drive ou link direto"}
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono transition-all"
                />
              </div>

              {/* Playbook.com Detection Notice */}
              {parsePlaybookUrl(mediaUrl).isPlaybook && (
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5 sm:p-3 text-xs space-y-1 text-sky-950 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 font-bold text-sky-800">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Link do Playbook (playbook.com) detectado com sucesso!</span>
                  </div>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    O link de compartilhamento do Playbook foi identificado e preparado para exibição automática {type === 'video' ? 'no player de vídeo' : 'na galeria de fotos'}.
                  </p>
                  <div className="text-[10px] text-stone-600 bg-white/80 p-2 rounded-lg border border-sky-100 mt-1">
                    💡 <strong>Dica Playbook:</strong> Você pode usar links de boards compartilhados (<code>playbook.com/s/...</code>), embeds (<code>playbook.com/e/...</code>) ou links diretos de arquivos (<code>assets.playbook.com</code>).
                  </div>
                </div>
              )}

              {/* Google Drive Detection Notice */}
              {parseGoogleDriveUrl(mediaUrl).isDrive && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 sm:p-3 text-xs space-y-1 text-emerald-900 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Link do Google Drive detectado com sucesso!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    O link foi convertido automaticamente para exibição direta no site.
                  </p>
                  <div className="text-[10px] text-stone-600 bg-white/80 p-2 rounded-lg border border-emerald-100 mt-1">
                    💡 <strong>Importante no Google Drive:</strong> Certifique-se de que o arquivo no seu Drive está com a permissão definida para: <em>"Qualquer pessoa com o link" (Leitor)</em>.
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail / Poster URL (Optional for videos) */}
            {type === 'video' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">URL da Capa (Poster)</label>
                  <input
                    type="text"
                    placeholder="https://.../capa.jpg"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Duração do Vídeo</label>
                  <input
                    type="text"
                    placeholder="Ex: 01:15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Live Preview Box */}
            {mediaUrl.trim() && (
              <div className="space-y-1.5 bg-stone-950 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-stone-800">
                <div className="flex items-center justify-between text-white text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-stone-300">
                    <Eye className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    Prévia Instantânea da Mídia
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {type === 'video' ? 'Vídeo / Player' : 'Imagem direta'}
                  </span>
                </div>
                
                <div className="relative aspect-video max-h-40 sm:max-h-48 rounded-lg sm:rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
                  {type === 'video' ? (
                    isIframeVideo(mediaUrl) ? (
                      <iframe
                        src={getVideoEmbedUrl(mediaUrl)}
                        title="Prévia do vídeo"
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                      />
                    ) : (
                      <video
                        src={formatMediaUrl(mediaUrl, 'video')}
                        poster={getMediaThumbnailUrl(mediaUrl, posterUrl)}
                        preload="metadata"
                        playsInline
                        controls
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <img
                      src={formatMediaUrl(mediaUrl, 'photo')}
                      alt="Prévia da foto selecionada"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE_URL;
                      }}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Descrição Comercial</label>
              <textarea
                rows={2}
                placeholder="Explique os diferenciais da peça, tecidos, cores e vantagens para as clientes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none transition-all"
              />
            </div>

            {/* Badge Color & Order Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Cor do Selo/Badge</label>
                <select
                  value={badgeColor}
                  onChange={(e) => setBadgeColor(e.target.value as any)}
                  className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all"
                >
                  <option value="rose">Rosa / Romance</option>
                  <option value="emerald">Verde Esmeralda (40% Lucro)</option>
                  <option value="amber">Âmbar / Dourado</option>
                  <option value="purple">Roxo / Glamour</option>
                  <option value="blue">Azul / Institucional</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Ordem de Exibição</label>
                <input
                  type="number"
                  min={1}
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>
            </div>

            {/* Toggles: Featured & Active */}
            <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <label className="flex items-center gap-2.5 bg-stone-50 p-2.5 sm:p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                    Destaque no Carrossel
                  </span>
                  <span className="text-[10px] text-stone-500 block">Exibe com prioridade no topo</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 bg-stone-50 p-2.5 sm:p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Ativo no Site
                  </span>
                  <span className="text-[10px] text-stone-500 block">Visível para o público</span>
                </div>
              </label>
            </div>

            {error && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}

          </div>

          {/* Fixed Footer CTAs */}
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-stone-50 border-t border-stone-200/80 flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs sm:text-sm py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl shadow-md shadow-rose-600/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{editingItem ? 'Salvar Alterações' : 'Publicar Mídia'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
