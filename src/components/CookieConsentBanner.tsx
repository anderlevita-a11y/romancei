import { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X, Settings2, Check, ExternalLink } from 'lucide-react';
import { BusinessSettings } from '../types';

interface CookieConsentBannerProps {
  settings: BusinessSettings;
  onOpenLegalModal: (initialTab?: 'privacy' | 'terms' | 'cookies') => void;
}

export function CookieConsentBanner({ settings: _settings, onOpenLegalModal }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Granular settings for customization
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [marketingCookies, setMarketingCookies] = useState(true);

  useEffect(() => {
    // Check if user already consented
    const storedConsent = localStorage.getItem('romance_modaitajai_cookies_consent') || localStorage.getItem('romance_itapema_cookies_consent');
    if (!storedConsent) {
      // Small delay for smooth entry animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      status: 'accepted_all',
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('romance_modaitajai_cookies_consent', JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    const consentData = {
      status: 'essential_only',
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('romance_modaitajai_cookies_consent', JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const consentData = {
      status: 'custom',
      essential: true,
      analytics: analyticsCookies,
      marketing: marketingCookies,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('romance_modaitajai_cookies_consent', JSON.stringify(consentData));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      id="cookie-consent-banner"
      className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-6 md:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-stone-950/95 backdrop-blur-2xl text-stone-100 p-5 sm:p-6 rounded-3xl border border-white/15 shadow-2xl shadow-stone-950/50 space-y-4">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 text-rose-300 flex items-center justify-center border border-rose-500/30 shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Privacidade & Recolhimento de Cookies</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LGPD
                </span>
              </h4>
              <p className="text-xs text-stone-400">
                Romance Itapema • Lei Federal nº 13.709/2018
              </p>
            </div>
          </div>
          <button
            onClick={handleAcceptEssential}
            className="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar e aceitar apenas essenciais"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text */}
        <div className="text-xs text-stone-300 leading-relaxed space-y-1.5">
          <p>
            Utilizamos cookies essenciais e tecnologias de armazenamento seguro para viabilizar o envio do seu pré-cadastro, salvar preferências de simulação de lucro e proteger seus dados durante a navegação.
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => onOpenLegalModal('privacy')}
              className="text-rose-400 hover:text-rose-300 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Ler Política de Privacidade & LGPD</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <span className="text-stone-600">•</span>
            <button
              type="button"
              onClick={() => onOpenLegalModal('terms')}
              className="text-rose-400 hover:text-rose-300 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Termos de Uso</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Preferences Toggle Area */}
        {isPreferencesOpen && (
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between py-1 border-b border-white/10">
              <div>
                <span className="font-bold text-white block">1. Cookies Estritamente Necessários</span>
                <span className="text-[11px] text-stone-400">Segurança SSL, envio seguro de formulário e persistência da sessão.</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-800 text-stone-300">
                Sempre Ativo
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/10">
              <div>
                <span className="font-bold text-white block">2. Cookies de Desempenho & Formulário</span>
                <span className="text-[11px] text-stone-400">Memorização de opções selecionadas no simulador de lucro e regras de rentabilidade.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsCookies}
                  onChange={(e) => setAnalyticsCookies(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-bold text-white block">3. Personalização & Atendimento</span>
                <span className="text-[11px] text-stone-400">Ativação de links diretos de WhatsApp para suporte e atendimento.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingCookies}
                  onChange={(e) => setMarketingCookies(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
            className="text-xs text-stone-300 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-stone-400" />
            <span>{isPreferencesOpen ? 'Ocultar Opções' : 'Personalizar'}</span>
          </button>

          <div className="flex items-center gap-2">
            {isPreferencesOpen ? (
              <button
                type="button"
                onClick={handleSavePreferences}
                className="flex-1 sm:flex-initial text-xs bg-stone-800 hover:bg-stone-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all border border-white/15 cursor-pointer flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salvar Preferências</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAcceptEssential}
                className="flex-1 sm:flex-initial text-xs bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition-all border border-white/15 cursor-pointer"
              >
                Apenas Essenciais
              </button>
            )}

            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-initial text-xs bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/30 transition-all border border-white/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Aceitar Todos</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
