// Service Worker para notificações Push
const CACHE_NAME = 'elite-acai-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push event - Receber notificações
self.addEventListener('push', (event) => {
  console.log('📱 Notificação Push recebida:', event);
  
  let notificationData = {
    title: 'Elite Açaí',
    body: 'Nova notificação',
    icon: '/logo elite.jpeg',
    badge: '/logo elite.jpeg',
    tag: 'elite-acai-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver Pedido',
        icon: '/logo elite.jpeg'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('📋 Dados da notificação:', data);
      
      notificationData = {
        ...notificationData,
        title: data.title || 'Elite Açaí',
        body: data.body || 'Nova notificação',
        data: data.data || {},
        tag: data.tag || 'elite-acai-notification',
        icon: data.icon || '/logo elite.jpeg',
        badge: data.badge || '/logo elite.jpeg',
        requireInteraction: data.requireInteraction || true,
        actions: data.actions || notificationData.actions
      };
    } catch (error) {
      console.error('❌ Erro ao processar dados da notificação:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Abrir página do pedido se tiver orderId
    const orderId = event.notification.data?.orderId;
    const url = orderId ? `/pedido/${orderId}` : '/';
    
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'close') {
    // Apenas fechar a notificação
    console.log('🚪 Notificação fechada pelo usuário');
  } else {
    // Click padrão na notificação
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Background sync event (para quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aqui você pode sincronizar dados quando voltar online
      console.log('📡 Sincronizando dados em background...')
    );
  }
});