// Independence PWA Service Worker v6
// ÐÐ• ÐºÑÑˆÐ¸Ñ€ÑƒÐµÑ‚ HTML Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð¸Ð·Ð±ÐµÐ¶Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼ Ñ Ñ€ÐµÐ´Ð¸Ñ€ÐµÐºÑ‚Ð°Ð¼Ð¸
const CACHE_NAME = 'independence-v6';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install - ÐºÑÑˆÐ¸Ñ€ÑƒÐµÐ¼ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ ÑÑ‚Ð°Ñ‚Ð¸ÐºÑƒ (Ð¸ÐºÐ¾Ð½ÐºÐ¸, Ð¼Ð°Ð½Ð¸Ñ„ÐµÑÑ‚)
self.addEventListener('install', event => {
  console.log('[SW] Installing v6...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate - ÑƒÐ´Ð°Ð»ÑÐµÐ¼ ÑÑ‚Ð°Ñ€Ñ‹Ðµ ÐºÑÑˆÐ¸
self.addEventListener('activate', event => {
  console.log('[SW] Activating v6...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch - HTML Ð²ÑÐµÐ³Ð´Ð° Ð¸Ð· ÑÐµÑ‚Ð¸, Ð¾ÑÑ‚Ð°Ð»ÑŒÐ½Ð¾Ðµ Ð¸Ð· ÐºÑÑˆÐ°
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // HTML Ð¸ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñ‹ Ñ Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€Ð°Ð¼Ð¸ â€” Ð’Ð¡Ð•Ð“Ð”Ð Ð¸Ð· ÑÐµÑ‚Ð¸
  if (event.request.destination === 'document' || 
      url.pathname === '/' || 
      url.pathname.endsWith('.html') ||
      url.search) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Ð¡Ñ‚Ð°Ñ‚Ð¸ÐºÐ° â€” Ð¸Ð· ÐºÑÑˆÐ°, Ð¿Ð¾Ñ‚Ð¾Ð¼ ÑÐµÑ‚ÑŒ
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
