// Service Worker Oficial para Web Push Notifications - Romance Itapema
// Gerencia recebimento de notificações nativas e abertura de janelas ao clicar

self.addEventListener('install', (event) => {
  // Ativação imediata sem esperar fechamento de abas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Assume o controle de todas as abas abertas imediatamente
  event.waitUntil(self.clients.claim());
});

// Evento de Recebimento de Notificação Push
self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = {
        title: 'Romance Itapema',
        body: event.data.text()
      };
    }
  }

  const title = payload.title || 'Romance Itapema: Aviso de Atendimento';
  const deviceId = payload.deviceId || payload.device_id || null;
  const resellerId = payload.resellerId || payload.reseller_id || null;

  const notificationOptions = {
    body: payload.body || 'Você possui um aviso de retorno ou novidade da sua sacola Romance.',
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    tag: payload.tag || `romance-push-${deviceId || Date.now()}`,
    data: {
      url: payload.url || '/',
      deviceId: deviceId,
      resellerId: resellerId,
      timestamp: Date.now(),
      ...payload
    },
    vibrate: [200, 100, 200],
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Evento de Clique na Notificação Nativa
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se houver uma aba da aplicação já aberta, foca nela e notifica
      for (const client of windowClients) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_CLICKED',
            notificationData: event.notification.data
          });
          return client.focus();
        }
      }
      // Se nenhuma janela estiver aberta, abre a URL de destino
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Comunicação bidirecional com a aplicação
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PING_SW') {
    event.ports?.[0]?.postMessage({ status: 'active', version: '2.0.0' });
  }
});
