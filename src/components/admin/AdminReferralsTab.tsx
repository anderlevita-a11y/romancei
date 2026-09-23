import React, { useState } from 'react';
import { 
  Gift, 
  Search, 
  User, 
  CreditCard, 
  Phone, 
  Coins, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  Check, 
  Users, 
  ExternalLink,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  QrCode,
  ArrowUpRight,
  Send,
  Building2,
  Save,
  Filter
} from 'lucide-react';
import { ReferralCoupon, Lead, BusinessSettings, LeadStatus } from '../../types';
import { formatCurrency, maskCPF, maskPhone, isValidCPF, generateCouponCode, buildWhatsAppLink } from '../../utils/validators';

interface AdminReferralsTabProps {
  coupons: ReferralCoupon[];
  leads: Lead[];
  settings: BusinessSettings;
  onSaveCoupon: (coupon: ReferralCoupon) => void;
  onDeleteCoupon: (couponId: string) => void;
  onUpdateLeadStatus?: (leadId: string, status: LeadStatus) => void;
}

export function AdminReferralsTab({
  coupons,
  leads,
  settings,
  onSaveCoupon,
  onDeleteCoupon,
  onUpdateLeadStatus,
}: AdminReferralsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_payment' | 'paid'>('all');
  const [selectedCoupon, setSelectedCoupon] = useState<ReferralCoupon | null>(null);
  const [isNewCouponModalOpen, setIsNewCouponModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState<string | null>(null);

  // Payout modal state
  const [payoutCoupon, setPayoutCoupon] = useState<ReferralCoupon | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  // New manual coupon state
  const [newFullName, setNewFullName] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('Itapema');
  const [newPixKey, setNewPixKey] = useState('');
  const [newPixKeyType, setNewPixKeyType] = useState<'cpf' | 'telefone' | 'email' | 'aleatoria' | 'cnpj'>('cpf');
  const [newBankName, setNewBankName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Calculations for Distributor Dashboard
  const totalCouponsCount = coupons.length;
  
  // Total leads that used any referral coupon
  const leadsWithReferral = leads.filter((l) => Boolean(l.referralCouponCode));
  
  // Leads with delivered status that generated credit
  const deliveredReferrals = leadsWithReferral.filter(
    (l) => l.status === 'kit_entregue' || l.status === 'acerto_realizado'
  );

  const totalCreditsGenerated = deliveredReferrals.length * 10;
  const totalPaidOut = coupons.reduce((acc, c) => acc + (c.paidBalance || 0), 0);
  const totalPendingPayout = Math.max(0, totalCreditsGenerated - totalPaidOut);

  // Filter coupons based on search term & status
  const filteredCoupons = coupons.filter((c) => {
    const term = searchTerm.toLowerCase();
    const cleanTermDigits = term.replace(/\D/g, '');
    const couponCpfClean = (c.cpf || '').replace(/\D/g, '');
    const matchesSearch = (
      (c.fullName && c.fullName.toLowerCase().includes(term)) ||
      (c.code && c.code.toLowerCase().includes(term)) ||
      (cleanTermDigits && couponCpfClean.includes(cleanTermDigits)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.pixKey && c.pixKey.toLowerCase().includes(term))
    );

    if (!matchesSearch) return false;

    // Calculate coupon balance
    const related = leads.filter(
      (l) => l.referralCouponCode && l.referralCouponCode.toUpperCase() === c.code.toUpperCase()
    );
    const delivered = related.filter((l) => l.status === 'kit_entregue' || l.status === 'acerto_realizado').length;
    const earned = delivered * 10;
    const paid = c.paidBalance || 0;
    const remaining = Math.max(0, earned - paid);

    if (statusFilter === 'pending_payment') {
      return remaining > 0;
    }
    if (statusFilter === 'paid') {
      return paid > 0 && remaining === 0;
    }
    return true;
  });

  const handleCopy = async (code: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyPix = async (pix: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pix);
        setCopiedPix(pix);
        setTimeout(() => setCopiedPix(null), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newFullName.trim() || newFullName.trim().split(' ').length < 2) {
      setFormError('Informe o nome completo do titular.');
      return;
    }

    const cleanCpf = newCpf.replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11 || !isValidCPF(newCpf)) {
      setFormError('CPF inválido. Verifique os dígitos digitados.');
      return;
    }

    // Check if CPF already has coupon
    const existing = coupons.find((c) => (c.cpf || '').replace(/\D/g, '') === cleanCpf);
    if (existing) {
      setFormError(`Este CPF já possui o cupom ativo: ${existing.code} (${existing.fullName})`);
      return;
    }

    const code = generateCouponCode(newFullName, newCpf);
    const newCoupon: ReferralCoupon = {
      id: `coupon-${Date.now()}`,
      code,
      fullName: newFullName.trim(),
      cpf: newCpf.trim(),
      phone: newPhone.trim(),
      city: newCity.trim() || 'Itapema',
      pixKey: newPixKey.trim() || newCpf.trim(),
      pixKeyType: newPixKeyType || 'cpf',
      bankName: newBankName.trim() || undefined,
      creditBalance: 0,
      paidBalance: 0,
      status: 'ativo',
      totalReferralsCount: 0,
      deliveredReferralsCount: 0,
      createdAt: new Date().toISOString(),
      notes: newNotes.trim() || undefined,
    };

    onSaveCoupon(newCoupon);
    setIsNewCouponModalOpen(false);
    setNewFullName('');
    setNewCpf('');
    setNewPhone('');
    setNewPixKey('');
    setNewBankName('');
    setNewNotes('');
  };

  const handleConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutCoupon) return;

    const amountNum = parseFloat(payoutAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Informe um valor de pagamento válido.');
      return;
    }

    const currentPaid = payoutCoupon.paidBalance || 0;
    const newPaidTotal = currentPaid + amountNum;

    const updatedCoupon: ReferralCoupon = {
      ...payoutCoupon,
      paidBalance: newPaidTotal,
      notes: payoutNotes.trim()
        ? `${payoutCoupon.notes ? payoutCoupon.notes + '\n' : ''}[${new Date().toLocaleDateString('pt-BR')}] Pago Pix R$ ${amountNum.toFixed(2)}: ${payoutNotes.trim()}`
        : payoutCoupon.notes,
      updatedAt: new Date().toISOString(),
    };

    onSaveCoupon(updatedCoupon);
    setPayoutCoupon(null);
    setPayoutAmount('');
    setPayoutNotes('');
  };

  // Export CSV for distributor
  const handleExportCsv = () => {
    const headers = [
      'Codigo Cupom',
      'Titular do Cupom',
      'CPF Titular',
      'Telefone WhatsApp',
      'Chave Pix',
      'Tipo Pix',
      'Banco',
      'Cidade',
      'Total Indicacoes Cadastradas',
      'Kits Entregues (Aprovados)',
      'Total Gerado (R$ 10 cada)',
      'Total Ja Pago (Pix)',
      'Saldo Pendente a Pagar',
      'Status Cupom',
      'Data de Criacao',
    ];

    const rows = coupons.map((c) => {
      const related = leads.filter(
        (l) => l.referralCouponCode && l.referralCouponCode.toUpperCase() === c.code.toUpperCase()
      );
      const delivered = related.filter((l) => l.status === 'kit_entregue' || l.status === 'acerto_realizado').length;
      const earned = delivered * 10;
      const paid = c.paidBalance || 0;
      const pending = Math.max(0, earned - paid);

      return [
        c.code,
        `"${(c.fullName || '').replace(/"/g, '""')}"`,
        c.cpf,
        c.phone || '',
        c.pixKey || c.cpf,
        c.pixKeyType || 'CPF',
        c.bankName || '',
        c.city || 'Itapema',
        related.length,
        delivered,
        formatCurrency(earned),
        formatCurrency(paid),
        formatCurrency(pending),
        c.status || 'ativo',
        c.createdAt,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_indicacoes_romance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Cupons Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            {totalCouponsCount}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">1 cupom exclusivo por CPF</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Indicações Recebidas</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">
            {leadsWithReferral.length}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">Cadastros vinculados a cupons</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Kits Entregues (Aprovados)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {deliveredReferrals.length}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Total Gerado: {formatCurrency(totalCreditsGenerated)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-900 to-stone-900 text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Pendente a Pagar (Pix)</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2">
            {formatCurrency(totalPendingPayout)}
          </div>
          <p className="text-[11px] text-rose-200 mt-0.5">
            Já Pago: {formatCurrency(totalPaidOut)}
          </p>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-rose-600" />
              <span>Gestão de Cupons & Bonificações de Indicação</span>
            </h3>
            <p className="text-xs text-stone-500">
              Controle detalhado de cupons vinculados ao CPF, conferência de entregas, pagamentos Pix e extratos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-stone-200 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Exportar dados para planilha Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewCouponModalOpen(true)}
              className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Cupom Manual</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, nome da cliente, CPF, Pix ou WhatsApp..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Quick status tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todos ({coupons.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending_payment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'pending_payment'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-100/50'
              }`}
            >
              A Pagar
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100/50'
              }`}
            >
              Quitados
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Grid of Coupons */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Cupom</th>
                <th className="py-3 px-4">Titular / CPF</th>
                <th className="py-3 px-4">Chave Pix</th>
                <th className="py-3 px-4 text-center">Cadastros</th>
                <th className="py-3 px-4 text-center">Kits Entregues</th>
                <th className="py-3 px-4 text-right">Total Gerado</th>
                <th className="py-3 px-4 text-right">Saldo a Pagar</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    <Gift className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    Nenhum cupom encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const relatedLeads = leads.filter(
                    (l) => l.referralCouponCode && l.referralCouponCode.toUpperCase() === coupon.code.toUpperCase()
                  );
                  const deliveredCount = relatedLeads.filter(
                    (l) => l.status === 'kit_entregue' || l.status === 'acerto_realizado'
                  ).length;
                  const totalEarned = deliveredCount * 10;
                  const paid = coupon.paidBalance || 0;
                  const pendingBalance = Math.max(0, totalEarned - paid);
                  const pix = coupon.pixKey || coupon.cpf;

                  return (
                    <tr key={coupon.id} className="hover:bg-rose-50/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            className="text-stone-400 hover:text-stone-600 p-1 rounded-md cursor-pointer"
                            title="Copiar Código do Cupom"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{coupon.fullName}</div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          CPF: {coupon.cpf} {coupon.city ? `• ${coupon.city}` : ''}
                        </div>
                        {coupon.phone && (
                          <div className="text-[10px] text-stone-400">{coupon.phone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="font-mono text-stone-800 text-[11px] max-w-[140px] truncate" title={pix}>
                            {pix}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyPix(pix)}
                            className="text-stone-400 hover:text-emerald-600 p-1 rounded-md cursor-pointer"
                            title="Copiar Chave Pix"
                          >
                            {copiedPix === pix ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-stone-400 block">
                          {coupon.pixKeyType?.toUpperCase() || 'CPF'} {coupon.bankName ? `(${coupon.bankName})` : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full">
                          {relatedLeads.length}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {deliveredCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-stone-700">
                          {formatCurrency(totalEarned)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {pendingBalance > 0 ? (
                          <span className="font-black text-sm text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                            {formatCurrency(pendingBalance)}
                          </span>
                        ) : totalEarned > 0 ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Quitado ({formatCurrency(paid)})
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">R$ 0,00</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {pendingBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayoutCoupon(coupon);
                                setPayoutAmount(pendingBalance.toString());
                                setPayoutNotes('');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Registrar pagamento de bônus via Pix"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Pagar Pix</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedCoupon(coupon)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer"
                            title="Ver relação de indicadas deste cupom"
                          >
                            Extrato ({relatedLeads.length})
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir o cupom ${coupon.code} de ${coupon.fullName}?`)) {
                                onDeleteCoupon(coupon.id);
                              }
                            }}
                            className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Excluir cupom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Payout / Payment */}
      {payoutCoupon && (() => {
        const related = leads.filter(
          (l) => l.referralCouponCode && l.referralCouponCode.toUpperCase() === payoutCoupon.code.toUpperCase()
        );
        const delivered = related.filter((l) => l.status === 'kit_entregue' || l.status === 'acerto_realizado').length;
        const totalEarned = delivered * 10;
        const paid = payoutCoupon.paidBalance || 0;
        const pending = Math.max(0, totalEarned - paid);
        const pix = payoutCoupon.pixKey || payoutCoupon.cpf;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden">
              <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <h4 className="font-serif-luxury text-lg font-bold text-white">
                    Registrar Pagamento Pix
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPayoutCoupon(null)}
                  className="text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmPayout} className="p-5 space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs space-y-1">
                  <p className="font-bold text-emerald-950">{payoutCoupon.fullName}</p>
                  <p className="text-emerald-800">Cupom: <strong className="font-mono">{payoutCoupon.code}</strong> • CPF: {payoutCoupon.cpf}</p>
                  <div className="pt-1 flex items-center justify-between border-t border-emerald-200/60 mt-1">
                    <span className="text-stone-600">Saldo Pendente:</span>
                    <strong className="text-emerald-800 text-sm">{formatCurrency(pending)}</strong>
                  </div>
                </div>

                {/* Pix data copy card */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs space-y-2">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Chave Pix para Transferência:</span>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200">
                    <div className="font-mono font-bold text-stone-900 truncate mr-2">{pix}</div>
                    <button
                      type="button"
                      onClick={() => handleCopyPix(pix)}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2 py-1 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer text-[11px]"
                    >
                      {copiedPix === pix ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPix === pix ? 'Copiado' : 'Copiar Pix'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Tipo: <strong>{payoutCoupon.pixKeyType?.toUpperCase() || 'CPF'}</strong> {payoutCoupon.bankName ? `• Banco: ${payoutCoupon.bankName}` : ''}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Valor Pago (R$) *</label>
                  <input
                    type="text"
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Ex: 50.00"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-sm font-bold text-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Comprovante / Observação (Opcional)</label>
                  <input
                    type="text"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    placeholder="Ex: Pix efetuado ref. 5 kits entregues..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                {/* WhatsApp Receipt CTA */}
                {payoutCoupon.phone && (
                  <div className="pt-1">
                    <a
                      href={buildWhatsAppLink(
                        payoutCoupon.phone,
                        `Olá ${payoutCoupon.fullName.split(' ')[0]}! Seu bônus de indicação Romance no valor de R$ ${payoutAmount || pending} referente ao cupom ${payoutCoupon.code} foi enviado com sucesso via Pix para sua chave ${pix}! Muito obrigado por indicar!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Enviar Comprovante no WhatsApp</span>
                    </a>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayoutCoupon(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar Pagamento</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal: View Details and Statement of a Specific Coupon */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-6">
            
            <div className="bg-gradient-to-r from-stone-900 to-rose-950 text-white p-5 sm:p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-300/30">
                  Extrato do Cupom: {selectedCoupon.code}
                </span>
                <h4 className="font-serif-luxury text-xl font-bold text-white mt-1">
                  {selectedCoupon.fullName}
                </h4>
                <p className="text-xs text-stone-300 font-mono">
                  CPF: {selectedCoupon.cpf} • WhatsApp: {selectedCoupon.phone || 'Não informado'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCoupon(null)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {(() => {
                const related = leads.filter(
                  (l) => l.referralCouponCode && l.referralCouponCode.toUpperCase() === selectedCoupon.code.toUpperCase()
                );
                const delivered = related.filter((l) => l.status === 'kit_entregue' || l.status === 'acerto_realizado');
                const totalBalance = delivered.length * 10;
                const paid = selectedCoupon.paidBalance || 0;
                const pending = Math.max(0, totalBalance - paid);

                return (
                  <div className="space-y-4">
                    {/* Summary card */}
                    <div className="grid grid-cols-4 gap-2 bg-stone-50 border border-stone-200 p-3 rounded-2xl text-center text-xs">
                      <div>
                        <span className="text-stone-500 block text-[10px]">Total Amigas</span>
                        <strong className="text-base text-stone-900">{related.length}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-700 block text-[10px]">Kits Entregues</span>
                        <strong className="text-base text-emerald-600">{delivered.length}</strong>
                      </div>
                      <div>
                        <span className="text-stone-700 block text-[10px]">Já Pago</span>
                        <strong className="text-base text-stone-800">{formatCurrency(paid)}</strong>
                      </div>
                      <div>
                        <span className="text-amber-600 block text-[10px]">A Pagar</span>
                        <strong className="text-base text-amber-600">{formatCurrency(pending)}</strong>
                      </div>
                    </div>

                    {/* Pix Details */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-bold block">Chave Pix do Titular:</span>
                        <span className="font-mono font-bold text-stone-900">
                          {selectedCoupon.pixKey || selectedCoupon.cpf} ({selectedCoupon.pixKeyType || 'CPF'})
                        </span>
                        {selectedCoupon.bankName && (
                          <span className="text-stone-500 text-[11px] block">Banco: {selectedCoupon.bankName}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyPix(selectedCoupon.pixKey || selectedCoupon.cpf)}
                        className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPix === (selectedCoupon.pixKey || selectedCoupon.cpf) ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copiar Pix</span>
                      </button>
                    </div>

                    {/* List of referred leads */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Amigas Cadastradas com Este Cupom:
                      </h5>

                      {related.length === 0 ? (
                        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
                          Nenhum cadastro vinculado ainda.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {related.map((lead) => {
                            const isDelivered = lead.status === 'kit_entregue' || lead.status === 'acerto_realizado';
                            return (
                              <div
                                key={lead.id}
                                className="p-3.5 bg-white border border-stone-200 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-stone-900">{lead.fullName}</span>
                                    <span className="text-[10px] text-stone-400 font-mono">({lead.protocol})</span>
                                  </div>
                                  <p className="text-[11px] text-stone-500">
                                    {lead.city} • WhatsApp: {lead.phone}
                                  </p>
                                </div>

                                <div className="text-right flex items-center gap-2">
                                  {isDelivered ? (
                                    <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-1 rounded-md text-[10px] flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>R$ 10,00 (Entregue)</span>
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="bg-amber-100 text-amber-900 font-medium px-2 py-0.5 rounded-md text-[10px]">
                                        Status: {lead.status}
                                      </span>
                                      {onUpdateLeadStatus && (
                                        <button
                                          type="button"
                                          onClick={() => onUpdateLeadStatus(lead.id, 'kit_entregue')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-1 rounded-md shadow-2xs transition-all cursor-pointer"
                                          title="Marcar kit como entregue e creditar R$ 10,00"
                                        >
                                          Aprovar Entrega (+ R$ 10)
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCoupon(null)}
                        className="bg-stone-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                      >
                        Fechar Extrato
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Manual Coupon */}
      {isNewCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <h4 className="font-serif-luxury text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-500" />
                <span>Cadastrar Cupom Manualmente</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsNewCouponModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ex: Amanda Silva"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">CPF *</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={newCpf}
                    onChange={(e) => setNewCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">WhatsApp</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={newPhone}
                    onChange={(e) => setNewPhone(maskPhone(e.target.value))}
                    placeholder="(47) 99999-9999"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Tipo Chave Pix</label>
                  <select
                    value={newPixKeyType}
                    onChange={(e) => setNewPixKeyType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-white"
                  >
                    <option value="cpf">CPF</option>
                    <option value="telefone">Telefone</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória</option>
                    <option value="cnpj">CNPJ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Chave Pix</label>
                  <input
                    type="text"
                    value={newPixKey}
                    onChange={(e) => setNewPixKey(e.target.value)}
                    placeholder="Chave Pix"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Banco</label>
                  <input
                    type="text"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="Ex: Nubank"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Cidade</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Ex: Itapema"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Observações Internas (Opcional)</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Revendedora destaque de Itapema Meia Praia..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Criar e Vincular Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
