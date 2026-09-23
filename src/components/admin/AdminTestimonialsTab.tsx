import React, { useState } from 'react';
import { 
  MessageSquareHeart, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  MapPin, 
  User, 
  DollarSign, 
  ExternalLink,
  MessageCircle,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { TestimonialItem, TestimonialStatus, BusinessSettings } from '../../types';

interface AdminTestimonialsTabProps {
  testimonials: TestimonialItem[];
  settings: BusinessSettings;
  onOpenNewTestimonialModal: () => void;
  onOpenEditTestimonialModal: (item: TestimonialItem) => void;
  onUpdateStatus: (testimonialId: string, status: TestimonialStatus) => void;
  onToggleFeatured: (testimonial: TestimonialItem) => void;
  onToggleVerified: (testimonial: TestimonialItem) => void;
  onDeleteTestimonial: (testimonialId: string) => void;
}

export function AdminTestimonialsTab({
  testimonials = [],
  settings,
  onOpenNewTestimonialModal,
  onOpenEditTestimonialModal,
  onUpdateStatus,
  onToggleFeatured,
  onToggleVerified,
  onDeleteTestimonial,
}: AdminTestimonialsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TestimonialStatus>('all');
  const [testimonialToDelete, setTestimonialToDelete] = useState<TestimonialItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleConfirmDelete = () => {
    if (testimonialToDelete) {
      const deletedName = testimonialToDelete.name || 'Depoimento';
      onDeleteTestimonial(testimonialToDelete.id);
      setTestimonialToDelete(null);
      showToast(`Depoimento de "${deletedName}" foi excluído com sucesso!`);
    }
  };

  // Contadores
  const pendingCount = testimonials.filter((t) => t.status === 'pending').length;
  const approvedCount = testimonials.filter((t) => t.status === 'approved' || !t.status).length;
  const rejectedCount = testimonials.filter((t) => t.status === 'rejected').length;
  const totalCount = testimonials.length;

  // Média de estrelas dos aprovados
  const approvedItems = testimonials.filter((t) => t.status === 'approved' || !t.status);
  const averageRating = approvedItems.length > 0
    ? (approvedItems.reduce((acc, curr) => acc + (curr.rating || 5), 0) / approvedItems.length).toFixed(1)
    : '5.0';

  // Filtragem
  const filteredTestimonials = testimonials.filter((item) => {
    // Status
    if (statusFilter !== 'all') {
      const itemStatus = item.status || 'approved';
      if (itemStatus !== statusFilter) return false;
    }

    // Busca textual
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(term);
      const matchCity = item.city?.toLowerCase().includes(term);
      const matchQuote = item.quote?.toLowerCase().includes(term);
      const matchPhone = item.phone?.toLowerCase().includes(term);
      const matchRole = item.role?.toLowerCase().includes(term);
      return matchName || matchCity || matchQuote || matchPhone || matchRole;
    }

    return true;
  });

  const getInitials = (name: string) => {
    if (!name) return 'RM';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-1">
            <MessageSquareHeart className="w-4 h-4" />
            <span>Moderação & Prova Social</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 font-serif-luxury">
            Depoimentos & Avaliações Reais
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Gerencie e modere os depoimentos enviados pelas revendedoras antes de publicá-los no site.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenNewTestimonialModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Depoimento Manual</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Pendentes de Aprovação */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30'
              : 'bg-white/80 border-stone-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pendentes
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-900">
              {pendingCount}
            </span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full animate-pulse">
                Aprovação
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">Aguardando moderação</p>
        </div>

        {/* 2. Aprovados no Site */}
        <div 
          onClick={() => setStatusFilter('approved')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/30'
              : 'bg-white/80 border-stone-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Publicados
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">
              {approvedCount}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">Visíveis no frontend</p>
        </div>

        {/* 3. Média de Estrelas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Média Geral
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-stone-900">
              {averageRating}
            </span>
            <span className="text-xs text-stone-500 font-medium">/ 5.0</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Avaliações públicas</p>
        </div>

        {/* 4. Total Geral */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-rose-500/10 border-rose-400 ring-2 ring-rose-400/30'
              : 'bg-white/80 border-stone-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Total
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-stone-900">
              {totalCount}
            </span>
          </div>
          <p className="text-[11px] text-rose-700/80 mt-1">Cadastrados no sistema</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nome, cidade ou texto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:border-rose-500 focus:bg-white focus:outline-hidden transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todos ({totalCount})
          </button>
          
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendentes ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aprovados ({approvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejeitados ({rejectedCount})</span>
          </button>
        </div>
      </div>

      {/* Testimonials List */}
      {filteredTestimonials.length === 0 ? (
        <div className="bg-white/70 rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <MessageSquareHeart className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">
            Nenhum depoimento encontrado
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchTerm 
              ? 'Tente ajustar os termos de busca ou limpar o filtro atual.' 
              : 'Clique em "Novo Depoimento Manual" para registrar uma avaliação verificada.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredTestimonials.map((item) => {
            const isApproved = item.status === 'approved' || !item.status;
            const isPending = item.status === 'pending';
            const isRejected = item.status === 'rejected';

            // WhatsApp link for the consultant
            const cleanPhone = item.phone ? item.phone.replace(/\D/g, '') : '';
            const whatsAppUrl = cleanPhone 
              ? `https://wa.me/55${cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone}?text=${encodeURIComponent(`Olá ${item.name}! Aqui é da Distribuição Oficial Romance. Agradecemos muito pelo seu depoimento enviado em nosso site!`)}`
              : null;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isPending 
                    ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20' 
                    : isRejected
                    ? 'border-rose-200 opacity-70 bg-stone-50/60'
                    : 'border-stone-200 hover:border-rose-300'
                }`}
              >
                {/* Card Top: Badges and Ratings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold animate-pulse">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Aguardando Aprovação
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Aprovado no Site
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          <XCircle className="w-3 h-3 text-rose-700" />
                          Rejeitado
                        </span>
                      )}

                      {item.verified && (
                        <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          Verificado
                        </span>
                      )}

                      {item.featured && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <Sparkles className="w-3 h-3 text-rose-500" />
                          Destaque
                        </span>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                      {[...Array(Math.min(5, Math.max(1, item.rating || 5)))].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>

                  {/* Testimonial Quote */}
                  <blockquote className="text-stone-800 text-xs sm:text-sm leading-relaxed italic bg-stone-50/80 p-3.5 rounded-2xl border border-stone-100">
                    "{item.quote}"
                  </blockquote>

                  {/* Profit badge if present */}
                  {item.profit && (
                    <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.profit}</span>
                    </div>
                  )}
                </div>

                {/* Author Details & Actions */}
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-stone-100 shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-600 to-rose-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-stone-100 shrink-0">
                          {getInitials(item.name)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.source === 'google' && (
                            <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-bold border border-blue-200">
                              Google
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 truncate">
                          <span className="flex items-center gap-0.5 text-rose-700 font-medium">
                            <MapPin className="w-3 h-3" />
                            {item.city}
                          </span>
                          <span>•</span>
                          <span>{item.role || 'Revendedora'}</span>
                        </div>
                        {item.phone && (
                          <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                            Tel: {item.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp Action Button */}
                    {whatsAppUrl && (
                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0"
                        title="Enviar mensagem no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                    
                    {/* Primary Moderation Actions */}
                    <div className="flex items-center gap-1.5">
                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(item.id, 'approved')}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all"
                          title="Aprovar e Exibir no Site"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar & Publicar</span>
                        </button>
                      )}

                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(item.id, 'rejected')}
                          className="inline-flex items-center gap-1 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 transition-all"
                          title="Rejeitar Depoimento"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejeitar</span>
                        </button>
                      )}
                    </div>

                    {/* Secondary Toggles and Edit/Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleFeatured(item)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          item.featured 
                            ? 'bg-rose-100 text-rose-800 border-rose-300' 
                            : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                        }`}
                        title={item.featured ? 'Remover dos Destaques' : 'Destacar no Site'}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleVerified(item)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          item.verified 
                            ? 'bg-blue-100 text-blue-800 border-blue-300' 
                            : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                        }`}
                        title={item.verified ? 'Remover Selo Verificado' : 'Adicionar Selo Verificado'}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEditTestimonialModal(item)}
                        className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors"
                        title="Editar Depoimento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setTestimonialToDelete(item)}
                        className="p-1.5 rounded-lg bg-stone-50 hover:bg-rose-100 text-stone-400 hover:text-rose-700 border border-stone-200 hover:border-rose-300 transition-colors cursor-pointer"
                        title="Excluir Depoimento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Floating Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (100% iframe-safe, no window.confirm) */}
      {testimonialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-lg">
                  Excluir Depoimento?
                </h3>
                <p className="text-stone-500 text-xs">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 text-sm">
                  {testimonialToDelete.name}
                </span>
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: testimonialToDelete.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-stone-600 italic line-clamp-3">
                "{testimonialToDelete.quote}"
              </p>
              <div className="text-[11px] text-stone-400 flex items-center gap-2 pt-1 border-t border-stone-200/60">
                <span>{testimonialToDelete.city || 'Santa Catarina'}</span>
                <span>•</span>
                <span>{testimonialToDelete.role || 'Revendedora'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                O depoimento será removido permanentemente da base e deixará de aparecer para novos visitantes.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTestimonialToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
