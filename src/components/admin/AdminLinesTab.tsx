import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  RefreshCw, 
  Database, 
  Copy, 
  Check, 
  DollarSign, 
  Tag, 
  Sparkles,
  ExternalLink,
  Code,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { CommercialLine } from '../../types';
import { AdminLineModal } from './AdminLineModal';
import { productCategories } from '../../data/initialData';

interface AdminLinesTabProps {
  lines: CommercialLine[];
  onAddLine: (line: CommercialLine) => void;
  onUpdateLine: (line: CommercialLine) => void;
  onDeleteLine: (lineId: string) => void;
  onReorderLines: (lines: CommercialLine[]) => void;
  onSyncWithSupabase?: () => Promise<void>;
  supabaseConnected?: boolean;
}

export function AdminLinesTab({
  lines,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
  onReorderLines,
  onSyncWithSupabase,
  supabaseConnected = false,
}: AdminLinesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'active' | 'inactive' | 'favorita'>('all');
  const [selectedLine, setSelectedLine] = useState<CommercialLine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lineToDelete, setLineToDelete] = useState<CommercialLine | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filtragem
  const filteredLines = lines.filter((line) => {
    const matchesSearch = 
      line.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.badge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.items.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterCategory === 'active') return line.active !== false;
    if (filterCategory === 'inactive') return line.active === false;
    if (filterCategory === 'favorita') return Boolean(line.isFavorita);

    return true;
  });

  const totalActive = lines.filter(l => l.active !== false).length;
  const totalFavorita = lines.filter(l => Boolean(l.isFavorita)).length;

  const handleOpenCreateModal = () => {
    setSelectedLine(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (line: CommercialLine) => {
    setSelectedLine(line);
    setIsModalOpen(true);
  };

  const handleSaveLine = (savedLine: CommercialLine) => {
    if (selectedLine) {
      onUpdateLine(savedLine);
      showToast(`Linha "${savedLine.title}" atualizada com sucesso!`);
    } else {
      onAddLine(savedLine);
      showToast(`Nova linha "${savedLine.title}" cadastrada com sucesso!`);
    }
    setIsModalOpen(false);
    setSelectedLine(null);
  };

  const handleConfirmDelete = () => {
    if (!lineToDelete) return;
    onDeleteLine(lineToDelete.id);
    showToast(`Linha "${lineToDelete.title}" excluída com sucesso.`);
    setLineToDelete(null);
    if (isModalOpen && selectedLine?.id === lineToDelete.id) {
      setIsModalOpen(false);
      setSelectedLine(null);
    }
  };

  const handleToggleActive = (line: CommercialLine) => {
    const updated = { ...line, active: line.active === false ? true : false };
    onUpdateLine(updated);
    showToast(
      updated.active ? `Linha "${line.title}" ativada no site.` : `Linha "${line.title}" ocultada do site.`,
      'info'
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lines.length) return;

    const newLines = [...lines];
    const temp = newLines[index];
    newLines[index] = newLines[targetIndex];
    newLines[targetIndex] = temp;

    // Atualiza campo order em cada linha
    const reordered = newLines.map((item, idx) => ({ ...item, order: idx + 1 }));
    onReorderLines(reordered);
    showToast('Ordem das linhas atualizada!');
  };

  const handleRestoreDefaults = () => {
    onReorderLines(productCategories);
    setShowRestoreModal(false);
    showToast('Linhas comerciais restauradas para a configuração padrão oficial!');
  };

  const handleManualSync = async () => {
    if (!onSyncWithSupabase) return;
    setIsSyncing(true);
    try {
      await onSyncWithSupabase();
      showToast('Linhas comerciais sincronizadas com o Supabase!', 'success');
    } catch {
      showToast('Erro ao sincronizar com o Supabase. Verifique a conexão.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const sqlSnippet = `-- ==============================================================================
-- CÓDIGO SQL PARA CRIAR/ATUALIZAR TABELA DE LINHAS COMERCIAIS NO SUPABASE
-- Execute no SQL Editor do seu Painel Supabase (https://app.supabase.com)
-- ==============================================================================

-- 1. Criação da Tabela commercial_lines (caso ainda não exista)
CREATE TABLE IF NOT EXISTS public.commercial_lines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    badge VARCHAR(100) NOT NULL,
    tagline TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    profit_highlight TEXT NOT NULL,
    image TEXT NOT NULL,
    accent_color VARCHAR(50) DEFAULT 'rose',
    is_favorita BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.1 Migração Automática: Garante que colunas novas existam caso a tabela já tenha sido criada anteriormente
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT 'rose';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS profit_highlight TEXT DEFAULT '';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS badge VARCHAR(100) DEFAULT '';
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS is_favorita BOOLEAN DEFAULT false;
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.commercial_lines ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 1.2 Compatibilidade Retroativa: Remove restrição NOT NULL de colunas antigas (subtitle, description) se existirem
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'commercial_lines' AND column_name = 'subtitle'
  ) THEN
    ALTER TABLE public.commercial_lines ALTER COLUMN subtitle DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'commercial_lines' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.commercial_lines ALTER COLUMN description DROP NOT NULL;
  END IF;
END $$;

-- 2. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_lines_order ON public.commercial_lines(order_index ASC);
CREATE INDEX IF NOT EXISTS idx_lines_active ON public.commercial_lines(active, order_index ASC);

-- 3. Habilitação de RLS (Row Level Security) e Políticas de Acesso
ALTER TABLE public.commercial_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso a commercial_lines" ON public.commercial_lines;
CREATE POLICY "Permitir acesso a commercial_lines" ON public.commercial_lines 
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Habilitação de Atualizações Realtime via WebSocket (Idempotente / Seguro)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'commercial_lines'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.commercial_lines;
  END IF;
END $$;

-- 5. Inserção / Atualização das Linhas Atuais:
${lines.map((l, i) => `INSERT INTO public.commercial_lines (id, title, badge, tagline, items, profit_highlight, image, accent_color, is_favorita, active, order_index)
VALUES ('${l.id.replace(/'/g, "''")}', '${l.title.replace(/'/g, "''")}', '${(l.badge || '').replace(/'/g, "''")}', '${(l.tagline || '').replace(/'/g, "''")}', '${JSON.stringify(l.items).replace(/'/g, "''")}'::jsonb, '${(l.profitHighlight || '').replace(/'/g, "''")}', '${(l.image || '').replace(/'/g, "''")}', '${l.accentColor || 'rose'}', ${Boolean(l.isFavorita)}, ${l.active !== false}, ${i + 1})
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    badge = EXCLUDED.badge,
    tagline = EXCLUDED.tagline,
    items = EXCLUDED.items,
    profit_highlight = EXCLUDED.profit_highlight,
    image = EXCLUDED.image,
    accent_color = EXCLUDED.accent_color,
    is_favorita = EXCLUDED.is_favorita,
    active = EXCLUDED.active,
    order_index = EXCLUDED.order_index;`).join('\n\n')}`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
    showToast('Código SQL copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6" id="admin-commercial-lines-tab">
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

      {/* Header & Action Bar */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-900">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">Linhas Comerciais Oficiais</h2>
              <p className="text-xs text-stone-500">
                Gerencie todo o mix de produtos, fotos, títulos, tópicos e destaques de lucro exibidos no catálogo
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Ver SQL */}
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-stone-200"
          >
            <Code className="w-4 h-4 text-stone-600" /> Código SQL Supabase
          </button>

          {/* Sincronizar Supabase */}
          {onSyncWithSupabase && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-900 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-rose-600 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Supabase'}
            </button>
          )}

          {/* Adicionar Nova Linha */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-900 to-rose-950 text-white text-xs font-bold hover:from-rose-800 hover:to-rose-900 shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Nova Linha Comercial
          </button>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase">Total de Linhas</span>
            <Layers className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-1">{lines.length}</p>
          <span className="text-[11px] text-stone-400">Mix de produtos configurado</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase">Linhas Ativas</span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{totalActive}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Visíveis no site para clientes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase">Catálogo Favorita</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-1">{totalFavorita}</p>
          <span className="text-[11px] text-stone-400">Vinculadas a pedidos Favorita</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase">Sem Investimento</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-900 mt-1">{lines.length - totalFavorita}</p>
          <span className="text-[11px] text-stone-400">Consignado Romance 40 dias</span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, badge, itens ou lucro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-stone-800"
          />
        </div>

        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              filterCategory === 'all'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Todas ({lines.length})
          </button>
          <button
            onClick={() => setFilterCategory('active')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              filterCategory === 'active'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Ativas ({totalActive})
          </button>
          <button
            onClick={() => setFilterCategory('favorita')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              filterCategory === 'favorita'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Catálogo Favorita ({totalFavorita})
          </button>
          <button
            onClick={() => setFilterCategory('inactive')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              filterCategory === 'inactive'
                ? 'bg-stone-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Ocultas ({lines.length - totalActive})
          </button>
        </div>
      </div>

      {/* Lista de Linhas Comerciais */}
      <div className="space-y-3">
        {filteredLines.map((line, index) => {
          const originalIndex = lines.findIndex((l) => l.id === line.id);
          const isFirst = originalIndex === 0;
          const isLast = originalIndex === lines.length - 1;

          return (
            <div
              key={line.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                line.active === false ? 'opacity-60 bg-stone-50 border-stone-300' : 'border-stone-200'
              }`}
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Lado Esquerdo: Foto e Informações Principais */}
                <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                  {/* Foto Thumbnail */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-200 shadow-sm">
                    {line.image ? (
                      <img
                        src={line.image}
                        alt={line.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Layers className="w-6 h-6" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 text-[10px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded">
                      #{originalIndex + 1}
                    </span>
                  </div>

                  {/* Detalhes de Texto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-stone-900 truncate">{line.title}</h3>
                      {line.badge && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                          {line.badge}
                        </span>
                      )}
                      {line.isFavorita && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Catálogo Favorita
                        </span>
                      )}
                      {line.active === false && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                          Oculta
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-1 mb-2">{line.tagline}</p>

                    {/* Chips de Itens e Lucro */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="flex items-center text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                        <Tag className="w-3 h-3 mr-1 text-stone-500" />
                        <span>{line.items.length} itens inclusos</span>
                      </div>
                      {line.profitHighlight && (
                        <div className="flex items-center text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                          <DollarSign className="w-3 h-3 mr-0.5 text-amber-600" />
                          <span>{line.profitHighlight}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Ações (Reordenar, Toggle Ativo, Editar, Excluir) */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                  {/* Reordenar */}
                  <div className="flex bg-stone-100 rounded-xl p-0.5 border border-stone-200 mr-1">
                    <button
                      type="button"
                      onClick={() => handleMove(originalIndex, 'up')}
                      disabled={isFirst}
                      title="Subir posição"
                      className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-25 rounded-lg hover:bg-white transition-all"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(originalIndex, 'down')}
                      disabled={isLast}
                      title="Descer posição"
                      className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-25 rounded-lg hover:bg-white transition-all"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle Ativo */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(line)}
                    title={line.active !== false ? 'Ocultar linha do site' : 'Ativar linha no site'}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                      line.active !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-500 border-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {line.active !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Editar */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(line)}
                    className="px-3 py-2 bg-rose-900 text-white hover:bg-rose-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>

                  {/* Excluir com confirmação inline/modal */}
                  <button
                    type="button"
                    onClick={() => setLineToDelete(line)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                    title="Excluir linha comercial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLines.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
            <Layers className="w-12 h-12 text-stone-300 mx-auto" />
            <h4 className="text-base font-bold text-stone-800">Nenhuma linha comercial encontrada</h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Nenhuma linha corresponde aos filtros aplicados. Tente limpar os termos de busca ou clique em "+ Nova Linha Comercial".
            </p>
            <button
              onClick={() => { setSearchTerm(''); setFilterCategory('all'); }}
              className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Footer Info & Restore Button */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-stone-500" />
          <span>
            {supabaseConnected
              ? 'Todas as alterações são sincronizadas automaticamente com o banco Supabase via WebSocket.'
              : 'As linhas comerciais estão salvas no navegador e prontas para sincronização com o Supabase.'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowRestoreModal(true)}
          className="text-stone-500 hover:text-rose-900 font-medium underline flex items-center gap-1 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restaurar Linhas Padrão
        </button>
      </div>

      {/* Modal de Criação / Edição */}
      <AdminLineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLine(null);
        }}
        onSave={handleSaveLine}
        onDelete={(lineId) => {
          onDeleteLine(lineId);
          showToast('Linha comercial excluída com sucesso!');
          setIsModalOpen(false);
          setSelectedLine(null);
        }}
        line={selectedLine}
        totalLinesCount={lines.length}
      />

      {/* In-App Confirmation Modal: Delete Line */}
      {lineToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Confirmar Exclusão</h3>
                <p className="text-xs text-stone-500">Excluir Linha Comercial</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              Você tem certeza que deseja excluir a linha comercial <strong className="font-bold text-stone-900">"{lineToDelete.title}"</strong>?
              Ela será removida do mostruário e do catálogo do site.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setLineToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Restore Defaults */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Restaurar Linhas Padrão</h3>
                <p className="text-xs text-stone-500">Configuração de Fábrica</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              Deseja restaurar as linhas comerciais para os modelos oficiais da Romance Moda (Fitness, Seamless, Casual, Moda Íntima, Cosméticos, RMC Casa e Sex Shop)?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 shadow-md transition-colors"
              >
                Confirmar e Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: SQL Code Viewer */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-stone-200 flex flex-col">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-base font-bold">Código SQL Supabase - Linhas Comerciais</h3>
                  <p className="text-xs text-stone-400">Copie e cole no SQL Editor do seu Painel Supabase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-stone-950 font-mono text-xs text-stone-300">
              <pre className="whitespace-pre-wrap">{sqlSnippet}</pre>
            </div>

            <div className="px-6 py-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Tabela: <strong className="text-stone-800">public.commercial_lines</strong>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-900 hover:bg-rose-800 shadow-md flex items-center gap-1.5"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedSql ? 'Copiado!' : 'Copiar Código SQL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
