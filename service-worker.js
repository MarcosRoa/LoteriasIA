// ============================================
// SERVICE WORKER - Loterias IA PWA
// ============================================

const CACHE_NAME = 'loterias-ia-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/perfil.html',
  '/css/style.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/supabase.js',
  '/js/loterias.js',
  '/js/ia.js',
  '/js/ui.js',
  '/js/pagamentos.js',
  '/js/utils.js',
  '/manifest.json',
  '/img/brasao.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Estratégia: Cache First, depois rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});