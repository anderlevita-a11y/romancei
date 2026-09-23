import React, { useState } from 'react';
import { 
  X, 
  User, 
  CreditCard, 
  Calendar, 
  Phone, 
  MapPin, 
  Gift, 
  MessageCircle, 
  Clock, 
  Plus, 
  Send, 
  PackagePlus, 
  ShieldCheck, 
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  HeartHandshake,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Lead, LeadStatus, BusinessSettings } from '../../types';
import { formatDateBR, buildWhatsAppLink } from '../../utils/validators';

interface AdminLeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onAddNote: (leadId: string, text: string) => void;
  onDeleteLead: (leadId: string) => void;
  onCreateOrderFromLead: (lead: Lead) => void;
  settings: BusinessSettings;
}

export function AdminLeadDetailModal({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  onAddNote,
  onDeleteLead,
  onCreateOrderFromLead,
  settings,
}: AdminLeadDetailModalProps) {
  const [newNoteText, setNewNoteText] = useState('');
  const [showFullCpf, setShowFullCpf] = useState(false);

  if (!isOpen || !lead) return null;

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(lead.id, newNoteText.trim());
    setNewNoteText('');
  };

  const statusOptions: { value: LeadStatus; label: string; color: string }[] = [
    { value: 'novo', label: 'Novo Lead', color: 'bg-blue-100 text-blue-800' },
    { value: 'em_analise', label: 'Em Análise de Crédito', color: 'bg-amber-100 text-amber-800' },
    { value: 'aprovado', label: 'Aprovado p/ Kit', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'kit_entregue', label: 'Kit Entregue (Ativa)', color: 'bg-purple-100 text-purple-800' },
    { value: 'acerto_realizado', label: 'Acerto Realizado', color: 'bg-teal-100 text-teal-800' },
    { value: 'recusado', label: 'Recusado / Impeditivo', color: 'bg-rose-100 text-rose-800' },
    { value: 'arquivado', label: 'Arquivado', color: 'bg-stone-100 text-stone-700' },
  ];

  // Masked CPF for privacy display
  const rawCpf = lead.cpf || '';
  const displayCpf = showFullCpf 
    ? rawCpf 
    : rawCpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '***.$2.***-$4');

  const firstName = lead.fullName ? lead.fullName.split(' ')[0] : 'Revendedora';
  const protocol = lead.protocol || '';

  const defaultWelcomeTemplate =
    'Olá {nome}! Aqui é o Anderson da Distribuição Romance Itapema. Recebemos seu pré-cadastro (Protocolo: {protocolo}). Vamos agendar a liberação do seu Mostruário Sem Investimento de Lingerie?';

  const defaultKitReadyTemplate =
    'Oi {nome}! Seu Mostruário Sem Investimento Romance com lucro de {lucro}% está pronto para entrega/retirada. Você tem 40 dias para vender sem risco!';

  // WhatsApp Messages
  const welcomeMsg = (settings.welcomeTemplate || defaultWelcomeTemplate)
    .replace('{nome}', firstName)
    .replace('{protocolo}', protocol);

  const kitReadyMsg = (settings.kitReadyTemplate || defaultKitReadyTemplate)
    .replace('{nome}', firstName)
    .replace('{comissao}', lead.wantsFavorita40 === 'sim' ? '40' : '30')
    .replace('{lucro}', lead.wantsFavorita40 === 'sim' ? '40' : '30');

  const defaultRejectedTemplate =
    `Olá {nome}! Tudo bem? Agradecemos muito pelo seu interesse em revender com a Distribuição ${settings.businessName || 'Romance'} (Protocolo: {protocolo}). No momento, após a análise cadastral inicial, não foi possível aprovar a liberação do seu mostruário sem investimento para este ciclo. Mantemos o seu contato arquivado com carinho e você poderá solicitar uma nova avaliação em ciclos futuros. Desejamos muito sucesso para você!`;

  const rejectedMsg = (settings.leadRejectedTemplate || defaultRejectedTemplate)
    .replace('{nome}', firstName)
    .replace('{protocolo}', protocol);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/80 flex items-center justify-center text-white font-bold text-lg">
              {lead.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">
                  {lead.fullName}
                </h3>
                <span className="text-xs font-mono bg-white/20 text-rose-200 px-2 py-0.5 rounded">
                  {lead.protocol}
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Cadastrado em {formatDateBR(lead.createdAt)} • {lead.city}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800 text-sm">
          
          {/* Status Changer & Quick Actions */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-stone-600 block">Status do Lead:</span>
              <select
                value={lead.status}
                onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateOrderFromLead(lead);
                }}
                className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Entregar Kit Sem Investimento</span>
              </button>
            </div>
          </div>

          {/* Lead Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* CPF */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
              <span className="text-xs text-stone-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                  <span>CPF da Candidata</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullCpf(!showFullCpf)}
                  className="text-stone-400 hover:text-stone-700 text-[11px] flex items-center gap-0.5"
                >
                  {showFullCpf ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showFullCpf ? 'Ocultar' : 'Ver'}</span>
                </button>
              </span>
              <p className="font-mono font-bold text-stone-900 text-sm">
                {displayCpf}
              </p>
            </div>

            {/* Birth Date & Age */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>Data de Nascimento & Idade</span>
              </span>
              <p className="font-bold text-stone-900 text-sm">
                {lead.birthDate} {lead.age ? `(${lead.age} anos)` : ''}
              </p>
            </div>

            {/* WhatsApp */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp / Celular</span>
              </span>
              <p className="font-bold text-stone-900 text-sm">
                {lead.phone}
              </p>
            </div>

            {/* Location */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Cidade / Bairro</span>
              </span>
              <p className="font-bold text-stone-900 text-sm">
                {lead.city} {lead.neighborhood ? `- ${lead.neighborhood}` : ''}
              </p>
            </div>

            {/* Favorita Plan */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1 sm:col-span-2">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <span>Interesse no Catálogo Favorita (Lucro 40%)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${lead.wantsFavorita40 === 'sim' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-stone-200 text-stone-800'}`}>
                  {lead.wantsFavorita40 === 'sim' ? 'Sim! Quer 40% de lucro com Favorita (R$ 400-600)' : 'Não, prefere começar só com 30% sem investimento'}
                </span>
                <span className="text-xs text-stone-500">
                  • Experiência prévia: <strong>{lead.hasExperience === 'sim' ? 'Sim' : 'Não'}</strong>
                </span>
              </div>
            </div>

            {/* Compliance & Legal Auditing */}
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/70 space-y-1.5 sm:col-span-2 text-xs text-emerald-950">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Auditoria de Conformidade Legal & LGPD</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-800">
                <span className="inline-flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded-md font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Termos de Revenda Sem Investimento: Aceitos</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded-md font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Tratamento LGPD: Autorizado</span>
                </span>
                {lead.consentTimestamp && (
                  <span className="text-stone-500 font-mono">
                    Registrado em: {new Date(lead.consentTimestamp).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Quick WhatsApp Messaging Bar */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Atalhos Rápidos de Mensagens para WhatsApp:</span>
              </span>
              <span className="text-[10px] text-stone-500 font-medium">1 clique para abrir conversa</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={buildWhatsAppLink(lead.phone, welcomeMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                title="Mensagem de boas-vindas para agendar liberação do mostruário"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>1. Boas-Vindas</span>
              </a>
              <a
                href={buildWhatsAppLink(lead.phone, kitReadyMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                title="Avisar que o kit sem investimento está pronto"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>2. Kit Pronto</span>
              </a>
              <a
                href={buildWhatsAppLink(lead.phone, rejectedMsg)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (lead.status !== 'recusado') {
                    onUpdateStatus(lead.id, 'recusado');
                  }
                }}
                className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                title="Enviar mensagem acolhedora informando a não aprovação no ciclo atual"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>3. Avisar Não Aprovado (Amigável)</span>
              </a>
            </div>
          </div>

          {/* Contextual Notice for Rejected Status */}
          {lead.status === 'recusado' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-rose-950">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <strong className="block text-rose-900 font-bold">Status: Cadastro Não Aprovado</strong>
                  <span className="text-[11px] text-rose-700">Envie o retorno amigável para manter um relacionamento positivo com a cliente.</span>
                </div>
              </div>
              <a
                href={buildWhatsAppLink(lead.phone, rejectedMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer transition-colors"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Enviar Retorno Amigável</span>
              </a>
            </div>
          )}

          {/* Internal Notes / CRM Section */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>Histórico & Anotações Internas ({lead.notes.length})</span>
            </h4>

            {/* Note List */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {lead.notes.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-2">
                  Nenhuma anotação interna registrada ainda.
                </p>
              ) : (
                lead.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-stone-500">
                      <span className="font-semibold text-stone-700">{note.author}</span>
                      <span>{formatDateBR(note.createdAt)}</span>
                    </div>
                    <p className="text-stone-800">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar nota sobre a revendedora..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              />
              <button
                type="submit"
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Nota</span>
              </button>
            </form>
          </div>

          {/* Delete Danger Zone */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-400">
              Protocolo oficial gerado: {lead.protocol}
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Deseja realmente remover o lead de ${lead.fullName}?`)) {
                  onDeleteLead(lead.id);
                  onClose();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Lead</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
