import { useState } from 'react';
import { 
  Sparkles, 
  Film, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Star, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ExternalLink,
  Play,
  ArrowUpDown,
  Code,
  Copy,
  RefreshCw,
  X,
  Check,
  Tag
} from 'lucide-react';
import { MediaItem, BusinessSettings } from '../../types';
import { 
  formatMediaUrl, 
  getMediaThumbnailUrl, 
  FALLBACK_IMAGE_URL 
} from '../../utils/mediaUrlHelper';

interface AdminMediaTabProps {
  mediaItems: MediaItem[];
  settings: BusinessSettings;
  onOpenNewMediaModal: () => void;
  onOpenEditMediaModal: (item: MediaItem) => void;
  onToggleActive: (item: MediaItem) => void;
  onToggleFeatured: (item: MediaItem) => void;
  onDeleteMediaItem: (itemId: string) => void;
  onSyncWithSupabase?: () => Promise<void>;
}

export function AdminMediaTab({
  mediaItems,
  settings,
  onOpenNewMediaModal,
  onOpenEditMediaModal,
  onToggleActive,
  onToggleFeatured,
  onDeleteMediaItem,
  onSyncWithSupabase,
}: AdminMediaTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Metrics
  const totalItems = mediaItems.length;
  const activePhotos = mediaItems.filter(m => m.type === 'photo' && m.active).length;
  const activeVideos = mediaItems.filter(m => m.type === 'video' && m.active).length;
  const featuredCount = mediaItems.filter(m => m.featured && m.active).length;
  const totalFavorita = mediaItems.filter(m => m.category === 'favorita' || m.category === 'cosmeticos').length;

  // Filter items
  const filtered = mediaItems.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.tag && item.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.categoryLabel && item.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && item.active) || 
      (statusFilter === 'inactive' && !item.active);

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      onDeleteMediaItem(itemToDelete.id);
      showToast(`Mídia "${itemToDelete.title}" excluída com sucesso.`);
      setItemToDelete(null);
    }
  };

  const handleManualSync = async () => {
    if (!onSyncWithSupabase) return;
    setIsSyncing(true);
    try {
      await onSyncWithSupabase();
      showToast('Galeria de mídias sincronizada com o Supabase!', 'success');
    } catch (e) {
      showToast('Falha ao sincronizar com o Supabase. Verifique a tabela e credenciais.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // SQL Script para criação / correção da tabela media_items no Supabase
  const sqlSnippet = `-- ==============================================================================
-- SCRIPT DE CORREÇÃO & CRIAÇÃO: TABELA public.media_items (Supabase)
-- Execute este script no SQL Editor do seu painel Supabase
-- ==============================================================================

-- 1. Criação da Tabela media_items (caso ainda não exista)
CREATE TABLE IF NOT EXISTS public.media_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'photo', -- 'photo' ou 'video'
    category VARCHAR(50) NOT NULL DEFAULT 'novidades',
    category_label TEXT NOT NULL DEFAULT 'Geral',
    media_url TEXT NOT NULL,
    poster_url TEXT,
    description TEXT,
    tag VARCHAR(100),
    badge_color VARCHAR(30) DEFAULT 'rose',
    duration VARCHAR(30),
    link_text VARCHAR(100) DEFAULT 'Quero no Meu Mostruário',
    link_action VARCHAR(30) DEFAULT 'form',
    external_url TEXT,
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Garantir colunas opcionais caso a tabela tenha sido criada em versão anterior
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'photo';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'photo';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS tag VARCHAR(100);
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS badge_color VARCHAR(30) DEFAULT 'rose';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS duration VARCHAR(30);
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS link_text VARCHAR(100) DEFAULT 'Quero no Meu Mostruário';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS link_action VARCHAR(30) DEFAULT 'form';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'media_items' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE public.media_items ALTER COLUMN media_type DROP NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'media_items' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.media_items ALTER COLUMN type DROP NOT NULL;
  END IF;
END $$;

-- 3. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_media_order ON public.media_items(order_index ASC);
CREATE INDEX IF NOT EXISTS idx_media_active ON public.media_items(active, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_media_category ON public.media_items(category);

-- 4. Habilitar Segurança por Linha (Row Level Security - RLS)
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso Permissivo (Leitura Pública e Gestão no Painel)
DROP POLICY IF EXISTS "Permitir acesso a media_items" ON public.media_items;
CREATE POLICY "Permitir acesso a media_items" ON public.media_items 
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Habilitar Realtime para a tabela media_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'media_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.media_items;
  END IF;
END $$;

-- 7. Carga / Sincronização Inicial de Mídias Cadastradas
${mediaItems.map((m) => `INSERT INTO public.media_items (id, title, subtitle, type, category, category_label, media_url, poster_url, description, tag, badge_color, duration, link_text, link_action, external_url, featured, active, order_index, created_at)
VALUES (
  '${m.id.replace(/'/g, "''")}',
  '${m.title.replace(/'/g, "''")}',
  ${m.subtitle ? `'${m.subtitle.replace(/'/g, "''")}'` : 'NULL'},
  '${m.type}',
  '${m.category}',
  '${(m.categoryLabel || 'Geral').replace(/'/g, "''")}',
  '${m.mediaUrl.replace(/'/g, "''")}',
  ${m.posterUrl ? `'${m.posterUrl.replace(/'/g, "''")}'` : 'NULL'},
  '${(m.description || '').replace(/'/g, "''")}',
  ${m.tag ? `'${m.tag.replace(/'/g, "''")}'` : 'NULL'},
  '${m.badgeColor || 'rose'}',
  ${m.duration ? `'${m.duration.replace(/'/g, "''")}'` : 'NULL'},
  '${(m.linkText || 'Quero no Meu Mostruário').replace(/'/g, "''")}',
  '${m.linkAction || 'form'}',
  ${m.externalUrl ? `'${m.externalUrl.replace(/'/g, "''")}'` : 'NULL'},
  ${Boolean(m.featured)},
  ${m.active !== false},
  ${Number(m.order) || 0},
  '${m.createdAt || new Date().toISOString()}'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  category_label = EXCLUDED.category_label,
  media_url = EXCLUDED.media_url,
  poster_url = EXCLUDED.poster_url,
  description = EXCLUDED.description,
  tag = EXCLUDED.tag,
  badge_color = EXCLUDED.badge_color,
  duration = EXCLUDED.duration,
  link_text = EXCLUDED.link_text,
  link_action = EXCLUDED.link_action,
  external_url = EXCLUDED.external_url,
  featured = EXCLUDED.featured,
  active = EXCLUDED.active,
  order_index = EXCLUDED.order_index;`).join('\n\n')}`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
    showToast('Código SQL copiado para a área de transferência!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200" id="admin-media-tab">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 animate-bounce ${
            toastMessage.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' :
            toastMessage.type === 'error' ? 'bg-red-900 text-white border-red-700' :
            'bg-stone-900 text-white border-stone-700'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Central de Mídias (Fotos, Vídeos & Catálogo Favorita)</span>
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900">
            Gestão de Fotos, Vídeos & Lançamentos
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Cadastre fotos e vídeos para as 7 linhas comerciais de revenda sem investimento e para o <strong>Catálogo Favorita (40% de lucro)</strong>. Suporte direto a links de imagens, <strong>Playbook (playbook.com)</strong>, <strong>Google Drive</strong>, <strong>YouTube</strong> e <strong>MP4</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Ver SQL */}
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-stone-200 cursor-pointer"
            title="Ver e copiar comandos SQL para o Supabase"
          >
            <Code className="w-4 h-4 text-stone-600" /> 
            <span>Código SQL Supabase</span>
          </button>

          {/* Sincronizar Supabase */}
          {onSyncWithSupabase && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-900 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-200 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-rose-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Supabase'}</span>
            </button>
          )}

          {/* Cadastrar Nova Mídia */}
          <button
            type="button"
            onClick={onOpenNewMediaModal}
            className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Mídia</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase">Total Mídias</span>
            <Layers className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900">{totalItems}</div>
          <p className="text-[10px] sm:text-[11px] text-stone-500">Cadastradas</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase">Fotos Ativas</span>
            <ImageIcon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900">{activePhotos}</div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium">No mostruário</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase">Vídeos Ativos</span>
            <Film className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900">{activeVideos}</div>
          <p className="text-[10px] sm:text-[11px] text-purple-600 font-medium">Romance Play</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase">Favorita (40%)</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700">{totalFavorita}</div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium">Catálogo 40%</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase">Destaques</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900">{featuredCount}</div>
          <p className="text-[10px] sm:text-[11px] text-amber-700 font-medium">Topo do carrossel</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, tag, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">Todos os Tipos (Fotos & Vídeos)</option>
              <option value="photo">Apenas Fotos</option>
              <option value="video">Apenas Vídeos</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">Todas as Linhas / Categorias</option>
              <option value="favorita">⭐ Catálogo Favorita Oficial (40% Lucro)</option>
              <option value="cosmeticos">💄 Cosméticos (Catálogo Favorita)</option>
              <option value="fitness">🏃‍♀️ 1. Fitness (Moda Treino)</option>
              <option value="seamless">✨ 2. Seamless (Sem Costura)</option>
              <option value="casual">👗 3. Casual (Looks & Dia a Dia)</option>
              <option value="intima">👙 4. Moda Íntima (Lingerie Nobre)</option>
              <option value="rmc_casa">🏡 6. RMC Casa (Lar, Cama & Banho)</option>
              <option value="sex_shop">🔥 7. Sex Shop (Boutique Sensual)</option>
              <option value="lingerie">👙 Lingerie & Linhas Romance</option>
              <option value="novidades">⭐ Lançamentos & Novidades 2026</option>
              <option value="campanha">📢 Campanhas Oficiais & Vídeos</option>
              <option value="depoimento">💬 Depoimentos</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Apenas Ativos (Visíveis no site)</option>
              <option value="inactive">Apenas Ocultos</option>
            </select>
          </div>

        </div>
      </div>

      {/* Media Items List / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-12 text-center border border-stone-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-stone-900 text-lg">Nenhuma mídia encontrada</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Não encontramos fotos ou vídeos com os filtros selecionados.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewMediaModal}
            className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Mídia</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl overflow-hidden border shadow-md transition-all flex flex-col justify-between ${
                item.active ? 'border-stone-200 hover:border-rose-300' : 'border-stone-200/50 opacity-60 bg-stone-50'
              }`}
            >
              {/* Media Header Preview */}
              <div>
                <div className="relative aspect-video bg-stone-900 overflow-hidden group">
                  <img
                    src={item.type === 'video' ? (item.posterUrl || getMediaThumbnailUrl(item.mediaUrl)) : formatMediaUrl(item.mediaUrl, 'photo')}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                    }}
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="bg-stone-950/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      {item.type === 'video' ? <Film className="w-3 h-3 text-purple-400" /> : <ImageIcon className="w-3 h-3 text-rose-400" />}
                      <span>{item.type === 'video' ? 'Vídeo' : 'Foto'}</span>
                    </span>

                    {item.featured && (
                      <span className="bg-amber-500/90 backdrop-blur-md text-stone-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-stone-950" />
                        <span>Destaque Topo</span>
                      </span>
                    )}
                  </div>

                  {/* Play Overlay if video */}
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-600 shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current translate-x-0.5" />
                      </div>
                      {item.duration && (
                        <span className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {item.duration}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tag / Category Badge bottom left */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                    {item.tag && (
                      <span className="bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {item.tag}
                      </span>
                    )}
                    <span className="bg-stone-900/80 backdrop-blur-md text-stone-200 text-[10px] font-medium px-2 py-0.5 rounded-md">
                      {item.categoryLabel || item.category}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 sm:p-5 space-y-2">
                  <h4 className="font-serif-luxury font-bold text-stone-900 text-base leading-snug line-clamp-1" title={item.title}>
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-xs text-rose-700 font-medium line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleActive(item);
                      showToast(item.active ? `Mídia "${item.title}" ocultada do site.` : `Mídia "${item.title}" ativada no site.`);
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      item.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200'
                    }`}
                    title={item.active ? 'Mídia ativa (clique para ocultar)' : 'Mídia oculta (clique para ativar)'}
                  >
                    {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onToggleFeatured(item);
                      showToast(item.featured ? `Destaque removido de "${item.title}".` : `"${item.title}" definido como destaque do topo!`);
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      item.featured
                        ? 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100'
                        : 'bg-white text-stone-400 border-stone-200 hover:bg-stone-50'
                    }`}
                    title={item.featured ? 'Destaque prioritário (clique para remover)' : 'Marcar como destaque no topo'}
                  >
                    <Star className={`w-4 h-4 ${item.featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenEditMediaModal(item)}
                    className="p-2 text-stone-600 hover:text-rose-700 hover:bg-white rounded-xl border border-transparent hover:border-stone-200 transition-all cursor-pointer"
                    title="Editar Mídia"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Excluir Mídia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/80 relative text-stone-900">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2 mb-6">
              <h3 className="font-bold text-lg text-stone-900">Excluir Mídia?</h3>
              <p className="text-xs text-stone-500">
                Tem certeza que deseja excluir <strong>"{itemToDelete.title}"</strong>? Esta ação removerá a mídia do carrossel e do banco de dados.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-colors cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Script Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-white/80 relative text-stone-900 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Script SQL Supabase: public.media_items</h3>
                  <p className="text-xs text-stone-500">
                    Execute este script no <strong>SQL Editor do Supabase</strong> para criar ou corrigir a tabela e políticas de mídias
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSqlModal(false)}
                className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 flex-1 overflow-hidden flex flex-col bg-stone-950 rounded-2xl border border-stone-800 p-4">
              <div className="flex items-center justify-between text-xs text-stone-400 pb-2 mb-2 border-b border-stone-800">
                <span>PostgreSQL / Supabase Query</span>
                <span className="text-[10px] text-emerald-400 font-mono">Pronto para Executar</span>
              </div>
              <pre className="text-stone-200 text-xs font-mono overflow-auto flex-1 p-2 leading-relaxed selection:bg-purple-500 selection:text-white">
                {sqlSnippet}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <span className="text-xs text-stone-500">
                Tabela: <strong className="text-stone-800">public.media_items</strong> ({mediaItems.length} registros mapeados)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-all"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar Código SQL
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
