/* Enregistre le service worker et demande un stockage persistant
   (empêche le navigateur d'effacer la base IndexedDB « FTPB_Offline »). */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('SW', e); });
    });
  }
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  } catch (e) {}
})();
