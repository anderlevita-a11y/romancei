import React, { useState } from 'react';
import { X, UserPlus, Sparkles, AlertCircle, Send } from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { maskCPF, maskPhone, maskDate, calculateAge, isValidCPF, generateProtocol } from '../../utils/validators';

interface AdminNewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: Lead) => void;
}

export function AdminNewLeadModal({ isOpen, onClose, onAddLead }: AdminNewLeadModalProps) {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Itajaí - São Vicente');
  const [hasExperience, setHasExperience] = useState<'sim' | 'nao'>('nao');
  const [wantsFavorita40, setWantsFavorita40] = useState<'sim' | 'nao'>('sim');
  const [status, setStatus] = useState<LeadStatus>('novo');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      setError('Informe o nome completo da candidata.');
      return;
    }

    const cleanCpf = (cpf || '').replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11 || !isValidCPF(cpf)) {
      setError('CPF inválido ou incompleto.');
      return;
    }

    const age = calculateAge(birthDate);
    if (!birthDate || age === null || age < 18) {
      setError('Data de nascimento inválida ou menor de 18 anos.');
      return;
    }

    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Telefone/WhatsApp inválido.');
      return;
    }

    const newLead: Lead = {
      id: `lead-manual-${Date.now()}`,
      protocol: generateProtocol(),
      fullName: fullName.trim(),
      cpf: cpf.trim(),
      birthDate: birthDate.trim(),
      age: age || undefined,
      phone: phone.trim(),
      city,
      hasExperience,
      wantsFavorita40,
      termsAccepted: true,
      consentLgpd: true,
      consentTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status,
      score: wantsFavorita40 === 'sim' ? 'alto' : 'medio',
      source: 'Cadastrado Manualmente pelo Admin',
      notes: [
        {
          id: `note-${Date.now()}`,
          author: 'Distribuidora',
          text: 'Cadastro inserido manualmente no painel administrativo.',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    onAddLead(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-stone-200 relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 leading-tight">
                Novo Cadastro Manual
              </h3>
              <p className="text-xs text-stone-500">
                Cadastre uma revendedora captada presencialmente
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
          
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Fernanda Lima Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">CPF *</label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Nascimento (DD/MM/AAAA) *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  value={birthDate}
                  onChange={(e) => setBirthDate(maskDate(e.target.value))}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">WhatsApp / Celular *</label>
                <input
                  type="tel"
                  required
                  maxLength={15}
                  placeholder="(47) 90000-0000"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Região / Cidade</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                >
                  <optgroup label="Cidades Atendidas Oficialmente">
                    <option value="Itajaí - São Vicente">Itajaí - São Vicente</option>
                    <option value="Itajaí - Centro">Itajaí - Centro</option>
                    <option value="Itajaí - Fazenda">Itajaí - Fazenda</option>
                    <option value="Itajaí - Cordeiros">Itajaí - Cordeiros</option>
                    <option value="Itajaí - Praia Brava">Itajaí - Praia Brava</option>
                    <option value="Itajaí - Dom Bosco">Itajaí - Dom Bosco</option>
                    <option value="Itajaí - Ressacada">Itajaí - Ressacada</option>
                    <option value="Itajaí - Outro Bairro">Itajaí - Outro Bairro</option>
                    <option value="Balneário Camboriú">Balneário Camboriú</option>
                    <option value="Camboriú">Camboriú</option>
                    <option value="Navegantes">Navegantes</option>
                    <option value="Penha">Penha</option>
                    <option value="Piçarras">Balneário Piçarras</option>
                    <option value="Araquari">Araquari</option>
                    <option value="Joinville">Joinville</option>
                  </optgroup>
                  <optgroup label="Outras Regiões de Santa Catarina">
                    <option value="Outra Cidade">Outra Cidade / Bairro em SC</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Plano Catálogo Favorita</label>
                <select
                  value={wantsFavorita40}
                  onChange={(e) => setWantsFavorita40(e.target.value as 'sim' | 'nao')}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                >
                  <option value="sim">Sim (40% Lucro)</option>
                  <option value="nao">Não (30% Sem Investimento)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Status Inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                >
                  <option value="novo">Novo Lead</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="aprovado">Aprovado p/ Kit</option>
                </select>
              </div>
            </div>
          </div>

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
              <span>Cadastrar Revendedora</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
