// Athkar Service Worker — Staging
// Network-first for HTML, cache-first for assets
const CACHE = 'athkar-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/jawamie-douaa/',
  '/jawamie-douaa/index.html',
  '/daily-wird/',
  '/daily-wird/index.html',
  '/sabah-masa/',
  '/sabah-masa/index.html',
  '/mazeed/',
  '/mazeed/index.html',
  '/404.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  // Only handle same-origin GET requests
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  if (req.mode === 'navigate') {
    // Network-first for page navigation
    e.respondWith(
      fetch(req).then(function(resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(req, copy); });
        return resp;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match('/');
        });
      })
    );
  } else {
    // Cache-first for static assets
    e.respondWith(
      caches.match(req).then(function(cached) {
        return cached || fetch(req).then(function(resp) {
          var copy = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(req, copy); });
          return resp;
        });
      })
    );
  }
});
