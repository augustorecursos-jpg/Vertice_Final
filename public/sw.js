/* Vértice — cache dos arquivos estáticos (CSS, JS, fontes, ícone).
 * Páginas e /api sempre vão ao servidor: login, permissões e dados nunca saem do cache.
 * Troque a versão ao publicar mudanças. */
const CACHE = 'vertice-v3';
const ARQUIVOS = [
  'css/estilo.css', 'js/nucleo.js', 'js/app.js', 'js/entrar.js', 'img/icone.svg', 'manifest.webmanifest',
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

// Estáticos: rede primeiro (para pegar atualizações) e cache se estiver offline.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); } return r; })
      .catch(() => caches.match(e.request)),
  );
});
