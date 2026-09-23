import { ResellerDeviceSubscription, WebPushLog, PushSanitizationLog, ResellerSalesProfile, ResellerUser } from '../types';

const STORAGE_DEVICES_KEY = 'romance_itapema_reseller_devices';
const STORAGE_LOGS_KEY = 'romance_itapema_web_push_logs';
const STORAGE_SANITIZATION_KEY = 'romance_itapema_push_sanitization_logs';
const STORAGE_AUTHORIZED_RESELLERS_KEY = 'romance_itapema_push_authorized_resellers';
const STORAGE_DEACTIVATED_RESELLERS_KEY = 'romance_itapema_push_deactivated_resellers';
const STORAGE_LAST_AUTO_PURGE_KEY = 'romance_itapema_push_last_auto_purge';

/**
 * Detecta características do dispositivo da vendedora a partir do navegador
 */
export function getDeviceDetails(): {
  deviceName: string;
  deviceModel: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  userAgent: string;
} {
  if (typeof window === 'undefined') {
    return {
      deviceName: 'Dispositivo Web',
      deviceModel: 'Navegador Web',
      deviceType: 'mobile',
      browser: 'Navegador',
      os: 'Desconhecido',
      userAgent: '',
    };
  }

  const ua = navigator.userAgent;
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  let os = 'Windows / Desktop';
  let browser = 'Chrome / Web';
  let deviceModel = 'Dispositivo Padrão';

  // Detecção de tipo de dispositivo
  if (/iPad|Tablet|PlayBook/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))) {
    deviceType = 'tablet';
  } else if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'mobile';
  }

  // Detecção de Sistema Operacional
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s([0-9\.]+)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS\s([0-9\_]+)/);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS (iPhone/Apple)';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS (Apple)';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Detecção de Navegador
  if (/SamsungBrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua)) {
    browser = deviceType === 'mobile' ? 'Chrome Mobile' : 'Google Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/Edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Mozilla Firefox';
  }

  // Heurística de Marca / Modelo
  if (/SM-|Samsung/i.test(ua)) {
    deviceModel = 'Samsung Galaxy';
  } else if (/iPhone/i.test(ua)) {
    deviceModel = 'Apple iPhone';
  } else if (/iPad/i.test(ua)) {
    deviceModel = 'Apple iPad';
  } else if (/Moto|Motorola/i.test(ua)) {
    deviceModel = 'Motorola Moto';
  } else if (/Redmi|POCO|Xiaomi/i.test(ua)) {
    deviceModel = 'Xiaomi / Redmi';
  } else if (deviceType === 'desktop') {
    deviceModel = `${os} - Computador`;
  } else {
    deviceModel = `${os} Smartphone`;
  }

  const deviceName = `${deviceModel} (${browser})`;

  return {
    deviceName,
    deviceModel,
    deviceType,
    browser,
    os,
    userAgent: ua,
  };
}

/**
 * Verifica o status atual da permissão de notificações no navegador
 */
export function checkPushPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Solicita a autorização de Notificações Push ao usuário
 */
export async function requestPushPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Erro ao solicitar permissão de notificações push:', err);
    return 'denied';
  }
}

/**
 * Dispara uma notificação nativa na barra/área de notificações do dispositivo
 */
export function showNativePushNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    url?: string;
  }
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body: options?.body || 'Romance Itapema: Aviso do seu mostruário consignado.',
      icon: options?.icon || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=192&auto=format&fit=crop&q=80',
      badge: options?.badge || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=96&auto=format&fit=crop&q=80',
      tag: options?.tag || 'romance-push',
      ...({ vibrate: [200, 100, 200] } as any),
    });

    notification.onclick = () => {
      window.focus();
      if (options?.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    // Tocar feedback sonoro suave se possível
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // áudio opcional
    }

    return true;
  } catch (err) {
    console.warn('Falha ao instanciar Notification nativa (tentando modo alternativo):', err);
    return false;
  }
}

/**
 * Dispositivos padrão monitorados para revendedoras cadastradas
 */
