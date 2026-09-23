import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  LogOut, 
  ShoppingBag, 
  MessageSquare, 
  Sparkles, 
  User, 
  Phone, 
  Clock, 
  Calendar,
  Check,
  ChevronRight,
  Info,
  Bell,
  BellOff,
  Smartphone,
  RefreshCw,
  Send
} from 'lucide-react';
import { ResellerUser, ResellerSalesProfile, PantyPreference, DominantSize, BusinessSettings } from '../../types';
import { OFFICIAL_GENERAL_CLOTHING_ITEMS } from '../../data/initialData';
import { 
  getDeviceDetails, 
  checkPushPermission, 
  requestPushPermission, 
  showNativePushNotification, 
  registerCurrentDeviceForReseller, 
  isReturnDateDue, 
  formatDaysUntilReturn,
  recordPushLog,
  hasResellerAuthorizedPush,
  markResellerPushAuthorized,
  isResellerPushDeactivatedByUser,
  setResellerPushDeactivatedByUser,
  checkAndRunAutomaticSanitization 
} from '../../utils/webPushHelper';

interface ResellerDashboardProps {
  currentReseller: ResellerUser;
  salesProfile?: ResellerSalesProfile;
  settings: BusinessSettings;
  onSaveProfile: (profile: ResellerSalesProfile) => void;
  onLogout: () => void;
  onBackToSite: () => void;
}

