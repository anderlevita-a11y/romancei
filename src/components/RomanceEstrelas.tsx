import { useState } from 'react';
import { 
  Star, 
  Sparkles, 
  Car, 
  Bike, 
  CreditCard, 
  Gift, 
  Calendar, 
  ChevronDown, 
  ExternalLink, 
  CheckCircle2, 
  Smartphone, 
  ArrowRight, 
  Award, 
  Trophy, 
  HelpCircle,
  Clock,
  Zap,
  Info,
  MessageCircle,
  X
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { ROMANCE_APP_PLAYSTORE_URL, ROMANCE_APP_APPSTORE_URL, GooglePlayIcon, AppleIcon } from './AppDownloadBadges';
import { buildWhatsAppLink } from '../utils/validators';

interface RomanceEstrelasProps {
  settings?: BusinessSettings;
  onScrollToForm: (reason?: string) => void;
}

export function RomanceEstrelas({ settings, onScrollToForm }: RomanceEstrelasProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const scrollToPrazosTable = () => {
    const el = document.getElementById('tabela-prazos-favorita');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-4', 'ring-amber-400/80');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400/80');
      }, 2500);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Calendar reminder links for 27/12/2026
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Último dia da Promoção Estrelas Romance 2026')}&dates=20261227T000000Z/20261227T235959Z&details=${encodeURIComponent('Último dia para acumular pontos e garantir seus números da sorte na Promoção Estrelas Romance 2026! Acesse o App Romance ou www.estrelasromance.com.br')}&location=${encodeURIComponent('App Romance Oficial')}`;

  const outlookCalendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent('Último dia da Promoção Estrelas Romance 2026')}&startdt=2026-12-27T00:00:00Z&enddt=2026-12-27T23:59:59Z&body=${encodeURIComponent('Último dia para acumular pontos e garantir seus números da sorte na Promoção Estrelas Romance 2026!')}&location=${encodeURIComponent('App Romance Oficial')}`;

  const downloadIcsApple = () => {
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Romance Itapema//Estrelas Romance 2026//PT',
      'BEGIN:VEVENT',
      'UID:estrelas-romance-2026-last-day@romance.com.br',
      'DTSTAMP:20260101T000000Z',
      'DTSTART;VALUE=DATE:20261227',
      'DTEND;VALUE=DATE:20261228',
      'SUMMARY:Último dia da Promoção Estrelas Romance 2026',
      'DESCRIPTION:Último dia para acumular pontos e garantir seus números da sorte na Promoção Estrelas Romance 2026!',
      'URL:https://www.estrelasromance.com.br',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Lembrete_Estrelas_Romance_2026.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const steps = [
    {
      num: '1',
      title: 'Acesse o APP Romance',
      desc: 'Disponível para iOS e Android. Certifique-se de que seu cadastro de empreendedora esteja ativo e atualizado.',
      icon: Smartphone,
    },
    {
      num: '2',
      title: 'Venda & Pontue',
      desc: 'Realize vendas ou compras das marcas Romance e Favorita. A cada R$ 1,00 gasto = 1 ponto automático no programa.',
      icon: Sparkles,
    },
    {
      num: '3',
      title: '+1 Ponto Extra Todo Dia',
      desc: 'Ganhe 1 ponto bônus por dia simplesmente ao abrir e acessar o aplicativo oficial.',
      icon: Zap,
    },
    {
      num: '4',
      title: '500 Pontos = Número da Sorte',
      desc: 'A cada 500 pontos acumulados, você gera 1 número da sorte para concorrer aos sorteios de R$ 450 mil.',
      icon: Award,
    },
  ];

  const prizes = [
    {
      category: 'Mobilidade & Conquistas',
      highlight: 'Carro 0km & 20 Motos',
      color: 'from-amber-500/20 via-rose-500/10 to-amber-600/20 border-amber-500/40 text-amber-300',
      badge: 'Prêmio Principal',
      items: [
        {
          title: '1 Carro 0km (R$ 80.000,00)',
          desc: '1 Cartão de crédito pré-pago com valor sugerido de R$ 80.000,00 para compra de carro 0km.',
          icon: Car,
          count: '1 Carro',
          val: 'R$ 80.000',
        },
        {
          title: '20 Motocicletas (R$ 7.000,00 cada)',
          desc: '20 Cartões de crédito pré-pago com valor sugerido de R$ 7.000,00 para compra de motocicleta.',
          icon: Bike,
          count: '20 Motos',
          val: 'R$ 140.000',
        },
      ],
    },
    {
      category: 'Créditos & Cartões Pré-Pagos',
      highlight: '80 Cartões em Dinheiro',
      color: 'from-purple-500/20 via-pink-500/10 to-rose-500/20 border-purple-500/40 text-purple-300',
      badge: 'Liberdade Financeira',
      items: [
        {
          title: '60 Cartões de R$ 1.518,00',
          desc: 'Cartões pré-pagos para usar livremente em qualquer compra ou investimento.',
          icon: CreditCard,
          count: '60 Ganhadoras',
          val: 'R$ 91.080',
        },
        {
          title: '20 Cartões de R$ 759,00',
          desc: 'Créditos adicionais para impulsionar a sua renda mensal.',
          icon: CreditCard,
          count: '20 Ganhadoras',
          val: 'R$ 15.180',
        },
      ],
    },
    {
      category: 'Vales-Compras para o Negócio',
      highlight: '142 Vales-Compras',
      color: 'from-emerald-500/20 via-teal-500/10 to-emerald-600/20 border-emerald-500/40 text-emerald-300',
      badge: 'Estoque & Lucro',
      items: [
        {
          title: '142 Vales de R$ 250 a R$ 1.500',
          desc: 'Vales-compras exclusivos para abastecer seu mostruário com produtos Romance e Favorita conforme sua categoria.',
          icon: Gift,
          count: '142 Vales',
          val: 'Mais de R$ 100 mil',
        },
      ],
    },
  ];

  const faqs = [
    {
      q: 'Como as categorias funcionam na promoção?',
      a: 'Sua pontuação total acumulada no aplicativo define sua categoria (como Uma Estrela, Superstar, etc.). Quanto maior a sua categoria, você concorre em séries e modalidades específicas que oferecem prêmios de maior valor!',
    },
    {
      q: 'Os pontos acumulados podem expirar?',
      a: 'Sim, os pontos têm validade de 18 semanas. Por isso, é fundamental manter a atividade e as vendas constantes para não perder o saldo necessário para a geração dos números da sorte.',
    },
    {
      q: 'Existe limite de números da sorte por pessoa?',
      a: 'Não há um limite fixo por pessoa! Quanto mais você vender, comprar produtos Romance & Favorita e acessar o app diariamente, mais números da sorte você acumula para os sorteios.',
    },
    {
      q: 'Onde encontro o regulamento completo da promoção?',
      a: 'Todas as informações detalhadas, datas de apuração e regulamento oficial completo podem ser consultados no site oficial www.estrelasromance.com.br ou diretamente no menu informativo dentro do APP Romance.',
    },
    {
      q: 'Como saber se fui sorteada?',
      a: 'Os resultados são divulgados oficialmente no site da promoção em até 5 dias úteis após cada apuração, e as ganhadoras também são avisadas por telefone e por notificações diretas dentro do APP Romance.',
    },
  ];

  return (
    <section 
      id="romance-estrelas" 
      className="py-20 relative overflow-hidden bg-stone-950 text-white border-y border-amber-500/30"
    >
      {/* Golden & Rose Ambient Glows */}
      <div className="absolute top-0 left-1/3 -mt-28 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -mb-28 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-600/20 via-pink-600/15 to-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Top Eyebrow & Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-400/40 px-4 py-1.5 rounded-full text-xs font-bold text-amber-300 shadow-lg shadow-amber-950/50 backdrop-blur-md">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-spin-slow" />
            <span className="tracking-wide uppercase font-extrabold">Campanha Oficial Crisdu • Romance & Favorita</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Promoção <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-amber-200">Estrelas Romance 2026</span>
          </h2>

          <p className="text-stone-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl mx-auto">
            Concorra a <strong className="text-amber-300 font-semibold">1 Carro 0km</strong>, <strong className="text-amber-300 font-semibold">20 Motos</strong> e <strong className="text-amber-300 font-semibold">Mais de R$ 450 Mil em Prêmios</strong> exclusivos para empreendedoras e consultoras independentes!
          </p>

          {/* Quick Stats Highlights */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md text-center">
              <span className="block text-2xl font-black text-amber-400 font-serif-luxury">+R$ 450 Mil</span>
              <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Em Prêmios Totais</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md text-center">
              <span className="block text-2xl font-black text-rose-400 font-serif-luxury">1 Carro + 20 Motos</span>
              <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Veículos 0km</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md text-center">
              <span className="block text-2xl font-black text-pink-400 font-serif-luxury">80 Cartões</span>
              <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Pré-Pagos em Dinheiro</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md text-center">
              <span className="block text-2xl font-black text-emerald-400 font-serif-luxury">142 Vales</span>
              <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Compras p/ o Negócio</span>
            </div>
          </div>
        </div>

        {/* Action Button to Open Complete Guide */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-stone-950 font-black text-sm px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-300 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 fill-current text-stone-950" />
            <span>Quero Saber Mais & Ver Regulamento Completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onScrollToForm('Interesse na Promoção Estrelas Romance 2026')}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-4 rounded-2xl border border-white/20 backdrop-blur-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Fazer Cadastro de Revendedora</span>
          </button>
        </div>

        {/* How to Participate Steps */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
              Brilhe com Suas Vendas e Pontue: <span className="text-amber-300">Como Funciona</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Cada real vendido e cada acesso no aplicativo aproximam você dos grandes prêmios.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.num}
                  className="bg-stone-900/80 hover:bg-stone-900 border border-white/10 hover:border-amber-400/50 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-lg shadow-black/40"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 via-rose-500/20 to-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 rounded-full">
                        Passo {step.num}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">
                      {step.title}
                    </h4>

                    <p className="text-xs text-stone-300 leading-relaxed">
                      {step.desc}
                    </p>

                    {step.num === '1' && (
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                        <a
                          href={ROMANCE_APP_PLAYSTORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/15 transition-colors"
                        >
                          <GooglePlayIcon className="w-3 h-3 text-emerald-400" />
                          <span>Play Store</span>
                        </a>
                        <a
                          href={ROMANCE_APP_APPSTORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/15 transition-colors"
                        >
                          <AppleIcon className="w-3 h-3 text-white" />
                          <span>App Store</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prize Constellation Preview Cards */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3.5 py-1 rounded-full">
              Sua Chance de Ganhar
            </span>
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white mt-2">
              Uma Constelação de Prêmios Espera por Você
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {prizes.map((group, idx) => (
              <div 
                key={idx}
                className="bg-stone-900/90 border border-white/10 hover:border-amber-400/40 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-500/30 px-3 py-1 rounded-lg">
                      {group.badge}
                    </span>
                    <span className="text-xs font-mono text-stone-400">{group.highlight}</span>
                  </div>

                  <h4 className="font-serif-luxury text-xl font-bold text-white">
                    {group.category}
                  </h4>

                  <div className="space-y-3">
                    {group.items.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-white text-xs">{item.title}</p>
                            </div>
                            <p className="text-[11px] text-stone-300 leading-snug">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-stone-400">Total da Categoria:</span>
                  <span className="font-bold text-amber-300">{group.items[0]?.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DESTAQUE DE BENEFÍCIO: PRAZOS & PARCELAMENTO COM LINK PARA TABELA UNIFICADA */}
        <div className="bg-gradient-to-br from-stone-900 via-amber-950/30 to-stone-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl mb-16 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>Benefício Exclusivo • Romance Estrelas</span>
              </div>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                Prazos Ampliados e Parcelamento no Catálogo Favorita
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
                Quanto mais estrelas você conquista, maiores são seus prazos de pagamento (de 14 até 90 dias) e opções de parcelamento sem juros em até 3x para pedidos do Catálogo Favorita.
              </p>
            </div>

            <div className="bg-amber-950/60 border border-amber-500/30 rounded-2xl p-3 text-right shrink-0">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Parcelamento Especial</span>
              <span className="text-amber-300 font-extrabold text-sm">Até 3x (30/60/90 dias)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-white/10 text-stone-300">
                  Início & Bronze
                </span>
                <div className="flex items-center text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Prazos de 14 a 21 dias</h4>
                <p className="text-xs text-stone-400">Pedidos a partir de R$ 400</p>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-amber-300 font-bold">
                1x no Boleto / Acerto
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-white/10 text-stone-300">
                  Prata a Diamante
                </span>
                <div className="flex items-center text-amber-400 gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Prazos de 21 a 48 dias</h4>
                <p className="text-xs text-stone-400">Pedidos de R$ 600 a R$ 800</p>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-amber-300 font-bold">
                Parcelado em 2x (até 48d)
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-stone-900 border border-amber-400/80 rounded-2xl p-4 flex flex-col justify-between space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-amber-400 text-stone-950">
                  Superstar (Máximo)
                </span>
                <div className="flex items-center text-amber-400 gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Prazos de 30 / 60 / 90 dias</h4>
                <p className="text-xs text-stone-300">Pedidos a partir de R$ 1.000</p>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-amber-300 font-extrabold">
                Parcelado em 3x (30/60/90d)
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-stone-300 text-xs">
                Consulte as 7 faixas detalhadas e regras de antecedência na seção oficial do Catálogo Favorita.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={scrollToPrazosTable}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span>Ver Tabela Completa de Prazos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Promotion Validity & Calendar Reminder Widget */}
        <div className="bg-gradient-to-r from-amber-950/40 via-stone-900 to-rose-950/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl mb-16 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Período Oficial de Participação</span>
              </div>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                Válido de 01/01/2026 até 27/12/2026
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm max-w-xl">
                A participação está aberta a todas as revendedoras e empreendedoras que utilizam o aplicativo oficial Romance.
              </p>
            </div>

            {/* Reminder Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <span className="text-xs text-stone-400 font-semibold mb-1 sm:mb-0 sm:mr-2">Lembre-me do último dia:</span>
              
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer"
                title="Adicionar ao Google Calendar"
              >
                <span>🗓️ Google</span>
              </a>

              <button
                type="button"
                onClick={downloadIcsApple}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer"
                title="Adicionar ao Apple Calendar (iPhone/Mac)"
              >
                <span>🗓️ Apple</span>
              </button>

              <a
                href={outlookCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer"
                title="Adicionar ao Microsoft Outlook"
              >
                <span>🗓️ Outlook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Embedded Accordion FAQs */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center mb-6">
            <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white">
              Dúvidas Frequentes sobre a Promoção Estrelas Romance 2026
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-stone-900/80 border border-white/10 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-300 leading-relaxed border-t border-white/5 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Official Site External Link */}
          <div className="pt-6 text-center">
            <a
              href="https://www.estrelasromance.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 hover:bg-amber-950 border border-amber-500/40 px-5 py-2.5 rounded-full transition-all"
            >
              <span>Consultar Regulamento Completo em www.estrelasromance.com.br</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>

      {/* FULL DETAILS MODAL / POPUP: "QUERO SABER MAIS" */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-stone-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl text-white my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-amber-950/80 via-stone-900 to-rose-950/80 flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">Guia Completo da Promoção</span>
                  <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-white">
                    Estrelas Romance 2026: Concorra a Carro, Motos e R$ 450 Mil!
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1">
              
              {/* Introduction */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <p className="text-sm text-stone-200 leading-relaxed">
                  A <strong>Crisdu Moda Íntima</strong>, através de suas consagradas marcas <strong>Romance</strong> e <strong>Favorita</strong>, apresenta uma oportunidade imperdível para quem atua no mercado de moda. A campanha <strong>Estrelas Romance</strong> é voltada exclusivamente para os empreendedores independentes, transformando cada venda e cada interação no aplicativo oficial em chances reais de conquistar prêmios incríveis.
                </p>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Esta iniciativa celebra a parceria e o sucesso dos consultores, oferecendo desde veículos zero quilômetro até suporte financeiro para o crescimento do seu negócio.
                </p>
              </div>

              {/* How to Participate */}
              <div className="space-y-4">
                <h4 className="font-serif-luxury text-lg font-bold text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Brilhe com Suas Vendas e Pontue – Como participar:</span>
                </h4>

                <ul className="space-y-3 text-xs sm:text-sm text-stone-300">
                  <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>1. Acesse o APP Romance:</strong> Disponível para download em smartphones iOS e Android. Certifique-se de que seu cadastro esteja ativo.</span>
                    </div>
                    <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                      <a
                        href={ROMANCE_APP_PLAYSTORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/15 transition-colors"
                      >
                        <GooglePlayIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Play Store</span>
                      </a>
                      <a
                        href={ROMANCE_APP_APPSTORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/15 transition-colors"
                      >
                        <AppleIcon className="w-3.5 h-3.5 text-white" />
                        <span>App Store</span>
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>2. Realize vendas ou compras:</strong> Produtos das marcas Romance e Favorita geram pontos imediatos.</span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>3. R$ 1,00 = 1 Ponto:</strong> A cada R$ 1,00 gasto, você acumula automaticamente 1 ponto no programa de benefícios.</span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>4. Bônus Diário de Acesso:</strong> Garanta 1 ponto extra por dia simplesmente ao abrir e acessar o aplicativo.</span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>5. 500 Pontos = 1 Número da Sorte:</strong> Ao atingir a marca de 500 pontos acumulados, você ganha 1 número da sorte para participar dos sorteios.</span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>6. Acompanhe no APP:</strong> Acompanhe sua evolução e categoria diretamente na seção “Estrelas Romance” dentro do aplicativo para verificar seus números da sorte.</span>
                  </li>
                </ul>
              </div>

              {/* Complete Prize List */}
              <div className="space-y-4">
                <h4 className="font-serif-luxury text-lg font-bold text-amber-300 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Uma Constelação de Prêmios Espera por Você:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-black/40 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-amber-400">Mobilidade & Conquistas</span>
                    <p className="font-bold text-white text-sm">1 Carro 0km & 20 Motos</p>
                    <p className="text-stone-300 leading-relaxed">• 1 Cartão pré-pago de <strong>R$ 80.000,00</strong> (valor sugerido para compra de carro 0km).</p>
                    <p className="text-stone-300 leading-relaxed">• 20 Cartões pré-pagos de <strong>R$ 7.000,00 cada</strong> (valor sugerido para compra de motocicleta).</p>
                  </div>

                  <div className="bg-black/40 border border-purple-500/30 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-purple-300">Créditos e Cartões</span>
                    <p className="font-bold text-white text-sm">80 Cartões Pré-Pagos</p>
                    <p className="text-stone-300 leading-relaxed">• 60 Cartões pré-pagos no valor de <strong>R$ 1.518,00 cada</strong>.</p>
                    <p className="text-stone-300 leading-relaxed">• 20 Cartões pré-pagos no valor de <strong>R$ 759,00 cada</strong>.</p>
                  </div>

                  <div className="bg-black/40 border border-emerald-500/30 rounded-2xl p-4 space-y-2 sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-400">Vales-Compras para o Negócio</span>
                    <p className="font-bold text-white text-sm">142 Vales-Compras Exclusivos</p>
                    <p className="text-stone-300 leading-relaxed">
                      142 Vales-compras exclusivos para produtos Romance e Favorita, com valores que variam entre <strong>R$ 250,00 e R$ 1.500,00</strong>, distribuídos conforme a categoria da participante.
                    </p>
                  </div>
                </div>
              </div>

              {/* Where and When */}
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-5 space-y-2">
                <h5 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Onde e Quando Brilhar:</span>
                </h5>
                <p className="text-xs text-stone-300 leading-relaxed">
                  A participação está aberta a empreendedores de todo o Brasil que utilizam o aplicativo oficial da marca. O período para acumular pontos e garantir sua participação nos sorteios acontece de <strong>01/01/2026 até 27/12/2026</strong>.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 bg-stone-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-20">
              <a
                href="https://www.estrelasromance.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5"
              >
                <span>Acessar www.estrelasromance.com.br</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-3 rounded-xl border border-white/20 transition-all cursor-pointer"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    onScrollToForm('Interesse na Promoção Estrelas Romance 2026');
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-stone-950 font-black text-xs px-6 py-3 rounded-xl shadow-lg border border-amber-300 transition-all cursor-pointer whitespace-nowrap"
                >
                  Quero Revender e Concorrer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
