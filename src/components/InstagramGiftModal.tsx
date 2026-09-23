import { useState } from 'react';
import { 
  Instagram, 
  Gift, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  X,
  Heart,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { buildInstagramLink } from '../utils/validators';

interface InstagramGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  onScrollToForm?: () => void;
}

export function InstagramGiftModal({ 
  isOpen, 
  onClose, 
  settings, 
  onScrollToForm 
}: InstagramGiftModalProps) {
  const [copied, setCopied] = useState(false);
  const instagramUrl = buildInstagramLink(settings.instagramHandle || '@romanceitapema');
  const handleClean = (settings.instagramHandle || '@romanceitapema').replace('@', '');

  const handleCopyHandle = () => {
    navigator.clipboard.writeText(`@${handleClean}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full shadow-2xl border border-white/80 overflow-hidden relative">
        
        {/* Header with vibrant Instagram-luxury gradient */}
        <div className="p-6 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-800 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg">
                <Gift className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full text-white tracking-widest mb-1 border border-white/20">
                  <Sparkles className="w-3 h-3" />
                  <span>Promoção Exclusiva</span>
                </div>
                <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold leading-tight">
                  Ganhe um Brinde Especial!
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-rose-100 mt-2 relative z-10">
            Cadastre-se na Romance Itapema e siga nossa página no Instagram para retirar seu brinde na entrega do mostruário.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-stone-700">
          
          {/* Step by Step Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
              Como garantir o seu brinde:
            </h4>
            
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                  1
                </div>
                <div className="text-xs text-stone-700">
                  <strong className="text-stone-900 block">Faça seu Pré-Cadastro</strong>
                  Preencha o formulário online gratuito para solicitar seu mostruário sem investimento.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-50/70 to-pink-50/70 border border-purple-100">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                  2
                </div>
                <div className="text-xs text-stone-700">
                  <strong className="text-stone-900 block">Siga o perfil @{handleClean}</strong>
                  Acompanhe lançamentos, dicas de vendas e novidades em primeira mão no nosso Instagram oficial.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                  3
                </div>
                <div className="text-xs text-stone-700">
                  <strong className="text-stone-900 block">Receba seu Brinde Exclusivo!</strong>
                  Ao receber ou retirar sua maleta sem investimento de lingeries, mostre que nos segue para receber seu mimo especial.
                </div>
              </div>
            </div>
          </div>

          {/* Instagram QR & Handle Card */}
          <div className="bg-gradient-to-b from-stone-50 to-rose-50/50 p-5 rounded-3xl border border-stone-200/80 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            
            {/* Visual QR Code Display */}
            <div className="relative group shrink-0">
              <div className="w-36 h-36 bg-white p-2.5 rounded-2xl shadow-lg border border-stone-200/90 flex flex-col items-center justify-between">
                <div className="w-full h-full relative flex flex-col items-center justify-center bg-radial from-rose-50 to-white rounded-xl overflow-hidden p-1">
                  {/* Decorative stylized Instagram QR visual */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-700 p-1 flex items-center justify-center shadow-md">
                    <div className="w-full h-full bg-white rounded-xl flex items-center justify-center p-2">
                      <Instagram className="w-10 h-10 text-rose-600" />
                    </div>
                  </div>
                  <span className="text-[9px] font-black tracking-widest text-stone-800 uppercase mt-1">
                    {handleClean.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions & Handle */}
            <div className="space-y-3 w-full">
              <div>
                <span className="text-[11px] text-stone-500 font-medium">Perfil Oficial no Instagram:</span>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                  <span className="text-lg font-bold text-stone-900 tracking-tight">
                    @{handleClean}
                  </span>
                  <button
                    onClick={handleCopyHandle}
                    className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-200/80 transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Copiar @ do Instagram"
                  >
                    {copied ? (
                      <span className="text-emerald-600 flex items-center gap-1 font-semibold text-[11px]">
                        <Check className="w-3.5 h-3.5" /> Copiado!
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-amber-500 via-rose-600 to-purple-700 hover:opacity-95 text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Seguir @{handleClean} no Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>

                {onScrollToForm && (
                  <button
                    onClick={() => {
                      onClose();
                      onScrollToForm();
                    }}
                    className="w-full bg-white hover:bg-stone-50 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Fazer meu Pré-Cadastro Agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Promoção válida para novas revendedoras com cadastro aprovado na Romance Itapema.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