export const DEFAULT_DEVICES: ResellerDeviceSubscription[] = [
  {
    id: 'dev-reseller-1-samsung-galaxy',
    resellerId: 'reseller-1',
    resellerName: 'Camila Silveira Bastos',
    resellerCpf: '123.456.789-01',
    resellerPhone: '(47) 99876-5432',
    deviceName: 'Samsung Galaxy S23 (Chrome Mobile)',
    deviceModel: 'Samsung Galaxy',
    deviceType: 'mobile',
    browser: 'Chrome Mobile',
    os: 'Android 14',
    permissionStatus: 'granted',
    pushToken: 'push-token-reseller-1-camila',
    registeredAt: '2026-02-12T15:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    active: true,
    tokenStatus: 'active',
    deactivatedByUser: false,
    messagesSentCount: 4,
    messagesDeliveredCount: 4,
    messagesFailedCount: 0,
    receivingStatus: 'tolerance_phase',
    lastMessageSentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dev-reseller-2-iphone-14',
    resellerId: 'reseller-2',
    resellerName: 'Juliana Mendes Rocha',
    resellerCpf: '987.654.321-09',
    resellerPhone: '(47) 98765-4321',
    deviceName: 'Apple iPhone 14 (Safari Mobile)',
    deviceModel: 'Apple iPhone',
    deviceType: 'mobile',
    browser: 'Safari',
    os: 'iOS 17.4',
    permissionStatus: 'granted',
    pushToken: 'push-token-reseller-2-juliana',
    registeredAt: '2026-02-20T10:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    active: true,
    tokenStatus: 'active',
    deactivatedByUser: false,
    messagesSentCount: 7,
    messagesDeliveredCount: 7,
    messagesFailedCount: 0,
    receivingStatus: 'tolerance_phase',
    lastMessageSentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dev-reseller-3-motorola-moto',
    resellerId: 'reseller-3',
    resellerName: 'Tatiane Aparecida Santos',
    resellerCpf: '456.789.123-45',
    resellerPhone: '(47) 99123-4567',
    deviceName: 'Motorola Moto G84 (Chrome Mobile)',
    deviceModel: 'Motorola Moto',
    deviceType: 'mobile',
    browser: 'Chrome Mobile',
    os: 'Android 14',
    permissionStatus: 'granted',
    pushToken: 'push-token-reseller-3-tatiane',
    registeredAt: '2026-03-02T11:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    active: true,
    tokenStatus: 'active',
    deactivatedByUser: false,
    messagesSentCount: 2,
    messagesDeliveredCount: 2,
    messagesFailedCount: 0,
    receivingStatus: 'tolerance_phase',
    lastMessageSentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dev-demo-antigo-expurgo',
    resellerId: 'reseller-demo-antigo',
    resellerName: 'Aparelho Antigo Descartado (Demonstração)',
    resellerCpf: '000.111.222-33',
    resellerPhone: '(47) 99999-0000',
    deviceName: 'Xiaomi Redmi Note 8 (Navegador Inativo)',
    deviceModel: 'Xiaomi / Redmi',
    deviceType: 'mobile',
    browser: 'Chrome Mobile',
    os: 'Android 10',
    permissionStatus: 'granted',
    pushToken: 'push-token-redmi-unreachable',
    registeredAt: '2025-11-01T10:00:00.000Z',
    lastActiveAt: '2025-11-15T10:00:00.000Z',
    active: true,
    tokenStatus: 'active',
    deactivatedByUser: false,
    messagesSentCount: 12,
    messagesDeliveredCount: 0,
    messagesFailedCount: 12,
    receivingStatus: 'purge_eligible',
    lastMessageSentAt: '2025-12-01T10:00:00.000Z',
  }
];

/**
 * Lê os dispositivos salvos no armazenamento local.
 * Garante que os aparelhos monitorados padrão estejam sempre presentes caso a base esteja vazia.
 */
