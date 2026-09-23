import { useState } from 'react';
import { 
  Instagram, 
  Gift, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight,
  Heart,
  QrCode
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { buildInstagramLink } from '../utils/validators';

interface InstagramPromoSectionProps {
  settings: BusinessSettings;
  onScrollToForm: () => void;
  onOpenModal?: () => void;
}

export function InstagramPromoSection({ 
  settings, 
  onScrollToForm,
  onOpenModal 
}: InstagramPromoSectionProps) {
  const [copied, setCopied] = useState(false);
  const instagramUrl = buildInstagramLink(settings.instagramHandle || '@romanceitapema');
  const handleClean = (settings.instagramHandle || '@romanceitapema').replace('@', '');

  const handleCopyHandle = () => {
    navigator.clipboard.writeText(`@${handleClean}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="promocao-instagram" className="py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Banner Card */}
        <div className="relative bg-gradient-to-r from-rose-950 via-rose-900 to-stone-900 rounded-3xl p-6 sm:p-10 lg:p-12 text-white border border-white/20 shadow-2xl overflow-hidden">
          
          {/* Ambient Lighting & Glows */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-purple-600/30 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-5 text-left">
              
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-purple-500/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-rose-200">
                <Gift className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Bônus Exclusivo de Boas-Vindas</span>
              </div>

              <div className="space-y-3">
                <h2 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Cadastre-se e siga <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-200 font-extrabold">@{handleClean}</span> no Instagram para ganhar um brinde especial!
                </h2>
                <p className="text-sm sm:text-base text-rose-100/90 max-w-2xl leading-relaxed">
                  Queremos comemorar sua entrada na equipe Romance Itapema! Complete seu pré-cadastro gratuito de lingerie sem investimento e siga nossa página oficial no Instagram para retirar um mimo exclusivo na entrega do seu mostruário.
                </p>
              </div>

              {/* 3 Quick Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-600/80 text-white flex items-center justify-center font-black text-xs shrink-0">
                    1
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">Faça o Cadastro</p>
                    <p className="text-rose-200 text-[11px]">100% sem investimento</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">Siga @{handleClean}</p>
                    <p className="text-rose-200 text-[11px]">No Instagram oficial</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/80 text-white flex items-center justify-center font-black text-xs shrink-0">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-white">Ganhe o Brinde</p>
                    <p className="text-rose-200 text-[11px]">Junto com o mostruário</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-amber-500 via-rose-600 to-purple-700 hover:opacity-95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-rose-600/30 flex items-center gap-2.5 transition-transform hover:scale-[1.02] border border-white/20"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Seguir @{handleClean} no Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                </a>

                <button
                  onClick={onScrollToForm}
                  className="bg-white/90 hover:bg-white text-stone-900 font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Preencher Pré-Cadastro</span>
                  <ArrowRight className="w-4 h-4 text-rose-600" />
                </button>
              </div>

            </div>

            {/* Right Interactive Instagram QR Card */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 text-stone-900 shadow-2xl border border-white/90 max-w-xs w-full text-center space-y-4">
                
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-700 p-0.5 flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-xs text-stone-800">Instagram Oficial</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                    🎁 Brinde
                  </span>
                </div>

                {/* QR Visual */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-xl shadow-inner border border-stone-200/90 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-700 p-1 flex items-center justify-center shadow-md">
                      <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                        <Instagram className="w-10 h-10 text-rose-600" />
                      </div>
                    </div>
                    <p className="text-[9px] font-black tracking-widest text-stone-800 uppercase mt-2">
                      {handleClean.toUpperCase()}
                    </p>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Aponte a câmera ou clique no botão abaixo para seguir
                  </p>
                </div>

                {/* Handle & Copy */}
                <div className="flex items-center justify-center gap-2">
                  <span className="font-bold text-stone-900 text-sm">
                    @{handleClean}
                  </span>
                  <button
                    onClick={handleCopyHandle}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    title="Copiar usuário"
                  >
                    {copied ? (
                      <span className="text-emerald-600 text-[11px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Copiado!
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-stone-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Acessar Perfil Agora</span>
                </a>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
