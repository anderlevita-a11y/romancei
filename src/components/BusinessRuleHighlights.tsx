import { Shield, Sparkles, RefreshCcw, DollarSign, Gift, CalendarCheck, CheckCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/validators';

interface BusinessRuleHighlightsProps {
  onScrollToForm: () => void;
}

export function BusinessRuleHighlights({ onScrollToForm }: BusinessRuleHighlightsProps) {
  return (
    <section id="regras-de-negocio" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-md text-rose-800 text-xs font-bold px-3.5 py-1 rounded-full border border-white/80 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Transparência e Liberdade Financeira</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-stone-900">
            Como funciona o modelo Romance Itapema?
          </h2>
          <p className="text-stone-600 text-base sm:text-lg">
            Sem pegadinhas, sem dívidas e sem precisar comprar estoque antecipado. Entenda as regras do nosso modelo sem investimento:
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1: Só Paga o que Vender */}
          <div className="bg-white/70 backdrop-blur-lg hover:bg-white/90 p-6 rounded-3xl border border-white/80 hover:border-rose-300/80 shadow-lg shadow-rose-950/5 hover:shadow-xl transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform border border-rose-200/50">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-stone-900 text-lg">
                1. Só Paga o que Vender
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Você recebe uma maleta completa com lingeries de alta procura. Não precisa desembolsar nenhum valor para começar a revender.
              </p>
            </div>
            <div className="pt-2 border-t border-rose-100/60 text-xs text-rose-700 font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero risco financeiro</span>
            </div>
          </div>

          {/* Pillar 2: Devolva o que Sobrar */}
          <div className="bg-white/70 backdrop-blur-lg hover:bg-white/90 p-6 rounded-3xl border border-white/80 hover:border-rose-300/80 shadow-lg shadow-rose-950/5 hover:shadow-xl transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-200/50">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-stone-900 text-lg">
                2. Devolve sem Custos
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                As peças que você não vendeu durante o período são devolvidas sem nenhuma multa, juros ou cobrança.
              </p>
            </div>
            <div className="pt-2 border-t border-rose-100/60 text-xs text-rose-700 font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sem mercadoria encalhada</span>
            </div>
          </div>

          {/* Pillar 3: Acertos a cada 40 Dias */}
          <div className="bg-white/70 backdrop-blur-lg hover:bg-white/90 p-6 rounded-3xl border border-white/80 hover:border-rose-300/80 shadow-lg shadow-rose-950/5 hover:shadow-xl transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-200/50">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-stone-900 text-lg">
                3. Acertos a Cada 40 Dias
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Você tem 40 dias inteiros com as peças em mãos. Tempo de sobra para mostrar para todas as clientes e receber com tranquilidade.
              </p>
            </div>
            <div className="pt-2 border-t border-rose-100/60 text-xs text-rose-700 font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ciclo longo e sem pressa</span>
            </div>
          </div>

          {/* Pillar 4: Lucro 30% a 40% com Favorita */}
          <div className="bg-gradient-to-br from-rose-950/95 via-rose-900/95 to-stone-900/95 backdrop-blur-xl text-white p-6 rounded-3xl border border-white/20 shadow-xl space-y-4 group relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-amber-400 text-stone-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Destaque
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-700/80 text-rose-200 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/10">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-white text-lg">
                4. Lucro de 30% a 40%
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed">
                Ganhe 30% na revenda sem investimento. E atinja <strong>40% de lucro máximo</strong> ao incluir um pedido do <strong>Catálogo Favorita</strong> (mínimo de R$ 400 e limite de R$ 600 no 1º pedido).
              </p>
            </div>
            <div className="pt-2 border-t border-white/15 text-xs text-amber-300 font-semibold flex items-center gap-1">
              <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Maior lucratividade do mercado</span>
            </div>
          </div>

        </div>

        {/* Highlight Banner / Rule Details */}
        <div className="mt-10 bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/80 shadow-xl shadow-rose-950/5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <span className="bg-rose-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-md shadow-xs">
                  Regra Especial Catálogo Favorita
                </span>
                <span className="text-xs text-stone-600 font-medium">Como liberar 40% de lucro?</span>
              </div>
              <p className="text-stone-800 text-sm sm:text-base">
                Para elevar seus ganhos de <strong>30%</strong> para <strong>40%</strong>, basta realizar um pedido do Catálogo Favorita (cosméticos, maquiagem e utilidades) com valor entre <strong>R$ 400 (mínimo)</strong> e <strong>R$ 600 (limite no primeiro pedido)</strong>. Você vende mais itens e ganha muito mais!
              </p>
            </div>
            <button
              onClick={onScrollToForm}
              className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shrink-0 shadow-lg shadow-rose-600/25 border border-white/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Fazer Pré-Cadastro Agora
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
