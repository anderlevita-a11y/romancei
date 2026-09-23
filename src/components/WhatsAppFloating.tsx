import { MessageCircle } from 'lucide-react';
import { BusinessSettings } from '../types';
import { buildWhatsAppLink } from '../utils/validators';

interface WhatsAppFloatingProps {
  settings: BusinessSettings;
}

export function WhatsAppFloating({ settings }: WhatsAppFloatingProps) {
  const link = buildWhatsAppLink(
    settings.officialWhatsApp || '5547997626121',
    `Olá ${settings.distributorName || 'Anderson'}! Tenho interesse em ser revendedora de lingerie sem investimento com a Distribuição Romance Itapema.`
  );

  return (
    <div className="fixed bottom-16 right-3.5 md:bottom-6 md:right-6 z-40 flex items-center gap-3">
      {/* Speech tooltip on desktop */}
      <div className="hidden md:flex items-center bg-white/85 backdrop-blur-md text-stone-800 text-xs font-semibold py-2 px-3.5 rounded-2xl shadow-xl border border-white/90 animate-bounce duration-1000">
        <span>Tire dúvidas no WhatsApp!</span>
      </div>

      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/30 transition-all duration-300 group hover:rotate-6"
      >
        <MessageCircle className="w-7 h-7 fill-current" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full border-2 border-white animate-ping" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full border-2 border-white" />
      </a>
    </div>
  );
}
