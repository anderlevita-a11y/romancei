import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Gift, 
  CheckCircle2, 
  Percent, 
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';
import { Lead, ConsignmentOrder, BusinessSettings } from '../../types';
import { formatCurrency } from '../../utils/validators';

interface AdminMetricsTabProps {
  leads: Lead[];
  orders: ConsignmentOrder[];
  settings: BusinessSettings;
}

export function AdminMetricsTab({ leads, orders, settings }: AdminMetricsTabProps) {
  // Calculations
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(
    (l) => l.status === 'aprovado' || l.status === 'kit_entregue' || l.status === 'acerto_realizado'
  ).length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const favoritaEnthusiasts = leads.filter((l) => l.wantsFavorita40 === 'sim').length;
  const favoritaPercentage = totalLeads > 0 ? Math.round((favoritaEnthusiasts / totalLeads) * 100) : 0;

  const totalConsignedActive = orders
    .filter((o) => o.status !== 'finalizado')
    .reduce((acc, o) => acc + o.totalConsigned, 0);

  const totalSoldHistory = orders
    .filter((o) => o.status === 'finalizado')
    .reduce((acc, o) => acc + (o.soldAmount || 0), 0);

  const totalProfitDistributed = orders
    .filter((o) => o.status === 'finalizado')
    .reduce((acc, o) => acc + (o.resellerProfit || 0), 0);

  const totalNetRevenueCompany = orders
    .filter((o) => o.status === 'finalizado')
    .reduce((acc, o) => acc + (o.netCompanyAmount || 0), 0);

  // Region breakdown
  const regionCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const r = l.city.split(' - ')[0] || l.city;
    regionCounts[r] = (regionCounts[r] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Total de Cadastros</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900 font-serif-luxury">
            {totalLeads}
          </div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{conversionRate}% taxa de conversão</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Mostruários em Campo</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-900 font-serif-luxury">
            {formatCurrency(totalConsignedActive)}
          </div>
          <div className="text-xs text-stone-500">
            {orders.filter((o) => o.status !== 'finalizado').length} maletas em circulação
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Lucro Pago às Revendedoras</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700 font-serif-luxury">
            {formatCurrency(totalProfitDistributed)}
          </div>
          <div className="text-xs text-amber-800">
            Renda gerada para revendedoras
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Faturamento Romance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 font-serif-luxury">
            {formatCurrency(totalNetRevenueCompany)}
          </div>
          <div className="text-xs text-emerald-600 font-semibold">
            Líquido recolhido nos acertos
          </div>
        </div>

      </div>

      {/* Deep Dive Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Favorita 40% Engagement */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Adesão ao Catálogo Favorita (Lucro 40%)
              </h3>
              <p className="text-xs text-stone-500">
                Interesse das revendedoras no pedido de R$ 400 a R$ 600
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-stone-800">
              <span>Opção com Catálogo Favorita (40% de lucro):</span>
              <span className="text-amber-700 font-black">{favoritaPercentage}% ({favoritaEnthusiasts})</span>
            </div>
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${favoritaPercentage}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 pt-1">
              Revendedoras com Catálogo Favorita vendem em média <strong>35% a mais</strong> por ciclo de 40 dias.
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 text-xs text-stone-700 space-y-1">
            <span className="font-bold text-stone-900 block">Dica de Gestão:</span>
            <p>
              Ao entrar em contato com novos leads, enfatize que o Catálogo Favorita amplia a linha para cosméticos e utilidades, facilitando o aumento do lucro para 40%.
            </p>
          </div>
        </div>

        {/* Region Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Distribuição Geográfica dos Cadastros
              </h3>
              <p className="text-xs text-stone-500">
                Concentração de revendedoras por cidade/bairro
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(regionCounts).map(([region, count]) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={region} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-stone-800">
                    <span>{region}</span>
                    <span className="text-stone-500">{count} revendedora(s) ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
