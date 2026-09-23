import { Sparkles, Heart, Shield, Lock, MapPin, Phone, MessageCircle, Instagram, Gift, ExternalLink, Share2, UserCheck } from 'lucide-react';
import { BusinessSettings } from '../types';
import { buildWhatsAppLink, buildInstagramLink } from '../utils/validators';

interface FooterProps {
  settings: BusinessSettings;
  onOpenAdmin: () => void;
  onOpenLgpd: (tab?: 'privacy' | 'terms' | 'cookies') => void;
  onScrollToForm: () => void;
  onOpenReferralModal?: () => void;
  onOpenShare?: () => void;
  onOpenResellerPortal?: () => void;
}

export function Footer({ settings, onOpenAdmin, onOpenLgpd, onScrollToForm, onOpenReferralModal, onOpenShare, onOpenResellerPortal }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-950/95 backdrop-blur-2xl text-stone-300 pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
      
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-lg shadow-black/40 border border-white/20 shrink-0">
                <img
                  src={settings.logoUrl || 'https://bminunltftkmfmsnjpea.supabase.co/storage/v1/object/sign/logo/e8bbfd68-4456-452c-ab67-ee284960fd02.jfif?token=eyJraWQiOiJlZDc2YzAxMi0xN2I2LTRjZWMtYjhlMy1iNTA4MTUxODlmZTMiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJsb2dvL2U4YmJmZDY4LTQ0NTYtNDUyYy1hYjY3LWVlMjg0OTYwZmQwMi5qZmlmIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4ODEwMzU0OSwiZXhwIjoxODE5NjM5NTQ5fQ.Qefo2xyIUBJ8P3UnKReyQ9UYaD4pUuRB-KsscKTkli2u6EDvI_nywYpue33nbjlJ95EH9GoGqtV7MNPH6dhR3Q'}
                  alt="Romance Moda Íntima"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <span className="font-serif-luxury text-2xl font-bold text-white tracking-tight">
                  Romance
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-300 ml-1.5 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15">
                  Itapema
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Distribuição oficial de Lingerie Sem Investimento & Catálogo Favorita Romance Itapema. Atendimento em diversas cidades e regiões com lucro de 30% a 40% e zero investimento inicial.
            </p>
            <div className="pt-1 flex items-center gap-3 text-xs text-rose-300 font-semibold">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Conformidade com a LGPD</span>
            </div>
          </div>

          {/* Col 2: Regras Principais */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              Regras Sem Investimento
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Você só paga o que vender</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Devolve o que sobrou sem custo</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Acerto a cada 40 dias</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Lucro de 30% a 40%</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Favorita: pedido mín. R$ 400 e máx. R$ 600</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Atendimento e Localização */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              Contato & Distribuição
            </h4>
            <div className="space-y-2 text-stone-400">
              {settings.distributorName && (
                <p className="flex items-center gap-2 text-rose-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Distribuidor: {settings.distributorName}</span>
                </p>
              )}
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{settings.cityRegion}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Distribuição Romance: {settings.displayWhatsApp}</span>
              </p>
              <p className="flex items-center gap-2 text-stone-300">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Loja Favorita Joinville ({settings.lojaJoinvilleVendedora || 'Hevilin'}): {settings.lojaJoinvilleDisplayWhatsApp || '(47) 98840-7904'}</span>
              </p>
              <p className="flex items-center gap-2 text-stone-300">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Loja Favorita Florianópolis ({settings.lojaFlorianopolisVendedora || 'Warla'}): {settings.lojaFlorianopolisDisplayWhatsApp || '(48) 99692-7999'}</span>
              </p>
              <a
                href={buildInstagramLink(settings.instagramHandle || '@romanceitapema')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 text-rose-300 hover:text-white group transition-colors py-0.5"
              >
                <span className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>{settings.instagramHandle}</span>
                </span>
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Gift className="w-2.5 h-2.5" /> Brinde
                </span>
              </a>
            </div>
            <a
              href={buildWhatsAppLink(
                settings.officialWhatsApp,
                `Olá ${settings.distributorName || 'Anderson'}! Gostaria de falar com a Distribuição Romance Itapema sobre o modelo sem investimento.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold mt-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chamar no WhatsApp ({settings.displayWhatsApp})</span>
            </a>
          </div>

          {/* Col 4: Acesso Rápido & Painel */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              Links Rápidos & Legal
            </h4>
            <ul className="space-y-2">
              {onOpenReferralModal && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenReferralModal}
                    className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>Indique & Ganhe (R$ 10 por Indicação)</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={onScrollToForm}
                  className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer transition-colors"
                >
                  Quero Fazer Meu Pré-Cadastro
                </button>
              </li>
              <li>
                <a
                  href="#romance-estrelas"
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>Promoção Estrelas 2026 (R$ 450k)</span>
                </a>
              </li>
              <li>
                <a
                  href={settings.catalogoFavoritaUrl || 'https://catalogofavorita.com.br/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Catálogo Favorita Oficial</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <button
                  onClick={() => onOpenLgpd('terms')}
                  className="text-stone-400 hover:text-white cursor-pointer transition-colors"
                >
                  Termos de Uso & Revenda Sem Investimento
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLgpd('privacy')}
                  className="text-stone-400 hover:text-white cursor-pointer transition-colors"
                >
                  Política de Privacidade (LGPD)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLgpd('cookies')}
                  className="text-stone-400 hover:text-white cursor-pointer transition-colors"
                >
                  Preferências de Cookies
                </button>
              </li>
              <li className="pt-2 space-y-2">
                {onOpenResellerPortal && (
                  <button
                    type="button"
                    onClick={onOpenResellerPortal}
                    className="w-full bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 hover:text-white p-3 rounded-2xl border border-rose-500/30 backdrop-blur-md flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs font-semibold"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                    <span>Portal da Vendedora (Perfil de Vendas)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="w-full bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white p-3 rounded-2xl border border-white/15 backdrop-blur-md flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Painel da Distribuidora (Admin)</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {currentYear} Romance Itapema. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1">
            <span>Desenvolvido para mulheres empreendedoras de Itapema e SC</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
          </div>
        </div>

      </div>
    </footer>
  );
}
