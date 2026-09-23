import { useState, useEffect } from 'react';
import { 
  Share2, 
  Gift, 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  MessageCircle, 
  Send, 
  Facebook, 
  Twitter, 
  QrCode, 
  Heart, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Users,
  Award,
  Download
} from 'lucide-react';
import { BusinessSettings } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  referralCode?: string;
  onScrollToForm?: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  settings,
  referralCode,
  onScrollToForm,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setHasNativeShare(true);
    }
  }, []);

  // Listen for ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Base URL
  const baseUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://romanceitapema.com.br';

  const shareUrl = customName.trim()
    ? `${baseUrl}/?ind=${encodeURIComponent(customName.trim())}#cadastro`
    : `${baseUrl}/#cadastro`;

  const shareTitle = 'Romance Itapema | Revenda de Lingerie Sem Investimento';
  
  const shareMessage = customName.trim()
    ? `Oi amiga! ${customName.trim()} te indicou uma oportunidade maravilhosa na Romance Itapema! Você recebe uma maleta completa com lingeries de luxo sem investimento inicial, lucra de 30% a 40% e paga só o que vender após 40 dias! Acesse o link para se cadastrar gratuitamente: ${shareUrl}`
    : `Oi amiga! Conheça a Romance Itapema: revenda lingeries de alta qualidade sem investimento inicial! Ganhe até 40% de lucro líquido, receba a maleta sem pagar nada e devolva o que não vender após 40 dias. Faça seu pré-cadastro gratuito aqui: ${shareUrl}`;

  // WhatsApp link
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

  // Telegram link
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`;

  // Facebook link
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  // Twitter/X link
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;

  // QR Code URL using high-reliability public API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=9f1239&bgcolor=ffffff&data=${encodeURIComponent(shareUrl)}`;

  const handleCopyLink = async () => {
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
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar link', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareMessage,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, silently ignore
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200/80 overflow-hidden relative text-left my-auto">
        
        {/* Header with vibrant luxury gradient */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 text-white relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-rose-500/30 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2 relative z-10 mb-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg shrink-0">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 bg-amber-400/25 backdrop-blur-md text-[9px] sm:text-[10px] uppercase font-black px-2 sm:px-2.5 py-0.5 rounded-full text-amber-200 tracking-wider mb-0.5 border border-amber-300/30 truncate max-w-full">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 shrink-0" />
                  <span>Programa de Indicação</span>
                </div>
                <h3 id="share-modal-title" className="font-serif-luxury text-lg sm:text-2xl font-bold leading-tight truncate">
                  Compartilhe & Ganhe!
                </h3>
              </div>
            </div>

            {/* Back / Close button at top */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/35 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
                title="Voltar / Fechar"
                aria-label="Voltar / Fechar Janela"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Voltar</span>
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 xs:hidden" />
              </button>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-rose-100 relative z-10 leading-relaxed">
            Indique amigas para revender lingeries sem investimento inicial na <strong>Romance Itapema</strong> e ganhe mimos e cupons extras para a campanha Estrelas Romance!
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-stone-700 max-h-[calc(85vh-130px)] overflow-y-auto">
          
          {/* How It Works 3-Step Banner */}
          <div className="bg-gradient-to-r from-rose-50/90 via-amber-50/70 to-rose-50/90 p-3 sm:p-4 rounded-2xl border border-rose-100/90">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5">
              <Users className="w-4 h-4 text-rose-700 shrink-0" />
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-950">
                Como Funciona o Compartilhe & Ganhe:
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-rose-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                <div className="min-w-0">
                  <p className="font-bold text-stone-900 text-xs">Envie o Link</p>
                  <p className="text-[10px] sm:text-[11px] text-stone-600">Compartilhe no WhatsApp ou redes</p>
                </div>
              </div>

              <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-rose-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                <div className="min-w-0">
                  <p className="font-bold text-stone-900 text-xs">Amiga Cadastra</p>
                  <p className="text-[10px] sm:text-[11px] text-stone-600">100% gratuito e sem investimento</p>
                </div>
              </div>

              <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-rose-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                <div className="min-w-0">
                  <p className="font-bold text-stone-900 text-xs">Vocês Ganham</p>
                  <p className="text-[10px] sm:text-[11px] text-stone-600">Brindes e cupons de sorteios</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personalize Share Message (Optional Name) */}
          <div className="space-y-1.5">
            <label htmlFor="custom-share-name" className="block text-xs font-bold text-stone-700">
              Personalizar Mensagem com seu Nome (Opcional):
            </label>
            <input
              id="custom-share-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex: Maria da Silva"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white placeholder-stone-400"
            />
            <p className="text-[10px] sm:text-[11px] text-stone-500">
              Seu nome aparecerá como indicação amiga no texto enviado.
            </p>
          </div>

          {/* Quick Share Buttons */}
          <div className="space-y-2.5 sm:space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
              Escolha por onde compartilhar:
            </h4>

            {/* Native Mobile Share Button (If supported) */}
            {hasNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold text-xs sm:text-sm py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Compartilhar no Celular (Qualquer App)</span>
              </button>
            )}

            {/* 1-Click Social Apps Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              
              {/* WhatsApp */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform mb-1">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                </div>
                <span className="text-xs font-bold">WhatsApp</span>
                <span className="text-[9px] sm:text-[10px] text-emerald-600">Direto / Grupos</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform mb-1">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs font-bold">Telegram</span>
                <span className="text-[9px] sm:text-[10px] text-sky-600">Mensagens</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform mb-1">
                  <Facebook className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                </div>
                <span className="text-xs font-bold">Facebook</span>
                <span className="text-[9px] sm:text-[10px] text-blue-600">Feed / Stories</span>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform mb-1">
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                </div>
                <span className="text-xs font-bold">X (Twitter)</span>
                <span className="text-[9px] sm:text-[10px] text-stone-600">Postagem</span>
              </a>

            </div>
          </div>

          {/* Copy Link Input Box */}
          <div className="space-y-1.5 sm:space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
              Copiar Link Direto da Página:
            </h4>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-stone-100 border border-stone-300 rounded-xl px-3 py-2.5 text-xs text-stone-700 font-mono select-all focus:outline-none focus:ring-1 focus:ring-rose-500 truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Section Toggle */}
          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 active:bg-stone-200 border border-stone-200 transition-colors text-xs font-bold text-stone-700 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Exibir QR Code para Apontar a Câmera</span>
              </div>
              <span className="text-rose-600 text-[11px] font-semibold underline shrink-0">
                {showQrCode ? 'Ocultar' : 'Mostrar QR'}
              </span>
            </button>

            {showQrCode && (
              <div className="mt-3 p-4 bg-stone-50/50 rounded-2xl border border-stone-200 text-center space-y-2.5 animate-in fade-in duration-200">
                <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto bg-white p-2 rounded-xl shadow-md border border-stone-200 flex items-center justify-center">
                  <img
                    src={qrCodeImageUrl}
                    alt="QR Code de Compartilhamento Romance Itapema"
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] sm:text-xs text-stone-600 max-w-xs mx-auto">
                  Aponte a câmera do celular para abrir a página de cadastro instantaneamente.
                </p>
              </div>
            )}
          </div>

          {/* Bonus Campaign Info Note */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
            <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs leading-relaxed">
              <strong>Dica de Ouro:</strong> Compartilhe no status do WhatsApp e Stories avisando que a <strong>Romance Itapema</strong> está liberando mostruários sem investimento. Quanto mais você indicar, mais prêmios acumula!
            </p>
          </div>

        </div>

        {/* Modal Footer with explicit Back and Close buttons */}
        <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
          
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-800 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à Página</span>
          </button>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {onScrollToForm && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onScrollToForm();
                }}
                className="text-rose-700 hover:text-rose-900 font-bold text-xs underline cursor-pointer px-2 py-1"
              >
                Ir para o Cadastro
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
