const CACHE_NAME = 'inventario-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/styles/main.css',
  '/src/styles/variables.css',
  '/src/scripts/app.js',
  '/src/scripts/firebase.js',
  '/src/pages/dashboard.html',
  '/src/pages/inventario.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
