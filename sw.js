/* Service worker — Suivi de chantier FTPB */
const VERSION = 'a816aca105';
const SHELL_CACHE = 'ftpb-shell-' + VERSION;
const SEED_CACHE = 'ftpb-seed-v1';          // fiches PDF : conservées d'une version à l'autre
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'pwa-register.js',
               'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)));
  /* pas de skipWaiting : la nouvelle version s'active à la prochaine ouverture,
     pour ne jamais changer le code sous les pieds d'une saisie en cours */
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('ftpb-shell-') && k !== SHELL_CACHE) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* Fiches PDF d'amorçage : cache d'abord, puis réseau (et mise en cache) */
  if (url.pathname.includes('/seed/')) {
    e.respondWith((async () => {
      const c = await caches.open(SEED_CACHE);
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    })());
    return;
  }

  /* Navigation : on sert toujours l'application depuis le cache (hors ligne garanti) */
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
