// Network first, so every push shows up on the next open; the cache is only a fallback for offline.
const CACHE = 'outlet-proto-v3';
const CORE = [
  './',
  './index.html',
  './category.html',
  './categories.html',
  './search.html',
  './product.html',
  './cart.html',
  './checkout.html',
  './payment.html',
  './payment-success.html',
  './payment-failed.html',
  './orders.html',
  './order.html',
  './account.html',
  './report.html',
  './report-sent.html',
  './dispute.html',
  './messages.html',
  './chat.html',
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
  './assets/bag-cut.png',
  './assets/bag.jpg',
  './assets/banner-coat.jpg',
  './assets/dress-black.jpg',
  './assets/dress-cut.png',
  './assets/dress-green-cut.png',
  './assets/dress-green.jpg',
  './assets/dress-ivory-cut.png',
  './assets/dress-ivory.jpg',
  './assets/dress-pink-cut.png',
  './assets/dress-pink.jpg',
  './assets/dress-pleated-cut.png',
  './assets/dress-pleated.jpg',
  './assets/dress-polka-cut.png',
  './assets/dress-polka.jpg',
  './assets/dress-terracotta-cut.png',
  './assets/dress-terracotta.jpg',
  './assets/dress.jpg',
  './assets/pants-cut.png',
  './assets/pants.jpg',
  './assets/shirt-cut.png',
  './assets/shirt.jpg',
  './assets/sneakers-cut.png',
  './assets/sneakers.jpg',
  './assets/sweater-cut.png',
  './assets/sweater.jpg',
  './assets/trench-cut.png',
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