import React, { useState } from 'react';
import { 
  Gift, 
  Sparkles, 
  Copy, 
  Check, 
  Search, 
  User, 
  CreditCard, 
  Phone, 
  Coins, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Share2,
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  Building2,
  MapPin,
  Save,
  DollarSign
} from 'lucide-react';
import { ReferralCoupon, BusinessSettings, Lead } from '../types';
import { isValidCPF, maskCPF, maskPhone, formatCurrency, generateCouponCode, buildWhatsAppLink } from '../utils/validators';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  coupons: ReferralCoupon[];
  leads: Lead[];
  onSaveCoupon?: (coupon: ReferralCoupon) => void;
  onGenerateCoupon?: (fullName: string, cpf: string, phone: string, city?: string, pixKey?: string, pixKeyType?: string, bankName?: string) => { coupon: ReferralCoupon; isExisting: boolean };
  onScrollToForm?: (presetMessage?: string) => void;
}

export function ReferralModal({
  isOpen,
  onClose,
  settings,
  coupons,
  leads,
  onSaveCoupon,
  onGenerateCoupon,
  onScrollToForm,
}: ReferralModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'consult'>('create');
  
  // Registration State
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Itapema');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'telefone' | 'email' | 'aleatoria' | 'cnpj'>('cpf');
  const [bankName, setBankName] = useState('');
  const [showPixFields, setShowPixFields] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdCoupon, setCreatedCoupon] = useState<ReferralCoupon | null>(null);
  const [isExistingNotice, setIsExistingNotice] = useState(false);
  const [copied, setCopied] = useState(false);

  // Consultation State
  const [searchCpf, setSearchCpf] = useState('');
  const [consultError, setConsultError] = useState('');
  const [consultResult, setConsultResult] = useState<{ coupon: ReferralCoupon; referredLeads: Lead[] } | null>(null);
  const [isEditingPix, setIsEditingPix] = useState(false);
  const [editPixKey, setEditPixKey] = useState('');
  const [editPixType, setEditPixType] = useState<'cpf' | 'telefone' | 'email' | 'aleatoria' | 'cnpj'>('cpf');
  const [editBankName, setEditBankName] = useState('');
  const [pixSavedNotice, setPixSavedNotice] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://romanceitapema.com.br';

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPF(e.target.value);
    setCpf(masked);
    if (!pixKey || pixKeyType === 'cpf') {
      setPixKey(masked);
    }
    if (errors.cpf) setErrors((prev) => ({ ...prev, cpf: '' }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(maskPhone(e.target.value));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
  };

  const handleSearchCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchCpf(maskCPF(e.target.value));
    setConsultError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().split(' ').length < 2) {
      newErrors.name = 'Informe seu nome completo (nome e sobrenome).';
    }

    const cleanCpf = (cpf || '').replace(/\D/g, '');
    if (!cleanCpf) {
      newErrors.cpf = 'Informe seu CPF para gerar seu cupom exclusivo.';
    } else if (cleanCpf.length !== 11 || !isValidCPF(cpf)) {
      newErrors.cpf = 'CPF inválido. Verifique os números digitados.';
    }

    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Informe seu WhatsApp com DDD.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let result: { coupon: ReferralCoupon; isExisting: boolean };

    if (onGenerateCoupon) {
      result = onGenerateCoupon(name.trim(), cpf.trim(), phone.trim(), city.trim(), pixKey.trim(), pixKeyType, bankName.trim());
    } else {
      const cleanCpfDigits = (cpf || '').replace(/\D/g, '');
      const existing = coupons.find((c) => (c.cpf || '').replace(/\D/g, '') === cleanCpfDigits);
      if (existing) {
        result = { coupon: existing, isExisting: true };
      } else {
        const code = generateCouponCode(name.trim(), cpf.trim());
        const newCoupon: ReferralCoupon = {
          id: `coupon-${Date.now()}`,
          code,
          fullName: name.trim(),
          cpf: cpf.trim(),
          phone: phone.trim(),
          city: city.trim() || 'Itapema',
          pixKey: pixKey.trim() || cpf.trim(),
          pixKeyType: pixKeyType || 'cpf',
          bankName: bankName.trim() || undefined,
          creditBalance: 0,
          paidBalance: 0,
          status: 'ativo',
          totalReferralsCount: 0,
          deliveredReferralsCount: 0,
          createdAt: new Date().toISOString(),
        };
        if (onSaveCoupon) {
          onSaveCoupon(newCoupon);
        }
        result = { coupon: newCoupon, isExisting: false };
      }
    }

    setCreatedCoupon(result.coupon);
    setIsExistingNotice(result.isExisting);
  };

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = (searchCpf || '').replace(/\D/g, '');

    if (!cleanCpf || cleanCpf.length !== 11 || !isValidCPF(searchCpf)) {
      setConsultError('Digite um CPF válido com 11 dígitos para consultar seus créditos.');
      setConsultResult(null);
      return;
    }

    const found = coupons.find((c) => (c.cpf || '').replace(/\D/g, '') === cleanCpf);
    if (!found) {
      setConsultError('Nenhum cupom de indicação encontrado para este CPF. Gere seu cupom na aba "Gerar Meu Cupom"!');
      setConsultResult(null);
      return;
    }

    // Buscar todos os leads vinculados a este cupom
    const relatedLeads = leads.filter(
      (l) => l.referralCouponCode && l.referralCouponCode.toUpperCase() === found.code.toUpperCase()
    );

    setConsultResult({ coupon: found, referredLeads: relatedLeads });
    setEditPixKey(found.pixKey || found.cpf);
    setEditPixType((found.pixKeyType as any) || 'cpf');
    setEditBankName(found.bankName || '');
    setIsEditingPix(false);
    setConsultError('');
  };

  const handleSavePixFromConsult = () => {
    if (!consultResult) return;
    const updatedCoupon: ReferralCoupon = {
      ...consultResult.coupon,
      pixKey: editPixKey.trim(),
      pixKeyType: editPixType,
      bankName: editBankName.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    if (onSaveCoupon) {
      onSaveCoupon(updatedCoupon);
    }
    setConsultResult({ ...consultResult, coupon: updatedCoupon });
    setIsEditingPix(false);
    setPixSavedNotice(true);
    setTimeout(() => setPixSavedNotice(false), 3000);
  };

  const getShareLink = (code: string) => {
    return `${baseUrl}/?cupom=${encodeURIComponent(code)}#cadastro`;
  };

  const handleCopyLink = async (code: string) => {
    const link = getShareLink(code);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const input = document.createElement('input');
        input.value = link;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
            title="Fechar"
          >
            ✕
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-300/30 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-amber-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                <span>R$ 10,00 por Kit Entregue</span>
              </div>
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white">
                Indique & Ganhe Romance
              </h3>
              <p className="text-xs text-rose-100/90">
                Gere seu cupom oficial vinculado ao CPF e ganhe R$ 10,00 por amiga aprovada com kit entregue!
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 bg-white/10 p-1 rounded-2xl border border-white/15">
            <button
              type="button"
              onClick={() => { setActiveTab('create'); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white text-rose-950 shadow-md'
                  : 'text-rose-100 hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar Meu Cupom</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('consult'); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'consult'
                  ? 'bg-white text-rose-950 shadow-md'
                  : 'text-rose-100 hover:bg-white/10'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Consultar Meus Créditos</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[75vh] overflow-y-auto">
          
          {/* TAB 1: CREATE COUPON */}
          {activeTab === 'create' && (
            <div>
              {!createdCoupon ? (
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Regra de Vinculação Exclusiva:</strong> Cada CPF pode gerar apenas um cupom no sistema. Cada amiga indicada que tiver a maleta aprovada e entregue pelo distribuidor gera <strong>R$ 10,00 de bônus via Pix</strong> no seu extrato.
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-rose-600" />
                      <span>Nome Completo *</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="Ex: Maria da Silva"
                      className={`w-full p-3 rounded-xl border text-sm transition-all ${
                        errors.name ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200 bg-stone-50/60 focus:bg-white'
                      }`}
                    />
                    {errors.name && <p className="text-[11px] text-rose-600">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                        <span>CPF * (Vinculado ao Cupom)</span>
                      </label>
                      <input
                        type="text"
                        value={cpf}
                        onChange={handleCpfChange}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className={`w-full p-3 rounded-xl border text-sm font-mono transition-all ${
                          errors.cpf ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200 bg-stone-50/60 focus:bg-white'
                        }`}
                      />
                      {errors.cpf && <p className="text-[11px] text-rose-600">{errors.cpf}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-rose-600" />
                        <span>WhatsApp para Contato *</span>
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="(47) 99999-9999"
                        maxLength={15}
                        className={`w-full p-3 rounded-xl border text-sm font-mono transition-all ${
                          errors.phone ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200 bg-stone-50/60 focus:bg-white'
                        }`}
                      />
                      {errors.phone && <p className="text-[11px] text-rose-600">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Optional Pix & City toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPixFields(!showPixFields)}
                      className="text-xs text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{showPixFields ? 'Ocultar dados de pagamento Pix' : '+ Adicionar Chave Pix para receber os bônus (Opcional)'}</span>
                    </button>
                  </div>

                  {showPixFields && (
                    <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700">Tipo de Chave Pix</label>
                          <select
                            value={pixKeyType}
                            onChange={(e) => setPixKeyType(e.target.value as any)}
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
                          <label className="text-[11px] font-bold text-stone-700">Chave Pix</label>
                          <input
                            type="text"
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            placeholder="Informe sua chave Pix"
                            className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700">Banco / Instituição</label>
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="Ex: Nubank, Caixa, Itaú..."
                            className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700">Sua Cidade</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ex: Sua Cidade..."
                            className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Gerar Meu Cupom de Indicação Agora</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Success View with Coupon Card */
                <div className="space-y-5 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {isExistingNotice ? 'Cupom Existente Recuperado com Sucesso' : 'Cupom Gerado e Vinculado ao seu CPF!'}
                    </span>
                    <h4 className="font-serif-luxury text-2xl font-bold text-stone-900">
                      Olá, {createdCoupon.fullName}!
                    </h4>
                    <p className="text-xs text-stone-600 max-w-md mx-auto">
                      Seu cupom está ativo. Compartilhe com amigas e familiares para começar a acumular créditos de <strong>R$ 10,00 por indicação entregue</strong>.
                    </p>
                  </div>

                  {/* Coupon Box */}
                  <div className="bg-gradient-to-br from-rose-50 to-amber-50/60 border-2 border-dashed border-rose-300 rounded-3xl p-5 max-w-md mx-auto space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700">
                      Seu Código de Cupom Oficial
                    </span>
                    <div className="text-3xl font-black font-mono text-rose-700 tracking-wider">
                      {createdCoupon.code}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      Vinculado ao CPF: {createdCoupon.cpf}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(createdCoupon.code)}
                        className="flex-1 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Link Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-rose-600" />
                            <span>Copiar Link com Cupom</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Oi amiga! Conheça a Romance Moda Íntima: receba um mostruário completo sem investimento inicial e lucre até 40%! Ao fazer seu cadastro gratuito, use meu cupom especial ${createdCoupon.code} através do link: ${getShareLink(createdCoupon.code)}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar no WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchCpf(createdCoupon.cpf);
                        setActiveTab('consult');
                        // auto-trigger consult
                        const relatedLeads = leads.filter(
                          (l) => l.referralCouponCode && l.referralCouponCode.toUpperCase() === createdCoupon.code.toUpperCase()
                        );
                        setConsultResult({ coupon: createdCoupon, referredLeads: relatedLeads });
                        setEditPixKey(createdCoupon.pixKey || createdCoupon.cpf);
                        setEditPixType((createdCoupon.pixKeyType as any) || 'cpf');
                        setEditBankName(createdCoupon.bankName || '');
                      }}
                      className="text-xs text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Ver meu extrato de créditos</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONSULT CREDIT BALANCE */}
          {activeTab === 'consult' && (
            <div className="space-y-5">
              <form onSubmit={handleConsultSubmit} className="space-y-3">
                <label className="text-xs font-bold text-stone-700 block">
                  Informe seu CPF para consultar saldo e amigas indicadas:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchCpf}
                    onChange={handleSearchCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white text-sm font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Consultar</span>
                  </button>
                </div>
                {consultError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{consultError}</span>
                  </div>
                )}
              </form>

              {/* Consultation Results */}
              {consultResult && (() => {
                const deliveredCount = consultResult.referredLeads.filter(
                  (l) => l.status === 'kit_entregue' || l.status === 'acerto_realizado'
                ).length;
                const totalEarned = deliveredCount * 10;
                const paidAmount = consultResult.coupon.paidBalance || 0;
                const remainingBalance = Math.max(0, totalEarned - paidAmount);

                return (
                  <div className="space-y-5 pt-2 animate-in fade-in duration-300">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-stone-900 via-rose-950 to-stone-900 text-white rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300">
                            Titular do Cupom
                          </span>
                          <h4 className="text-lg sm:text-xl font-bold text-white">
                            {consultResult.coupon.fullName}
                          </h4>
                          <p className="text-xs text-stone-400 font-mono">
                            CPF: {consultResult.coupon.cpf} • Cupom: <strong className="text-amber-300">{consultResult.coupon.code}</strong>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                            Saldo Disponível
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-emerald-300">
                            {formatCurrency(remainingBalance)}
                          </div>
                          <span className="text-[10px] text-stone-400">
                            (R$ 10,00 por kit entregue)
                          </span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                        <div className="bg-white/5 p-2.5 rounded-xl">
                          <span className="text-[10px] text-stone-400 block">Total Indicadas</span>
                          <span className="text-sm sm:text-base font-bold text-white">
                            {consultResult.referredLeads.length} amigas
                          </span>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-xl">
                          <span className="text-[10px] text-emerald-400 block">Kits Entregues</span>
                          <span className="text-sm sm:text-base font-bold text-emerald-300">
                            {deliveredCount} ({formatCurrency(totalEarned)})
                          </span>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-xl">
                          <span className="text-[10px] text-amber-300 block">Já Pago via Pix</span>
                          <span className="text-sm sm:text-base font-bold text-amber-300">
                            {formatCurrency(paidAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pix key details / editor */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-stone-800">Dados Pix para Recebimento de Bônus</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingPix(!isEditingPix)}
                          className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                        >
                          {isEditingPix ? 'Cancelar Edição' : 'Editar Chave Pix'}
                        </button>
                      </div>

                      {pixSavedNotice && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Chave Pix atualizada com sucesso no sistema!</span>
                        </div>
                      )}

                      {!isEditingPix ? (
                        <div className="text-xs text-stone-600 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-stone-200">
                          <div>
                            <span className="text-[10px] text-stone-400 block uppercase">Chave Pix:</span>
                            <span className="font-mono font-bold text-stone-900">
                              {consultResult.coupon.pixKey || consultResult.coupon.cpf} ({consultResult.coupon.pixKeyType || 'CPF'})
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block uppercase">Banco / Cidade:</span>
                            <span className="text-stone-900 font-medium">
                              {consultResult.coupon.bankName || 'Não especificado'} • {consultResult.coupon.city || 'Itapema'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-stone-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-stone-700">Tipo de Chave Pix</label>
                              <select
                                value={editPixType}
                                onChange={(e) => setEditPixType(e.target.value as any)}
                                className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                              >
                                <option value="cpf">CPF</option>
                                <option value="telefone">Telefone / WhatsApp</option>
                                <option value="email">E-mail</option>
                                <option value="aleatoria">Chave Aleatória</option>
                                <option value="cnpj">CNPJ</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-stone-700">Chave Pix</label>
                              <input
                                type="text"
                                value={editPixKey}
                                onChange={(e) => setEditPixKey(e.target.value)}
                                className="w-full p-2 rounded-xl border border-stone-200 text-xs font-mono"
                                placeholder="Sua chave Pix"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-stone-700">Banco / Instituição</label>
                            <input
                              type="text"
                              value={editBankName}
                              onChange={(e) => setEditBankName(e.target.value)}
                              placeholder="Ex: Nubank, Inter, Caixa..."
                              className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSavePixFromConsult}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar Dados Pix</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* List of Referred Leads */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Relação de Cadastros Vinculados ao seu Cupom:</span>
                        <span className="text-[11px] text-stone-500 font-normal">
                          {consultResult.referredLeads.length} cadastros
                        </span>
                      </h5>

                      {consultResult.referredLeads.length === 0 ? (
                        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2">
                          <Users className="w-8 h-8 text-stone-400 mx-auto" />
                          <p className="text-xs text-stone-600">
                            Ainda não há cadastros com o seu cupom <strong>{consultResult.coupon.code}</strong>.
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Compartilhe seu link exclusivo com amigas e vizinhas para começar a ganhar!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {consultResult.referredLeads.map((lead) => {
                            const isDelivered = lead.status === 'kit_entregue' || lead.status === 'acerto_realizado';
                            return (
                              <div
                                key={lead.id}
                                className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs gap-2"
                              >
                                <div>
                                  <p className="font-bold text-stone-900">{lead.fullName}</p>
                                  <p className="text-[11px] text-stone-500">
                                    {lead.city} • Protocolo: {lead.protocol}
                                  </p>
                                </div>

                                <div className="text-right">
                                  {isDelivered ? (
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>+ R$ 10,00 (Entregue)</span>
                                    </span>
                                  ) : lead.status === 'recusado' ? (
                                    <span className="bg-rose-100 text-rose-800 text-[10px] font-medium px-2 py-0.5 rounded-md">
                                      Não aprovado
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-medium px-2 py-0.5 rounded-md">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>Em Análise / Aguardando Entrega</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Help CTA */}
                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200/80 flex items-center justify-between gap-3">
                      <div className="text-xs text-rose-950">
                        <strong>Dúvidas sobre o resgate do seu saldo?</strong>
                        <p className="text-[11px] text-rose-800">
                          Fale diretamente com o distribuidor oficial Romance Itapema.
                        </p>
                      </div>
                      <a
                        href={buildWhatsAppLink(
                          settings.officialWhatsApp,
                          `Olá! Meu nome é ${consultResult.coupon.fullName} (CPF: ${consultResult.coupon.cpf}). Gostaria de informações sobre o resgate dos meus créditos do cupom de indicação ${consultResult.coupon.code}. Meu saldo disponível é ${formatCurrency(remainingBalance)}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3 rounded-xl shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>Falar no Whats</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
