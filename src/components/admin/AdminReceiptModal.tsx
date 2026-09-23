import { useRef } from 'react';
import { X, Printer, Share2, Sparkles, CheckCircle2, MessageCircle, Download } from 'lucide-react';
import { ConsignmentOrder, BusinessSettings } from '../../types';
import { formatCurrency, formatDateBR, buildWhatsAppLink } from '../../utils/validators';

interface AdminReceiptModalProps {
  order: ConsignmentOrder | null;
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
}

export function AdminReceiptModal({
  order,
  isOpen,
  onClose,
  settings,
}: AdminReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptSummaryText = `*COMPROVANTE DE ACERTO - ${settings.businessName || 'ROMANCE'}*\n` +
    `Código: ${order.code}\n` +
    `Revendedora: ${order.resellerName}\n` +
    `Data do Acerto: ${formatDateBR(order.settlementDate || new Date().toISOString())}\n` +
    `Total Vendido: ${formatCurrency(order.soldAmount || 0)}\n` +
    `Total Devolvido: ${formatCurrency(order.returnedAmount || 0)}\n` +
    `Lucro (${order.commissionRate * 100}%): ${formatCurrency(order.resellerProfit || 0)}\n` +
    `Valor Pago à Distribuidora: ${formatCurrency(order.netCompanyAmount || 0)}\n` +
    `\nParabéns pelo excelente ciclo! 🌸`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-stone-200 relative overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="p-3 sm:p-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif-luxury font-bold text-stone-900 text-sm sm:text-base">{settings.businessName || 'Romance Itapema'}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
              Recibo Oficial
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          {/* Receipt Printable Area */}
          <div ref={receiptRef} className="p-4 sm:p-6 bg-stone-50/70 rounded-2xl border border-stone-200 space-y-5">
            
            {/* Header */}
            <div className="text-center space-y-1 pb-4 border-b border-stone-200">
              <div className="flex items-center justify-center gap-2">
                <span className="font-serif-luxury text-xl sm:text-2xl font-bold text-stone-900">
                  {settings.businessName || 'Romance Itapema'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                  Oficial
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                Comprovante Oficial de Acerto do Mostruário Sem Investimento (40 Dias)
              </p>
              <p className="text-[10px] text-stone-400">
                Protocolo: <strong className="text-stone-700">{order.code}</strong>
              </p>
            </div>

            {/* Reseller Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
              <div>
                <span className="text-[10px] text-stone-400 block">Revendedora:</span>
                <span className="font-bold text-stone-900">{order.resellerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">CPF:</span>
                <span className="font-mono text-stone-900">{order.resellerCpf}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">Data de Entrega do Kit:</span>
                <span>{formatDateBR(order.deliveryDate)}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">Data do Acerto Final:</span>
                <span className="font-bold text-emerald-700">{formatDateBR(order.settlementDate || new Date().toISOString())}</span>
              </div>
            </div>

            {/* Detailed Financial Settlement Table */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden text-xs">
              <div className="p-3 bg-stone-100/70 font-bold text-stone-700 border-b border-stone-200 flex justify-between">
                <span>Item do Ciclo</span>
                <span>Valor</span>
              </div>
              <div className="p-3 space-y-2 divide-y divide-stone-100">
                <div className="flex justify-between text-stone-600">
                  <span>Mostruário Inicial Entregue:</span>
                  <span className="font-medium">{formatCurrency(order.totalConsigned)}</span>
                </div>
                <div className="flex justify-between text-stone-600 pt-2">
                  <span>Peças Devolvidas ao Estoque:</span>
                  <span className="font-medium">{formatCurrency(order.returnedAmount || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-2">
                  <span>Total Efetivamente Vendido:</span>
                  <span className="font-black text-emerald-700">{formatCurrency(order.soldAmount || 0)}</span>
                </div>
              </div>

              {/* Profit Highlight Box */}
              <div className="p-3.5 sm:p-4 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-900 block">
                    LUCRO DA REVENDEDORA ({order.commissionRate * 100}%):
                  </span>
                  <span className="text-[10px] text-emerald-700">Retido pela revendedora</span>
                </div>
                <span className="text-lg sm:text-xl font-black text-emerald-700 font-serif-luxury">
                  {formatCurrency(order.resellerProfit || 0)}
                </span>
              </div>

              {/* Amount paid to company */}
              <div className="p-3 bg-stone-900 text-white flex items-center justify-between text-xs font-bold">
                <span>Valor Pago à Romance:</span>
                <span className="text-sm font-mono text-amber-300">
                  {formatCurrency(order.netCompanyAmount || 0)}
                </span>
              </div>
            </div>

            {order.settlementNotes && (
              <div className="text-xs text-stone-500 bg-white p-3 rounded-xl border border-stone-200">
                <strong>Obs:</strong> {order.settlementNotes}
              </div>
            )}

            {/* Footer of Receipt */}
            <div className="text-center text-[10px] text-stone-400 space-y-1">
              <p className="font-semibold text-stone-600">
                Romance Itapema • Distribuidor Oficial: {settings.distributorName || 'Anderson Rodrigues'}
              </p>
              <p>WhatsApp: {settings.displayWhatsApp} • Itapema e Região/SC</p>
            </div>

          </div>
        </div>

        {/* Buttons for actions */}
        <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row gap-2 print:hidden shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2.5 sm:py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Recibo</span>
          </button>

          <a
            href={buildWhatsAppLink(order.resellerPhone, receiptSummaryText)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 sm:py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center transition-colors"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Enviar no WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
}