export const ResellerDashboard: React.FC<ResellerDashboardProps> = ({
  currentReseller,
  salesProfile,
  settings,
  onSaveProfile,
  onLogout,
  onBackToSite,
}) => {
  // Estados do formulário de Perfil de Vendas
  const [sellsMensUnderwear, setSellsMensUnderwear] = useState<boolean>(
    salesProfile?.sellsMensUnderwear ?? true
  );
  const [mensUnderwearSizes, setMensUnderwearSizes] = useState<('P' | 'M' | 'G' | 'GG')[]>(
    salesProfile?.mensUnderwearSizes ?? ['M', 'G']
  );

  const [sellsMensApparel, setSellsMensApparel] = useState<boolean>(
    salesProfile?.sellsMensApparel ?? false
  );

  const [sellsKidsClothing, setSellsKidsClothing] = useState<boolean>(
    salesProfile?.sellsKidsClothing ?? false
  );

  const [sellsKidsUnderwear, setSellsKidsUnderwear] = useState<boolean>(
    salesProfile?.sellsKidsUnderwear ?? false
  );

  const [sellsBraletteNoPadding, setSellsBraletteNoPadding] = useState<boolean>(
    salesProfile?.sellsBraletteNoPadding ?? true
  );

  const [pantyPreference, setPantyPreference] = useState<PantyPreference>(
    salesProfile?.pantyPreference ?? 'equilibrado'
  );

  const [topSellingSizes, setTopSellingSizes] = useState<DominantSize[]>(
    salesProfile?.topSellingSizes ?? ['M', 'G']
  );

  const [generalClothingItems, setGeneralClothingItems] = useState<string[]>(
    salesProfile?.generalClothingItems ?? ['Blusa', 'Conjunto', 'Top e cropped', 'Legg', 'Pijamas']
  );

  const [distributorMessage, setDistributorMessage] = useState<string>(
    salesProfile?.distributorMessage ?? ''
  );

  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(
    salesProfile?.updatedAt ? new Date(salesProfile.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null
  );

  // Informações do Aparelho & Notificações Web Push
  const [deviceInfo] = useState(getDeviceDetails());
  const [pushPermission, setPushPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(checkPushPermission());
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() =>
    hasResellerAuthorizedPush(currentReseller.id, currentReseller.cpf) || checkPushPermission() === 'granted'
  );
  const [isDeactivatedByUser, setIsDeactivatedByUser] = useState<boolean>(() =>
    isResellerPushDeactivatedByUser(currentReseller.id)
  );
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  // Executa checagem de higienização de tokens em segundo plano
  useEffect(() => {
    checkAndRunAutomaticSanitization();
  }, []);

  // Verificação automática da Data de Retorno do Atendimento e Disparo de Web Push para a área de notificações
  useEffect(() => {
    // Garante que o aparelho esteja vinculado e salvo
    registerCurrentDeviceForReseller(currentReseller, checkPushPermission() as any);

    // Se a vendedora desativou notificações no painel dela, não dispara o push automático
    if (isDeactivatedByUser) return;

    if (salesProfile?.returnDate && salesProfile.pushScheduled !== false) {
      if (isReturnDateDue(salesProfile.returnDate)) {
        const sessionKey = `romance_return_push_shown_${currentReseller.id}_${salesProfile.returnDate}`;
        const alreadyShown = sessionStorage.getItem(sessionKey);
        if (!alreadyShown) {
          const title = salesProfile.pushNotificationTitle || 'Romance Itapema: Retorno do Atendimento';
          const body = salesProfile.pushNotificationBody || `Olá ${currentReseller.fullName.split(' ')[0]}! Hoje é o dia do retorno do seu atendimento e acerto da sacola Romance.`;
          
          showNativePushNotification(title, {
            body,
            tag: `return-auto-${currentReseller.id}-${salesProfile.returnDate}`,
          });

          recordPushLog({
            id: `log-reseller-auto-${Date.now()}`,
            resellerId: currentReseller.id,
            resellerName: currentReseller.fullName,
            resellerCpf: currentReseller.cpf,
            deviceId: `dev-${currentReseller.id}`,
            deviceName: deviceInfo.deviceName,
            title,
            body,
            sentAt: new Date().toISOString(),
            scheduledFor: `${salesProfile.returnDate} ${salesProfile.returnTime || '10:00'}`,
            triggerType: 'automatic_schedule',
            status: 'delivered',
          });

          sessionStorage.setItem(sessionKey, 'true');
          setPushFeedback(`🔔 Notificação de Retorno enviada para a área de notificações do seu aparelho!`);
          setTimeout(() => setPushFeedback(null), 6000);
        }
      }
    }
  }, [salesProfile?.returnDate, salesProfile?.pushScheduled, currentReseller.id, isDeactivatedByUser]);

  // Ação de autorizar Web Push caso ainda não esteja concedida
  const handleEnablePush = async () => {
    setIsRequestingPush(true);
    try {
      const perm = await requestPushPermission();
      setPushPermission(perm);
      registerCurrentDeviceForReseller(currentReseller, perm);

      if (perm === 'granted') {
        markResellerPushAuthorized(currentReseller.id, currentReseller.cpf);
        setIsAuthorized(true);
        setIsDeactivatedByUser(false);
        showNativePushNotification('Romance Itapema: Notificações Ativadas!', {
          body: `Seu aparelho (${deviceInfo.deviceName}) está vinculado. Você receberá avisos da sua sacola aqui.`,
        });
        setPushFeedback('✅ Notificações Web Push autorizadas com sucesso! Não será necessário ativar novamente.');
      } else {
        setPushFeedback('ℹ️ Permissão mantida no estado atual do navegador.');
      }
    } catch {
      // silencioso
    } finally {
      setIsRequestingPush(false);
      setTimeout(() => setPushFeedback(null), 5000);
    }
  };

  // Desativação ou Reativação voluntária no painel da revendedora
  const handleToggleResellerPush = () => {
    const nextState = !isDeactivatedByUser;
    setResellerPushDeactivatedByUser(currentReseller.id, nextState);
    setIsDeactivatedByUser(nextState);

    if (nextState) {
      setPushFeedback('🔕 Notificações desativadas neste aparelho. Você pode reativar a qualquer momento aqui.');
    } else {
      setPushFeedback('🔔 Notificações reativadas com sucesso! Você voltará a receber os avisos na data de retorno.');
      showNativePushNotification('Romance Itapema: Notificações Reativadas!', {
        body: `Seu aparelho (${deviceInfo.deviceName}) está configurado para receber os alertas de atendimento.`,
      });
    }
    setTimeout(() => setPushFeedback(null), 5000);
  };

  // Testar notificação no próprio aparelho
  const handleTestPushOnDevice = () => {
    if (isDeactivatedByUser) {
      setPushFeedback('⚠️ Você desativou as notificações. Reative as notificações para testar.');
      setTimeout(() => setPushFeedback(null), 4000);
      return;
    }
    const success = showNativePushNotification('Romance Itapema: Teste de Notificação', {
      body: `Olá ${currentReseller.fullName.split(' ')[0]}! Seu aparelho ${deviceInfo.deviceName} está conectado com sucesso ao Web Push.`,
      tag: `test-reseller-${Date.now()}`,
    });

    if (success) {
      setPushFeedback('📲 Notificação de teste enviada para a barra do seu dispositivo!');
    } else {
      setPushFeedback('⚠️ Para ver a notificação na barra, autorize as notificações acima.');
    }
    setTimeout(() => setPushFeedback(null), 5000);
  };

  // Alterna tamanho de cueca masculina
  const toggleMensSize = (size: 'P' | 'M' | 'G' | 'GG') => {
    if (mensUnderwearSizes.includes(size)) {
      setMensUnderwearSizes(mensUnderwearSizes.filter((s) => s !== size));
    } else {
      setMensUnderwearSizes([...mensUnderwearSizes, size]);
    }
  };

  // Alterna tamanho feminino mais vendido
  const toggleTopSellingSize = (size: DominantSize) => {
    if (topSellingSizes.includes(size)) {
      if (topSellingSizes.length === 1) return; // Mantém ao menos 1
      setTopSellingSizes(topSellingSizes.filter((s) => s !== size));
    } else {
      setTopSellingSizes([...topSellingSizes, size]);
    }
  };

  // Alterna item de roupas em geral
  const toggleClothingItem = (item: string) => {
    if (generalClothingItems.includes(item)) {
      setGeneralClothingItems(generalClothingItems.filter((i) => i !== item));
    } else {
      setGeneralClothingItems([...generalClothingItems, item]);
    }
  };

  // Salvar perfil de vendas preservando dados de retorno cadastrados pelo distribuidor
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const profileData: ResellerSalesProfile = {
      id: salesProfile?.id || `profile-${currentReseller.id}-${Date.now()}`,
      resellerId: currentReseller.id,
      resellerCpf: currentReseller.cpf,
      resellerName: currentReseller.fullName,
      resellerPhone: currentReseller.phone,
      resellerCity: currentReseller.city || 'Santa Catarina',
      sellsMensUnderwear,
      mensUnderwearSizes: sellsMensUnderwear ? mensUnderwearSizes : [],
      sellsMensApparel,
      sellsKidsClothing,
      sellsKidsUnderwear,
      sellsBraletteNoPadding,
      pantyPreference,
      topSellingSizes,
      generalClothingItems,
      distributorMessage: distributorMessage.trim(),
      // Preservar dados de retorno e push configurados pelo distribuidor
      returnDate: salesProfile?.returnDate,
      returnTime: salesProfile?.returnTime,
      returnNotes: salesProfile?.returnNotes,
      pushScheduled: salesProfile?.pushScheduled,
      pushNotificationTitle: salesProfile?.pushNotificationTitle,
      pushNotificationBody: salesProfile?.pushNotificationBody,
      pushSentAt: salesProfile?.pushSentAt,
      pushStatus: salesProfile?.pushStatus,
      updatedAt: new Date().toISOString(),
      createdAt: salesProfile?.createdAt || new Date().toISOString(),
    };

    onSaveProfile(profileData);
    setIsSaved(true);
    setLastSavedTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToSite}
              className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors"
            >
              <span>← Voltar ao site</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">
                {currentReseller.fullName.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-semibold text-slate-800 line-clamp-1">
                  {currentReseller.fullName}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Revendedora Conectada
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Desconectar do portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Welcome & Info Card */}
        <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-pink-900 text-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-rose-100 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Montagem do Mostruário Sem Investimento</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Olá, {currentReseller.fullName.split(' ')[0]}! Configure seu Perfil de Vendas
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Aqui você informa suas preferências e o perfil das suas clientes. O distribuidor utiliza estas informações para equilibrar e montar a sua sacola da melhor forma para você lucrar de 30% a 40%!
            </p>

            <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs text-rose-200">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-300" />
                <span>Ciclo: <strong>40 dias sem risco</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-300" />
                <span>Última atualização: <strong>{lastSavedTime ? `${lastSavedTime}` : 'Ainda não preenchido'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* CAIXA DE AVISO PARA AUTORIZAR NOTIFICAÇÃO (UMA VEZ AUTORIZADO NÃO DEVE SER NECESSÁRIO ATIVAR NOVAMENTE) */}
        {!isAuthorized && pushPermission !== 'granted' && (
          <div className="mb-6 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-2 border-rose-300 rounded-2xl p-5 sm:p-6 shadow-sm animate-fade-in relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-200">
                  <Bell className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      📢 Aviso de Autorização: Ative as Notificações da sua Sacola Romance
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                      Ação Única
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 max-w-2xl leading-relaxed">
                    Para não perder o prazo de retorno do mostruário e acerto do atendimento cadastrado pelo distribuidor, autorize o envio de notificações na tela do seu aparelho. <strong>Uma vez autorizado, não será necessário ativar novamente</strong>, salvo se você optar por desativar no seu painel.
                  </p>
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isRequestingPush}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-300 transition-all active:scale-95 disabled:opacity-60"
                >
                  <Bell className="w-4 h-4" />
                  <span>{isRequestingPush ? 'Autorizando aparelho...' : 'Autorizar Notificações Agora'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK DE DISPARO DE PUSH */}
        {pushFeedback && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{pushFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setPushFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        )}

        {/* CARD DEDICADO: RETORNO DO ATENDIMENTO & VÍNCULO DE WEB PUSH */}
        <div className="mb-6 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Data de Retorno do Atendimento & Web Push
                </h3>
                <p className="text-xs text-slate-500">
                  Avisos automáticos enviados para a área de notificações do seu aparelho
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDeactivatedByUser ? (
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                  <BellOff className="w-3.5 h-3.5 text-slate-500" />
                  Notificações Pausadas
                </span>
              ) : isAuthorized || pushPermission === 'granted' ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Aparelho Conectado & Ativo
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isRequestingPush}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{isRequestingPush ? 'Autorizando...' : 'Autorizar Notificações'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco 1: Data de Retorno Cadastrada pelo Distribuidor */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              salesProfile?.returnDate && isReturnDateDue(salesProfile.returnDate)
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : salesProfile?.returnDate
                  ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span className="flex items-center gap-1 text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  Previsão de Retorno do Atendimento:
                </span>
                {salesProfile?.returnDate && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 text-[10px]">
                    Cadastrado pelo Distribuidor
                  </span>
                )}
              </div>

              {salesProfile?.returnDate ? (
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-900">
                      {new Date(`${salesProfile.returnDate}T12:00:00`).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Horário: {salesProfile.returnTime || '10:00'}h
                    </span>
                  </div>

                  <div className={`text-xs font-bold flex items-center gap-1.5 ${
                    isReturnDateDue(salesProfile.returnDate) ? 'text-amber-800' : 'text-purple-700'
                  }`}>
                    {isReturnDateDue(salesProfile.returnDate) ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    <span>{formatDaysUntilReturn(salesProfile.returnDate)}</span>
                  </div>

                  {salesProfile.returnNotes && (
                    <p className="text-[11px] text-slate-600 pt-1 border-t border-purple-100 italic">
                      💬 Recado do Distribuidor: "{salesProfile.returnNotes}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2 text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Nenhuma data de retorno cadastrada no momento.</p>
                  <p className="text-[11px]">
                    O distribuidor Anderson registrará a data de retorno do seu mostruário ao enviar sua sacola.
                  </p>
                </div>
              )}
            </div>

            {/* Bloco 2: Aparelho Vinculado ao Nome da Revendedora */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                    Aparelho Vinculado ao seu Cadastro:
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {currentReseller.cpf}
                  </span>
                </div>
                <div className="text-slate-900 font-bold text-xs">
                  {deviceInfo.deviceName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {deviceInfo.os} • {deviceInfo.browser}
                </div>
              </div>

              {/* CONTROLES DE ATIVAÇÃO / DESATIVAÇÃO PELO PAINEL DA VENDEDORA */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Status no Aparelho:</span>
                  {isDeactivatedByUser ? (
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BellOff className="w-3 h-3 text-amber-600" />
                      Pausado por Você
                    </span>
                  ) : isAuthorized || pushPermission === 'granted' ? (
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Autorizado & Ativo
                    </span>
                  ) : (
                    <span className="font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      Pendente de Autorização
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {(isAuthorized || pushPermission === 'granted') && (
                    <button
                      type="button"
                      onClick={handleToggleResellerPush}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                        isDeactivatedByUser
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                          : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                      title={
                        isDeactivatedByUser
                          ? 'Clique para voltar a receber notificações automáticas'
                          : 'Clique para desativar o recebimento de notificações no seu aparelho'
                      }
                    >
                      {isDeactivatedByUser ? (
                        <>
                          <Bell className="w-3.5 h-3.5" />
                          <span>Reativar Notificações</span>
                        </>
                      ) : (
                        <>
                          <BellOff className="w-3.5 h-3.5" />
                          <span>Desativar no meu Painel</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleTestPushOnDevice}
                    disabled={isDeactivatedByUser}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-40"
                    title="Testar notificação nativa no aparelho"
                  >
                    <Send className="w-3 h-3 text-rose-600" />
                    <span>Testar no Aparelho</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AVISO IMPORTANTE EM DESTAQUE OBRIGATÓRIO */}
        <div className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-amber-900 flex items-center gap-2">
                <span>Aviso Importante sobre o Mostruário em Consignado</span>
                <span className="text-[11px] font-semibold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Leia antes de preencher
                </span>
              </h2>
              <div className="text-xs sm:text-sm text-amber-950/90 leading-relaxed font-medium space-y-1.5 bg-white/70 p-3.5 rounded-xl border border-amber-200/70">
                <p>
                  Na <strong>Romance NÃO trabalhamos com encomendas</strong>, mas sim com <strong>perfil de tamanhos e linhas comerciais genéricas</strong>.
                </p>
                <p>
                  Não sendo possível encomendar modelos e cores específicos.
                </p>
                <p className="text-amber-900 font-semibold">
                  Lembrando que não é possível disponibilizar todas as grades de tamanhos na mesma sacola.
                </p>
              </div>
              <p className="text-xs text-amber-800">
                Preencha abaixo o perfil que mais reflete o seu público para que o distribuidor consiga equilibrar o mix da sua sacola.
              </p>
            </div>
          </div>
        </div>

        {/* Formulário de Perfil de Vendas */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* SEÇÃO 1: LINHAS MASCULINAS & INFANTIL */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs flex items-center justify-center font-bold">1</span>
                <span>Moda Masculina & Linha Infantil</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Defina se você atende público masculino e infantil</p>
            </div>

            {/* 1. Cuecas masculinas */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-sm font-semibold text-slate-800 block">
                    Vende cuecas masculinas?
                  </label>
                  <p className="text-xs text-slate-500">Boxer, slip e sem costura para o público masculino</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSellsMensUnderwear(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      sellsMensUnderwear
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setSellsMensUnderwear(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      !sellsMensUnderwear
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {sellsMensUnderwear && (
                <div className="pt-3 border-t border-slate-200/80 animate-fade-in">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    Quais tamanhos masculinos você vende? (Selecione um ou mais)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(['P', 'M', 'G', 'GG'] as const).map((size) => {
                      const selected = mensUnderwearSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleMensSize(size)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            selected
                              ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5" />}
                          <span>Tamanho {size}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Bermuda e camiseta masculino */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-semibold text-slate-800 block">
                  Vende bermuda e camiseta masculino?
                </label>
                <p className="text-xs text-slate-500">Linha casual e treino para homens</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSellsMensApparel(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    sellsMensApparel
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setSellsMensApparel(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    !sellsMensApparel
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>

            {/* 3. Roupas infantil */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-semibold text-slate-800 block">
                  Vende roupas infantil?
                </label>
                <p className="text-xs text-slate-500">Conjuntinhos, vestidos e moda para crianças</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSellsKidsClothing(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    sellsKidsClothing
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setSellsKidsClothing(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    !sellsKidsClothing
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>

            {/* 4. Calcinha e cueca infantil */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-semibold text-slate-800 block">
                  Vende calcinha e cueca infantil?
                </label>
                <p className="text-xs text-slate-500">Moda íntima infantil para meninos e meninas</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSellsKidsUnderwear(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    sellsKidsUnderwear
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setSellsKidsUnderwear(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    !sellsKidsUnderwear
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: LINGERIE E PREFERÊNCIAS FEMININAS */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs flex items-center justify-center font-bold">2</span>
                <span>Lingerie & Modelagens Femininas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Preferências de sutiãs, calcinhas e tamanhos mais procurados</p>
            </div>

            {/* 5. Soutien sem bojo */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-semibold text-slate-800 block">
                  Vende soutien sem bojo?
                </label>
                <p className="text-xs text-slate-500">Modelos confortáveis tipo bralette, renda ou algodão sem bojo estruturado</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSellsBraletteNoPadding(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    sellsBraletteNoPadding
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setSellsBraletteNoPadding(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    !sellsBraletteNoPadding
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>

            {/* 6. Vende mais tanga ou fio? */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <label className="text-sm font-semibold text-slate-800 block">
                Vende mais tanga ou fio?
              </label>
              <p className="text-xs text-slate-500">Qual é a preferência predominante das suas clientes?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { id: 'tanga', label: 'Mais Tanga', desc: 'Maior cobertura e conforto' },
                  { id: 'fio', label: 'Mais Fio', desc: 'Menor cobertura e sensual' },
                  { id: 'equilibrado', label: 'Equilibrado (Ambos)', desc: 'Meio a meio na sacola' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPantyPreference(opt.id as PantyPreference)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      pantyPreference === opt.id
                        ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {pantyPreference === opt.id && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Vende mais p, m, g ou gg? */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <label className="text-sm font-semibold text-slate-800 block">
                Vende mais P, M, G ou GG?
              </label>
              <p className="text-xs text-slate-500">Selecione os tamanhos que mais têm saída com suas clientes:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {(['P', 'M', 'G', 'GG'] as const).map((size) => {
                  const selected = topSellingSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleTopSellingSize(size)}
                      className={`p-3 rounded-xl border text-center font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                        selected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {selected && <Check className="w-4 h-4 text-white" />}
                      <span>Tamanho {size}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: ROUPAS EM GERAL (13 ITENS OFICIAIS) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs flex items-center justify-center font-bold">3</span>
                  <span>Roupas em Geral (Mix de Produtos)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marque as categorias de peças que você tem público para vender:
                </p>
              </div>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                {generalClothingItems.length} selecionadas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2">
              {OFFICIAL_GENERAL_CLOTHING_ITEMS.map((item) => {
                const isSelected = generalClothingItems.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleClothingItem(item)}
                    className={`p-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between gap-1 text-left ${
                      isSelected
                        ? 'bg-rose-50/90 border-rose-400 text-rose-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 4: RECADO SALVO PARA O DISTRIBUIDOR */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs flex items-center justify-center font-bold">4</span>
                <span>Recado Salvo para o Distribuidor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Deixe seu recado salvo para o distribuidor e assim facilitar a organização do seu material.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mensagem ou Observação da Sacola:
              </label>
              <textarea
                rows={4}
                value={distributorMessage}
                onChange={(e) => setDistributorMessage(e.target.value)}
                placeholder="Exemplo: Minhas clientes são em sua maioria professoras e donas de casa. Têm preferência por conjuntos fitness sem transparência, peças sem costura e pijamas de botão. Tamanhos M e G vendem primeiro!"
                className="w-full p-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm outline-none transition-all placeholder:text-slate-400 leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Este recado ficará salvo e visível no painel do distribuidor para orientar a separação do seu mostruário.</span>
              </p>
            </div>
          </div>

          {/* BARRA DE AÇÃO FIXA / BOTÃO DE SALVAR */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-rose-100 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {isSaved ? (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Perfil de vendas salvo com sucesso no sistema!</span>
                </div>
              ) : (
                <span>
                  As alterações são salvas e o distribuidor poderá consultar no painel a qualquer momento.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Perfil de Vendas</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
