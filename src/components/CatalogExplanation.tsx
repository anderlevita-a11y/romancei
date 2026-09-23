import { Sparkles, Check, ArrowUpRight, Gift, ShoppingBag, Percent, Star, ExternalLink, BookOpen, MapPin, MessageCircle, Clock, Calendar, CreditCard, Store, ShieldCheck } from 'lucide-react';
import { formatCurrency, buildWhatsAppLink } from '../utils/validators';
import { BusinessSettings } from '../types';

interface CatalogExplanationProps {
  settings?: BusinessSettings;
  onScrollToForm: () => void;
}

export function CatalogExplanation({ settings, onScrollToForm }: CatalogExplanationProps) {
  const catalogoUrl = settings?.catalogoFavoritaUrl || 'https://catalogofavorita.com.br/';
  
  // Loja Física Contact & Maps
  const lojaWhatsRaw = settings?.lojaFisicaWhatsApp || settings?.officialWhatsApp || '5547997626121';
  const lojaWhatsDisplay = settings?.lojaFisicaDisplayWhatsApp || settings?.displayWhatsApp || '(47) 99762-6121';
  const lojaVendedora = settings?.lojaFisicaVendedora || settings?.distributorName || 'Atendimento Oficial';
  const lojaMapsUrl = settings?.lojaFisicaMapsUrl?.trim() || '';
  const lojaEndereco = settings?.lojaFisicaEndereco?.trim() || '';

  const mainMapsEffectiveUrl = lojaMapsUrl.startsWith('http')
    ? lojaMapsUrl
    : (lojaEndereco ? `https://maps.google.com/?q=${encodeURIComponent(lojaEndereco)}` : '');

  const lojaWhatsLink = buildWhatsAppLink(
    lojaWhatsRaw,
    `Olá ${lojaVendedora}! Gostaria de fazer meu pedido do Catálogo Favorita com a Distribuição ${settings?.businessName || 'Romance'}.`
  );

  // Vendedoras Lojas Favorita Parceiras (Joinville & Florianópolis)
  const joinvilleVendedora = settings?.lojaJoinvilleVendedora || 'Hevilin';
  const joinvilleWhatsRaw = settings?.lojaJoinvilleWhatsApp || '5547988407904';
  const joinvilleWhatsDisplay = settings?.lojaJoinvilleDisplayWhatsApp || '(47) 98840-7904';
  const joinvilleWhatsLink = buildWhatsAppLink(
    joinvilleWhatsRaw,
    `Olá ${joinvilleVendedora}! Gostaria de consultar os pedidos do Catálogo Favorita da Loja Favorita Joinville.`
  );

  const floripaVendedora = settings?.lojaFlorianopolisVendedora || 'Warla';
  const floripaWhatsRaw = settings?.lojaFlorianopolisWhatsApp || '5548996927999';
  const floripaWhatsDisplay = settings?.lojaFlorianopolisDisplayWhatsApp || '(48) 99692-7999';
  const floripaWhatsLink = buildWhatsAppLink(
    floripaWhatsRaw,
    `Olá ${floripaVendedora}! Gostaria de consultar os pedidos do Catálogo Favorita da Loja Favorita Florianópolis.`
  );

  // Romance Estrelas Favorita Installments & Terms Table
  const prazosFavorita = [
    {
      tier: 'Pedido Mínimo',
      valor: 'R$ 400,00',
      prazos: '14 dias',
      parcelas: '1x (14 dias)',
      stars: 0,
      badge: 'Ativação 40%',
      highlight: false,
    },
    {
      tier: '1 Estrela',
      valor: 'R$ 500,00',
      prazos: '21 dias',
      parcelas: '1x (21 dias)',
      stars: 1,
      badge: 'Nível Bronze',
      highlight: false,
    },
    {
      tier: '2 Estrelas',
      valor: 'R$ 600,00',
      prazos: '21 e 35 dias',
      parcelas: '2x (21 / 35 dias)',
      stars: 2,
      badge: 'Nível Prata',
      highlight: false,
    },
    {
      tier: '3 Estrelas',
      valor: 'R$ 700,00',
      prazos: '21 e 42 dias',
      parcelas: '2x (21 / 42 dias)',
      stars: 3,
      badge: 'Nível Ouro',
      highlight: false,
    },
    {
      tier: '4 Estrelas',
      valor: 'R$ 800,00',
      prazos: '30 e 48 dias',
      parcelas: '2x (30 / 48 dias)',
      stars: 4,
      badge: 'Nível Diamante',
      highlight: false,
    },
    {
      tier: '5 Estrelas',
      valor: 'R$ 900,00',
      prazos: '30 e 60 dias',
      parcelas: '2x (30 / 60 dias)',
      stars: 5,
      badge: 'Nível Elite',
      highlight: false,
    },
    {
      tier: 'Superstar',
      valor: 'R$ 1.000,00',
      prazos: '30, 60 e 90 dias',
      parcelas: '3x (30 / 60 / 90 dias)',
      stars: 6,
      badge: 'Nível Máximo',
      highlight: true,
    },
  ];

  return (
    <section id="catalogo-favorita" className="py-20 bg-stone-950/90 backdrop-blur-2xl text-white relative overflow-hidden border-y border-white/10">
      
      {/* Decorative ambient light */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* Top Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 text-xs font-extrabold px-4 py-1.5 rounded-full border border-amber-400/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>O Segredo do Lucro Máximo</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Como funciona o lucro de 40% com o Catálogo Favorita?
          </h2>
          <p className="text-stone-300 text-base sm:text-lg">
            Entenda a regra simples que transforma você em uma consultora de alta rentabilidade com prazos flexíveis.
          </p>
        </div>

        {/* 2-Column Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Card 1: 30% Base */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-xl rounded-3xl p-7 border border-white/15 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Nível Inicial
                </span>
                <span className="text-2xl font-black text-rose-400 font-serif-luxury">
                  30% Lucro
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white">
                Apenas Lingeries Sem Investimento
              </h3>
              <p className="text-stone-300 text-sm leading-relaxed">
                Você recebe a maleta sem investimento Romance. Não faz pedido de catálogo. O risco é zero e sua margem é de 30% sobre todas as vendas.
              </p>

              <ul className="space-y-2.5 pt-2 text-xs text-stone-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Você só paga o que vender no acerto de 40 dias</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Devolve as sobras sem custo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Margem garantida de 30%</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-stone-200 shadow-xs">
              Exemplo: Vendeu <strong>R$ 1.500</strong> → Seu lucro é <strong>R$ 450,00</strong>.
            </div>
          </div>

          {/* Card 2: 40% Favorita Boost (Featured) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-rose-900/80 via-stone-900/90 to-stone-950/95 backdrop-blur-2xl rounded-3xl p-7 sm:p-8 border-2 border-amber-400/50 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            
            {/* Top Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-stone-950 font-black text-xs px-4 py-1 rounded-bl-2xl uppercase tracking-wider shadow-md">
              Mais Vantajoso ★ 40%
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  Nível Top Lucro
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                Lingeries Sem Investimento + Catálogo Favorita
              </h3>
              
              <p className="text-stone-200 text-sm leading-relaxed">
                Ao incluir um pedido do <strong>Catálogo Favorita</strong> (produtos de perfumaria, maquiagens, cosméticos e utilidades que vendem muito fácil), toda a sua margem sobe imediatamente para <strong>40% de lucro líquido</strong>!
              </p>

              {/* The Business Rule Box */}
              <div className="bg-stone-950/80 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl space-y-2.5">
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Regra Oficial do Primeiro Pedido Favorita:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-stone-300 block text-[11px]">Pedido Mínimo:</span>
                    <span className="text-base font-black text-amber-400">R$ 400,00</span>
                    <span className="text-[10px] text-stone-300 block">para ativar os 40% de lucro</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-stone-300 block text-[11px]">Limite 1º Pedido:</span>
                    <span className="text-base font-black text-amber-400">R$ 600,00</span>
                    <span className="text-[10px] text-stone-300 block">teto seguro no primeiro ciclo</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-stone-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Produtos do catálogo complementam as lingeries com venda instantânea</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Você ganha 40% em todo o seu faturamento</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Acerto unificado a cada 40 dias com a distribuidora</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-white/15">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-amber-200">
                  Exemplo: Vendeu <strong>R$ 1.500</strong> → Seu lucro sobe para <strong className="text-amber-300 text-sm">R$ 600,00</strong> (+R$ 150 a mais!).
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                  <a
                    href={catalogoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-3 rounded-xl border border-white/20 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ver Catálogo Online</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>

                  <button
                    onClick={onScrollToForm}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs uppercase px-5 py-3 rounded-xl shadow-lg shadow-amber-400/20 border border-white/30 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Quero o Plano de 40%
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* NOVA TABELA OFICIAL DE PRAZOS E PARCELAMENTO ROMANCE ESTRELA (FAVORITA) */}
        <div id="tabela-prazos-favorita" className="scroll-mt-24 bg-stone-900/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>Romance Estrela • Regra de Parcelamento</span>
              </div>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                Nova Tabela de Prazos & Parcelamento Catálogo Favorita
              </h3>
              <p className="text-xs sm:text-sm text-stone-300">
                Conforme você pontua e avança de nível no programa de estrelas Romance, seus prazos de pagamento aumentam e você ganha parcelamento flexível!
              </p>
            </div>

            <div className="bg-amber-950/60 border border-amber-500/30 rounded-2xl p-3 text-right shrink-0">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Facilidade Financeira</span>
              <span className="text-amber-300 font-extrabold text-sm">Prazos de 14 até 90 dias</span>
            </div>
          </div>

          {/* Table Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {prazosFavorita.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  item.highlight
                    ? 'bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-stone-900 border-amber-400/80 shadow-lg shadow-amber-500/10'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      item.highlight ? 'bg-amber-400 text-stone-950' : 'bg-white/10 text-stone-300'
                    }`}>
                      {item.badge}
                    </span>
                    <div className="flex items-center text-amber-400 text-xs">
                      {item.stars === 0 ? (
                        <span className="text-[10px] text-stone-400 font-semibold">Inicial</span>
                      ) : (
                        Array.from({ length: item.stars }).map((_, s) => (
                          <Star key={s} className="w-3 h-3 fill-amber-400" />
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{item.tier}</h4>
                    <p className="text-xs text-stone-400">Valor: <strong className="text-white">{item.valor}</strong></p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">Prazo:</span>
                    <span className="font-black text-amber-300">{item.prazos}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400">Parcelas:</span>
                    <span className="font-semibold text-white">{item.parcelas}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LOJAS FÍSICAS & VENDEDORAS REGIONAIS FAVORITA */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 text-xs font-extrabold px-3.5 py-1 rounded-full border border-rose-500/30">
              <Store className="w-3.5 h-3.5 text-rose-400" />
              <span>Rede de Lojas Físicas & Vendedoras Favorita</span>
            </div>
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
              Pontos de Atendimento e Pedidos Regionais
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm max-w-2xl mx-auto">
              Faça seus pedidos de Catálogo Favorita ou retire produtos diretamente com nossas vendedoras oficiais nas lojas físicas da região:
            </p>
          </div>

          {/* 3 Store / Point of Care Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {/* Card Principal: Ponto de Atendimento & Retirada Oficial */}
            <div className="bg-stone-900/90 border border-rose-500/40 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-rose-400 transition-all relative group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                    Ponto Oficial
                  </span>
                  <span className="text-xs text-stone-400 font-medium">{settings?.cityRegion?.split(',')[0] || 'Santa Catarina'}</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{settings?.businessName || 'Distribuição Oficial Romance'}</h4>
                  <p className="text-xs text-stone-400">Atendimento & Liberação de Mostruários</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Responsável:</span>
                    <strong className="text-white font-semibold">{lojaVendedora}</strong>
                  </div>
                  {lojaEndereco && (
                    <div className="text-stone-300 space-y-0.5">
                      <span className="block text-[11px] text-stone-400">Endereço:</span>
                      <p className="text-[11px] text-stone-200 font-medium leading-tight">{lojaEndereco}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-stone-300">
                    <span>WhatsApp:</span>
                    <strong className="text-emerald-400 font-mono">{lojaWhatsDisplay}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <a
                  href={lojaWhatsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Falar com Atendimento ({lojaVendedora})</span>
                </a>

                {mainMapsEffectiveUrl ? (
                  <a
                    href={mainMapsEffectiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-white/20 shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>Ver no Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                ) : (
                  <div className="text-center text-[10px] text-stone-400 py-1">
                    Atendimento online e presencial
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Joinville (Vendedora Hevilin) */}
            <div className="bg-stone-900/90 border border-white/15 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-rose-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                    Loja Favorita
                  </span>
                  <span className="text-xs text-stone-400 font-medium">Joinville & Região</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Loja Favorita Joinville</h4>
                  <p className="text-xs text-stone-400">Atendimento e Pedidos de Catálogo</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Vendedora:</span>
                    <strong className="text-white font-semibold">{joinvilleVendedora}</strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Região:</span>
                    <span className="text-stone-200 text-[11px]">Joinville, Araquari e Norte</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-300">
                    <span>WhatsApp:</span>
                    <strong className="text-emerald-400 font-mono">{joinvilleWhatsDisplay}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={joinvilleWhatsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Falar com Vendedora ({joinvilleVendedora})</span>
                </a>
              </div>
            </div>

            {/* Card 2: Florianópolis (Vendedora Warla) */}
            <div className="bg-stone-900/90 border border-white/15 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-rose-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Loja Favorita
                  </span>
                  <span className="text-xs text-stone-400 font-medium">Florianópolis & Região</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Loja Favorita Florianópolis</h4>
                  <p className="text-xs text-stone-400">Atendimento e Pedidos de Catálogo</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Vendedora:</span>
                    <strong className="text-white font-semibold">{floripaVendedora}</strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Região:</span>
                    <span className="text-stone-200 text-[11px]">Florianópolis e Grande Floripa</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-300">
                    <span>WhatsApp:</span>
                    <strong className="text-emerald-400 font-mono">{floripaWhatsDisplay}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={floripaWhatsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Falar com Vendedora ({floripaVendedora})</span>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

