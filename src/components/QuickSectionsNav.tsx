import React from 'react';
import { 
  TrendingUp, 
  Star, 
  Store, 
  ShoppingBag, 
  MessageSquareHeart, 
  Instagram, 
  Gift, 
  BookOpen, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Camera,
  PlayCircle,
  HelpCircle,
  Percent
} from 'lucide-react';

interface QuickSectionItem {
  id: string;
  targetId: string;
  title: string;
  badge: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  badgeColor: string;
  borderColor: string;
  glowShadow: string;
}

interface QuickSectionsNavProps {
  onOpenSection: (sectionId: string) => void;
}

export function QuickSectionsNav({ onOpenSection }: QuickSectionsNavProps) {
  const sections: QuickSectionItem[] = [
    {
      id: 'romance-estrelas',
      targetId: 'romance-estrelas-parcelamento',
      title: 'Romance Estrela Regra de Parcelamento & Segredo do Lucro',
      badge: 'Crisdu • Lucro & Parcelamento',
      sub: 'O Segredo Máximo do Lucro + Até 3x sem juros e Prêmios 2026',
      icon: Star,
      gradient: 'from-amber-500/25 via-rose-500/20 to-amber-400/20',
      iconColor: 'text-amber-600 group-hover:text-amber-700',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      borderColor: 'hover:border-amber-400/80',
      glowShadow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.55)]',
    },
    {
      id: 'catalogo-favorita',
      targetId: 'catalogo-favorita',
      title: 'Catálogo Favorita: 40% de Lucro & Regras',
      badge: '40% de Lucro Imediato',
      sub: 'Pedido Mínimo R$ 400 - R$ 600 • Tabela de Prazos & Contatos',
      icon: Percent,
      gradient: 'from-rose-500/25 via-red-500/20 to-amber-500/20',
      iconColor: 'text-rose-600 group-hover:text-rose-700',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      borderColor: 'hover:border-rose-400/80',
      glowShadow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.55)]',
    },
    {
      id: 'linhas-comerciais',
      targetId: 'linhas-comerciais',
      title: 'Nossas Linhas Comerciais Oficiais',
      badge: 'Mix Completo',
      sub: 'Lingerie, Fitness, Casa & Favorita',
      icon: ShoppingBag,
      gradient: 'from-purple-500/25 via-pink-500/20 to-rose-500/20',
      iconColor: 'text-purple-700 group-hover:text-purple-800',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
      borderColor: 'hover:border-purple-400/80',
      glowShadow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.55)]',
    },
    {
      id: 'lojas-fisicas',
      targetId: 'rede-lojas-fisicas',
      title: 'Rede de Lojas Físicas & Vendedora Favorita',
      badge: 'Itapema • Joinville • Floripa',
      sub: 'Atendimento & WhatsApp Direto',
      icon: Store,
      gradient: 'from-rose-500/25 via-pink-500/20 to-purple-500/20',
      iconColor: 'text-rose-700 group-hover:text-rose-800',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-200',
      borderColor: 'hover:border-rose-400/80',
      glowShadow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.55)]',
    },
    {
      id: 'guia-revendedora',
      targetId: 'guia-revendedora',
      title: 'Guia Completo da Revendedora Romance Itapema',
      badge: 'Passo a Passo',
      sub: 'Do cadastro ao 1º acerto de 40 dias sem investimento',
      icon: BookOpen,
      gradient: 'from-sky-500/25 via-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-700 group-hover:text-blue-800',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-200',
      borderColor: 'hover:border-sky-400/80',
      glowShadow: 'group-hover:shadow-[0_0_25px_rgba(14,165,233,0.55)]',
    },
    {
      id: 'faq-duvidas',
      targetId: 'faq-duvidas',
      title: 'Dúvidas Frequentes & Perguntas (FAQ)',
      badge: 'Tire suas Dúvidas',
      sub: 'Consignação, Lucros, Prazos de 40 dias e Suporte',
      icon: HelpCircle,
      gradient: 'from-indigo-500/25 via-blue-500/20 to-cyan-500/20',
      iconColor: 'text-indigo-700 group-hover:text-indigo-800',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
      borderColor: 'hover:border-indigo-400/80',
      glowShadow: 'group-hover:shadow-[0_0_25px_rgba(99,102,241,0.55)]',
    },
    {
      id: 'depoimentos-avaliacoes',
      targetId: 'depoimentos-avaliacoes',
      title: 'Depoimentos e Avaliações Verificadas',
      badge: 'Nota 5.0 • Google & SC',
      sub: 'Histórias Reais de Sucesso de Revendedoras',
      icon: MessageSquareHeart,
      gradient: 'from-emerald-500/25 via-teal-500/20 to-blue-500/20',
      iconColor: 'text-emerald-700 group-hover:text-emerald-800',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      borderColor: 'hover:border-emerald-400/80',
      glowShadow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.55)]',
    },
    {
      id: 'bonus-instagram',
      targetId: 'bonus-boas-vindas-instagram',
      title: 'Bônus Exclusivo de Boas-Vindas Instagram',
      badge: 'Brinde Especial',
      sub: 'Presente no 1º Pedido Oficial',
      icon: Instagram,
      gradient: 'from-pink-500/25 via-rose-500/20 to-purple-500/20',
      iconColor: 'text-pink-700 group-hover:text-pink-800',
      badgeColor: 'bg-pink-100 text-pink-900 border-pink-200',
      borderColor: 'hover:border-pink-400/80',
      glowShadow: 'group-hover:shadow-[0_0_25px_rgba(236,72,153,0.55)]',
    },
    {
      id: 'indique-ganhe',
      targetId: 'programa-indique-ganhe',
      title: 'Programa Oficial Indique e Ganhe Romance',
      badge: 'R$ 10 no Pix',
      sub: 'Ganhe por cada kit entregue',
      icon: Gift,
      gradient: 'from-amber-500/25 via-orange-500/20 to-rose-500/20',
      iconColor: 'text-orange-700 group-hover:text-orange-800',
      badgeColor: 'bg-orange-100 text-orange-900 border-orange-200',
      borderColor: 'hover:border-orange-400/80',
      glowShadow: 'group-hover:shadow-[0_0_25px_rgba(249,115,22,0.55)]',
    },
  ];

  const handleNavigate = (itemId: string) => {
    onOpenSection(itemId);
  };

  return (
    <section 
      aria-label="Acesso Rápido às Seções Oficiais"
      className="py-8 sm:py-12 relative z-20"
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Header da Navegação em Ícones */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-3 border-b border-rose-200/50">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100/80 px-3 py-1 rounded-full border border-rose-200">
              <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>Portal de Acesso Rápido da Vendedora</span>
            </div>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Toque no ícone e acesse a sessão desejada
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Navegação direta para as sessões essenciais da revenda Romance & Favorita Itapema
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-stone-500 shrink-0">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Navegação 100% responsiva</span>
          </div>
        </div>

        {/* Grid Responsivo de Ícones: 2 colunas no celular, 3 no tablet e 4 no desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                aria-label={`Abrir a seção ${item.title}`}
                className={`group relative text-left bg-white/90 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/90 ${item.borderColor} shadow-xs hover:shadow-2xl hover:shadow-rose-900/10 transition-all duration-300 ease-out transform hover:-translate-y-1.5 hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col justify-between overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-500`}
              >
                {/* Ambient Top Glow in card background */}
                <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br ${item.gradient} blur-xl pointer-events-none opacity-50 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500`} />

                <div>
                  {/* Top Bar inside card: Icon + Arrow */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Animated Icon Wrapper with Scale & Glow on Hover */}
                    <div className="relative shrink-0">
                      {/* Luminous Pulsing Halo behind the Icon */}
                      <div 
                        className={`absolute -inset-1 rounded-2xl bg-gradient-to-tr ${item.gradient} opacity-0 group-hover:opacity-100 group-hover:scale-125 blur-md transition-all duration-400 ease-out pointer-events-none`}
                        aria-hidden="true" 
                      />

                      {/* Icon Container with Scale, Dynamic Shadow Glow & Shimmer Sweep */}
                      <div 
                        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.gradient} border border-white/90 shadow-2xs ${item.glowShadow} flex items-center justify-center transition-all duration-300 ease-out transform group-hover:scale-115 group-hover:-rotate-3 group-hover:border-white overflow-hidden`}
                      >
                        {/* Diagonal Shine / Brilho Sweep Effect */}
                        <div 
                          className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
                          aria-hidden="true"
                        >
                          <div className="absolute -inset-full top-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/80 to-transparent -skew-x-25 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                        </div>

                        {/* Corner Sparkle Glint on hover */}
                        <div 
                          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-[0_0_6px_#fff]"
                          aria-hidden="true" 
                        />

                        {/* SVG Icon with smooth scale and subtle twist */}
                        <Icon 
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${item.iconColor} transform transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 drop-shadow-xs`} 
                        />
                      </div>
                    </div>

                    {/* Arrow Button with hover glow */}
                    <div className="w-6 h-6 rounded-full bg-stone-100 group-hover:bg-gradient-to-tr group-hover:from-rose-500 group-hover:to-pink-500 text-stone-400 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(244,63,94,0.4)] flex items-center justify-center transition-all duration-300 shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Badge */}
                  <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${item.badgeColor} mb-2 leading-tight max-w-full truncate transition-transform duration-200 group-hover:scale-[1.02]`}>
                    {item.badge}
                  </span>

                  {/* Title */}
                  <h3 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-rose-700 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                </div>

                {/* Subtitle / Micro explanation */}
                <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="line-clamp-1 group-hover:text-stone-700 transition-colors">{item.sub}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
