// @ts-check
/**
 * VetTrack PWA Service Worker Registration
 * Registra ./sw.js de forma no bloqueante y notifica actualizaciones disponibles.
 */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              const notice = document.getElementById('sw-update-notice');
              if (notice) {
                notice.classList.remove('hidden');
              }
            }
          });
        });
      })
      .catch(() => {
        // Degradación silenciosa en entornos sin soporte SW o file://
      });
  });
}
