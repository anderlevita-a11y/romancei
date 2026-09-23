import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  Eye, 
  Share2, 
  Filter, 
  Sparkles, 
  FileText, 
  Database, 
  Copy, 
  Check, 
  ShoppingBag,
  AlertCircle,
  Bell,
  Smartphone,
  Send,
  Calendar,
  Laptop,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  History,
  Info,
  ShieldCheck,
  Trash2,
  Zap,
  CheckSquare
} from 'lucide-react';
import { ResellerUser, ResellerSalesProfile, BusinessSettings, ResellerDeviceSubscription, WebPushLog, PushSanitizationLog } from '../../types';
import { AdminResellerProfileModal } from './AdminResellerProfileModal';
import { 
  getStoredDeviceSubscriptions, 
  getStoredPushLogs, 
  showNativePushNotification, 
  recordPushLog,
  isReturnDateDue,
  formatDaysUntilReturn,
  getDeviceDetails,
  getStoredSanitizationLogs,
  runPushTokenSanitization,
  checkAndRunAutomaticSanitization,
  restoreDefaultMonitoredDevices,
  simulateDeviceDeliveryTest
} from '../../utils/webPushHelper';

interface AdminResellerProfilesTabProps {
  resellers: ResellerUser[];
  salesProfiles: ResellerSalesProfile[];
  settings: BusinessSettings;
  onOpenSqlModal?: () => void;
  onSaveProfile?: (profile: ResellerSalesProfile) => void;
}

