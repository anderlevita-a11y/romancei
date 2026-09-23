import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calculator, 
  Banknote, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle, 
  Fingerprint, 
  ScanFace, 
  ShieldCheck, 
  Sparkles,
  Lock
} from 'lucide-react';
import { ConsignmentOrder } from '../../types';
import { formatCurrency, formatDateBR } from '../../utils/validators';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  getBiometricConfig,
  authenticateDeviceBiometrics,
  BiometricSecurityConfig
} from '../../utils/webauthn';

interface AdminSettlementModalProps {
  order: ConsignmentOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSettlement: (
    orderId: string,
    soldAmount: number,
    returnedAmount: number,
    resellerProfit: number,
    netCompanyAmount: number,
    notes: string
  ) => void;
}

export function AdminSettlementModal({
  order,
  isOpen,
  onClose,
  onConfirmSettlement,
}: AdminSettlementModalProps) {
  const [soldAmount, setSoldAmount] = useState<number>(0);
  const [returnedAmount, setReturnedAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // WebAuthn Biometric Security State
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [bioConfig, setBioConfig] = useState<BiometricSecurityConfig>({ enabled: false, requireOnLogin: false, requireOnSettlement: false });
  const [useBiometricCheck, setUseBiometricCheck] = useState(true);
  const [isBioAuthenticating, setIsBioAuthenticating] = useState(false);
  const [bioVerified, setBioVerified] = useState(false);
  const [bioNotice, setBioNotice] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (order && isOpen) {
      // Default initial prediction: 85% sold, 15% returned
      const estimatedSold = Math.round(order.totalConsigned * 0.85);
      const estimatedReturned = order.totalConsigned - estimatedSold;
      setSoldAmount(estimatedSold);
      setReturnedAmount(estimatedReturned);
      setNotes('');
      setError('');
      setBioVerified(false);
      setBioNotice(null);

      const supported = isWebAuthnSupported();
      setHasWebAuthn(supported);
      const config = getBiometricConfig();
      setBioConfig(config);
      setUseBiometricCheck(config.requireOnSettlement || config.enabled || supported);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const commissionRate = order.commissionRate;
  const resellerProfit = soldAmount * commissionRate;
  const netCompanyAmount = soldAmount - resellerProfit;

  // Total entered vs total consigned
  const accountedTotal = soldAmount + returnedAmount;
  const diffFromConsigned = accountedTotal - order.totalConsigned;

  const handleSoldChange = (val: number) => {
    setSoldAmount(val);
    if (val <= order.totalConsigned) {
      setReturnedAmount(Math.max(0, order.totalConsigned - val));
    }
  };

  const handleCompleteWithBiometrics = async () => {
    setError('');
    setIsBioAuthenticating(true);
    setBioNotice(null);

    try {
      const result = await authenticateDeviceBiometrics({
        promptReason: `Autorize o acerto financeiro de ${formatCurrency(netCompanyAmount)} com sua biometria`,
      });

      setIsBioAuthenticating(false);

      if (result.success) {
        setBioVerified(true);
        setBioNotice({
          type: 'success',
          text: 'Assinatura biométrica confirmada com sucesso via WebAuthn!',
        });

        // Append biometric signature note
        const signNote = notes.trim()
          ? `${notes.trim()} | [🔐 Assinado biometricamente via WebAuthn às ${new Date().toLocaleTimeString('pt-BR')}]`
          : `[🔐 Assinado biometricamente via WebAuthn às ${new Date().toLocaleTimeString('pt-BR')}]`;

        setTimeout(() => {
          onConfirmSettlement(
            order.id,
            soldAmount,
            returnedAmount,
            resellerProfit,
            netCompanyAmount,
            signNote
          );
        }, 500);
      } else if (result.canceled) {
        setBioNotice({
          type: 'warning',
          text: 'Validação biométrica cancelada. Você pode tentar novamente ou desmarcar a exigência biométrica.',
        });
      } else {
        setBioNotice({
          type: 'error',
          text: result.error || 'Falha na leitura biométrica do dispositivo.',
        });
      }
    } catch (err: any) {
      setIsBioAuthenticating(false);
      setBioNotice({
        type: 'error',
        text: 'Erro ao acionar o sensor biométrico.',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (soldAmount < 0 || returnedAmount < 0) {
      setError('Os valores não podem ser negativos.');
      return;
    }

    // If biometric check is requested and not verified yet, trigger biometric flow
    if (hasWebAuthn && useBiometricCheck && !bioVerified) {
      handleCompleteWithBiometrics();
      return;
    }

    onConfirmSettlement(
      order.id,
      soldAmount,
      returnedAmount,
      resellerProfit,
      netCompanyAmount,
      notes.trim()
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-stone-200 relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 leading-tight">
                Realizar Acerto de 40 Dias
              </h3>
              <p className="text-xs text-stone-500">
                Revendedora: <strong className="text-stone-900">{order.resellerName}</strong> ({order.code})
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
          
            {/* Overview of the Original Kit */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-stone-500 block">Total do Mostruário</span>
                <span className="text-xs sm:text-sm font-black text-stone-900">{formatCurrency(order.totalConsigned)}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Lucro Fixado</span>
                <span className="text-xs sm:text-sm font-black text-rose-700">{order.commissionRate * 100}%</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Data Entrega</span>
                <span className="text-xs sm:text-sm font-bold text-stone-700">{formatDateBR(order.deliveryDate)}</span>
              </div>
            </div>

            {/* Settlement Inputs */}
            <div className="space-y-3 bg-rose-50/40 p-3.5 sm:p-4 rounded-2xl border border-rose-100">
              <span className="font-bold text-stone-900 block text-xs">
                Valores Apurados no Acerto:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-800 flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total VENDIDO (R$) *</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={soldAmount}
                    onChange={(e) => handleSoldChange(Number(e.target.value))}
                    className="w-full p-2.5 sm:p-3 rounded-xl border border-emerald-300 bg-white font-black text-emerald-950 text-sm sm:text-base focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1">
                    <RefreshCcw className="w-3.5 h-3.5 text-stone-500" />
                    <span>Valor DEVOLVIDO (R$)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={returnedAmount}
                    onChange={(e) => setReturnedAmount(Number(e.target.value))}
                    className="w-full p-2.5 sm:p-3 rounded-xl border border-stone-300 bg-white font-bold text-stone-800 text-sm sm:text-base"
                  />
                </div>
              </div>

              {diffFromConsigned !== 0 && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Aviso: A soma de vendido + devolvido ({formatCurrency(accountedTotal)}) difere em {formatCurrency(Math.abs(diffFromConsigned))} do total inicial ({formatCurrency(order.totalConsigned)}).
                </p>
              )}
            </div>

            {/* Automatic Calculation Results */}
            <div className="bg-gradient-to-r from-stone-900 to-rose-950 p-4 sm:p-5 rounded-2xl text-white space-y-2.5 shadow-md">
              <div className="flex items-center justify-between text-xs border-b border-white/15 pb-2">
                <span className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                  Lucro Revendedora ({commissionRate * 100}%):
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-400 font-serif-luxury">
                  {formatCurrency(resellerProfit)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 text-[11px]">
                  Líquido Distribuidora (Romance):
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  {formatCurrency(netCompanyAmount)}
                </span>
              </div>
            </div>

            {/* Optional WebAuthn Biometric Security Layer */}
            {hasWebAuthn && (
              <div className="p-3.5 rounded-2xl bg-stone-900 text-white border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white block">
                        Assinatura Biométrica (WebAuthn)
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        Touch ID, Face ID, Windows Hello ou Sensor Digital
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useBiometricCheck}
                      onChange={(e) => setUseBiometricCheck(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {bioNotice && (
                  <div className={`p-2.5 rounded-xl text-[11px] flex items-center gap-2 ${
                    bioNotice.type === 'success'
                      ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/40'
                      : bioNotice.type === 'warning'
                      ? 'bg-amber-950/90 text-amber-200 border border-amber-500/40'
                      : 'bg-rose-950/90 text-rose-200 border border-rose-500/40'
                  }`}>
                    {bioNotice.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span>{bioNotice.text}</span>
                  </div>
                )}

                {bioVerified && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Transação validada por biometria do dispositivo</span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Observações do Acerto (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Devolveu 3 peças tamanho P. Pagamento efetuado via PIX."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
              />
            </div>
          </div>

          {/* Actions */}
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
              disabled={isBioAuthenticating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all disabled:opacity-60"
            >
              {isBioAuthenticating ? (
                <>
                  <Fingerprint className="w-4 h-4 animate-pulse text-amber-300" />
                  <span>Validando Biometria...</span>
                </>
              ) : hasWebAuthn && useBiometricCheck && !bioVerified ? (
                <>
                  <ScanFace className="w-4 h-4" />
                  <span>Autorizar com Biometria</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir Acerto</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

