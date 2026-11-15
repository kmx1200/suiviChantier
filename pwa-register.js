/* Enregistre le service worker, cherche les mises à jour et demande un stockage persistant
   (empêche le navigateur d'effacer la base IndexedDB « FTPB_Offline »). */
(function () {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  if (!('serviceWorker' in navigator)) return;

  var hadController = !!navigator.serviceWorker.controller;

  /* Bandeau discret : le rechargement n'est jamais forcé, pour ne pas perdre une saisie
     non enregistrée. La nouvelle version est de toute façon déjà active au prochain lancement. */
  function showBanner() {
    if (document.getElementById('ftpb-update-banner')) return;
    var b = document.createElement('div');
    b.id = 'ftpb-update-banner';
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483647;display:flex;' +
      'gap:12px;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:12px;' +
      'background:#17231d;color:#fff;font:14px system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.3)';
    var t = document.createElement('span');
    t.textContent = 'Nouvelle version installée.';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Recharger';
    btn.style.cssText = 'border:0;border-radius:8px;padding:6px 12px;background:#009a3e;color:#fff;font:inherit;font-weight:600;cursor:pointer';
    btn.onclick = function () { location.reload(); };
    b.appendChild(t); b.appendChild(btn);
    document.body.appendChild(b);
  }

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) { hadController = true; return; }   // première installation : rien à recharger
    showBanner();
  });

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      function nudge() { if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' }); }
      nudge();
      reg.addEventListener('updatefound', function () {
        var w = reg.installing;
        if (w) w.addEventListener('statechange', function () { if (w.state === 'installed') nudge(); });
      });
      reg.update().then(nudge, function () {});
      document.addEventListener('visibilitychange', function () { if (!document.hidden) { reg.update().then(nudge, function () {}); } });
      setInterval(function () { reg.update(); }, 30 * 60 * 1000);
    }).catch(function (e) { console.warn('SW', e); });
  });
})();
