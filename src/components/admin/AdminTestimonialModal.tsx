import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Sparkles, 
  ShieldCheck, 
  Upload, 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Camera,
  Trash2
} from 'lucide-react';
import { TestimonialItem, TestimonialStatus } from '../../types';
import { formatPhone } from '../../utils/validators';

interface AdminTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (testimonial: TestimonialItem) => void;
  onDelete?: (id: string) => void;
  initialData?: TestimonialItem | null;
}

export function AdminTestimonialModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}: AdminTestimonialModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('Revendedora Sem Investimento');
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState('');
  const [profit, setProfit] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<TestimonialStatus>('approved');
  const [featured, setFeatured] = useState(false);
  const [verified, setVerified] = useState(true);
  const [source, setSource] = useState<'form' | 'admin' | 'google' | 'whatsapp'>('admin');
  const [notes, setNotes] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPhone(initialData.phone || '');
      setCity(initialData.city || '');
      setRole(initialData.role || 'Revendedora Sem Investimento');
      setRating(initialData.rating || 5);
      setQuote(initialData.quote || '');
      setProfit(initialData.profit || '');
      setAvatarUrl(initialData.avatarUrl || '');
      setStatus(initialData.status || 'approved');
      setFeatured(!!initialData.featured);
      setVerified(initialData.verified !== false);
      setSource(initialData.source || 'admin');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setPhone('');
      setCity('');
      setRole('Revendedora Sem Investimento');
      setRating(5);
      setQuote('');
      setProfit('');
      setAvatarUrl('');
      setStatus('approved');
      setFeatured(false);
      setVerified(true);
      setSource('admin');
      setNotes('');
    }
    setIsConfirmingDelete(false);
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Imagem muito pesada (máx 3MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Informe o nome da revendedora.');
      return;
    }

    if (!city.trim()) {
      setErrorMessage('Informe a cidade da revendedora.');
      return;
    }

    if (!quote.trim()) {
      setErrorMessage('Informe o texto do depoimento.');
      return;
    }

    const testimonialItem: TestimonialItem = {
      id: initialData?.id || `testim-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      city: city.trim(),
      role: role.trim() || 'Revendedora',
      quote: quote.trim(),
      rating,
      avatarUrl: avatarUrl.trim() || undefined,
      profit: profit.trim() || undefined,
      status,
      featured,
      verified,
      source,
      notes: notes.trim() || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      approvedAt: status === 'approved' ? (initialData?.approvedAt || new Date().toISOString()) : undefined,
      approvedBy: status === 'approved' ? 'Anderson Rodrigues (Distribuidor)' : undefined,
    };

    onSave(testimonialItem);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-stone-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-800 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-rose-300">
              Painel do Distribuidor
            </span>
            <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold">
              {initialData ? 'Editar Depoimento' : 'Novo Depoimento Verificado'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* Status & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Status de Moderação *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TestimonialStatus)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden bg-white font-bold"
              >
                <option value="approved" className="text-emerald-700 font-bold">✅ Aprovado (Visível no Site)</option>
                <option value="pending" className="text-amber-700 font-bold">⏳ Pendente (Aguardando Aprovação)</option>
                <option value="rejected" className="text-rose-700 font-bold">❌ Rejeitado (Oculto)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Origem do Depoimento
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden bg-white"
              >
                <option value="admin">Cadastro Manual (Distribuidor)</option>
                <option value="google">Avaliação do Google Maps</option>
                <option value="whatsapp">Relato no WhatsApp</option>
                <option value="form">Formulário Público do Site</option>
              </select>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <span className="text-xs font-bold text-stone-700">Nota da Avaliação:</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      rating >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-300 fill-stone-100'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-rose-600" />
                Nome da Revendedora / Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Patrícia Mendes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-rose-600" />
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                placeholder="(47) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden bg-white"
              />
            </div>
          </div>

          {/* City & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                Cidade / Bairro *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Sua Cidade - Bairro"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-rose-600" />
                Título / Relação
              </label>
              <input
                type="text"
                placeholder="Ex: Revendedora Sem Investimento"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Quote */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Depoimento / Relato *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Digite o depoimento da revendedora..."
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden bg-white resize-none"
            />
          </div>

          {/* Profit & Avatar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Destaque de Renda (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Lucro de 40% / Sem risco"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-rose-600" />
                Foto da Revendedora (Opcional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-stone-300 hover:border-rose-500 bg-stone-50 cursor-pointer text-stone-600 text-xs font-medium">
                  <Upload className="w-3.5 h-3.5 text-rose-600" />
                  <span>{avatarUrl ? 'Alterar Foto' : 'Carregar Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {avatarUrl && (
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border border-rose-300 shrink-0">
                    <img src={avatarUrl} alt="Prévia da foto da revendedora" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checkboxes: Verified and Featured */}
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Exibir Selo de "Depoimento Verificado"
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                Marcar como Destaque na Página
              </span>
            </label>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Observações Internas (Uso Exclusivo do Distribuidor)
            </label>
            <input
              type="text"
              placeholder="Ex: Revendedora confirmou histórico de 3 sacolas quitadas com sucesso."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 focus:border-rose-600 outline-hidden bg-white text-stone-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              {initialData && onDelete && (
                !isConfirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Depoimento</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-rose-100/90 border border-rose-300 p-1.5 rounded-xl">
                    <span className="text-[11px] font-bold text-rose-900 px-1">
                      Confirmar exclusão?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(initialData.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Sim, Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 font-medium text-xs border border-stone-300 transition-colors cursor-pointer"
                    >
                      Não
                    </button>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                Salvar Depoimento
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
