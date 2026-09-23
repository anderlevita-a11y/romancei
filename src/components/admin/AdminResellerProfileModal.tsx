import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Copy, 
  Check, 
  MessageSquare, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Tag, 
  Share2,
  FileText,
  Bell,
  Smartphone,
  Send,
  Clock,
  Laptop,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ResellerUser, ResellerSalesProfile, BusinessSettings, ResellerDeviceSubscription } from '../../types';
import { 
  getStoredDeviceSubscriptions, 
  showNativePushNotification, 
  recordPushLog,
  getDeviceDetails 
} from '../../utils/webPushHelper';

interface AdminResellerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  reseller: ResellerUser;
  profile?: ResellerSalesProfile;
  settings: BusinessSettings;
  onSaveProfile?: (profile: ResellerSalesProfile) => void;
}

export const AdminResellerProfileModal: React.FC<AdminResellerProfileModalProps> = ({
  isOpen,
  onClose,
  reseller,
  profile,
  settings,
  onSaveProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pushTestSuccess, setPushTestSuccess] = useState(false);

  // Estados da Data de Retorno e Notificação Push
  const [returnDate, setReturnDate] = useState<string>('');
  const [returnTime, setReturnTime] = useState<string>('10:00');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [pushScheduled, setPushScheduled] = useState<boolean>(true);
  const [pushTitle, setPushTitle] = useState<string>('Romance Itapema: Retorno do Mostruário');
  const [pushBody, setPushBody] = useState<string>('');
  const [linkedDevices, setLinkedDevices] = useState<ResellerDeviceSubscription[]>([]);

  const rawPhone = reseller.phone.replace(/\D/g, '');
  const cleanProfile: ResellerSalesProfile = profile || {
    id: `profile-${reseller.id}`,
    resellerId: reseller.id,
    resellerCpf: reseller.cpf,
    resellerName: reseller.fullName,
    resellerPhone: reseller.phone,
    resellerCity: reseller.city || 'SC',
    sellsMensUnderwear: false,
    mensUnderwearSizes: [],
    sellsMensApparel: false,
    sellsKidsClothing: false,
    sellsKidsUnderwear: false,
    sellsBraletteNoPadding: false,
    pantyPreference: 'equilibrado' as const,
    topSellingSizes: ['M', 'G'] as any,
    generalClothingItems: [],
    distributorMessage: '',
    updatedAt: '',
    createdAt: reseller.createdAt,
  };

  // Inicializa dados ao abrir
  useEffect(() => {
    if (cleanProfile.returnDate) {
      setReturnDate(cleanProfile.returnDate);
    } else {
      // Sugere ciclo padrão de 40 dias
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + (settings.cycleDays || 40));
      const formatted = defaultDate.toISOString().split('T')[0];
      setReturnDate(formatted);
    }

    setReturnTime(cleanProfile.returnTime || '10:00');
    setReturnNotes(cleanProfile.returnNotes || '');
    setPushScheduled(cleanProfile.pushScheduled !== false);
    setPushTitle(cleanProfile.pushNotificationTitle || 'Romance Itapema: Retorno do Mostruário');
    setPushBody(
      cleanProfile.pushNotificationBody ||
      `Olá ${reseller.fullName.split(' ')[0]}! Hoje é o dia agendado para o retorno do seu mostruário Romance. Vamos acertar suas vendas e renovar sua sacola com novas peças!`
    );

    // Carrega dispositivos cadastrados vinculados a esta revendedora
    const allDevices = getStoredDeviceSubscriptions();
    const cleanCpf = reseller.cpf.replace(/\D/g, '');
    const myDevices = allDevices.filter(
      (d) => d.resellerId === reseller.id || d.resellerCpf.replace(/\D/g, '') === cleanCpf
    );
    setLinkedDevices(myDevices);
  }, [reseller, profile, settings.cycleDays]);

  if (!isOpen) return null;

  const hasProfile = Boolean(profile);

  // Atalhos rápidos para cálculo de data de retorno
  const handleSetQuickDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setReturnDate(d.toISOString().split('T')[0]);
  };

  // Salvar data de retorno e configurações de push
  const handleSaveReturnAndPush = () => {
    const updatedProfile: ResellerSalesProfile = {
      ...cleanProfile,
      returnDate,
      returnTime,
      returnNotes,
      pushScheduled,
      pushNotificationTitle: pushTitle,
      pushNotificationBody: pushBody,
      pushStatus: 'agendado',
      updatedAt: new Date().toISOString(),
    };

    if (onSaveProfile) {
      onSaveProfile(updatedProfile);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Disparar teste imediato de Notificação Push para o aparelho
  const handleTriggerPushTest = () => {
    const success = showNativePushNotification(pushTitle, {
      body: pushBody,
      tag: `return-notice-${reseller.id}`,
    });

    recordPushLog({
      id: `log-${Date.now()}`,
      resellerId: reseller.id,
      resellerName: reseller.fullName,
      resellerCpf: reseller.cpf,
      deviceId: linkedDevices[0]?.id || 'dev-current',
      deviceName: linkedDevices[0]?.deviceName || 'Dispositivo Web',
      title: pushTitle,
      body: pushBody,
      sentAt: new Date().toISOString(),
      scheduledFor: `${returnDate} ${returnTime}`,
      triggerType: 'manual_distributor',
      status: success ? 'delivered' : 'queued',
    });

    setPushTestSuccess(true);
    setTimeout(() => setPushTestSuccess(false), 3500);
  };

  // Formata o resumo da sacola para cópia na prancheta de separação
  const getBagSummaryText = () => {
    const tangaFioLabel = cleanProfile.pantyPreference === 'tanga'
      ? 'Mais Tanga (Conforto)'
      : cleanProfile.pantyPreference === 'fio'
        ? 'Mais Fio Dental'
        : 'Equilibrado (Tanga e Fio)';

    const mensSizes = cleanProfile.sellsMensUnderwear
      ? (cleanProfile.mensUnderwearSizes.length > 0 ? cleanProfile.mensUnderwearSizes.join(', ') : 'Geral')
      : 'Não vende';

    const roupas = cleanProfile.generalClothingItems.length > 0
      ? cleanProfile.generalClothingItems.join(', ')
      : 'Nenhuma marcada';

    return `GUIA DE SEPARAÇÃO DA SACOLA - ROMANCE ITAPEMA
REVENDEDORA: ${reseller.fullName}
CPF: ${reseller.cpf} | WHATSAPP: ${reseller.phone} | CIDADE: ${reseller.city || 'SC'}
DATA DO PERFIL: ${cleanProfile.updatedAt ? new Date(cleanProfile.updatedAt).toLocaleDateString('pt-BR') : 'Não atualizado'}
DATA DE RETORNO DO ATENDIMENTO: ${returnDate ? new Date(`${returnDate}T12:00:00`).toLocaleDateString('pt-BR') : 'Não cadastrada'} às ${returnTime}h

1. CUECAS MASCULINAS: ${cleanProfile.sellsMensUnderwear ? `SIM (Tamanhos: ${mensSizes})` : 'NÃO'}
2. BERMUDA E CAMISETA MASCULINO: ${cleanProfile.sellsMensApparel ? 'SIM' : 'NÃO'}
3. ROUPAS INFANTIL: ${cleanProfile.sellsKidsClothing ? 'SIM' : 'NÃO'}
4. CALCINHA E CUECA INFANTIL: ${cleanProfile.sellsKidsUnderwear ? 'SIM' : 'NÃO'}
5. SOUTIEN SEM BOJO: ${cleanProfile.sellsBraletteNoPadding ? 'SIM' : 'NÃO'}
6. CALCINHA PREDOMINANTE: ${tangaFioLabel}
7. TAMANHOS MAIS VENDIDOS: ${cleanProfile.topSellingSizes.join(', ')}
8. ROUPAS EM GERAL SELECIONADAS: ${roupas}

RECADO DA VENDEDORA PARA O DISTRIBUIDOR:
"${cleanProfile.distributorMessage || 'Nenhum recado adicional registrado.'}"
OBSERVAÇÕES DO DISTRIBUIDOR PARA O RETORNO:
"${returnNotes || 'Sem observações registradas.'}"
`;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(getBagSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    const formattedDate = returnDate ? new Date(`${returnDate}T12:00:00`).toLocaleDateString('pt-BR') : '';
    const text = `Olá ${reseller.fullName.split(' ')[0]}! Aqui é o Anderson da Distribuição Romance Itapema. Estou acompanhando seu perfil de vendas. Registrei aqui em nosso sistema o retorno do seu atendimento e acerto da sacola para o dia ${formattedDate || 'combinado'}. Vamos conversando para tirar qualquer dúvida!`;
    const url = `https://wa.me/55${rawPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden my-6">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-rose-700 via-pink-700 to-rose-800 p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-semibold uppercase tracking-wider text-rose-100">
              Perfil & Atendimento da Revendedora
            </span>
            {hasProfile ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300/40 text-[11px] font-semibold text-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Perfil Ativo
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-300/40 text-[11px] font-semibold text-amber-100">
                Pendente de Preenchimento
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {reseller.fullName}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-rose-100 mt-2">
            <span className="flex items-center gap-1">
              <strong>CPF:</strong> {reseller.cpf}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> {reseller.phone}
            </span>
            {reseller.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {reseller.city}
              </span>
            )}
            {cleanProfile.updatedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Atualizado em: {new Date(cleanProfile.updatedAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SEÇÃO PRINCIPAL: DATA DE RETORNO DO ATENDIMENTO & WEB PUSH */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-pink-50/50 to-white border-2 border-rose-300 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Data de Retorno do Atendimento & Notificação Web Push
                  </h3>
                  <p className="text-xs text-slate-600">
                    Programe o retorno do mostruário para disparar o aviso na área de notificações do aparelho dela.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-200/80 text-rose-900 text-[11px] font-bold self-start sm:self-center">
                Automação Web Push
              </span>
            </div>

            {/* Aparelho Vinculado da Vendedora */}
            <div className="p-3 bg-white rounded-xl border border-rose-200/80">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-rose-600" />
                  Aparelho Vinculado no Web Push:
                </span>
                {linkedDevices.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Autorizado ({linkedDevices.length} registrado{linkedDevices.length > 1 ? 's' : ''})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Aguardando Vínculo no Login
                  </span>
                )}
              </div>

              {linkedDevices.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {linkedDevices.map((dev) => (
                    <div key={dev.id} className="text-xs text-slate-700 flex flex-wrap items-center justify-between gap-1 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                      <div>
                        <strong>{dev.deviceName}</strong> ({dev.os})
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Navegador: {dev.browser}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  O aparelho será vinculado ao nome de {reseller.fullName} assim que ela fizer o acesso e autorizar as notificações no portal da revendedora.
                </p>
              )}
            </div>

            {/* Campos de Data e Horário de Retorno */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Data de Retorno do Atendimento:
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 focus:ring-2 focus:ring-rose-500 bg-white text-xs font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Horário de Preferência:
                </label>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 focus:ring-2 focus:ring-rose-500 bg-white text-xs font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Botões de Atalho Rápido */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Atalhos de Ciclo:</span>
              <button
                type="button"
                onClick={() => handleSetQuickDays(40)}
                className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold transition-colors"
              >
                +40 dias (Ciclo Romance)
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDays(30)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
              >
                +30 dias
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDays(15)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
              >
                +15 dias
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDays(0)}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold transition-colors"
              >
                Hoje (Vencido)
              </button>
            </div>

            {/* Checkbox de Envio Automático */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={pushScheduled}
                onChange={(e) => setPushScheduled(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                Disparar Notificação Web Push automaticamente no aparelho no dia do retorno
              </span>
            </label>

            {/* Mensagem Personalizada do Push */}
            {pushScheduled && (
              <div className="space-y-2 pt-1 border-t border-rose-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Título da Notificação Push:
                  </label>
                  <input
                    type="text"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Texto da Notificação no Dispositivo:
                  </label>
                  <textarea
                    rows={2}
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Observações Internas do Atendimento */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Observações do Distribuidor para o Atendimento / Retorno:
              </label>
              <textarea
                rows={2}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Ex: Vendedora pediu para levar calcinhas GG a mais e mostruário infantil na próxima renovação..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            {/* Ações da Notificação Push */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleTriggerPushTest}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-rose-400" />
                <span>Testar Push no Aparelho Agora</span>
              </button>

              <button
                type="button"
                onClick={handleSaveReturnAndPush}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Data de Retorno & Push</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Data de Retorno e Agendamento Push salvos com sucesso no perfil de {reseller.fullName}!</span>
              </div>
            )}

            {pushTestSuccess && (
              <div className="p-2.5 rounded-xl bg-purple-100 border border-purple-300 text-xs text-purple-900 font-semibold flex items-center gap-2 animate-fade-in">
                <Bell className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Notificação Push enviada para a área de notificações do aparelho e registrada no log!</span>
              </div>
            )}
          </div>

          {/* Diretriz Oficial Romance */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5 text-amber-950 font-bold">Diretriz Oficial Romance:</strong>
              <span>
                Não trabalhamos com encomendas de modelos ou cores específicos. A sacola é montada pelo distribuidor respeitando este perfil de tamanhos e categorias comerciais para assegurar o giro sem risco.
              </span>
            </div>
          </div>

          {/* RECADO SALVO PARA O DISTRIBUIDOR */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-rose-600" />
                Recado Salvo pela Vendedora para Você (Distribuidor):
              </span>
              <span className="text-[10px] bg-rose-200/60 text-rose-800 font-semibold px-2 py-0.5 rounded-full">
                Observação Direta
              </span>
            </div>
            {cleanProfile.distributorMessage ? (
              <p className="text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-lg border border-rose-100 font-medium leading-relaxed italic">
                "{cleanProfile.distributorMessage}"
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-100">
                Nenhum recado salvo por esta vendedora até o momento.
              </p>
            )}
          </div>

          {/* GRID DE PREFERÊNCIAS DE MONTAGEM */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Modas Específicas & Segmentos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Cuecas masculinas */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Cuecas masculinas:</div>
                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  {cleanProfile.sellsMensUnderwear ? (
                    <>
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">SIM</span>
                      <span className="text-slate-600 font-normal">
                        Tamanhos: {cleanProfile.mensUnderwearSizes.length ? cleanProfile.mensUnderwearSizes.join(', ') : 'Geral'}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md font-medium">NÃO VENDE</span>
                  )}
                </div>
              </div>

              {/* Bermuda e camiseta masculino */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Bermuda e camiseta masculino:</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {cleanProfile.sellsMensApparel ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">SIM</span>
                  ) : (
                    <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md font-medium">NÃO VENDE</span>
                  )}
                </div>
              </div>

              {/* Roupas infantil */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Roupas infantil:</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {cleanProfile.sellsKidsClothing ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">SIM</span>
                  ) : (
                    <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md font-medium">NÃO VENDE</span>
                  )}
                </div>
              </div>

              {/* Calcinha e cueca infantil */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Calcinha e cueca infantil:</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {cleanProfile.sellsKidsUnderwear ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">SIM</span>
                  ) : (
                    <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md font-medium">NÃO VENDE</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LINGERIE E MODELAGENS FEMININAS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Preferências de Lingerie Feminina
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Soutien sem bojo */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Soutien sem bojo:</div>
                <div className="font-bold text-slate-900 mt-1">
                  {cleanProfile.sellsBraletteNoPadding ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">SIM</span>
                  ) : (
                    <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md font-medium">NÃO</span>
                  )}
                </div>
              </div>

              {/* Vende mais tanga ou fio */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Calcinha predominante:</div>
                <div className="font-bold text-slate-900 mt-1">
                  {cleanProfile.pantyPreference === 'tanga' && (
                    <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md font-bold">Mais Tanga</span>
                  )}
                  {cleanProfile.pantyPreference === 'fio' && (
                    <span className="text-pink-700 bg-pink-100 px-2 py-0.5 rounded-md font-bold">Mais Fio Dental</span>
                  )}
                  {cleanProfile.pantyPreference === 'equilibrado' && (
                    <span className="text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">Equilibrado</span>
                  )}
                </div>
              </div>

              {/* Tamanhos femininos mais vendidos */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-medium">Tamanhos que mais vende:</div>
                <div className="font-bold text-slate-900 mt-1 flex flex-wrap gap-1">
                  {cleanProfile.topSellingSizes.map((s) => (
                    <span key={s} className="bg-slate-800 text-white px-2 py-0.5 rounded text-[11px]">
                      Tam {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ROUPAS EM GERAL */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Roupas em Geral Selecionadas ({cleanProfile.generalClothingItems.length})
              </h3>
            </div>
            {cleanProfile.generalClothingItems.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {cleanProfile.generalClothingItems.map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold text-xs flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-rose-600" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Nenhuma peça de roupa em geral marcada.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copiado para Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar Guia da Sacola</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Chamar no WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