export function getStoredDeviceSubscriptions(): ResellerDeviceSubscription[] {
  if (typeof window === 'undefined') return DEFAULT_DEVICES;
  try {
    const raw = localStorage.getItem(STORAGE_DEVICES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_DEVICES_KEY, JSON.stringify(DEFAULT_DEVICES));
      return DEFAULT_DEVICES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_DEVICES_KEY, JSON.stringify(DEFAULT_DEVICES));
      return DEFAULT_DEVICES;
    }
    return parsed;
  } catch {
    return DEFAULT_DEVICES;
  }
}

/**
 * Salva ou atualiza a inscrição do dispositivo da vendedora
 */
export function saveStoredDeviceSubscription(sub: ResellerDeviceSubscription): ResellerDeviceSubscription[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getStoredDeviceSubscriptions();
    const filtered = current.filter(
      (d) => d.id !== sub.id && !(d.resellerId === sub.resellerId && d.deviceName === sub.deviceName)
    );
    const updated = [sub, ...filtered];
    localStorage.setItem(STORAGE_DEVICES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Verifica se a vendedora já autorizou push anteriormente (no navegador ou cadastro)
 */
export function hasResellerAuthorizedPush(resellerId: string, cpf?: string): boolean {
  if (typeof window === 'undefined') return false;
  if ('Notification' in window && Notification.permission === 'granted') {
    return true;
  }
  try {
    const raw = localStorage.getItem(STORAGE_AUTHORIZED_RESELLERS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
    return list.includes(resellerId) || (cleanCpf ? list.includes(cleanCpf) : false);
  } catch {
    return false;
  }
}

/**
 * Marca a revendedora como autorizada para nunca mais exibir a caixa de aviso desnecessariamente
 */
export function markResellerPushAuthorized(resellerId: string, cpf?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_AUTHORIZED_RESELLERS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
    const toAdd = [resellerId, cleanCpf].filter(Boolean);
    const updated = Array.from(new Set([...list, ...toAdd]));
    localStorage.setItem(STORAGE_AUTHORIZED_RESELLERS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erro ao marcar revendedora como autorizada:', err);
  }
}

/**
 * Verifica se a revendedora optou por desativar notificações no seu painel
 */
export function isResellerPushDeactivatedByUser(resellerId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_DEACTIVATED_RESELLERS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(resellerId);
  } catch {
    return false;
  }
}

/**
 * Permite à vendedora desativar ou reativar as notificações no seu próprio painel
 */
export function setResellerPushDeactivatedByUser(resellerId: string, deactivated: boolean): ResellerDeviceSubscription[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_DEACTIVATED_RESELLERS_KEY);
    let list: string[] = raw ? JSON.parse(raw) : [];
    if (deactivated) {
      if (!list.includes(resellerId)) list.push(resellerId);
    } else {
      list = list.filter((id) => id !== resellerId);
    }
    localStorage.setItem(STORAGE_DEACTIVATED_RESELLERS_KEY, JSON.stringify(list));

    // Atualiza status nos aparelhos salvos
    const currentDevs = getStoredDeviceSubscriptions();
    const updatedDevs = currentDevs.map((dev) => {
      if (dev.resellerId === resellerId) {
        return {
          ...dev,
          active: !deactivated,
          deactivatedByUser: deactivated,
          deactivatedAt: deactivated ? new Date().toISOString() : undefined,
          tokenStatus: deactivated
            ? ('deactivated_by_user' as const)
            : dev.permissionStatus === 'denied'
              ? ('revoked' as const)
              : ('active' as const),
        };
      }
      return dev;
    });
    localStorage.setItem(STORAGE_DEVICES_KEY, JSON.stringify(updatedDevs));
    return updatedDevs;
  } catch {
    return [];
  }
}

/**
 * Cria ou atualiza o vínculo do aparelho para a revendedora logada
 */
