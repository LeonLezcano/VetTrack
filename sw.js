// @ts-check
/**
 * VetTrack PWA Service Worker (AiAppFactory Offline Continuity Standard)
 * Network-First para navegación HTML y version.json; Cache-First con refresco en background para assets.
 */

const CACHE_NAME = 'vettrack-cache-v1.0.02';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg',
  './version.json',
  './src/app.js',
  './src/sw-register.js',
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
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // @ts-ignore
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Bypass inmediato para APIs externas y Cloud Firestore
  if (url.origin !== self.location.origin || url.pathname.includes('firestore.googleapis.com')) {
    return;
  }

  const isNavigationOrVersion =
    request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/version.json') ||
    url.pathname.endsWith('/');

  if (isNavigationOrVersion) {
    // @ts-ignore
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-First con refresco en background para assets estáticos locales
  // @ts-ignore
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
