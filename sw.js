// Offline support for the installed web app. The version changes on every build,
// so a new word batch replaces the old cache the next time the app is opened online.
const CACHE = 'amv-5199e1cb8a';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // network first, so a new version arrives when online; cached copy when offline
    // a slow or hanging connection falls back to the cached copy after a few seconds
    const cached = () => caches.match('./index.html');
    const net = fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; });
    const slow = new Promise(r => setTimeout(r, 4000)).then(cached).then(hit => hit || net);
    e.respondWith(Promise.race([net.catch(cached), slow]).then(res => res || Response.error()));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
