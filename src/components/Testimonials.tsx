import React, { useState } from 'react';
import { 
  Star, 
  Quote, 
  MapPin, 
  CheckCircle, 
  Sparkles, 
  ExternalLink, 
  MessageSquareHeart, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import { initialTestimonials } from '../data/initialData';
import { BusinessSettings, TestimonialItem } from '../types';
import { SubmitTestimonialModal } from './SubmitTestimonialModal';

interface TestimonialsProps {
  settings?: BusinessSettings;
  testimonialsList?: TestimonialItem[];
  onSubmitTestimonial?: (testimonial: Omit<TestimonialItem, 'id' | 'status' | 'createdAt'>) => Promise<boolean> | boolean;
}

export function Testimonials({ 
  settings, 
  testimonialsList = initialTestimonials, 
  onSubmitTestimonial 
}: TestimonialsProps) {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Exibir apenas depoimentos com status 'approved' (ou sem status definido)
  const approvedTestimonials = (testimonialsList || []).filter(
    (t) => !t.status || t.status === 'approved'
  );

  const googleMapsUrl = settings?.googleReviewsUrl?.trim() || '';
  const isExternalGoogleLink = googleMapsUrl.startsWith('http');

  // Helper para gerar as iniciais do nome
  const getInitials = (name: string) => {
    if (!name) return 'RM';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Cores dinâmicas elegantes para os avatares com monograma
  const avatarGradients = [
    'from-rose-600 to-rose-800 text-white',
    'from-stone-800 to-stone-900 text-white',
    'from-amber-600 to-amber-800 text-white',
    'from-purple-700 to-stone-900 text-white',
    'from-rose-500 to-pink-700 text-white',
  ];

  return (
    <section id="depoimentos" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-md text-stone-800 text-xs font-bold px-4 py-1.5 rounded-full border border-stone-200 shadow-xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold">Depoimentos Reais & Avaliações Verificadas</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
            Histórias Reais de Mulheres que Conquistaram sua Renda Extra
          </h2>
          <p className="text-stone-600 text-base sm:text-lg">
            Relatos autênticos de quem já revende com zero investimento e acertos a cada 40 dias na Distribuição Oficial Romance.
          </p>

          {/* Google Rating Counter Badge & Share Button */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {isExternalGoogleLink ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-white/90 hover:bg-white px-4 py-2 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-stone-900">5.0 no Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-rose-700" />
              </a>
            ) : (
              <div className="inline-flex items-center gap-2.5 bg-white/90 px-4 py-2 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-stone-900">Avaliação 5 Estrelas</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-xs hover:shadow-md transition-all hover:scale-105"
            >
              <MessageSquareHeart className="w-3.5 h-3.5 text-rose-200" />
              <span>Deixar Meu Depoimento</span>
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        {approvedTestimonials.length === 0 ? (
          <div className="text-center py-12 bg-white/60 rounded-3xl border border-stone-200 p-8 max-w-lg mx-auto space-y-4">
            <UserCheck className="w-12 h-12 text-rose-600 mx-auto" />
            <h3 className="font-serif-luxury text-xl font-bold text-stone-900">
              Seja a Primeira a Compartilhar!
            </h3>
            <p className="text-sm text-stone-600">
              Você já é revendedora ou cliente da Romance? Compartilhe sua experiência e ajude outras mulheres.
            </p>
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm"
            >
              Enviar Meu Relato
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {approvedTestimonials.map((t, idx) => {
              const ratingCount = Math.min(5, Math.max(1, t.rating || 5));
              const gradientClass = avatarGradients[idx % avatarGradients.length];

              return (
                <div
                  key={t.id || idx}
                  className="bg-white/80 backdrop-blur-lg hover:bg-white/95 rounded-3xl p-7 border border-white/80 hover:border-rose-300/80 shadow-lg shadow-rose-950/5 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6 relative group"
                >
                  <div className="space-y-4">
                    {/* Rating & Location */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-amber-500">
                          {[...Array(ratingCount)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        {t.verified && (
                          <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verificado
                          </span>
                        )}
                      </div>

                      {t.profit && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg shadow-xs truncate max-w-[140px]">
                          {t.profit}
                        </span>
                      )}
                    </div>

                    {/* Quote Text */}
                    <p className="text-stone-700 text-sm leading-relaxed italic">
                      "{t.quote}"
                    </p>
                  </div>

                  {/* Author Profile */}
                  <div className="pt-4 border-t border-stone-100/80 flex items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {t.avatarUrl ? (
                        <img
                          src={t.avatarUrl}
                          alt={t.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-xs shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Fallback caso a imagem dê erro
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-xs shrink-0 tracking-wider`}>
                          {getInitials(t.name)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 truncate">
                          <span>{t.name}</span>
                        </h4>
                        <p className="text-xs text-rose-700 font-medium flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{t.city}</span>
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                          {t.role || 'Revendedora Romance'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all hover:scale-[1.02]"
          >
            <MessageSquareHeart className="w-4 h-4 text-rose-300" />
            <span>Compartilhar Meu Depoimento</span>
          </button>

          {isExternalGoogleLink && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl border border-stone-200 shadow-sm transition-all hover:scale-[1.02]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Ver Avaliações no Google Maps</span>
              <ExternalLink className="w-4 h-4 ml-0.5 text-stone-400" />
            </a>
          )}
        </div>

      </div>

      {/* Submission Modal */}
      <SubmitTestimonialModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={async (newTestimonial) => {
          if (onSubmitTestimonial) {
            return await onSubmitTestimonial(newTestimonial);
          }
          return true;
        }}
      />
    </section>
  );
}


