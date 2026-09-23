import { useState } from 'react';
import { 
  PackageCheck, 
  Clock, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  Receipt, 
  MessageCircle, 
  FileText,
  Calculator,
  RefreshCw,
  Gift,
  Trash2,
  X,
  ShieldAlert,
  User,
  Phone,
  MapPin
} from 'lucide-react';
import { ConsignmentOrder, BusinessSettings } from '../../types';
import { formatCurrency, formatDateBR, getDaysRemaining, buildWhatsAppLink } from '../../utils/validators';

interface AdminOrdersTabProps {
  orders: ConsignmentOrder[];
  settings: BusinessSettings;
  onOpenNewOrderModal: () => void;
  onOpenSettlementModal: (order: ConsignmentOrder) => void;
  onOpenReceiptModal: (order: ConsignmentOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export function AdminOrdersTab({
  orders,
  settings,
  onOpenNewOrderModal,
  onOpenSettlementModal,
  onOpenReceiptModal,
  onDeleteOrder,
}: AdminOrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'finalizados'>('todos');
  const [orderToDelete, setOrderToDelete] = useState<ConsignmentOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    if (onDeleteOrder) {
      onDeleteOrder(orderToDelete.id);
      showToast(`Sacola "${orderToDelete.code}" de ${orderToDelete.resellerName} foi excluída com sucesso.`);
    }
    setOrderToDelete(null);
  };

  // Filter logic
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.resellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.resellerPhone.includes(searchTerm) ||
      ord.resellerCity.toLowerCase().includes(searchTerm.toLowerCase());

    const isFinalized = ord.status === 'finalizado';
    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'ativos' && !isFinalized) ||
      (statusFilter === 'finalizados' && isFinalized);

    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalInCirculation = orders
    .filter((o) => o.status !== 'finalizado')
    .reduce((acc, o) => acc + o.totalConsigned, 0);

  const totalSettledRevenue = orders
    .filter((o) => o.status === 'finalizado')
    .reduce((acc, o) => acc + (o.soldAmount || 0), 0);

  const activeKitsCount = orders.filter((o) => o.status !== 'finalizado').length;

