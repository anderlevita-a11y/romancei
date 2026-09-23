import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Calendar, DollarSign, Gift, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConsignmentOrder, Lead, BusinessSettings } from '../../types';
import { formatCurrency, maskCPF, maskPhone } from '../../utils/validators';

interface AdminNewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (order: ConsignmentOrder) => void;
  initialLead?: Lead | null;
  settings: BusinessSettings;
}

export function AdminNewOrderModal({
  isOpen,
  onClose,
  onSaveOrder,
  initialLead,
  settings,
}: AdminNewOrderModalProps) {
  const [resellerName, setResellerName] = useState('');
  const [resellerCpf, setResellerCpf] = useState('');
  const [resellerPhone, setResellerPhone] = useState('');
  const [resellerCity, setResellerCity] = useState('');
  const [kitAmount, setKitAmount] = useState<number>(1800);
  const [favoritaAmount, setFavoritaAmount] = useState<number>(500);
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  // If opening from lead
  useEffect(() => {
    if (initialLead) {
      setResellerName(initialLead.fullName);
      setResellerCpf(initialLead.cpf);
      setResellerPhone(initialLead.phone);
      setResellerCity(initialLead.city);
      setFavoritaAmount(initialLead.wantsFavorita40 === 'sim' ? 500 : 0);
    }
  }, [initialLead]);

  if (!isOpen) return null;

  // Favorita rule: if favoritaAmount >= 400, commission is 40%, otherwise 30%
  const isFavoritaEligible = favoritaAmount >= settings.favoritaMinOrder;
  const commissionRate: 0.30 | 0.40 = isFavoritaEligible ? 0.40 : 0.30;
  const totalConsigned = kitAmount + favoritaAmount;

  // Calculate Due Date (Delivery + 40 days)
  const delivery = new Date(deliveryDate);
  const due = new Date(delivery.getTime() + settings.cycleDays * 24 * 60 * 60 * 1000);
  const dueDateStr = due.toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!resellerName.trim()) {
      setError('Informe o nome da revendedora.');
      return;
    }

    if (kitAmount <= 0) {
      setError('O valor do kit sem investimento de lingeries deve ser maior que zero.');
      return;
    }

    const newOrder: ConsignmentOrder = {
      id: `ord-${Date.now()}`,
      code: `KIT-2026-${Math.floor(10 + Math.random() * 90)}`,
      leadId: initialLead ? initialLead.id : 'manual',
      resellerName: resellerName.trim(),
      resellerCpf: resellerCpf.trim() || '000.000.000-00',
      resellerPhone: resellerPhone.trim(),
      resellerCity: resellerCity.trim() || 'Itapema',
      kitAmount,
      favoritaAmount,
      totalConsigned,
      commissionRate,
      deliveryDate: new Date(deliveryDate).toISOString(),
      dueDate: due.toISOString(),
      status: 'ativo',
    };

    onSaveOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-stone-200 relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-100 text-rose-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <PackagePlus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 leading-tight">
                Registrar Entrega de Kit Sem Investimento
              </h3>
              <p className="text-xs text-stone-500">
                Inicia o ciclo oficial de 40 dias para acerto de contas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs flex-1">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          
            {/* Reseller Details */}
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Nome da Revendedora *</label>
              <input
                type="text"
                required
                placeholder="Ex: Juliana Silveira"
                value={resellerName}
                onChange={(e) => setResellerName(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">WhatsApp</label>
                <input
                  type="tel"
                  placeholder="(47) 90000-0000"
                  value={resellerPhone}
                  onChange={(e) => setResellerPhone(maskPhone(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Cidade / Bairro</label>
                <input
                  type="text"
                  placeholder="Ex: Sua Cidade - Centro"
                  value={resellerCity}
                  onChange={(e) => setResellerCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                />
              </div>
            </div>

            {/* Consignment Kit Values */}
            <div className="p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
              <span className="font-bold text-stone-900 text-xs block">
                Composição do Mostruário Sem Investimento:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-600">
                    Lingeries Sem Investimento (R$) *
                  </label>
                  <input
                    type="number"
                    min="200"
                    step="50"
                    required
                    value={kitAmount}
                    onChange={(e) => setKitAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-600">
                    Catálogo Favorita (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={favoritaAmount}
                    onChange={(e) => setFavoritaAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-900 text-sm"
                  />
                </div>
              </div>

              {/* Rule Indicator Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1 gap-1">
                <span className="text-stone-500">Margem de Lucro Calculada:</span>
                <span className={`font-bold px-2.5 py-1 rounded-md text-center ${isFavoritaEligible ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-100 text-rose-900'}`}>
                  {isFavoritaEligible ? '40% Lucro (Catálogo Ativado ≥ R$ 400)' : '30% Lucro (Apenas Sem Investimento)'}
                </span>
              </div>
            </div>

            {/* Dates & Cycle Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Data de Entrega</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Vencimento (+40 dias)</label>
                <input
                  type="text"
                  disabled
                  value={dueDateStr}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-100 font-bold text-stone-800 text-xs cursor-not-allowed"
                />
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-500 block">Total em Mãos:</span>
                <span className="font-bold text-stone-900 text-base">{formatCurrency(totalConsigned)}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-stone-500 block">Margem:</span>
                <span className="font-bold text-rose-700 text-base">{commissionRate * 100}%</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 sm:py-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <span>Confirmar Entrega</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