export const AdminResellerProfilesTab: React.FC<AdminResellerProfilesTabProps> = ({
  resellers,
  salesProfiles,
  settings,
  onOpenSqlModal,
  onSaveProfile,
}) => {
  // Sub-abas: Perfis de Vendas (Montagem da Sacola) vs Web Push & Aparelhos
  const [activeSubTab, setActiveSubTab] = useState<'profiles' | 'web_push'>('web_push');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_profile' | 'without_profile'>('all');
  const [filterPushStatus, setFilterPushStatus] = useState<'all' | 'with_device' | 'return_today' | 'no_return'>('all');
  const [selectedReseller, setSelectedReseller] = useState<ResellerUser | null>(null);

  // Dispositivos e Logs de Push
  const [devices, setDevices] = useState<ResellerDeviceSubscription[]>([]);
  const [pushLogs, setPushLogs] = useState<WebPushLog[]>([]);
  const [quickPushModalReseller, setQuickPushModalReseller] = useState<ResellerUser | null>(null);
  const [quickPushTitle, setQuickPushTitle] = useState('Romance Itapema: Retorno do Atendimento');
  const [quickPushBody, setQuickPushBody] = useState('');
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  // Higienização de Tokens de Push & Histórico de Expurgos
  const [sanitizationLogs, setSanitizationLogs] = useState<PushSanitizationLog[]>([]);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [sanitizationFeedback, setSanitizationFeedback] = useState<string | null>(null);

  // Recarregar dispositivos, logs e auditorias de higienização salvas
  const reloadPushData = () => {
    setDevices(getStoredDeviceSubscriptions());
    setPushLogs(getStoredPushLogs());
    setSanitizationLogs(getStoredSanitizationLogs());
  };

  useEffect(() => {
    checkAndRunAutomaticSanitization();
    reloadPushData();
  }, []);

  // Disparo manual da rotina de higienização de tokens (Regra restrita: expurgo a partir da 10ª mensagem não recebida)
  const handleRunSanitization = () => {
    setIsSanitizing(true);
    try {
      const result = runPushTokenSanitization({
        triggeredBy: 'manual_distributor',
        executorName: 'Distribuidor Anderson',
      });
      reloadPushData();
      if (result.stats.totalPurged > 0) {
        setSanitizationFeedback(
          `🧹 Higienização Concluída! ${result.stats.totalScanned} aparelho(s) analisados: ${result.stats.unreachableAfter10thCount} aparelho(s) sem recebimento a partir da 10ª mensagem foram expurgados. ${result.stats.retainedCount} tokens monitorados foram preservados com sucesso.`
        );
      } else {
        setSanitizationFeedback(
          `🛡️ Higienização Concluída: Todos os ${result.stats.retainedCount} tokens monitorados foram preservados! Nenhum aparelho atingiu o critério de expurgo (sem recebimento após a 10ª mensagem enviada).`
        );
      }
    } catch {
      setSanitizationFeedback('Erro ao executar higienização de tokens.');
    } finally {
      setIsSanitizing(false);
      setTimeout(() => setSanitizationFeedback(null), 8000);
    }
  };

  // Restaura base inicial de aparelhos monitorados para teste
  const handleRestoreDefaults = () => {
    restoreDefaultMonitoredDevices();
    reloadPushData();
    setSanitizationFeedback('🔄 Base padrão de aparelhos monitorados restaurada com sucesso para testes!');
    setTimeout(() => setSanitizationFeedback(null), 5000);
  };

  // Mapa rápido de perfis por resellerId ou CPF
  const profilesMap = useMemo(() => {
    const map = new Map<string, ResellerSalesProfile>();
    salesProfiles.forEach((p) => {
      if (p.resellerId) map.set(p.resellerId, p);
      if (p.resellerCpf) map.set(p.resellerCpf.replace(/\D/g, ''), p);
    });
    return map;
  }, [salesProfiles]);

  // Mapa de dispositivos vinculados por CPF ou ID de revendedora
  const devicesByResellerMap = useMemo(() => {
    const map = new Map<string, ResellerDeviceSubscription[]>();
    devices.forEach((dev) => {
      const cleanCpf = dev.resellerCpf.replace(/\D/g, '');
      const listById = map.get(dev.resellerId) || [];
      listById.push(dev);
      map.set(dev.resellerId, listById);

      if (cleanCpf) {
        const listByCpf = map.get(cleanCpf) || [];
        if (!listByCpf.some((d) => d.id === dev.id)) {
          listByCpf.push(dev);
        }
        map.set(cleanCpf, listByCpf);
      }
    });
    return map;
  }, [devices]);

  // Vendedoras filtradas
  const filteredResellers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return resellers.filter((r) => {
      const cleanCpf = r.cpf.replace(/\D/g, '');
      const profile = profilesMap.get(r.id) || profilesMap.get(cleanCpf);
      const hasProfile = Boolean(profile);
      const linkedDevs = devicesByResellerMap.get(r.id) || devicesByResellerMap.get(cleanCpf) || [];
      const hasDevice = linkedDevs.length > 0;
      const isDue = profile?.returnDate ? isReturnDateDue(profile.returnDate) : false;

      // Filtro para aba de Perfis
      if (activeSubTab === 'profiles') {
        if (filterStatus === 'with_profile' && !hasProfile) return false;
        if (filterStatus === 'without_profile' && hasProfile) return false;
      }

      // Filtro para aba de Web Push
      if (activeSubTab === 'web_push') {
        if (filterPushStatus === 'with_device' && !hasDevice) return false;
        if (filterPushStatus === 'return_today' && !isDue) return false;
        if (filterPushStatus === 'no_return' && profile?.returnDate) return false;
      }

      // Filtro de busca textual
      if (!term) return true;
      const matchName = r.fullName.toLowerCase().includes(term);
      const matchCpf = r.cpf.includes(term) || cleanCpf.includes(term);
      const matchPhone = r.phone.includes(term);
      const matchCity = (r.city || '').toLowerCase().includes(term);
      const matchDevice = linkedDevs.some((d) => d.deviceName.toLowerCase().includes(term));

      return matchName || matchCpf || matchPhone || matchCity || matchDevice;
    });
  }, [resellers, searchTerm, activeSubTab, filterStatus, filterPushStatus, profilesMap, devicesByResellerMap]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    let authorizedCount = 0;
    let scheduledReturnsCount = 0;
    let dueReturnsCount = 0;

    resellers.forEach((r) => {
      const cleanCpf = r.cpf.replace(/\D/g, '');
      const profile = profilesMap.get(r.id) || profilesMap.get(cleanCpf);
      const linkedDevs = devicesByResellerMap.get(r.id) || devicesByResellerMap.get(cleanCpf) || [];

      if (linkedDevs.some((d) => d.permissionStatus === 'granted')) {
        authorizedCount++;
      }
      if (profile?.returnDate) {
        scheduledReturnsCount++;
        if (isReturnDateDue(profile.returnDate)) {
          dueReturnsCount++;
        }
      }
    });

    return {
      totalResellers: resellers.length,
      linkedDevicesCount: devices.length,
      authorizedCount,
      scheduledReturnsCount,
      dueReturnsCount,
      totalPushSent: pushLogs.length,
    };
  }, [resellers, devices, profilesMap, devicesByResellerMap, pushLogs]);

  const selectedProfile = useMemo(() => {
    if (!selectedReseller) return undefined;
    const cleanCpf = selectedReseller.cpf.replace(/\D/g, '');
    return profilesMap.get(selectedReseller.id) || profilesMap.get(cleanCpf);
  }, [selectedReseller, profilesMap]);

  // Disparo automático dos retornos do dia para as áreas de notificação
  const handleTriggerTodayReturnsPush = () => {
    let dispatched = 0;
    const today = new Date().toISOString().split('T')[0];

    resellers.forEach((reseller) => {
      const cleanCpf = reseller.cpf.replace(/\D/g, '');
      const profile = profilesMap.get(reseller.id) || profilesMap.get(cleanCpf);
      if (profile?.returnDate && isReturnDateDue(profile.returnDate)) {
        const linkedDevs = devicesByResellerMap.get(reseller.id) || devicesByResellerMap.get(cleanCpf) || [];
        const title = profile.pushNotificationTitle || 'Romance Itapema: Retorno do Mostruário';
        const body = profile.pushNotificationBody || `Olá ${reseller.fullName.split(' ')[0]}! Hoje é o dia do retorno do seu atendimento e renovação de sacola Romance.`;

        // Dispara notificação nativa
        showNativePushNotification(title, {
          body,
          tag: `return-${reseller.id}-${today}`,
        });

        // Registra log
        recordPushLog({
          id: `log-auto-${reseller.id}-${Date.now()}`,
          resellerId: reseller.id,
          resellerName: reseller.fullName,
          resellerCpf: reseller.cpf,
          deviceId: linkedDevs[0]?.id || 'dev-registered',
          deviceName: linkedDevs[0]?.deviceName || 'Dispositivo Cadastrado',
          title,
          body,
          sentAt: new Date().toISOString(),
          scheduledFor: `${profile.returnDate} ${profile.returnTime || '10:00'}`,
          triggerType: 'automatic_schedule',
          status: 'delivered',
        });

        dispatched++;
      }
    });

    reloadPushData();
    setDispatchFeedback(
      dispatched > 0
        ? `✅ ${dispatched} notificação(ões) Web Push disparada(s) com sucesso para a área de notificações dos aparelhos das vendedoras!`
        : `ℹ️ Nenhuma vendedora com data de retorno de atendimento agendada para hoje.`
    );
    setTimeout(() => setDispatchFeedback(null), 5000);
  };

  // Abrir modal de envio rápido de push para revendedora específica
  const handleOpenQuickPush = (reseller: ResellerUser) => {
    const cleanCpf = reseller.cpf.replace(/\D/g, '');
    const profile = profilesMap.get(reseller.id) || profilesMap.get(cleanCpf);
    setQuickPushModalReseller(reseller);
    setQuickPushTitle(profile?.pushNotificationTitle || 'Romance Itapema: Aviso de Atendimento');
    setQuickPushBody(
      profile?.pushNotificationBody ||
      `Olá ${reseller.fullName.split(' ')[0]}! Aqui é o Anderson da Romance Itapema. Passando para lembrar da nossa data de retorno e novidades do mostruário!`
    );
  };

  // Enviar push rápido
  const handleSendQuickPush = () => {
    if (!quickPushModalReseller) return;

    const cleanCpf = quickPushModalReseller.cpf.replace(/\D/g, '');
    const linkedDevs = devicesByResellerMap.get(quickPushModalReseller.id) || devicesByResellerMap.get(cleanCpf) || [];

    const success = showNativePushNotification(quickPushTitle, {
      body: quickPushBody,
      tag: `custom-push-${quickPushModalReseller.id}-${Date.now()}`,
    });

    recordPushLog({
      id: `log-quick-${Date.now()}`,
      resellerId: quickPushModalReseller.id,
      resellerName: quickPushModalReseller.fullName,
      resellerCpf: quickPushModalReseller.cpf,
      deviceId: linkedDevs[0]?.id || 'dev-direct',
      deviceName: linkedDevs[0]?.deviceName || 'Dispositivo Vinculado',
      title: quickPushTitle,
      body: quickPushBody,
      sentAt: new Date().toISOString(),
      triggerType: 'manual_distributor',
      status: success ? 'delivered' : 'queued',
    });

    reloadPushData();
    const name = quickPushModalReseller.fullName;
    setQuickPushModalReseller(null);
    setDispatchFeedback(`🔔 Notificação Web Push disparada para a área de notificações do aparelho de ${name}!`);
    setTimeout(() => setDispatchFeedback(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Apresentação */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-pink-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-rose-100 mb-2">
              <Bell className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>Painel do Distribuidor • Gestão de Revendedoras & Automação</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Vendedoras, Perfis & Web Push
            </h2>
            <p className="text-xs sm:text-sm text-rose-100 mt-1 max-w-2xl">
              Vincule os aparelhos de cada vendedora, autorize o envio para a área de notificações e automatize lembretes de retorno de atendimento cadastrados no perfil.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerTodayReturnsPush}
              className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-900" />
              <span>Verificar & Disparar Retornos de Hoje</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de Sub-Abas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full touch-pan-x scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSubTab('web_push')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeSubTab === 'web_push'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>📲 Web Push & Aparelhos das Vendedoras</span>
            {stats.dueReturnsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black animate-pulse">
                {stats.dueReturnsCount} hoje
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('profiles')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeSubTab === 'profiles'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>📋 Perfis de Vendas (Montagem da Sacola)</span>
          </button>
        </div>

        {/* Feedback visual de disparo */}
        {dispatchFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{dispatchFeedback}</span>
          </div>
        )}
      </div>

      {/* SUB-ABA 1: WEB PUSH & APARELHOS VINCULADOS */}
      {activeSubTab === 'web_push' && (
        <div className="space-y-6 animate-fade-in">
          {/* CARDS DE MÉTRICAS DO WEB PUSH */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Aparelhos Vinculados</span>
                <Smartphone className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                {stats.linkedDevicesCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Vínculo por login/cadastro
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Push Autorizado</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-emerald-700">
                {stats.authorizedCount} <span className="text-xs text-slate-400 font-normal">/ {resellers.length} vendedoras</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Permissão concedida no browser
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Retornos Agendados</span>
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl font-bold text-purple-700">
                {stats.scheduledReturnsCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Definidos na sessão Visualizar Perfil
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Retorno Hoje / Vencidos</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-amber-700">
                {stats.dueReturnsCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Prontos para envio de Web Push
              </p>
            </div>
          </div>

          {/* GUIA DE DIRETRIZ E FUNCIONAMENTO DO WEB PUSH */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 text-xs text-rose-950 flex flex-col sm:flex-row items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">
                Como funciona o sistema de Web Push por Cadastro de Revendedora:
              </h4>
              <p className="text-slate-700 leading-relaxed">
                1. <strong>Acesso & Autorização</strong>: Para acessar o painel da revendedora, a vendedora autoriza o recebimento de notificações nativas no seu smartphone/computador.
                <br />
                2. <strong>Vínculo do Aparelho</strong>: O modelo do dispositivo (sistema, navegador e token) fica vinculado ao nome e CPF dela aqui no painel do distribuidor.
                <br />
                3. <strong>Envio Automático por Data de Retorno</strong>: Ao cadastrar a <em>Data de Retorno do Atendimento</em> na sessão Visualizar Perfil, o sistema agenda o push e dispara a notificação diretamente na barra/área de notificações do aparelho dela.
              </p>
            </div>
          </div>

          {/* FILTROS E BUSCA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome da vendedora, CPF, telefone ou modelo do aparelho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterPushStatus}
                onChange={(e) => setFilterPushStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">Todos os Cadastros ({resellers.length})</option>
                <option value="with_device">Com Aparelho Vinculado ({stats.authorizedCount})</option>
                <option value="return_today">Retorno Hoje / Vencido ({stats.dueReturnsCount})</option>
                <option value="no_return">Sem Data de Retorno</option>
              </select>
            </div>
          </div>

          {/* LISTA PERSONALIZADA DE CADA CADASTRO DE REVENDEDORA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Mostrando {filteredResellers.length} cadastro(s) de vendedoras:</span>
              <span className="italic">Clique em "Definir Retorno" para agendar a notificação</span>
            </div>

            {filteredResellers.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <Smartphone className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm">Nenhuma revendedora encontrada com este filtro.</p>
                <p className="text-xs">Tente buscar por outro termo ou limpar os filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredResellers.map((reseller) => {
                  const cleanCpf = reseller.cpf.replace(/\D/g, '');
                  const profile = profilesMap.get(reseller.id) || profilesMap.get(cleanCpf);
                  const linkedDevs = devicesByResellerMap.get(reseller.id) || devicesByResellerMap.get(cleanCpf) || [];
                  const hasDevice = linkedDevs.length > 0;
                  const primaryDev = linkedDevs[0];
                  const hasReturnDate = Boolean(profile?.returnDate);
                  const isDue = profile?.returnDate ? isReturnDateDue(profile.returnDate) : false;

                  return (
                    <div
                      key={reseller.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all p-4.5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Header do Card com Nome & Status do Aparelho */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {reseller.fullName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                                {reseller.fullName}
                              </h4>
                              <span className="text-[11px] text-slate-500 font-mono">
                                CPF: {reseller.cpf}
                              </span>
                            </div>
                          </div>

                          {/* Badge de Notificação */}
                          {hasDevice ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 shrink-0">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Web Push Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Sem Aparelho
                            </span>
                          )}
                        </div>

                        {/* Dados de Contato */}
                        <div className="flex items-center justify-between text-xs text-slate-600 py-1.5 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {reseller.phone}
                          </span>
                          {reseller.city && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {reseller.city}
                            </span>
                          )}
                        </div>

                        {/* BLOCO PERSONALIZADO: APARELHO VINCULADO */}
                        <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-semibold flex items-center gap-1">
                              <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                              Aparelho Vinculado:
                            </span>
                            {hasDevice ? (
                              <span className="text-slate-900 font-bold capitalize">
                                {primaryDev.deviceType === 'mobile' ? '📱 Celular' : primaryDev.deviceType === 'tablet' ? '📱 Tablet' : '💻 Computador'}
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium">Aguardando 1º Acesso</span>
                            )}
                          </div>

                          {hasDevice ? (
                            <div className="space-y-1.5 text-xs text-slate-700">
                              <div className="font-bold text-slate-800 truncate">
                                {primaryDev.deviceName}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                                <span>{primaryDev.os} • {primaryDev.browser}</span>
                                <span className="font-mono text-[10px]">
                                  {new Date(primaryDev.lastActiveAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>

                              {/* Status do Monitoramento e Regra da 10ª Mensagem */}
                              <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-medium">Ciclo de Envios:</span>
                                {(primaryDev.messagesSentCount || 0) < 10 ? (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold flex items-center gap-1 border border-blue-100" title="Em fase de tolerância inicial. Imune a expurgo.">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Tolerância ({primaryDev.messagesSentCount || 0}/10 envios)
                                  </span>
                                ) : (primaryDev.messagesDeliveredCount || 0) > 0 ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold flex items-center gap-1 border border-emerald-100" title="Recebendo mensagens normalmente. Token ativo e protegido.">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Ativo ({primaryDev.messagesDeliveredCount}/{primaryDev.messagesSentCount} entregues)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold flex items-center gap-1 border border-rose-200" title="Aparelho sem recebimento a partir do 10º envio. Elegível para expurgo na próxima higienização.">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    Expurgo Elegível ({primaryDev.messagesSentCount} envios s/ entrega)
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">
                              O aparelho e autorização de push serão vinculados automaticamente quando {reseller.fullName.split(' ')[0]} acessar o portal.
                            </p>
                          )}
                        </div>

                        {/* BLOCO PERSONALIZADO: DATA DE RETORNO DO ATENDIMENTO & STATUS DO PUSH */}
                        <div className={`mt-2 p-3 rounded-xl border text-xs space-y-1.5 ${
                          isDue
                            ? 'bg-amber-50 border-amber-300 text-amber-950'
                            : hasReturnDate
                              ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                              : 'bg-slate-50 border-slate-200/70 text-slate-600'
                        }`}>
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              Data de Retorno do Atendimento:
                            </span>
                            {profile?.pushScheduled !== false && hasReturnDate && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-200/80 text-purple-900 text-[10px]">
                                🔔 Push Automático
                              </span>
                            )}
                          </div>

                          {hasReturnDate && profile?.returnDate ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <strong className="text-sm">
                                  {new Date(`${profile.returnDate}T12:00:00`).toLocaleDateString('pt-BR')}
                                </strong>
                                <span className="text-[11px] text-slate-600">
                                  às {profile.returnTime || '10:00'}h
                                </span>
                              </div>
                              <div className={`text-[11px] font-semibold flex items-center gap-1 ${
                                isDue ? 'text-amber-800' : 'text-purple-700'
                              }`}>
                                {isDue ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                                )}
                                <span>{formatDaysUntilReturn(profile.returnDate)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">
                              Nenhuma data de retorno cadastrada. Clique em "Definir Retorno" para programar.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* BOTÕES DE AÇÃO POR CADASTRO */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReseller(reseller)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                          title="Definir data de retorno e configurações de push"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{hasReturnDate ? 'Ajustar Retorno' : 'Definir Retorno'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenQuickPush(reseller)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                          title="Disparar notificação push imediata para o aparelho dela"
                        >
                          <Send className="w-3.5 h-3.5 text-rose-400" />
                        </button>

                        <a
                          href={`https://wa.me/55${cleanCpf ? reseller.phone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(
                            `Olá ${reseller.fullName.split(' ')[0]}! Aqui é o Anderson da Distribuição Romance Itapema. Tudo bem? Passando para conversarmos sobre o retorno do seu atendimento do mostruário!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          title="Conversar no WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HISTÓRICO DE LOGS DE WEB PUSH ENVIADOS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800">
                  Histórico Recente de Notificações Web Push Disparadas ({pushLogs.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={reloadPushData}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Atualizar Logs
              </button>
            </div>

            {pushLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Nenhum envio de Web Push registrado ainda. As notificações automáticas e manuais aparecerão aqui.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {pushLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span>{log.resellerName}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
                          {log.deviceName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        <strong>{log.title}:</strong> {log.body}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(log.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.sentAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                        Entregue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MÓDULO: HIGIENIZAÇÃO DE PUSH & LIMPEZA DE TOKENS EXPIRADOS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Higienização de Push & Histórico de Expurgos
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Regra da 10ª Mensagem Ativa
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                    <strong>Limpeza não-destrutiva:</strong> Todos os tokens monitorados ativos e aparelhos em fase de adaptação (<strong className="text-indigo-700">1 a 9 envios</strong>) são rigorosamente preservados. O expurgo é aplicado <strong>exclusivamente para aparelhos que não receberem mensagens a partir da 10ª mensagem enviada</strong>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Restaura os aparelhos padrão de exemplo com status variados de mensagens para demonstração"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restaurar Aparelhos Exemplo</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunSanitization}
                  disabled={isSanitizing}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSanitizing ? 'animate-spin' : ''}`} />
                  <span>{isSanitizing ? 'Higienizando Tokens...' : 'Executar Higienização Agora'}</span>
                </button>
              </div>
            </div>

            {/* FEEDBACK DA HIGIENIZAÇÃO */}
            {sanitizationFeedback && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-900 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{sanitizationFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSanitizationFeedback(null)}
                  className="text-indigo-700 hover:text-indigo-900 text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* CARDS DE MONITORAMENTO DA HIGIENE */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-medium text-slate-500 block">Tokens Monitorados</span>
                <span className="text-lg font-bold text-slate-900">{devices.length}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Dispositivos cadastrados</span>
              </div>

              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/70">
                <span className="text-[11px] font-medium text-blue-800 block">Em Tolerância (&lt; 10 envios)</span>
                <span className="text-lg font-bold text-blue-700">
                  {devices.filter((d) => (d.messagesSentCount || 0) < 10).length}
                </span>
                <span className="text-[10px] text-blue-600 block mt-0.5">100% protegidos contra expurgo</span>
              </div>

              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/70">
                <span className="text-[11px] font-medium text-emerald-800 block">Recebendo com Sucesso</span>
                <span className="text-lg font-bold text-emerald-700">
                  {devices.filter((d) => (d.messagesSentCount || 0) >= 10 && (d.messagesDeliveredCount || 0) > 0).length}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">≥10 envios com entrega confirmada</span>
              </div>

              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/70">
                <span className="text-[11px] font-medium text-rose-800 block">Elegíveis p/ Expurgo (≥10 s/ entrega)</span>
                <span className="text-lg font-bold text-rose-700">
                  {devices.filter((d) => (d.messagesSentCount || 0) >= 10 && (d.messagesDeliveredCount || 0) === 0).length}
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5">Alvo exclusivo da limpeza</span>
              </div>
            </div>

            {/* SEÇÃO: HISTÓRICO DE LIMPEZAS & EXPURGOS AUTOMÁTICOS */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Histórico de Limpezas & Expurgos Automáticos ({sanitizationLogs.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={reloadPushData}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Atualizar Histórico
                </button>
              </div>

              {sanitizationLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Nenhum expurgo registrado ainda. Clique em "Executar Higienização Agora" ou aguarde a rotina noturna.
                </p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3.5">Tipo & Executor</th>
                          <th className="py-2.5 px-3">Data / Hora</th>
                          <th className="py-2.5 px-3 text-center">Analisados</th>
                          <th className="py-2.5 px-3 text-center">Preservados</th>
                          <th className="py-2.5 px-3 text-center">Expurgo (≥10 s/ entrega)</th>
                          <th className="py-2.5 px-3 text-center">Total Expurgados</th>
                          <th className="py-2.5 px-3.5">Status & Detalhes da Execução</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sanitizationLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-center gap-1.5">
                                {log.triggeredBy === 'automatic_schedule' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-purple-600" />
                                    Automático
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                                    Manual
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-500 truncate max-w-[130px]">
                                  {log.executorName || 'Sistema'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                              {log.totalTokensScanned}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                              {log.validTokensRetained}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold">
                              {(log.unreachableAfter10thRemoved ?? log.totalPurged) > 0 ? (
                                <span className="text-rose-600 font-bold">
                                  -{log.unreachableAfter10thRemoved ?? log.totalPurged}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {log.totalPurged > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  {log.totalPurged} expurgado(s)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  0 (Todos Mantidos)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 text-[11px] text-slate-600 max-w-sm">
                              <span className="line-clamp-2" title={log.details}>
                                {log.details}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 2: PERFIS DE VENDAS & MONTAGEM DA SACOLA */}
      {activeSubTab === 'profiles' && (
        <div className="space-y-6 animate-fade-in">
          {/* Métricas de Perfis */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Total de Revendedoras</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{resellers.length}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Perfis Preenchidos</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {salesProfiles.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Pendentes de Preenchimento</div>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {Math.max(0, resellers.length - salesProfiles.length)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Taxa de Conversão</div>
              <div className="text-xl font-bold text-rose-700 mt-1">
                {resellers.length > 0 ? Math.round((salesProfiles.length / resellers.length) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Filtros e Busca de Perfis */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF, telefone ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">Todos os Cadastros ({resellers.length})</option>
                <option value="with_profile">Com Perfil Preenchido</option>
                <option value="without_profile">Pendente de Preenchimento</option>
              </select>
            </div>
          </div>

          {/* Grid de Cards de Revendedoras para Montagem */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredResellers.map((reseller) => {
              const cleanCpf = reseller.cpf.replace(/\D/g, '');
              const profile = profilesMap.get(reseller.id) || profilesMap.get(cleanCpf);
              const hasProfile = Boolean(profile);

              return (
                <div
                  key={reseller.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {reseller.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {reseller.fullName}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono">
                            CPF: {reseller.cpf}
                          </span>
                        </div>
                      </div>

                      {hasProfile ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Perfil Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] shrink-0">
                          Pendente
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{reseller.phone}</span>
                      </div>
                      {reseller.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{reseller.city}</span>
                        </div>
                      )}
                    </div>

                    {hasProfile && profile ? (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Preferência Calcinha:</span>
                          <strong className="text-slate-800 capitalize">
                            {profile.pantyPreference === 'tanga' ? 'Mais Tanga' : profile.pantyPreference === 'fio' ? 'Mais Fio' : 'Equilibrado'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Tamanhos mais vendidos:</span>
                          <strong className="text-slate-800">
                            {profile.topSellingSizes.join(', ')}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Cueca Masculina:</span>
                          <strong className="text-slate-800">
                            {profile.sellsMensUnderwear ? `Sim (${profile.mensUnderwearSizes.join(',')})` : 'Não'}
                          </strong>
                        </div>

                        {profile.distributorMessage && (
                          <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-rose-800 italic line-clamp-2">
                            💬 "{profile.distributorMessage}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-800">
                        <p className="text-[11px]">
                          Esta revendedora ainda não preencheu o perfil de vendas no portal.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReseller(reseller)}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar Perfil & Retorno</span>
                    </button>

                    <a
                      href={`https://wa.me/55${reseller.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${reseller.fullName.split(' ')[0]}! Aqui é o Anderson da Romance Itapema. Tudo bem?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                      title="Conversar no WhatsApp"
                    >
                      <Share2 className="w-4 h-4 text-emerald-600" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Perfil da Revendedora & Data de Retorno Push */}
      {selectedReseller && (
        <AdminResellerProfileModal
          isOpen={Boolean(selectedReseller)}
          onClose={() => {
            setSelectedReseller(null);
            reloadPushData();
          }}
          reseller={selectedReseller}
          profile={selectedProfile}
          settings={settings}
          onSaveProfile={(updated) => {
            if (onSaveProfile) {
              onSaveProfile(updated);
            }
            reloadPushData();
          }}
        />
      )}

      {/* Modal de Disparo Rápido de Push */}
      {quickPushModalReseller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 border border-rose-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Disparar Notificação Web Push
                  </h4>
                  <p className="text-xs text-slate-500">
                    Destinatária: <strong>{quickPushModalReseller.fullName}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Notificação:
                </label>
                <input
                  type="text"
                  value={quickPushTitle}
                  onChange={(e) => setQuickPushTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mensagem para a Área de Notificações:
                </label>
                <textarea
                  rows={3}
                  value={quickPushBody}
                  onChange={(e) => setQuickPushBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickPushModalReseller(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendQuickPush}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Disparar Push Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
