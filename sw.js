const CACHE_VERSION = 'keychainland-v2';
const APP_CACHE = `${CACHE_VERSION}-app`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SHELL = [
  './keychainland_vanilla_pwa.html',
  './manifest.webmanifest',
  './assets/app-icon.svg',
  './assets/keychains/anime-character-keychains.png',
  './assets/keychains/anime-bead-figure.png',
  './assets/keychains/anime-id-figure.png',
  './assets/keychains/anime-id-keychain.png',
  './assets/keychains/anime-panel-charms.png',
  './assets/keychains/anime-panel-keychains.png',
  './assets/keychains/anime-photo-shaker.png',
  './assets/keychains/anime-pink-teal-charms.png',
  './assets/keychains/bear-figure-keychain.png',
  './assets/keychains/cat-charm.png',
  './assets/keychains/dragon-keychains.png',
  './assets/keychains/guitar-keychains.png',
  './assets/keychains/silver-heart-charm.png',
  './assets/keychains/strawberry-headphone-beads.png',
  './assets/keychains/travel-charms.png',
  './assets/keychains/violin-keychain.png',
  './assets/keychains/guitar-pair-charms.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('keychainland-') && key !== APP_CACHE && key !== RUNTIME_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') {
          await cache.put(request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(APP_CACHE).then(cache => cache.put('./keychainland_vanilla_pwa.html', copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match('./keychainland_vanilla_pwa.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(APP_CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
