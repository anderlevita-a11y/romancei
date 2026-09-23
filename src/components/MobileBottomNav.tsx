import { 
  Sparkles, 
  Calculator, 
  Film, 
  Search, 
  MessageCircle,
  Camera,
  Gift,
  Share2
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { buildWhatsAppLink } from '../utils/validators';

interface MobileBottomNavProps {
  settings: BusinessSettings;
  onScrollToForm: () => void;
  onOpenSearch: () => void;
  onOpenReferralModal?: () => void;
  onOpenShare?: () => void;
}

export function MobileBottomNav({
  settings,
  onScrollToForm,
  onOpenSearch,
  onOpenReferralModal,
  onOpenShare,
}: MobileBottomNavProps) {
  const whatsappUrl = buildWhatsAppLink(
    settings.officialWhatsApp || '5547997626121',
    `Olá ${settings.distributorName || 'Anderson'}! Gostaria de tirar dúvidas sobre a revenda sem investimento da Romance Itapema.`
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav 
      aria-label="Navegação Rápida Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-stone-200/90 shadow-2xl px-2 py-1.5 safe-area-pb"
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        
        {/* Button 1: Galeria de Fotos */}
        <button
          type="button"
          onClick={() => scrollToSection('galeria-fotos')}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-stone-600 hover:text-stone-900 active:bg-stone-100 transition-all flex-1 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-stone-600" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Fotos</span>
        </button>

        {/* Button 2: Indique & Ganhe (R$ 10) */}
        {onOpenReferralModal ? (
          <button
            type="button"
            onClick={onOpenReferralModal}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl text-amber-800 hover:text-amber-950 active:bg-amber-100/60 transition-all flex-1 cursor-pointer"
            title="Indique e Ganhe R$ 10,00 por kit entregue"
          >
            <div className="relative">
              <Gift className="w-4 h-4 text-amber-600 animate-bounce" />
              <span className="absolute -top-1 -right-2.5 text-[8px] bg-amber-500 text-stone-950 font-black px-1 py-0.2 rounded-full leading-none shadow-2xs">
                R$10
              </span>
            </div>
            <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap text-amber-900">Indique</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => scrollToSection('sessao-videos')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl text-stone-600 hover:text-stone-900 active:bg-stone-100 transition-all flex-1 cursor-pointer"
          >
            <Film className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Vídeos</span>
          </button>
        )}

        {/* Button 3: Main CTA (Quero Revender) Highlighted */}
        <button
          type="button"
          onClick={onScrollToForm}
          className="flex flex-col items-center justify-center -mt-3.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white shadow-lg shadow-rose-600/40 border border-white/20 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-tight mt-0.5 whitespace-nowrap">
            Quero Revender
          </span>
        </button>

        {/* Button 4: Simulador de Lucro */}
        <button
          type="button"
          onClick={() => scrollToSection('simulador-lucro')}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-stone-600 hover:text-stone-900 active:bg-stone-100 transition-all flex-1 cursor-pointer"
        >
          <Calculator className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Simulador</span>
        </button>

        {/* Button 5: WhatsApp Dúvidas */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-emerald-600 hover:text-emerald-700 active:bg-emerald-50 transition-all flex-1 cursor-pointer"
          title="Falar no WhatsApp"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">WhatsApp</span>
        </a>

      </div>
    </nav>
  );
}
