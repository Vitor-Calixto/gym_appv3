const CACHE_NAME = 'omni-cache-v2';
const ASSETS = [
  '/',
  '/index/index.html',
  '/cadastro/cadastro.html',
  '/home/home.html',
  '/executar-treino/executar-treino.html',
  '/executar-treino/executar-treino.css',
  '/executar-treino/executar-treino.js',
  '/css/global.css',
  '/js/auth.js',
  '/js/storage.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first for API, Cache first for assets
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request).catch(() => {
      // fallback offline
      if (event.request.destination === 'document') {
        return caches.match('/executar-treino/executar-treino.html');
      }
    }))
  );
});
