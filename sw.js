/* Vértice — cache para funcionar offline. Troque a versão ao publicar mudanças. */
const CACHE = 'vertice-v1';
const ARQUIVOS = [
  './', 'index.html', 'css/estilo.css', 'js/nucleo.js', 'js/app.js', 'img/icone.svg', 'manifest.webmanifest',
  'fonts/montserrat-latin-400-normal.woff', 'fonts/montserrat-latin-700-normal.woff', 'fonts/montserrat-latin-800-normal.woff',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Rede primeiro (para receber atualizações); cache quando estiver offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});
