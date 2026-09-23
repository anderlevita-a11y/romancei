import { useState } from 'react';
import { 
  Gift, 
  Sparkles, 
  MessageCircle, 
  Copy, 
  Check, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Award,
  Coins,
  QrCode
} from 'lucide-react';
import { BusinessSettings } from '../types';

interface SharePromoSectionProps {
  settings: BusinessSettings;
  onOpenReferralModal?: () => void;
  onOpenShareModal?: () => void;
}

export function SharePromoSection({
  settings,
  onOpenReferralModal,
  onOpenShareModal,
}: SharePromoSectionProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://romanceitapema.com.br';

  const shareUrl = `${baseUrl}/#cadastro`;
  const shareMessage = `Oi amiga! Conheça a Romance Itapema: revenda lingeries de alta qualidade sem investimento inicial! Ganhe até 40% de lucro líquido, receba a maleta sem pagar nada e devolva o que não vender após 40 dias. Faça seu pré-cadastro gratuito aqui: ${shareUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

  const handleOpenMain = () => {
    if (onOpenReferralModal) {
      onOpenReferralModal();
    } else if (onOpenShareModal) {
      onOpenShareModal();
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section id="indique-ganhe" className="py-8 sm:py-12 lg:py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Main Banner Card */}
        <div className="relative bg-gradient-to-br from-rose-950 via-stone-900 to-rose-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 text-white border border-amber-400/20 shadow-2xl overflow-hidden">
          
          {/* Ambient Lighting Background */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/20 via-rose-500/30 to-purple-600/30 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 -mb-20 w-72 h-72 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
            
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-5 text-left">
              
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-purple-500/30 backdrop-blur-md px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-amber-300/30 text-[11px] sm:text-xs font-bold text-amber-200">
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse shrink-0" />
                <span className="truncate">Programa Oficial • Indique & Ganhe Romance</span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <h2 className="font-serif-luxury text-xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Indique amigas e ganhe <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-amber-200 font-extrabold">R$ 10,00 por kit entregue!</span>
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-rose-100/90 max-w-2xl leading-relaxed">
                  Conhece amigas, familiares ou vizinhas que desejam ter uma renda extra sem gastar nada? Gere seu cupom exclusivo de indicação da <strong>Romance Itapema</strong> e receba R$ 10,00 via Pix a cada maleta aprovada e entregue!
                </p>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <div className="bg-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="text-xs min-w-0">
                    <p className="font-bold text-white">Gere Seu Cupom</p>
                    <p className="text-amber-100/80 text-[10px] sm:text-[11px]">Vinculado ao seu CPF</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="text-xs min-w-0">
                    <p className="font-bold text-white">Amiga se Cadastra</p>
                    <p className="text-rose-200 text-[10px] sm:text-[11px]">Informa seu código no form</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500 text-stone-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="text-xs min-w-0">
                    <p className="font-bold text-white">Receba R$ 10 Pix</p>
                    <p className="text-emerald-200 text-[10px] sm:text-[11px]">Na entrega do mostruário</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2 sm:pt-3">
                <button
                  type="button"
                  onClick={handleOpenMain}
                  className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 text-stone-950 font-black text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-stone-950 shrink-0" />
                  <span>Gerar Meu Cupom / Ver Créditos</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                  <span>Convidar no WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-white/15 hover:bg-white/25 active:bg-white/35 text-white font-semibold text-xs sm:text-sm px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-white/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-200 shrink-0" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Right Card / Incentive Badge */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <div className="bg-white/10 backdrop-blur-xl border border-amber-300/30 p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-center space-y-3.5 sm:space-y-4 max-w-sm w-full shadow-2xl relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg">
                  <Coins className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-pulse" />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-stone-950 bg-amber-400 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                    R$ 10,00 por Indicação
                  </span>
                  <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-white">
                    Indique & Ganhe
                  </h3>
                  <p className="text-[11px] sm:text-xs text-rose-100/80">
                    Acompanhe em tempo real quais amigas foram aprovadas e receba o valor acumulado via Pix!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenMain}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs py-3 px-4 rounded-xl shadow-md transition-all transform hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-stone-950 shrink-0" />
                  <span>Acessar Meu Painel de Indicação</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