export function registerCurrentDeviceForReseller(
  reseller: ResellerUser,
  permissionStatus: 'granted' | 'denied' | 'default'
): ResellerDeviceSubscription {
  const details = getDeviceDetails();
  const token = `push-token-${reseller.id}-${Math.random().toString(36).substring(2, 10)}`;
  const isDeactivated = isResellerPushDeactivatedByUser(reseller.id);

  if (permissionStatus === 'granted') {
    markResellerPushAuthorized(reseller.id, reseller.cpf);
  }

  // Token válido por padrão por 60 dias
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const subscription: ResellerDeviceSubscription = {
    id: `dev-${reseller.id}-${details.os.replace(/\s+/g, '-').toLowerCase()}`,
    resellerId: reseller.id,
    resellerName: reseller.fullName,
    resellerCpf: reseller.cpf,
    resellerPhone: reseller.phone,
    deviceName: details.deviceName,
    deviceModel: details.deviceModel,
    deviceType: details.deviceType,
    browser: details.browser,
    os: details.os,
    permissionStatus,
    pushToken: token,
    userAgent: details.userAgent,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    expiresAt,
    active: !isDeactivated && permissionStatus !== 'denied',
    deactivatedByUser: isDeactivated,
    tokenStatus: isDeactivated
      ? 'deactivated_by_user'
      : permissionStatus === 'denied'
        ? 'revoked'
        : 'active',
  };

  saveStoredDeviceSubscription(subscription);
  return subscription;
}

/**
 * Lê os logs de disparos de Web Push
 */
export function getStoredPushLogs(): WebPushLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Atualiza o contador de mensagens enviadas e status de recebimento do dispositivo
 */
export function updateDeviceMessageCounters(deviceId?: string, resellerId?: string, isDelivered = true): ResellerDeviceSubscription[] {
  if (typeof window === 'undefined') return [];
  try {
    const devices = getStoredDeviceSubscriptions();
    const updated = devices.map((dev) => {
      const match = (deviceId && dev.id === deviceId) || (resellerId && dev.resellerId === resellerId);
      if (match) {
        const sentCount = (dev.messagesSentCount || 0) + 1;
        const deliveredCount = (dev.messagesDeliveredCount || 0) + (isDelivered ? 1 : 0);
        const failedCount = (dev.messagesFailedCount || 0) + (isDelivered ? 0 : 1);

        let receivingStatus: 'active_receiving' | 'tolerance_phase' | 'purge_eligible' = 'tolerance_phase';
        if (sentCount >= 10 && deliveredCount === 0) {
          receivingStatus = 'purge_eligible';
        } else if (sentCount >= 10 && deliveredCount > 0) {
          receivingStatus = 'active_receiving';
        } else {
          receivingStatus = 'tolerance_phase';
        }

        return {
          ...dev,
          messagesSentCount: sentCount,
          messagesDeliveredCount: deliveredCount,
          messagesFailedCount: failedCount,
          lastMessageSentAt: new Date().toISOString(),
          receivingStatus,
        };
      }
      return dev;
    });
    localStorage.setItem(STORAGE_DEVICES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Permite simular envio ou falha de entrega para testes da regra da 10ª mensagem
 */
export function simulateDeviceDeliveryTest(deviceId: string, success: boolean): ResellerDeviceSubscription[] {
  return updateDeviceMessageCounters(deviceId, undefined, success);
}

/**
 * Restaura aparelhos monitorados padrão para demonstração
 */
export function restoreDefaultMonitoredDevices(): ResellerDeviceSubscription[] {
  if (typeof window === 'undefined') return DEFAULT_DEVICES;
  localStorage.setItem(STORAGE_DEVICES_KEY, JSON.stringify(DEFAULT_DEVICES));
  return DEFAULT_DEVICES;
}

/**
 * Salva um log de envio de Web Push e atualiza a métrica de mensagens do aparelho
 */
export function recordPushLog(log: WebPushLog): WebPushLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getStoredPushLogs();
    const updated = [log, ...current.slice(0, 99)]; // Mantém até 100 logs
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));

    // Atualiza contadores de mensagens do aparelho correspondente
    updateDeviceMessageCounters(log.deviceId, log.resellerId, log.status === 'delivered');

    return updated;
  } catch {
    return [];
  }
}

/**
 * Verifica se a data de retorno do atendimento atingiu o dia de hoje ou passou
 */