  return (
    <div className="space-y-6">
      
      {/* Top Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-900 to-stone-900 text-white p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs text-rose-300 font-semibold uppercase tracking-wider block">
            Capital em Mostruários Ativos
          </span>
          <span className="text-2xl sm:text-3xl font-black font-serif-luxury">
            {formatCurrency(totalInCirculation)}
          </span>
          <span className="text-xs text-stone-300 block pt-1">
            {activeKitsCount} maletas com revendedoras em campo
          </span>
        </div>

        <div className="bg-gradient-to-br from-emerald-800 to-stone-900 text-white p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider block">
            Total Já Vendido nos Acertos
          </span>
          <span className="text-2xl sm:text-3xl font-black font-serif-luxury text-emerald-400">
            {formatCurrency(totalSettledRevenue)}
          </span>
          <span className="text-xs text-stone-300 block pt-1">
            Ciclos de 40 dias concluídos com sucesso
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider block">
              Regra Oficial do Ciclo
            </span>
            <span className="text-xl font-bold text-stone-900">
              40 Dias de Mostruário
            </span>
            <p className="text-xs text-stone-500">
              Lucro de 30% ou 40% (Catálogo Favorita ≥ R$ 400).
            </p>
          </div>
          <button
            onClick={onOpenNewOrderModal}
            className="mt-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Entregar Novo Kit Sem Investimento</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Status Filter */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por revendedora, código do kit, telefone ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex-1 sm:flex-initial text-center ${
              statusFilter === 'todos' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('ativos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex-1 sm:flex-initial text-center ${
              statusFilter === 'ativos' ? 'bg-white text-rose-700 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Em Campo ({orders.filter((o) => o.status !== 'finalizado').length})
          </button>
          <button
            onClick={() => setStatusFilter('finalizados')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex-1 sm:flex-initial text-center ${
              statusFilter === 'finalizados' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Concluídos ({orders.filter((o) => o.status === 'finalizado').length})
          </button>
        </div>

      </div>

      {/* Orders List / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <PackageCheck className="w-12 h-12 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-700 text-sm">Nenhum pedido sem investimento encontrado</p>
            <p className="text-xs text-stone-500">Clique no botão "Entregar Novo Kit Sem Investimento" para começar um ciclo.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isSettled = ord.status === 'finalizado';
            const timing = getDaysRemaining(ord.dueDate);
            
            // Reminder WhatsApp text
            const defaultReminder = 'Olá {nome}! Tudo bem? Passando para lembrar que o acerto do seu ciclo de 40 dias do Mostruário Romance vence em {dias} dias ({data}). Como foram as vendas?';
            const reminderTemplate = settings.settlementReminderTemplate || defaultReminder;
            const firstName = ord.resellerName ? ord.resellerName.split(' ')[0] : 'Revendedora';

            const reminderMsg = reminderTemplate
              .replace('{nome}', firstName)
              .replace('{dias}', String(timing.days))
              .replace('{data}', formatDateBR(ord.dueDate));

            return (
              <div
                key={ord.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  isSettled
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : timing.isOverdue
                    ? 'border-rose-300 bg-rose-50/20'
                    : timing.isUrgent
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-stone-200'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg">
                      {ord.code}
                    </span>
                    
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Acerto Concluído</span>
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        timing.isOverdue 
                            ? 'bg-rose-100 text-rose-800' 
                            : timing.isUrgent 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timing.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Reseller Header */}
                  <div>
                    <h4 className="font-bold text-stone-900 text-base">
                      {ord.resellerName}
                    </h4>
                    <p className="text-xs text-stone-500">
                      {ord.resellerCity} • {ord.resellerPhone}
                    </p>
                  </div>

                  {/* Values Breakdown */}
                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/70 space-y-2 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Lingeries Romance:</span>
                      <span className="font-semibold text-stone-900">{formatCurrency(ord.kitAmount)}</span>
                    </div>
                    {ord.favoritaAmount > 0 && (
                      <div className="flex justify-between text-amber-800">
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3 text-amber-600" />
                          <span>Catálogo Favorita:</span>
                        </span>
                        <span className="font-semibold">{formatCurrency(ord.favoritaAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                      <span>Total do Mostruário:</span>
                      <span className="text-sm text-rose-700">{formatCurrency(ord.totalConsigned)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>Margem Fixada:</span>
                      <span className="font-bold text-emerald-700">{ord.commissionRate * 100}% Lucro</span>
                    </div>
                  </div>

                  {/* Cycle Dates */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-500">
                    <div>
                      <span>Entrega:</span>
                      <p className="font-bold text-stone-800">{formatDateBR(ord.deliveryDate)}</p>
                    </div>
                    <div>
                      <span>Vencimento (40d):</span>
                      <p className="font-bold text-stone-800">{formatDateBR(ord.dueDate)}</p>
                    </div>
                  </div>

                  {/* If Finalized, show settlement results */}
                  {isSettled && (
                    <div className="bg-emerald-100/60 p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="flex justify-between text-emerald-950 font-bold">
                        <span>Lucro da Revendedora:</span>
                        <span>{formatCurrency(ord.resellerProfit || 0)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-800 text-[11px]">
                        <span>Recebido pela Romance:</span>
                        <span>{formatCurrency(ord.netCompanyAmount || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                  {!isSettled ? (
                    <>
                      <button
                        onClick={() => onOpenSettlementModal(ord)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Fazer Acerto</span>
                      </button>

                      <a
                        href={buildWhatsAppLink(ord.resellerPhone, reminderMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 text-stone-700 rounded-xl transition-colors shrink-0"
                        title="Enviar lembrete de acerto no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600 fill-current" />
                      </a>
                    </>
                  ) : (
                    <button
                      onClick={() => onOpenReceiptModal(ord)}
                      className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Ver Recibo Oficial</span>
                    </button>
                  )}

                  {/* Botão de Excluir com Confirmação */}
                  <button
                    type="button"
                    onClick={() => setOrderToDelete(ord)}
                    className="p-2.5 bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-700 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Excluir esta sacola/acerto"
                    aria-label={`Excluir sacola ${ord.code}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal de Confirmação de Exclusão de Sacola / Acerto */}
      {orderToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-order-title"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="modal-delete-order-title" className="text-lg font-bold text-stone-900 leading-tight">
                  Excluir Sacola / Acerto?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Confirmação de segurança para evitar exclusão acidental.
                </p>
              </div>
              <button
                onClick={() => setOrderToDelete(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Summary Box */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold bg-white text-stone-800 px-2.5 py-1 rounded-lg border border-stone-200">
                  {orderToDelete.code}
                </span>
                <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full ${
                  orderToDelete.status === 'finalizado'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {orderToDelete.status === 'finalizado' ? 'Acerto Concluído' : 'Sacola em Aberto'}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-stone-800 font-semibold">
                  <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{orderToDelete.resellerName}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-500">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{orderToDelete.resellerPhone}</span>
                  {orderToDelete.resellerCity && (
                    <>
                      <span>•</span>
                      <span>{orderToDelete.resellerCity}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/80 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-stone-400 block">Total Consignado:</span>
                  <span className="font-bold text-rose-700 text-xs">
                    {formatCurrency(orderToDelete.totalConsigned)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Entrega / Vencimento:</span>
                  <span className="font-medium text-stone-700">
                    {formatDateBR(orderToDelete.deliveryDate)} (40d)
                  </span>
                </div>
              </div>

              {orderToDelete.status === 'finalizado' && orderToDelete.soldAmount !== undefined && (
                <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200/70 text-[11px] space-y-1 text-emerald-900">
                  <div className="flex justify-between">
                    <span>Total Vendido:</span>
                    <span className="font-bold">{formatCurrency(orderToDelete.soldAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lucro Revendedora:</span>
                    <span className="font-bold">{formatCurrency(orderToDelete.resellerProfit || 0)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Warning Message */}
            <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Esta ação removerá definitivamente o registro desta sacola do painel e do banco de dados. 
                <strong className="block font-semibold mt-0.5">Essa ação não pode ser desfeita.</strong>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-800 flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium flex-1">{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
