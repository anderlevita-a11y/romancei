import { useState } from 'react';
import { Calculator, Sparkles, TrendingUp, ArrowRight, Check, Zap, DollarSign, Award, Percent } from 'lucide-react';
import { formatCurrency } from '../utils/validators';

interface ProfitCalculatorProps {
  onSelectPlanAndScroll: (wantsFavorita: 'sim' | 'nao') => void;
}

export function ProfitCalculator({ onSelectPlanAndScroll }: ProfitCalculatorProps) {
  const [salesAmount, setSalesAmount] = useState<number>(2500);
  const [activePlan, setActivePlan] = useState<'both' | '30' | '40'>('both');

  // Cálculos de lucro a 30% e 40%
  const profit30 = salesAmount * 0.30;
  const profit40 = salesAmount * 0.40;
  const extraGain = profit40 - profit30;

  // Projeções com base no plano atualmente selecionado para CTA
  const selectedCommission = activePlan === '30' ? 0.30 : 0.40;
  const currentProfit = salesAmount * selectedCommission;
  const monthlyEquivalent = (currentProfit / 40) * 30;
  const annualProfit = (currentProfit / 40) * 365;

  // Máximo do slider para calcular % relativa das barras (base R$ 5.000)
  const maxSales = 5000;
  const maxPossibleProfit = maxSales * 0.40; // R$ 2.000
  const widthPercent30 = Math.min(100, Math.max(10, (profit30 / maxPossibleProfit) * 100));
  const widthPercent40 = Math.min(100, Math.max(12, (profit40 / maxPossibleProfit) * 100));

  const salesPresets = [
    { label: 'R$ 800', value: 800, tag: 'Início' },
    { label: 'R$ 1.500', value: 1500, tag: 'Fácil' },
    { label: 'R$ 2.500', value: 2500, tag: 'Média SC' },
    { label: 'R$ 3.800', value: 3800, tag: 'Destaque' },
    { label: 'R$ 5.000', value: 5000, tag: 'Top Lojista' },
  ];

  return (
    <section id="simulador-lucro" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-md text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-200/80 shadow-xs">
            <Calculator className="w-3.5 h-3.5 text-amber-600" />
            <span>Simulador de Lucro em Tempo Real</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900">
            Quanto você vai lucrar a cada 40 dias?
          </h2>
          <p className="text-stone-600 text-base sm:text-lg">
            Mova o valor de vendas e acompanhe as barras de progresso comparando o retorno a <strong className="text-stone-900 font-bold">30%</strong> e a <strong className="text-amber-800 font-bold">40% com Favorita</strong>.
          </p>
        </div>

        {/* Calculator Main Container */}
        <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl border border-white/90 p-6 sm:p-10 shadow-2xl shadow-rose-950/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Controls & Comparison Progress Bars (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Sales Slider Header & Controls */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label htmlFor="sales-slider" className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-rose-600" />
                    <span>Seu volume de vendas no ciclo (40 dias):</span>
                  </label>
                  <div className="inline-flex items-baseline gap-1 self-start sm:self-auto bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                    <span className="text-xs text-rose-700 font-semibold">Vendas:</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
                      {formatCurrency(salesAmount)}
                    </span>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="relative py-2">
                  <input
                    id="sales-slider"
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={salesAmount}
                    onChange={(e) => setSalesAmount(Number(e.target.value))}
                    className="w-full h-3.5 bg-stone-200/90 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-hidden"
                  />
                  <div className="flex justify-between text-[11px] text-stone-500 font-semibold mt-1.5">
                    <span>R$ 500</span>
                    <span>R$ 2.500</span>
                    <span>R$ 5.000</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-stone-500 mr-1">Simulação rápida:</span>
                  {salesPresets.map((preset) => {
                    const isSelected = salesAmount === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSalesAmount(preset.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-400'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {preset.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DUAL COMPARISON PROGRESS BARS (30% vs 40%) */}
              <div className="space-y-5 pt-4 border-t border-stone-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span>Comparativo das Barras de Lucro:</span>
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    Cálculo direto sobre {formatCurrency(salesAmount)}
                  </span>
                </div>

                {/* BARRA 1: 30% LUCRO (Sem Investimento Padrão) */}
                <div 
                  onClick={() => setActivePlan('30')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activePlan === '30' || activePlan === 'both'
                      ? 'bg-stone-50/90 border-stone-300 shadow-xs'
                      : 'bg-white/40 border-stone-200 opacity-70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center">
                        30%
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-stone-800">
                        Consignado Padrão Romance
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-stone-500 mr-1.5">Lucro Líquido:</span>
                      <span className="text-base sm:text-lg font-black text-stone-900 font-mono">
                        {formatCurrency(profit30)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Track */}
                  <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-stone-500 to-stone-700 rounded-full transition-all duration-300 relative"
                      style={{ width: `${widthPercent30}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-stone-500 mt-1.5">
                    <span>Sem nenhum investimento inicial</span>
                    <span className="font-semibold">{Math.round(widthPercent30)}% da meta máx.</span>
                  </div>
                </div>

                {/* BARRA 2: 40% LUCRO (Com Catálogo Favorita) */}
                <div 
                  onClick={() => setActivePlan('40')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    activePlan === '40' || activePlan === 'both'
                      ? 'bg-gradient-to-br from-amber-50/90 via-rose-50/50 to-amber-50/90 border-amber-300 ring-2 ring-amber-400/40 shadow-md'
                      : 'bg-white/40 border-stone-200 opacity-70'
                  }`}
                >
                  {/* Badge */}
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider shadow-xs">
                    +10% de Bônus de Lucro
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 text-xs font-black flex items-center justify-center shadow-xs">
                        40%
                      </span>
                      <div>
                        <span className="text-xs sm:text-sm font-extrabold text-amber-950 block">
                          Consignado + Catálogo Favorita
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-amber-900 mr-1.5">Lucro Líquido:</span>
                      <span className="text-base sm:text-lg font-black text-rose-700 font-mono">
                        {formatCurrency(profit40)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Track */}
                  <div className="w-full h-3.5 bg-amber-200/70 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 rounded-full transition-all duration-300 relative shadow-xs"
                      style={{ width: `${widthPercent40}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-amber-900 mt-1.5 font-medium">
                    <span className="flex items-center gap-1 font-bold text-rose-700">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      +{formatCurrency(extraGain)} a mais no bolso
                    </span>
                    <span className="font-bold font-mono">{Math.round(widthPercent40)}% da meta máx.</span>
                  </div>
                </div>

                {/* Comparative Gain Highlight Card */}
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3 shadow-xs">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-emerald-900 text-sm">
                      Diferença real no seu bolso: +{formatCurrency(extraGain)} a cada 40 dias!
                    </p>
                    <p className="text-emerald-800 leading-relaxed text-xs">
                      Com o catálogo Favorita (pedido de R$ 400 a R$ 600 em utilidades), seu lucro sobe de 30% para 40% em todas as lingeries consignadas.
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* Profit Results Right Column (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 rounded-3xl p-6 sm:p-7 text-white space-y-6 shadow-2xl border border-white/15">
              
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 font-bold bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-500/40">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Projeção com 40% (Recomendado)</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-amber-200 font-serif-luxury tracking-tight pt-1">
                  {formatCurrency(profit40)}
                </div>
                <p className="text-xs text-stone-400">
                  Lucro líquido por ciclo de 40 dias (Vendas: {formatCurrency(salesAmount)})
                </p>
              </div>

              {/* Comparison Breakdown Table */}
              <div className="space-y-3 pt-3 border-t border-white/15 text-xs">
                <div className="flex items-center justify-between text-stone-300 py-1 border-b border-white/10">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-stone-400" />
                    Com 30% padrão:
                  </span>
                  <span className="font-mono font-bold text-stone-200 text-sm">
                    {formatCurrency(profit30)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-amber-300 py-1 border-b border-white/10">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Com 40% Favorita:
                  </span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {formatCurrency(profit40)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-300 pt-1">
                  <span>Equivalente mensal:</span>
                  <span className="font-bold text-white text-sm">
                    {formatCurrency((profit40 / 40) * 30)} / mês
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-300">
                  <span>Projeção anual (40%):</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {formatCurrency((profit40 / 40) * 365)} / ano
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-300">
                  <span>Investimento consignado:</span>
                  <span className="font-bold text-emerald-400">R$ 0,00 (Grátis)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectPlanAndScroll('sim')}
                  className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs sm:text-sm shadow-xl shadow-rose-600/30 border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Quero Lucrar 40% ({formatCurrency(profit40)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectPlanAndScroll('nao')}
                  className="w-full bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Quero iniciar com 30% sem catálogo ({formatCurrency(profit30)})</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

