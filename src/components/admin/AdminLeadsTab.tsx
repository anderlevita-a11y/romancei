import { useState } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Download, 
  MessageCircle, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Gift, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  PackagePlus,
  Eye,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Database,
  HeartHandshake,
  UserX
} from 'lucide-react';
import { Lead, LeadStatus, BusinessSettings } from '../../types';
import { formatDateBR, buildWhatsAppLink } from '../../utils/validators';

interface AdminLeadsTabProps {
  leads: Lead[];
  settings: BusinessSettings;
  isSyncing?: boolean;
  onForceSyncLeads?: () => void;
  onSelectLead: (lead: Lead) => void;
  onOpenNewLeadModal: () => void;
  onCreateOrderFromLead: (lead: Lead) => void;
  onExportLeadsCsv: () => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateStatus?: (leadId: string, status: LeadStatus) => void;
}

export function AdminLeadsTab({
  leads,
  settings,
  isSyncing = false,
  onForceSyncLeads,
  onSelectLead,
  onOpenNewLeadModal,
  onCreateOrderFromLead,
  onExportLeadsCsv,
  onDeleteLead,
  onUpdateStatus,
}: AdminLeadsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Filter logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cpf.includes(searchTerm) ||
      lead.phone.includes(searchTerm) ||
      lead.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status Badges config
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'novo':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Novo</span>;
      case 'em_analise':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Em Análise</span>;
      case 'aprovado':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Aprovado</span>;
      case 'kit_entregue':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Kit Entregue</span>;
      case 'acerto_realizado':
        return <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Acerto Feito</span>;
      case 'recusado':
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Recusado</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Arquivado</span>;
    }
  };

  // Status Counters
  const countTotal = leads.length;
  const countNovos = leads.filter((l) => l.status === 'novo').length;
  const countEmAnalise = leads.filter((l) => l.status === 'em_analise').length;
  const countAprovados = leads.filter((l) => l.status === 'aprovado').length;
  const countKitsEntregues = leads.filter((l) => l.status === 'kit_entregue').length;

  return (
    <div className="space-y-6">
      
      {/* Top Status Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <button
          onClick={() => setStatusFilter('todos')}
          className={`p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
            statusFilter === 'todos' ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-white/70 text-stone-800 border-white/80 hover:bg-white'
          }`}
        >
          <span className="text-[11px] sm:text-xs font-semibold opacity-75 block truncate">Total de Leads</span>
          <span className="text-xl sm:text-2xl font-black">{countTotal}</span>
        </button>

        <button
          onClick={() => setStatusFilter('novo')}
          className={`p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
            statusFilter === 'novo' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white/70 text-stone-800 border-white/80 hover:bg-white'
          }`}
        >
          <span className="text-[11px] sm:text-xs font-semibold opacity-75 block truncate">Novos Inscritos</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 group-hover:text-white">{countNovos}</span>
        </button>

        <button
          onClick={() => setStatusFilter('em_analise')}
          className={`p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
            statusFilter === 'em_analise' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-white/70 text-stone-800 border-white/80 hover:bg-white'
          }`}
        >
          <span className="text-[11px] sm:text-xs font-semibold opacity-75 block truncate">Em Análise</span>
          <span className="text-xl sm:text-2xl font-black text-amber-600">{countEmAnalise}</span>
        </button>

        <button
          onClick={() => setStatusFilter('aprovado')}
          className={`p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md ${
            statusFilter === 'aprovado' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white/70 text-stone-800 border-white/80 hover:bg-white'
          }`}
        >
          <span className="text-[11px] sm:text-xs font-semibold opacity-75 block truncate">Aprovados</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600">{countAprovados}</span>
        </button>

        <button
          onClick={() => setStatusFilter('kit_entregue')}
          className={`p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 backdrop-blur-md ${
            statusFilter === 'kit_entregue' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white/70 text-stone-800 border-white/80 hover:bg-white'
          }`}
        >
          <span className="text-[11px] sm:text-xs font-semibold opacity-75 block truncate">Kits em Campo</span>
          <span className="text-xl sm:text-2xl font-black text-purple-600">{countKitsEntregues}</span>
        </button>
      </div>

      {/* Control Bar: Search, Filters & Actions */}
      <div className="bg-white/70 backdrop-blur-xl p-4 rounded-2xl border border-white/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shadow-rose-950/5">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, WhatsApp, protocolo ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/80 bg-white/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 shadow-inner"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
          {onForceSyncLeads && (
            <button
              type="button"
              onClick={onForceSyncLeads}
              disabled={isSyncing}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap transition-all ${
                isSyncing 
                  ? 'bg-rose-50 border-rose-200 text-rose-600 cursor-wait' 
                  : 'bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-200 text-emerald-800'
              }`}
              title="Sincronizar dados em tempo real com o banco Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-rose-600' : 'text-emerald-600'}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              <span className="text-[10px] font-black bg-emerald-600/20 text-emerald-900 px-1.5 py-0.2 rounded">
                {countTotal}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportLeadsCsv}
            className="px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/80 hover:bg-white text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            title="Exportar base de leads para Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar</span> CSV
          </button>

          <button
            type="button"
            onClick={onOpenNewLeadModal}
            className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 border border-white/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Manual</span>
          </button>
        </div>

      </div>

      {/* Leads Table for Desktop / Card List for Mobile */}
      <div className="bg-white/75 backdrop-blur-xl rounded-2xl border border-white/80 shadow-md shadow-rose-950/5 overflow-hidden">
        
        {/* Sync Info Header */}
        <div className="px-3 sm:px-4 py-2.5 bg-stone-900/90 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-stone-200">
              Base de Gestão: <strong className="text-emerald-300 font-bold">{countTotal} pré-cadastros cadastrados</strong>
            </span>
          </div>
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <span>Persistência e Cache Local Ativos</span>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-700">Nenhum pré-cadastro encontrado</p>
            <p className="text-xs text-stone-500">Tente ajustar a busca ou o filtro de status selecionado.</p>
          </div>
        ) : (
          <>
            {/* Mobile View: High-efficiency responsive cards (< lg screens) */}
            <div className="lg:hidden divide-y divide-stone-100">
              {filteredLeads.map((lead) => {
                const defaultWelcomeTemplate =
                  'Olá {nome}! Aqui é o Anderson da Distribuição Romance Itapema. Recebemos seu pré-cadastro (Protocolo: {protocolo}). Vamos agendar a liberação do seu Mostruário Sem Investimento de Lingerie?';

                const welcomeTemplate = settings.welcomeTemplate || defaultWelcomeTemplate;

                const defaultRejectedTemplate =
                  `Olá {nome}! Tudo bem? Agradecemos muito pelo seu interesse em revender com a Distribuição ${settings.businessName || 'Romance'} (Protocolo: {protocolo}). No momento, após a análise cadastral inicial, não foi possível aprovar a liberação do seu mostruário sem investimento para este ciclo. Mantemos o seu contato arquivado com carinho e você poderá solicitar uma nova avaliação em ciclos futuros. Desejamos muito sucesso para você!`;

                const rejectedTemplate = settings.leadRejectedTemplate || defaultRejectedTemplate;
                const firstName = lead.fullName ? lead.fullName.split(' ')[0] : 'Revendedora';
                const protocol = lead.protocol || '';

                const firstMsg = welcomeTemplate
                  .replace('{nome}', firstName)
                  .replace('{protocolo}', protocol);

                const rejectedMsg = rejectedTemplate
                  .replace('{nome}', firstName)
                  .replace('{protocolo}', protocol);

                const isRejected = lead.status === 'recusado';

                return (
                  <div key={`mob-${lead.id}`} className="p-3 sm:p-4 space-y-3 hover:bg-rose-50/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="font-bold text-stone-900 text-sm hover:text-rose-700 text-left truncate block max-w-full"
                        >
                          {lead.fullName}
                        </button>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
                          <span className="font-mono bg-stone-100 px-1.5 py-0.2 rounded text-stone-600 font-semibold">
                            {lead.protocol}
                          </span>
                          <span className="text-stone-400">• {formatDateBR(lead.createdAt)}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(lead.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 bg-stone-50/80 p-2.5 rounded-xl border border-stone-100">
                      <div className="min-w-0">
                        <span className="text-[10px] text-stone-400 block font-semibold">CPF:</span>
                        <span className="font-mono text-stone-800 font-medium break-all">{lead.cpf}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-stone-400 block font-semibold">Cidade / Região:</span>
                        <span className="truncate block font-medium" title={lead.city}>{lead.city}</span>
                      </div>
                      <div className="col-span-1 sm:col-span-2 flex items-center justify-between pt-1 border-t border-stone-200/60 flex-wrap gap-1">
                        <span className="text-[10px] text-stone-400 font-semibold">Catálogo Favorita:</span>
                        {lead.wantsFavorita40 === 'sim' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                            <Gift className="w-3 h-3 text-amber-600" />
                            <span>40% Favorita</span>
                          </span>
                        ) : (
                          <span className="text-stone-500 text-[10px]">30% Sem Investimento</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                        <a
                          href={buildWhatsAppLink(lead.phone, firstMsg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl font-bold text-xs flex-1 transition-colors"
                          title="Enviar mensagem de boas-vindas no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={buildWhatsAppLink(lead.phone, rejectedMsg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (!isRejected && onUpdateStatus) {
                              onUpdateStatus(lead.id, 'recusado');
                            }
                          }}
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl font-bold text-xs border transition-colors ${
                            isRejected
                              ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                          title="Atalho: Enviar mensagem amigável no WhatsApp informando que o cadastro não foi aprovado"
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>{isRejected ? 'Retorno Enviado' : 'Avisar Não Aprovado'}</span>
                        </a>
                      </div>

                      <div className="flex items-center justify-end gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onCreateOrderFromLead(lead)}
                          className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          title="Gerar Kit"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Entregar Kit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectLead(lead)}
                          className="p-2 hover:bg-stone-100 text-stone-600 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deseja realmente excluir o pré-cadastro de ${lead.fullName} (${lead.protocol})?`)) {
                              onDeleteLead(lead.id);
                            }
                          }}
                          className="p-2 hover:bg-rose-100 text-stone-400 hover:text-rose-700 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= lg screens) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Candidata / Protocolo</th>
                    <th className="px-4 py-3.5">CPF & Idade</th>
                    <th className="px-4 py-3.5">WhatsApp & Contato</th>
                    <th className="px-4 py-3.5">Localização</th>
                    <th className="px-4 py-3.5">Plano Favorita</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredLeads.map((lead) => {
                    const defaultWelcomeTemplate =
                      'Olá {nome}! Aqui é o Anderson da Distribuição Romance Itapema. Recebemos seu pré-cadastro (Protocolo: {protocolo}). Vamos agendar a liberação do seu Mostruário Sem Investimento de Lingerie?';

                    const welcomeTemplate = settings.welcomeTemplate || defaultWelcomeTemplate;

                    const defaultRejectedTemplate =
                      `Olá {nome}! Tudo bem? Agradecemos muito pelo seu interesse em revender com a Distribuição ${settings.businessName || 'Romance'} (Protocolo: {protocolo}). No momento, após a análise cadastral inicial, não foi possível aprovar a liberação do seu mostruário sem investimento para este ciclo. Mantemos o seu contato arquivado com carinho e você poderá solicitar uma nova avaliação em ciclos futuros. Desejamos muito sucesso para você!`;

                    const rejectedTemplate = settings.leadRejectedTemplate || defaultRejectedTemplate;
                    const firstName = lead.fullName ? lead.fullName.split(' ')[0] : 'Revendedora';
                    const protocol = lead.protocol || '';

                    const firstMsg = welcomeTemplate
                      .replace('{nome}', firstName)
                      .replace('{protocolo}', protocol);

                    const rejectedMsg = rejectedTemplate
                      .replace('{nome}', firstName)
                      .replace('{protocolo}', protocol);

                    const isRejected = lead.status === 'recusado';

                    return (
                      <tr key={lead.id} className="hover:bg-rose-50/40 transition-colors">
                        
                        {/* Name & Protocol */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <button
                              onClick={() => onSelectLead(lead)}
                              className="font-bold text-stone-900 hover:text-rose-700 text-left text-sm"
                            >
                              {lead.fullName}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                              <span className="font-mono bg-stone-100 px-1.5 py-0.2 rounded text-stone-600">
                                {lead.protocol}
                              </span>
                              <span>• {formatDateBR(lead.createdAt)}</span>
                            </div>
                          </div>
                        </td>

                        {/* CPF & Age */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-mono text-stone-800">{lead.cpf}</span>
                            <span className="text-[11px] text-stone-400 block">
                              {lead.birthDate} {lead.age ? `(${lead.age} anos)` : ''}
                            </span>
                          </div>
                        </td>

                        {/* Phone / WhatsApp & Shortcuts */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={buildWhatsAppLink(lead.phone, firstMsg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold"
                              title="Abrir WhatsApp com mensagem padrão de boas-vindas"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                              <span>{lead.phone}</span>
                            </a>

                            <a
                              href={buildWhatsAppLink(lead.phone, rejectedMsg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                if (!isRejected && onUpdateStatus) {
                                  onUpdateStatus(lead.id, 'recusado');
                                }
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isRejected
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 hover:border-rose-300'
                              }`}
                              title="Atalho: Enviar mensagem amigável no WhatsApp informando que o cadastro não foi aprovado"
                            >
                              <HeartHandshake className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-stone-600">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate max-w-[130px]" title={lead.city}>
                              {lead.city}
                            </span>
                          </div>
                        </td>

                        {/* Favorita 40% Plan */}
                        <td className="px-4 py-3.5">
                          {lead.wantsFavorita40 === 'sim' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                              <Gift className="w-3 h-3 text-amber-600" />
                              <span>40% (Favorita)</span>
                            </span>
                          ) : (
                            <span className="text-stone-500 text-[11px]">
                              30% Sem Investimento
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {getStatusBadge(lead.status)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={buildWhatsAppLink(lead.phone, rejectedMsg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                if (!isRejected && onUpdateStatus) {
                                  onUpdateStatus(lead.id, 'recusado');
                                }
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-lg transition-colors cursor-pointer"
                              title="Atalho: Enviar mensagem amigável no WhatsApp informando cadastro não aprovado"
                            >
                              <HeartHandshake className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => onCreateOrderFromLead(lead)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Gerar e Entregar Kit Sem Investimento"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectLead(lead)}
                              className="p-1.5 hover:bg-stone-100 text-stone-600 rounded-lg transition-colors cursor-pointer"
                              title="Ver detalhes completos e notas"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Deseja realmente excluir o pré-cadastro de ${lead.fullName} (${lead.protocol})?\n\nEsta ação removerá o lead definitivamente do banco de dados.`)) {
                                  onDeleteLead(lead.id);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-100 text-stone-400 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Pré-Cadastro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
