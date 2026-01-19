// Independence - Service Worker v7 (без кэширования)
2self.addEventListener('install', () => self.skipWaiting());
3
4self.addEventListener('activate', event => {
5  event.waitUntil(
6    caches.keys().then(keys => 
7      Promise.all(keys.map(key => caches.delete(key)))
8    ).then(() => self.clients.claim())
9  );
10});
11
12// Всё идёт напрямую в сеть, без кэширования
13self.addEventListener('fetch', event => {
14  event.respondWith(fetch(event.request));
15});
16
