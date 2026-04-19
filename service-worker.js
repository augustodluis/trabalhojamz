/*
 * Trabalho Ja MZ - Service Worker
 *
 * Transforma o site numa Progressive Web App. Guarda os ficheiros
 * estaticos em cache para que a plataforma abra instantaneamente e
 * funcione mesmo com sinal fraco. Para os pedidos a Google Sheets e
 * Apps Script segue uma estrategia "rede primeiro": tenta ir buscar
 * dados novos e so usa a copia em cache se a rede falhar.
 */

// Identificador da versao. Mudar aqui invalida automaticamente os
// caches antigos quando o service worker actualizar.
const CACHE_VERSION = 'tjmz-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Ficheiros essenciais ao funcionamento offline. Sao carregados em
// conjunto no evento install.
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/js/api.js',
  './assets/js/data.js',
  './assets/js/map.js',
  './assets/js/gps.js',
  './assets/js/router.js',
  './assets/img/logo.svg',
  './assets/img/mozambique-map.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Ao instalar, pre-carregamos todos os assets estaticos no cache para
// que a primeira visita sem rede ja tenha tudo o que precisa.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('SW install partial:', err))
  );
});

// Ao activar apagamos os caches com versoes antigas para nao deixar
// lixo acumular entre releases.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Intercepta todos os pedidos GET para decidir se vem da rede, do
// cache, ou de ambos em sequencia.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Para dominios da Google (Sheets e Apps Script) preferimos dados
  // frescos. Se a rede falhar, recuperamos a ultima resposta guardada.
  if (url.hostname.includes('google.com') || url.hostname.includes('googleusercontent.com')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Para os ficheiros estaticos, servimos primeiro do cache para que
  // a navegacao seja instantanea. Se nao houver copia, vamos a rede e
  // aproveitamos para guardar o resultado.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
