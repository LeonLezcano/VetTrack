// @ts-check
/**
 * VetTrack PWA Service Worker (AiAppFactory Offline Continuity Standard)
 * Cache-First para activos estáticos y Network-First con fallback offline.
 */

const CACHE_NAME = 'vettrack-v1.0.00';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './version.json',
  './src/utils/sanitizer.js',
  './src/utils/cryptoSeal.js',
  './src/utils/formatters.js',
  './src/core/withholdingPeriodGuardEngine.js',
  './src/core/chuteReproductiveTriageEngine.js',
  './src/core/senasaVaccinationLedgerEngine.js',
  './src/services/livestockCommodityLedgerService.js',
  './src/services/vetTrackCache.service.js',
  './src/services/whatsAppVetNotifier.service.js'
];

self.addEventListener('install', (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // @ts-ignore
  if (event.request.method !== 'GET') return;
  // @ts-ignore
  event.respondWith(
    // @ts-ignore
    caches.match(event.request).then((cached) => {
      // @ts-ignore
      return cached || fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
