// Cache name includes the app version — bumping the version here clears old caches.
// IMPORTANT: keep this in sync with appConfig.versionLabel in src/lib/appConfig.ts
const CACHE_NAME = 'exercise-journal-v1.5.0';

// Only pre-cache the app shell (not index.html — that must always be fresh).
const PRECACHE_URLS = [];

// Install: pre-cache static assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // activate new SW without waiting
  );
});

// Activate: delete all old caches so stale assets are removed
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// Fetch strategy:
//   - Navigation requests (HTML pages): network-first, no caching
//     This ensures users always load the latest index.html after a deploy.
//   - Hashed JS/CSS assets (/assets/*): cache-first (safe — filename changes per build)
//   - Everything else: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Navigation (HTML): always go to network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Hashed assets: cache-first (immutable)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
