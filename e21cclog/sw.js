/* The E21CC Log's offline copy. Pages, scripts and data come from the network first, so a
   student always gets the current version when online, with the copy kept for when the wifi is
   down. Fonts and images, which never change, come from the copy first. Nothing outside this
   site is touched: AI coach calls and group files from elsewhere always go to the network.
   Change VERSION when a release should replace every copy at once. */
const VERSION = 'e21cclog-3-2026-11-01';
const SHELL = ['./', './index.html', './teacher.html', './manifest.webmanifest',
  './assets/core.js', './assets/store.js', './assets/app.js', './assets/crest.png', './assets/icon-192.png',
  './assets/fonts/inter-regular-latin.woff2', './assets/fonts/inter-semibold-latin.woff2', './assets/fonts/inter-bold-latin.woff2',
  './assets/fonts/inter-extrabold-latin.woff2', './assets/fonts/literata-var-latin.woff2', './statements/beatty-v1.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, {cache:'reload'})).catch(() => {})))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('e21cclog-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

const lasting = url => /\.(woff2|png|jpg|svg)$/.test(url.pathname);
self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (url.pathname.includes('/legacy/')) return;
  if (lasting(url)){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })));
    return;
  }
  // a page, a script, the statements, a group file: the network first, the copy if offline
  e.respondWith(fetch(req).then(res => { if (res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, {ignoreSearch:req.mode === 'navigate'}).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
