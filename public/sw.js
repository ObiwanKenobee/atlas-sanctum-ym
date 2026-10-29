const CACHE_NAME = 'atlas-shell-v1'
const SHELL = ['/', '/blog', '/icon.svg', '/icon-light-32x32.png']

self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))) })
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', (event) => { if (event.request.method !== 'GET' || new URL(event.request.url).pathname.startsWith('/_next/')) return; event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)); return response }).catch(() => caches.match('/')))) })
