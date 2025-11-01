// Service Worker para notificações Push - Elite Açaí
const CACHE_NAME = 'elite-acai-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo.jpg'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker instalado com sucesso');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker ativando...');
  
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
    }).then(() => {
      console.log('✅ Service Worker ativado');
      return self.clients.claim();
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Apenas interceptar requests para recursos estáticos
  if (event.request.destination === 'image' || 
      event.request.destination === 'script' || 
      event.request.destination === 'style') {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          
          // Clone the request
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest).then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
        })
    );
  }
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Notificação Push recebida:', event);
  
  let notificationData = {
    title: 'Elite Açaí',
    body: 'Nova notificação',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    tag: 'elite-acai-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'Ver Detalhes'
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
      notificationData = { ...notificationData, ...data };
      console.log('📋 Dados da notificação:', data);
    } catch (err) {
      console.error('❌ Erro ao parsear dados da notificação:', err);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('✅ Notificação exibida com sucesso');
      })
      .catch((err) => {
        console.error('❌ Erro ao exibir notificação:', err);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificação clicada:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'view' || !action) {
    // Open the app or focus existing window
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Try to focus existing window
          for (const client of clientList) {
            if (client.url.includes(self.location.origin)) {
              console.log('🔍 Focando janela existente');
              return client.focus();
            }
          }
          
          // Open new window if none exists
          console.log('🆕 Abrindo nova janela');
          const urlToOpen = data.url || '/';
          return clients.openWindow(urlToOpen);
        })
        .catch((err) => {
          console.error('❌ Erro ao abrir/focar janela:', err);
        })
    );
  } else if (action === 'close') {
    console.log('❌ Notificação fechada pelo usuário');
  }
});

// Background sync event (for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Implement background sync logic here if needed
      Promise.resolve()
    );
  }
});

// Message event - Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Mensagem recebida no Service Worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Service Worker Elite Açaí carregado e pronto!');