/* Service worker — Suivi de chantier FTPB
   Mise à jour automatique : à chaque nouvelle version (VERSION change), la nouvelle
   version s'active seule et les anciens caches sont supprimés. */
const VERSION = 'efcf70c4f1';
const SHELL_CACHE = 'ftpb-shell-' + VERSION;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'pwa-register.js',
               'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL_CACHE);
    /* cache:'reload' → on contourne le cache HTTP de l'hébergeur (GitHub Pages garde 10 min) */
    await c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })));
  })());
  self.skipWaiting();                    // la nouvelle version prend la main tout de suite (sans await)
});

/* Secours : la page peut demander l'activation d'une version restée en attente */
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    /* vidage automatique : tout cache autre que celui de la version courante est supprimé
       (y compris l'ancien cache des fiches PDF, déjà stockées dans la base locale) */
    for (const k of await caches.keys()) {
      if (k !== SHELL_CACHE) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* Fiches PDF d'amorçage (seed/) : jamais mises en cache ici, elles sont copiées une
     seule fois dans IndexedDB par l'application (évite de stocker 150 Mo en double) */
  if (url.pathname.includes('/seed/')) return;

  /* Navigation : l'application est servie depuis le cache (hors ligne garanti) */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(SHELL_CACHE);
      return (await c.match('index.html')) || (await c.match('./')) || fetch(req);
    })());
    return;
  }

  /* Le reste : cache d'abord, sinon réseau */
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