export function isReturnDateDue(returnDateStr?: string): boolean {
  if (!returnDateStr) return false;
  try {
    // Normaliza datas sem levar em conta o fuso para comparação justa de dia
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return returnDateStr <= todayStr;
  } catch {
    return false;
  }
}

/**
 * Formata em texto humanizado quantos dias faltam para o retorno ou se já venceu
 */
export function formatDaysUntilReturn(returnDateStr?: string): string {
  if (!returnDateStr) return 'Sem data agendada';
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${returnDateStr}T00:00:00`);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '🚨 É HOJE! Retorno do Atendimento programado para hoje';
    if (diffDays === 1) return '⚠️ É amanhã! Retorno agendado para amanhã';
    if (diffDays < 0) return `🚨 Vencido há ${Math.abs(diffDays)} dia(s)! Realizar acerto`;
    return `📅 Faltam ${diffDays} dias para o retorno do atendimento`;
  } catch {
    return returnDateStr;
  }
}

/**
 * Registros padrão de auditoria para inicialização
 */
const DEFAULT_SANITIZATION_LOGS: PushSanitizationLog[] = [
  {
    id: 'sanit-auto-default-1',
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    triggeredBy: 'automatic_schedule',
    totalTokensScanned: 4,
    validTokensRetained: 3,
    expiredTokensRemoved: 0,
    revokedTokensRemoved: 0,
    duplicateTokensRemoved: 0,
    unreachableAfter10thRemoved: 1,
    totalPurged: 1,
    details: 'Expurgo rotineiro da 10ª mensagem: 1 aparelho sem recebimento confirmado após 10 disparos efetuados foi expurgado com sucesso. Todos os tokens em período de tolerância inicial (1 a 9 envios) foram preservados.',
    status: 'success',
    executorName: 'Rotina Automática (Sistema)',
  },
  {
    id: 'sanit-auto-default-2',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    triggeredBy: 'automatic_schedule',
    totalTokensScanned: 3,
    validTokensRetained: 3,
    expiredTokensRemoved: 0,
    revokedTokensRemoved: 0,
    duplicateTokensRemoved: 0,
    unreachableAfter10thRemoved: 0,
    totalPurged: 0,
    details: 'Auditoria de entrega: todos os 3 aparelhos monitorados ativos estão dentro do limite ou recebendo mensagens normalmente. Nenhum expurgo necessário.',
    status: 'no_purge_needed',
    executorName: 'Rotina Automática (Sistema)',
  },
];

/**
 * Lê o histórico de limpezas e expurgos salvos
 */
export function getStoredSanitizationLogs(): PushSanitizationLog[] {
  if (typeof window === 'undefined') return DEFAULT_SANITIZATION_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_SANITIZATION_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_SANITIZATION_KEY, JSON.stringify(DEFAULT_SANITIZATION_LOGS));
      return DEFAULT_SANITIZATION_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SANITIZATION_LOGS;
  } catch {
    return DEFAULT_SANITIZATION_LOGS;
  }
}

/**
 * Grava um novo log no histórico de limpezas & expurgos
 */
export function recordSanitizationLog(log: PushSanitizationLog): PushSanitizationLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getStoredSanitizationLogs();
    const updated = [log, ...current.slice(0, 49)]; // Armazena até 50 registros
    localStorage.setItem(STORAGE_SANITIZATION_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Executa a Higienização de Tokens Web Push
 * REGRA ESTRITA SOLICITADA PELO USUÁRIO:
 * - A higienização NÃO deve excluir tokens ativos ou em monitoramento regular.
 * - Limpeza aplicada SOMENTE para expurgo de aparelhos que NÃO receberem mensagens a partir da 10ª mensagem enviada.
 * - Aparelhos com menos de 10 mensagens enviadas (< 10) estão em período de carência/tolerância e NUNCA são expurgados.
 * - Aparelhos a partir da 10ª mensagem (>= 10) que recebem mensagens normalmente são 100% preservados.
 */
export function runPushTokenSanitization(options?: {
  triggeredBy?: 'automatic_schedule' | 'manual_distributor';
  executorName?: string;
}): {
  log: PushSanitizationLog;
  updatedDevices: ResellerDeviceSubscription[];
  stats: {
    totalScanned: number;
    expiredCount: number;
    revokedCount: number;
    duplicateCount: number;
    unreachableAfter10thCount: number;
    totalPurged: number;
    retainedCount: number;
  };
} {
  const triggeredBy = options?.triggeredBy || 'manual_distributor';
  const executorName =
    options?.executorName ||
    (triggeredBy === 'automatic_schedule'
      ? 'Rotina Automática do Sistema'
      : 'Distribuidor Anderson (Manual)');

  const devices = getStoredDeviceSubscriptions();
  const validDevices: ResellerDeviceSubscription[] = [];
  let unreachableAfter10thCount = 0;

  devices.forEach((dev) => {
    const sentCount = dev.messagesSentCount || 0;
    const deliveredCount = dev.messagesDeliveredCount || 0;
    const failedCount = dev.messagesFailedCount || 0;

    // Regra estrita: Expurgo SOMENTE para aparelhos que NÃO receberem mensagens a partir da 10ª mensagem enviada
    const hasReached10thMessage = sentCount >= 10;
    const hasNotReceivedMessages = deliveredCount === 0 || (failedCount >= 10 && deliveredCount / sentCount < 0.1);

    if (hasReached10thMessage && hasNotReceivedMessages) {
      // Expurga exclusivamente o aparelho que alcançou 10+ envios sem nenhum recebimento
      unreachableAfter10thCount++;
      return;
    }

    // Todos os outros aparelhos são PRESERVADOS:
    // - Aparelhos com 0 a 9 mensagens enviadas (período de tolerância e aquecimento)
    // - Aparelhos com 10 ou mais mensagens que receberam mensagens normalmente
    validDevices.push(dev);
  });

  const totalPurged = unreachableAfter10thCount;
  const totalScanned = devices.length;
  const retainedCount = validDevices.length;

  // Atualiza a lista no armazenamento local preservando todos os tokens monitorados
  localStorage.setItem(STORAGE_DEVICES_KEY, JSON.stringify(validDevices));
  localStorage.setItem(STORAGE_LAST_AUTO_PURGE_KEY, new Date().toISOString());

  const details =
    totalPurged > 0
      ? `Higienização concluída: ${totalPurged} aparelho(s) sem recebimento a partir da 10ª mensagem enviada foram expurgados. ${retainedCount} tokens monitorados foram preservados com sucesso.`
      : `Higienização concluída: Todos os ${retainedCount} tokens monitorados foram preservados. Nenhum aparelho atingiu o critério de expurgo (sem recebimento após a 10ª mensagem).`;

  const log: PushSanitizationLog = {
    id: `sanit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    triggeredBy,
    totalTokensScanned: totalScanned,
    validTokensRetained: retainedCount,
    expiredTokensRemoved: 0,
    revokedTokensRemoved: 0,
    duplicateTokensRemoved: 0,
    unreachableAfter10thRemoved: unreachableAfter10thCount,
    totalPurged,
    details,
    status: totalPurged > 0 ? 'success' : 'no_purge_needed',
    executorName,
  };

  recordSanitizationLog(log);

  return {
    log,
    updatedDevices: validDevices,
    stats: {
      totalScanned,
      expiredCount: 0,
      revokedCount: 0,
      duplicateCount: 0,
      unreachableAfter10thCount,
      totalPurged,
      retainedCount,
    },
  };
}

/**
 * Checa e executa a higienização automática se a última execução tiver mais de 24 horas
 */
export function checkAndRunAutomaticSanitization(): PushSanitizationLog | null {
  if (typeof window === 'undefined') return null;
  try {
    const lastRunRaw = localStorage.getItem(STORAGE_LAST_AUTO_PURGE_KEY);
    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    if (!lastRunRaw || now - new Date(lastRunRaw).getTime() > twentyFourHoursMs) {
      const result = runPushTokenSanitization({
        triggeredBy: 'automatic_schedule',
        executorName: 'Rotina Automática Diária de Higienização (Sistema)',
      });
      return result.log;
    }
    return null;
  } catch {
    return null;
  }
}
