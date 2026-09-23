import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  MessageCircle, 
  User, 
  CreditCard, 
  Calendar, 
  Phone, 
  MapPin, 
  Gift, 
  ArrowRight,
  ExternalLink,
  Instagram,
  Share2
} from 'lucide-react';
import { Lead, BusinessSettings } from '../types';
import { 
  isValidCPF, 
  maskCPF, 
  maskPhone, 
  maskDate, 
  calculateAge, 
  generateProtocol,
  buildWhatsAppLink,
  buildInstagramLink,
  sanitizeCouponCode
} from '../utils/validators';

interface LeadFormProps {
  settings: BusinessSettings;
  onAddLead: (lead: Lead) => void;
  onOpenLgpdModal: (tab?: 'privacy' | 'terms' | 'cookies') => void;
  preselectedFavorita?: 'sim' | 'nao';
  onOpenShare?: () => void;
  onOpenReferralModal?: () => void;
}

export function LeadForm({ settings, onAddLead, onOpenLgpdModal, preselectedFavorita, onOpenShare, onOpenReferralModal }: LeadFormProps) {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Itapema - Centro');
  const [customCity, setCustomCity] = useState('');
  const [referralCoupon, setReferralCoupon] = useState('');
  const [hasExperience, setHasExperience] = useState<'sim' | 'nao'>('nao');
  const [wantsFavorita40, setWantsFavorita40] = useState<'sim' | 'nao'>('sim');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consentLgpd, setConsentLgpd] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);

  // Read URL query params (?cupom=XYZ ou ?ind=XYZ)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCoupon = params.get('cupom') || params.get('cupom_indicacao') || params.get('ind') || params.get('ref');
      if (urlCoupon) {
        setReferralCoupon(sanitizeCouponCode(urlCoupon));
      }
    }
  }, []);

  // Sync preselectedFavorita if changed from profit calculator
  useEffect(() => {
    if (preselectedFavorita) {
      setWantsFavorita40(preselectedFavorita);
    }
  }, [preselectedFavorita]);

  // Handle Input Changes with Masks
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPF(e.target.value);
    setCpf(masked);
    if (errors.cpf) {
      setErrors((prev) => ({ ...prev, cpf: '' }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setPhone(masked);
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDate(e.target.value);
    setBirthDate(masked);
    if (errors.birthDate) {
      setErrors((prev) => ({ ...prev, birthDate: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nome
    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Por favor, informe seu nome completo (nome e sobrenome).';
    }

    // CPF
    const cleanCpf = (cpf || '').replace(/\D/g, '');
    if (!cleanCpf) {
      newErrors.cpf = 'O CPF é obrigatório para a liberação do kit sem investimento.';
    } else if (cleanCpf.length !== 11 || !isValidCPF(cpf)) {
      newErrors.cpf = 'CPF inválido. Verifique os números digitados.';
    }

    // Data de Nascimento
    const age = calculateAge(birthDate);
    if (!birthDate) {
      newErrors.birthDate = 'Informe sua data de nascimento.';
    } else if ((birthDate || '').replace(/\D/g, '').length !== 8 || age === null) {
      newErrors.birthDate = 'Data de nascimento incompleta ou inválida (use DD/MM/AAAA).';
    } else if (age < 18) {
      newErrors.birthDate = `É necessário ter no mínimo 18 anos (idade calculada: ${age} anos).`;
    }

    // Telefone
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Informe um WhatsApp válido com DDD.';
    }

    // Termos de Uso
    if (!termsAccepted) {
      newErrors.termsAccepted = 'Você precisa aceitar os Termos de Uso e Regras da Revenda Sem Investimento.';
    }

    // LGPD
    if (!consentLgpd) {
      newErrors.consentLgpd = 'Você precisa autorizar o tratamento de dados conforme a LGPD.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const calculatedAge = calculateAge(birthDate) || undefined;
    const finalCity = city === 'Outra Cidade' ? customCity || 'Outra Cidade' : city;
    const protocol = generateProtocol();

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      protocol,
      fullName: fullName.trim(),
      cpf: cpf.trim(),
      birthDate: birthDate.trim(),
      age: calculatedAge,
      phone: phone.trim(),
      city: finalCity,
      hasExperience,
      wantsFavorita40,
      referralCouponCode: referralCoupon.trim() ? sanitizeCouponCode(referralCoupon) : undefined,
      termsAccepted: true,
      consentLgpd: true,
      consentTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'novo',
      score: wantsFavorita40 === 'sim' ? 'alto' : 'medio',
      notes: [],
    };

    // Simulate safe API processing
    setTimeout(() => {
      onAddLead(newLead);
      setSubmittedLead(newLead);
      setIsSubmitting(false);

      // Trigger Celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#fb7185', '#f59e0b', '#10b981'],
        });
      } catch (err) {
        console.log('Confetti effect');
      }
    }, 600);
  };

  const resetForm = () => {
    setSubmittedLead(null);
    setFullName('');
    setCpf('');
    setBirthDate('');
    setPhone('');
    setConsentLgpd(false);
    setErrors({});
  };

  return (
    <section id="cadastro" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Card State */}
        {submittedLead ? (
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/90 p-8 sm:p-12 shadow-2xl shadow-rose-950/10 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100/90 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200/60">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50/90 border border-emerald-200 px-3 py-1 rounded-full shadow-xs">
                Pré-Cadastro Recebido com Sucesso!
              </span>
              <h3 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-stone-900">
                Parabéns, {submittedLead.fullName.split(' ')[0]}!
              </h3>
              <p className="text-stone-600 text-base max-w-lg mx-auto">
                Seu cadastro para ser Revendedora <strong>Romance Itapema</strong> foi registrado com total segurança.
              </p>
            </div>

            {/* Protocol Card */}
            <div className="bg-white/60 backdrop-blur-md border border-white/80 p-4 rounded-2xl max-w-sm mx-auto space-y-1 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">Seu Protocolo de Atendimento:</span>
              <div className="text-2xl font-black text-rose-700 tracking-wider">
                {submittedLead.protocol}
              </div>
              <p className="text-[11px] text-stone-500">
                Local: {submittedLead.city} • Plano: {submittedLead.wantsFavorita40 === 'sim' ? '40% com Favorita' : '30% Sem Investimento'}
              </p>
            </div>

            {/* Instagram Gift Promotion Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-600/10 border border-rose-200/80 rounded-3xl p-5 sm:p-6 max-w-lg mx-auto text-left space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-700 text-white flex items-center justify-center shadow-md shrink-0">
                  <Gift className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                    🎁 Passo Bônus: Ganhe seu Brinde!
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                    Siga nossa página @{settings.instagramHandle ? settings.instagramHandle.replace('@', '') : 'romanceitapema'}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Ao retirar ou receber seu mostruário sem investimento, mostre para nossa equipe que você está seguindo o Instagram oficial da <strong>Romance Itapema</strong> e ganhe um lindo brinde exclusivo de boas-vindas!
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <a
                  href={buildInstagramLink(settings.instagramHandle || '@romanceitapema')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex-1 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-700 hover:opacity-95 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Seguir @{settings.instagramHandle ? settings.instagramHandle.replace('@', '') : 'romanceitapema'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {onOpenShare && (
                  <button
                    type="button"
                    onClick={onOpenShare}
                    className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-amber-300" />
                    <span>Compartilhar & Ganhar Brindes</span>
                  </button>
                )}
              </div>
            </div>

            {/* Next Step / Direct WhatsApp Confirmation */}
            <div className="max-w-md mx-auto space-y-3 pt-2">
              <p className="text-sm font-semibold text-stone-800">
                Deseja agilizar a entrega do seu mostruário?
              </p>
              <a
                href={buildWhatsAppLink(
                  settings.officialWhatsApp,
                  `Olá ${settings.distributorName || 'Anderson'}! Acabei de fazer meu pré-cadastro na Romance Itapema com o protocolo ${submittedLead.protocol} no nome de ${submittedLead.fullName}. Gostaria de agilizar a liberação da minha maleta sem investimento!`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/25 border border-white/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Confirmar no WhatsApp ({settings.displayWhatsApp})</span>
              </a>
              
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-stone-500 hover:text-stone-800 underline transition-colors pt-2 block mx-auto cursor-pointer"
              >
                Fazer outro cadastro
              </button>
            </div>

            {/* LGPD Security Badge */}
            <div className="pt-4 border-t border-stone-100/80 flex items-center justify-center gap-2 text-xs text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Seus dados estão protegidos de acordo com a LGPD (Lei nº 13.709/2018).</span>
            </div>
          </div>
        ) : (
          /* Main Registration Form */
          <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-rose-950/5 space-y-8">
            
            {/* Header Form */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-md text-rose-900 text-xs font-bold px-3.5 py-1 rounded-full border border-white/80 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>Formulário Oficial de Pré-Cadastro</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-stone-900">
                Faça seu pré-cadastro gratuito
              </h2>
              <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
                Preencha os campos abaixo para realizarmos a liberação do seu Mostruário de Lingerie Romance Sem Investimento.
              </p>

              {/* Instagram Gift Incentive Header Box */}
              <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-600/10 border border-rose-200/90 p-3.5 rounded-2xl max-w-xl mx-auto flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-stone-800">
                    <span className="font-bold text-rose-900">Bônus de Cadastro:</span> Cadastre-se e siga <a href={buildInstagramLink(settings.instagramHandle || '@romanceitapema')} target="_blank" rel="noopener noreferrer" className="font-bold text-rose-700 hover:underline">@{settings.instagramHandle ? settings.instagramHandle.replace('@', '') : 'romanceitapema'}</a> para ganhar um brinde exclusivo!
                  </div>
                </div>
                <a
                  href={buildInstagramLink(settings.instagramHandle || '@romanceitapema')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-purple-900 bg-white/80 hover:bg-white px-2.5 py-1.5 rounded-lg border border-purple-200 shadow-xs transition-colors shrink-0"
                >
                  <Instagram className="w-3 h-3 text-rose-600" />
                  <span>Seguir</span>
                </a>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Full Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="lead-fullName" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-rose-600" />
                    <span>Nome Completo *</span>
                  </label>
                  <input
                    id="lead-fullName"
                    type="text"
                    required
                    placeholder="Ex: Maria Silva Santos"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    className={`w-full px-4 py-3.5 rounded-2xl border bg-white/70 backdrop-blur-sm text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-4 transition-all ${
                      errors.fullName ? 'border-rose-500 focus:ring-rose-200' : 'border-white/80 focus:ring-rose-500/15 focus:border-rose-400'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* CPF */}
                <div className="space-y-1.5">
                  <label htmlFor="lead-cpf" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                    <span>CPF *</span>
                    <span className="text-[10px] text-stone-400 font-normal">(Para liberação do kit)</span>
                  </label>
                  <input
                    id="lead-cpf"
                    type="text"
                    required
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    className={`w-full px-4 py-3.5 rounded-2xl border bg-white/70 backdrop-blur-sm text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-4 transition-all ${
                      errors.cpf ? 'border-rose-500 focus:ring-rose-200' : 'border-white/80 focus:ring-rose-500/15 focus:border-rose-400'
                    }`}
                  />
                  {errors.cpf ? (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.cpf}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-stone-400">
                      Dado protegido sob a LGPD
                    </p>
                  )}
                </div>

                {/* Birth Date */}
                <div className="space-y-1.5">
                  <label htmlFor="lead-birthDate" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    <span>Data de Nascimento *</span>
                    <span className="text-[10px] text-stone-400 font-normal">(Mínimo 18 anos)</span>
                  </label>
                  <input
                    id="lead-birthDate"
                    type="text"
                    required
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                    className={`w-full px-4 py-3.5 rounded-2xl border bg-white/70 backdrop-blur-sm text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-4 transition-all ${
                      errors.birthDate ? 'border-rose-500 focus:ring-rose-200' : 'border-white/80 focus:ring-rose-500/15 focus:border-rose-400'
                    }`}
                  />
                  {errors.birthDate && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.birthDate}</span>
                    </p>
                  )}
                </div>

                {/* Phone / WhatsApp */}
                <div className="space-y-1.5">
                  <label htmlFor="lead-phone" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-rose-600" />
                    <span>WhatsApp / Celular com DDD *</span>
                  </label>
                  <input
                    id="lead-phone"
                    type="tel"
                    required
                    maxLength={15}
                    placeholder="(47) 90000-0000"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`w-full px-4 py-3.5 rounded-2xl border bg-white/70 backdrop-blur-sm text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-4 transition-all ${
                      errors.phone ? 'border-rose-500 focus:ring-rose-200' : 'border-white/80 focus:ring-rose-500/15 focus:border-rose-400'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>

                {/* City & Region */}
                <div className="space-y-1.5">
                  <label htmlFor="lead-city" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sua Região de Atuação *</span>
                  </label>
                  <select
                    id="lead-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-rose-500/15 focus:border-rose-400 transition-all cursor-pointer"
                  >
                    <optgroup label="Cidades Atendidas Oficialmente">
                      <option value="Itapema - Centro">Itapema - Centro</option>
                      <option value="Itapema - Meia Praia">Itapema - Meia Praia</option>
                      <option value="Itapema - Morretes">Itapema - Morretes</option>
                      <option value="Itapema - Canto da Praia">Itapema - Canto da Praia</option>
                      <option value="Itapema - Alto São Bento">Itapema - Alto São Bento</option>
                      <option value="Itapema - Outro Bairro">Itapema - Outro Bairro</option>
                      <option value="Porto Belo">Porto Belo</option>
                      <option value="Bombinhas">Bombinhas</option>
                      <option value="Balneário Camboriú">Balneário Camboriú</option>
                      <option value="Camboriú">Camboriú</option>
                      <option value="Itajaí">Itajaí</option>
                      <option value="Navegantes">Navegantes</option>
                      <option value="Penha">Penha</option>
                      <option value="Piçarras">Balneário Piçarras</option>
                      <option value="Araquari">Araquari</option>
                      <option value="Joinville">Joinville</option>
                      <option value="Florianópolis">Florianópolis & Grande Fpolis</option>
                    </optgroup>
                    <optgroup label="Outras Regiões de Santa Catarina">
                      <option value="Outra Cidade">Outra Cidade / Bairro em SC</option>
                    </optgroup>
                  </select>
                </div>

                {/* Referral Coupon Field (Opcional) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="lead-referralCoupon" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-amber-600" />
                      <span>Cupom de Indicação (Opcional)</span>
                    </label>
                    {onOpenReferralModal && (
                      <button
                        type="button"
                        onClick={onOpenReferralModal}
                        className="text-[11px] text-rose-700 hover:text-rose-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Quer seu cupom? Clique aqui</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="lead-referralCoupon"
                      type="text"
                      maxLength={20}
                      placeholder="Ex: MARIA1234 (Código de quem te indicou)"
                      value={referralCoupon}
                      onChange={(e) => setReferralCoupon(sanitizeCouponCode(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl border border-amber-200/90 bg-amber-50/40 backdrop-blur-sm text-sm text-stone-900 font-mono placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-amber-500/15 focus:border-amber-400 transition-all uppercase"
                    />
                    {referralCoupon && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-mono">
                        Cupom Aplicado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Se você foi indicada por uma revendedora ou amiga, insira o código acima para bonificá-la com R$ 10,00 na entrega do seu mostruário.
                  </p>
                </div>

              </div>

              {/* If custom city selected */}
              {city === 'Outra Cidade' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label htmlFor="lead-customCity" className="text-xs font-bold text-stone-800">
                    Especifique sua Cidade / Bairro:
                  </label>
                  <input
                    id="lead-customCity"
                    type="text"
                    placeholder="Ex: Sua Cidade - Bairro"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-white/80 bg-white/70 text-sm"
                  />
                </div>
              )}

              {/* Additional Options */}
              <div className="pt-2 border-t border-stone-100/80 space-y-4">
                
                {/* Favorita Plan Choice */}
                <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/80 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-rose-600" />
                      <span>Deseja ativar o Lucro Máximo de 40% com o Catálogo Favorita?</span>
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Basta incluir um pedido entre R$ 400 (mínimo) e R$ 600 (limite no 1º pedido) no catálogo para ganhar 40% de lucro.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setWantsFavorita40('sim')}
                      className={`p-3 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                        wantsFavorita40 === 'sim'
                          ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-transparent shadow-md'
                          : 'bg-white/70 text-stone-700 border-white/80 hover:bg-white'
                      }`}
                    >
                      <span>Sim! Quero 40% de lucro</span>
                      {wantsFavorita40 === 'sim' && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWantsFavorita40('nao')}
                      className={`p-3 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                        wantsFavorita40 === 'nao'
                          ? 'bg-stone-900 text-white border-transparent shadow-md'
                          : 'bg-white/70 text-stone-700 border-white/80 hover:bg-white'
                      }`}
                    >
                      <span>Começar apenas com 30% sem investimento</span>
                      {wantsFavorita40 === 'nao' && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Experience Question */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-stone-700 pt-1">
                  <span className="font-medium">Você já tem experiência com revenda sem investimento ou catálogos?</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="experience"
                        checked={hasExperience === 'sim'}
                        onChange={() => setHasExperience('sim')}
                        className="accent-rose-600"
                      />
                      <span>Sim</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="experience"
                        checked={hasExperience === 'nao'}
                        onChange={() => setHasExperience('nao')}
                        className="accent-rose-600"
                      />
                      <span>Não, é minha 1ª vez</span>
                    </label>
                  </div>
                </div>

                {/* Legal Consents (Terms of Use & Privacy LGPD) */}
                <div className="pt-3 border-t border-stone-100/80 space-y-3">
                  
                  {/* Checkbox 1: Terms of Use & Consignment Rules */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        id="lead-terms-checkbox"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked);
                          if (errors.termsAccepted) setErrors((prev) => ({ ...prev, termsAccepted: '' }));
                        }}
                        className="mt-1 w-4 h-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer shrink-0"
                      />
                      <div className="text-xs text-stone-600 leading-relaxed">
                        <span>Declaro que li e concordo com os <strong>Termos de Uso e Regras da Revenda Sem Investimento</strong> (sem investimento prévio, ciclo de 40 dias, devolução sem custo das peças não vendidas e lucros de 30% a 40%).</span>{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLgpdModal('terms')}
                          className="text-rose-700 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-1"
                        >
                          <span>Ver Termos de Uso</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </label>
                    {errors.termsAccepted && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 mt-1.5 pl-7">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.termsAccepted}</span>
                      </p>
                    )}
                  </div>

                  {/* Checkbox 2: Privacy Policy & LGPD */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        id="lead-lgpd-checkbox"
                        type="checkbox"
                        checked={consentLgpd}
                        onChange={(e) => {
                          setConsentLgpd(e.target.checked);
                          if (errors.consentLgpd) setErrors((prev) => ({ ...prev, consentLgpd: '' }));
                        }}
                        className="mt-1 w-4 h-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer shrink-0"
                      />
                      <div className="text-xs text-stone-600 leading-relaxed">
                        <span>Autorizo a coleta e o tratamento dos meus dados cadastrais (Nome, CPF, Nascimento e Telefone) para análise de pré-cadastro e contato comercial da Romance Itapema, em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>.</span>{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLgpdModal('privacy')}
                          className="text-rose-700 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-1"
                        >
                          <span>Ver Política de Privacidade</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </label>
                    {errors.consentLgpd && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 mt-1.5 pl-7">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.consentLgpd}</span>
                      </p>
                    )}
                  </div>

                </div>

              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold text-base py-4 px-6 rounded-2xl shadow-xl shadow-rose-600/30 hover:shadow-rose-600/40 border border-white/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <span>Processando seu pré-cadastro seguro...</span>
                  ) : (
                    <>
                      <span>Enviar Pré-Cadastro e Garantir Mostruário</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400 mt-3">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-stone-400" />
                    <span>Conexão Segura SSL</span>
                  </span>
                  <span>•</span>
                  <span>Sem taxa de matrícula</span>
                  <span>•</span>
                  <span>Acerto em 40 dias</span>
                </div>
              </div>

            </form>

          </div>
        )}

      </div>
    </section>
  );
}
