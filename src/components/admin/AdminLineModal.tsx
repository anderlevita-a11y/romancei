import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  Plus, 
  Layers, 
  DollarSign, 
  Tag, 
  Eye, 
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  AlertTriangle
} from 'lucide-react';
import { CommercialLine } from '../../types';

interface AdminLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (line: CommercialLine) => void;
  onDelete?: (lineId: string) => void;
  line: CommercialLine | null;
  totalLinesCount: number;
}

const ACCENT_COLOR_OPTIONS = [
  { id: 'rose', label: 'Rosa Romance', bg: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-400' },
  { id: 'pink', label: 'Pink Vibrante', bg: 'bg-pink-500', text: 'text-pink-600', ring: 'ring-pink-400' },
  { id: 'amber', label: 'Âmbar / Dourado', bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-400' },
  { id: 'emerald', label: 'Esmeralda / Favorita', bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-400' },
  { id: 'blue', label: 'Azul Conforto', bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-400' },
  { id: 'purple', label: 'Roxo Sensual', bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-400' },
  { id: 'violet', label: 'Violeta Nobre', bg: 'bg-violet-500', text: 'text-violet-600', ring: 'ring-violet-400' },
  { id: 'cyan', label: 'Turquesa', bg: 'bg-cyan-500', text: 'text-cyan-600', ring: 'ring-cyan-400' },
];

export function AdminLineModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  line,
  totalLinesCount,
}: AdminLineModalProps) {
  const [formData, setFormData] = useState<CommercialLine>({
    id: '',
    title: '',
    badge: '',
    tagline: '',
    items: [],
    profitHighlight: '',
    image: '',
    accentColor: 'rose',
    isFavorita: false,
    active: true,
    order: totalLinesCount + 1,
  });

  const [newItemText, setNewItemText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewTab, setPreviewTab] = useState<'form' | 'preview'>('form');

  useEffect(() => {
    if (line) {
      setFormData({
        id: line.id,
        title: line.title || '',
        badge: line.badge || '',
        tagline: line.tagline || '',
        items: Array.isArray(line.items) ? [...line.items] : [],
        profitHighlight: line.profitHighlight || '',
        image: line.image || '',
        accentColor: line.accentColor || 'rose',
        isFavorita: Boolean(line.isFavorita),
        active: line.active !== false,
        order: line.order ?? (totalLinesCount + 1),
        createdAt: line.createdAt,
      });
    } else {
      setFormData({
        id: `line-${Date.now().toString(36)}`,
        title: '',
        badge: 'Lançamento',
        tagline: '',
        items: ['Item 1 da linha', 'Item 2 de alta procura'],
        profitHighlight: 'Lucro de 30% a 40%',
        image: '',
        accentColor: 'rose',
        isFavorita: false,
        active: true,
        order: totalLinesCount + 1,
      });
    }
    setShowDeleteConfirm(false);
    setNewItemText('');
  }, [line, isOpen, totalLinesCount]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, trimmed]
    }));
    setNewItemText('');
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.items.length) return;
    
    const newItems = [...formData.items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor, informe o título da linha.');
      return;
    }
    onSave(formData);
  };

  const selectedColor = ACCENT_COLOR_OPTIONS.find(c => c.id === formData.accentColor) || ACCENT_COLOR_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="admin-line-modal-container"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-rose-100"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-900 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Layers className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {line ? 'Editar Linha Comercial' : 'Criar Nova Linha Comercial'}
                {formData.isFavorita && (
                  <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium">
                    Catálogo Favorita
                  </span>
                )}
              </h3>
              <p className="text-xs text-rose-200">
                Personalize fotos, produtos inclusos, destaques de lucro e visibilidade no site
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle (Mobile / Desktop) */}
            <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/20 mr-2">
              <button
                type="button"
                onClick={() => setPreviewTab('form')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  previewTab === 'form' ? 'bg-white text-rose-950 shadow' : 'text-rose-200 hover:text-white'
                }`}
              >
                Formulário
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('preview')}
                className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                  previewTab === 'preview' ? 'bg-white text-rose-950 shadow' : 'text-rose-200 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Prévia
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-stone-50/50">
          {previewTab === 'preview' ? (
            /* PREVIEW CARD */
            <div className="max-w-md mx-auto py-4">
              <div className="text-center mb-4">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Prévia em Tempo Real no Site
                </span>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-stone-200 transition-all hover:shadow-xl">
                <div className="relative h-64 overflow-hidden bg-stone-900">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt={formData.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // fallback se URL for inválida
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400 flex-col gap-2">
                      <ImageIcon className="w-10 h-10 text-stone-600" />
                      <span className="text-xs">Insira a URL da Foto</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  
                  <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                    {formData.badge && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${selectedColor.bg}`}>
                        {formData.badge}
                      </span>
                    )}
                    {formData.isFavorita && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-md">
                        Catálogo Favorita
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-2xl font-black">{formData.title || 'Título da Linha'}</h3>
                    <p className="text-xs text-stone-300 mt-1 line-clamp-2">{formData.tagline || 'Descrição/subtítulo da linha...'}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Itens Inclusos na Linha:
                    </h4>
                    <ul className="space-y-1.5">
                      {formData.items.map((item, idx) => (
                        <li key={idx} className="flex items-center text-xs font-medium text-stone-700">
                          <Check className="w-3.5 h-3.5 text-rose-500 mr-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                      {formData.items.length === 0 && (
                        <li className="text-xs text-stone-400 italic">Nenhum item adicionado ainda.</li>
                      )}
                    </ul>
                  </div>

                  {formData.profitHighlight && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-bold text-amber-900">{formData.profitHighlight}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-900 to-rose-950 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:from-rose-800 hover:to-rose-900 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Quero no Meu Mostruário
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* FORMULÁRIO COMPLETO */
            <form id="admin-line-edit-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Seção 1: Identificação Básica */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-rose-600" /> Identificação & Nomenclatura
                  </h4>
                  <span className="text-xs font-mono text-stone-400">ID: {formData.id}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Nome / Título da Linha *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Fitness, Seamless, Casual, Moda Íntima, Cosméticos, RMC Casa, Sex Shop..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Etiqueta / Badge de Destaque
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Ex: Alta Performance, Lingerie Nobre..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Subtítulo / Descrição Rápida
                  </label>
                  <textarea
                    rows={2}
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Ex: Moda fitness com tecnologia de compressão e zero transparência..."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Destaque de Lucro / Margem
                  </label>
                  <input
                    type="text"
                    value={formData.profitHighlight}
                    onChange={(e) => setFormData({ ...formData, profitHighlight: e.target.value })}
                    placeholder="Ex: Lucro de R$ 35 a R$ 70 por conjunto / Lucro de 30% a 40%"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Seção 2: Imagem & Cor de Destaque */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                  <ImageIcon className="w-4 h-4 text-rose-600" /> Foto da Linha & Cor de Destaque
                </h4>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    URL da Foto da Linha
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://... ou URL do Supabase Storage / Imagem local"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-mono text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Dica: Você pode usar URLs de imagens do Supabase Storage, links do Unsplash ou fotos do catálogo.
                  </p>
                </div>

                {formData.image && (
                  <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-stone-300 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-xs text-stone-600">
                      <p className="font-bold text-stone-900">Prévia da Foto</p>
                      <p className="text-[11px] text-stone-500">Imagem carregada e pronta para exibição no catálogo.</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">
                    Cor de Destaque do Selo
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ACCENT_COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, accentColor: color.id })}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                          formData.accentColor === color.id
                            ? 'border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-400 font-bold'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${color.bg}`} />
                        <span className="truncate">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seção 3: Itens Inclusos (Bullet points) */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-600" /> Produtos & Itens Inclusos
                    </h4>
                    <p className="text-xs text-stone-500">Tópicos que aparecem na lista de produtos desta linha comercial</p>
                  </div>
                  <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full font-bold text-stone-600">
                    {formData.items.length} {formData.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {/* Adicionar novo item */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    placeholder="Ex: Leggings Power Modeladoras..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!newItemText.trim()}
                    className="px-4 py-2 bg-rose-900 text-white rounded-xl text-xs font-bold hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>

                {/* Lista de itens com ordenação */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200 hover:border-stone-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Check className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="text-xs font-medium text-stone-800 truncate">{item}</span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded"
                          title="Subir"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === formData.items.length - 1}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded"
                          title="Descer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Excluir item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.items.length === 0 && (
                    <p className="text-xs text-center py-4 text-stone-400 italic">
                      Nenhum item cadastrado. Digite acima e clique em "Adicionar".
                    </p>
                  )}
                </div>
              </div>

              {/* Seção 4: Configurações & Visibilidade */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">
                  Visibilidade & Regras de Catálogo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Toggle Ativo */}
                  <label className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">Exibir no Site</span>
                      <span className="text-[11px] text-stone-500 block">Linha visível para os visitantes</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.active !== false}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 border-stone-300"
                    />
                  </label>

                  {/* Toggle Favorita */}
                  <label className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">Catálogo Favorita</span>
                      <span className="text-[11px] text-stone-500 block">Linha vinculada aos pedidos Favorita</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.isFavorita)}
                      onChange={(e) => setFormData({ ...formData, isFavorita: e.target.checked })}
                      className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                    />
                  </label>
                </div>
              </div>
            </form>
          )}

          {/* Inline Delete Confirmation dialog */}
          {showDeleteConfirm && (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-red-950 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-red-900">Tem certeza que deseja excluir esta linha comercial?</h5>
                  <p className="text-xs text-red-700 mt-1">
                    Esta ação removerá a linha <strong className="font-semibold">"{formData.title}"</strong> do catálogo do site e do Supabase.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-red-200">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete && formData.id) {
                      onDelete(formData.id);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Confirmar Exclusão
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-between">
          <div>
            {line && onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Excluir Linha
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-900 to-rose-950 text-white text-xs font-bold hover:from-rose-800 hover:to-rose-900 shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {line ? 'Salvar Alterações' : 'Criar Linha'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
