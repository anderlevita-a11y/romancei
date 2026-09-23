import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Sparkles, 
  Heart, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  Camera, 
  MapPin, 
  Phone, 
  User, 
  DollarSign, 
  Briefcase 
} from 'lucide-react';
import { TestimonialItem } from '../types';
import { formatPhone } from '../utils/validators';

interface SubmitTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (testimonial: Omit<TestimonialItem, 'id' | 'status' | 'createdAt'>) => Promise<boolean> | boolean;
}

export function SubmitTestimonialModal({
  isOpen,
  onClose,
  onSubmit,
}: SubmitTestimonialModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('Revendedora Sem Investimento');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [quote, setQuote] = useState('');
  const [profit, setProfit] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('A imagem selecionada é muito pesada (máx 3MB). Por favor escolha outra foto.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarPreview(result);
      setAvatarUrl(result);
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor, informe o seu nome completo.');
      return;
    }

    if (!city.trim()) {
      setErrorMessage('Por favor, informe a sua cidade e bairro.');
      return;
    }

    if (!quote.trim() || quote.trim().length < 15) {
      setErrorMessage('Por favor, escreva um depoimento com pelo menos 15 caracteres contando sua experiência.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        name: name.trim(),
        phone: phone.trim() || undefined,
        city: city.trim(),
        role: role.trim() || 'Revendedora',
        quote: quote.trim(),
        rating,
        avatarUrl: avatarUrl.trim() || undefined,
        profit: profit.trim() || undefined,
        featured: false,
        verified: false,
        source: 'form',
      });

      if (result !== false) {
        setIsSubmitted(true);
      } else {
        setErrorMessage('Não foi possível enviar no momento. Tente novamente em instantes.');
      }
    } catch (err) {
      console.error('Erro ao enviar depoimento:', err);
      setErrorMessage('Ocorreu um erro ao enviar. Por favor, verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setName('');
    setPhone('');
    setCity('');
    setRole('Revendedora Sem Investimento');
    setRating(5);
    setQuote('');
    setProfit('');
    setAvatarUrl('');
    setAvatarPreview(null);
    setIsSubmitted(false);
    setErrorMessage('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-stone-950/70 backdrop-blur-md animate-fade-in"
      onClick={handleResetAndClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden text-stone-800 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-stone-900 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-rose-200 shadow-inner">
              <Heart className="w-5 h-5 fill-rose-300 text-rose-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-rose-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Comunidade Romance Itapema
              </span>
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white">
                Compartilhe sua Experiência
              </h3>
            </div>
          </div>
          <p className="text-rose-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
            Seu depoimento inspira outras mulheres a conquistarem sua independência financeira com zero investimento.
          </p>
        </div>

        {isSubmitted ? (
          /* Success Screen */
          <div className="p-6 sm:p-8 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h4 className="font-serif-luxury text-2xl font-bold text-stone-900">
                Depoimento Enviado com Sucesso!
              </h4>
              <p className="text-sm text-stone-600 leading-relaxed">
                Muito obrigada pelo seu carinho, <span className="font-bold text-stone-900">{name}</span>!
              </p>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-left flex items-start gap-3 max-w-md mx-auto">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block text-amber-950 mb-0.5">Moderação de Transparência & Autenticidade:</span>
                Para garantir que todas as avaliações no site sejam 100% de revendedoras e clientes reais, seu depoimento passará por uma breve aprovação do Distribuidor Oficial antes de ser publicado na página inicial.
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-md transition-all hover:scale-105"
              >
                Concluir & Voltar ao Site
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Rating Stars Selection */}
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-center space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Sua Nota de Avaliação
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1.5 transition-transform hover:scale-125 focus:outline-hidden"
                      title={`${star} de 5 estrelas`}
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-300 fill-stone-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-stone-500">
                {rating === 5 && '🌟 Excelente! Experiência Incrível'}
                {rating === 4 && '✨ Muito Bom! Super Recomendo'}
                {rating === 3 && '👍 Bom!'}
                {rating === 2 && '😐 Regular'}
                {rating === 1 && '👎 Precisa Melhorar'}
              </span>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-rose-600" />
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Patrícia Mendes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-rose-600" />
                  WhatsApp / Telefone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(47) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden transition-all bg-white"
                />
                <span className="text-[10px] text-stone-400">
                  Uso interno do distribuidor para verificação
                </span>
              </div>
            </div>

            {/* City & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  Cidade e Bairro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sua Cidade - Bairro"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-rose-600" />
                  Sua Relação com a Romance
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden transition-all bg-white text-stone-800"
                >
                  <option value="Revendedora Sem Investimento">Revendedora Sem Investimento (Consignado)</option>
                  <option value="Revendedora Diamante (Favorita 40%)">Revendedora Diamante (Favorita 40%)</option>
                  <option value="Revendedora Iniciante">Revendedora Iniciante (1º Ciclo)</option>
                  <option value="Revendedora há mais de 1 ano">Revendedora há mais de 1 ano</option>
                  <option value="Cliente / Consumidora Fiel">Cliente / Consumidora Fiel</option>
                </select>
              </div>
            </div>

            {/* Quote Text */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Seu Depoimento e Experiência *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Conte como foi sua experiência com os produtos Romance, o atendimento da distribuição, os lucros e a facilidade de vender sem gastar nada..."
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden transition-all bg-white resize-none"
              />
            </div>

            {/* Profit / Renda extra & Photo Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Ganhos / Destaque de Renda (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Renda extra sem risco / Lucro de 40%"
                  value={profit}
                  onChange={(e) => setProfit(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 outline-hidden transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-rose-600" />
                  Sua Foto Real (Opcional)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-stone-300 hover:border-rose-500 bg-stone-50 hover:bg-rose-50/50 cursor-pointer transition-colors text-stone-600 text-xs font-medium">
                    <Upload className="w-3.5 h-3.5 text-rose-600" />
                    <span>{avatarPreview ? 'Trocar Foto' : 'Escolher do Celular'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {avatarPreview && (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-rose-300 ring-2 ring-rose-100 shrink-0">
                      <img
                        src={avatarPreview}
                        alt="Prévia da foto de perfil da revendedora"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Disclaimer */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-[11px] text-stone-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Seu número de telefone não será exibido publicamente. Ele serve apenas para o Distribuidor verificar a autenticidade do seu relato.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Enviar Depoimento para Moderação</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
