// Network first, so every push shows up on the next open; the cache is only a fallback for offline.
const CACHE = 'outlet-proto-v3';
const CORE = [
  './',
  './index.html',
  './category.html',
  './categories.html',
  './app.js',
  './styles.css',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './fonts/thmanyahsans-Regular.otf',
  './fonts/thmanyahsans-Medium.otf',
  './fonts/thmanyahsans-Bold.otf',
  './assets/bag.jpg',
  './assets/banner-coat.jpg',
  './assets/dress-black.jpg',
  './assets/dress-green.jpg',
  './assets/dress-ivory.jpg',
  './assets/dress-pink.jpg',
  './assets/dress-polka.jpg',
  './assets/dress-terracotta.jpg',
  './assets/dress.jpg',
  './assets/pants.jpg',
  './assets/shirt.jpg',
  './assets/sneakers.jpg',
  './assets/sweater.jpg',
  './assets/trench.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
        )
      )
  );
});