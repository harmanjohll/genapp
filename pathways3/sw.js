// Cache-first service worker, keyed on the build version.
//
// The trust chips promise "it arrives once and then it is on this device".
// v2 said that and could not deliver it: with ?v= busting and school hosting
// that sends no cache headers, every visit refetched everything. This makes
// the promise true: the shell and data are precached on install, visit two
// is instant on any wifi, and the app works with zero bars on the bus.
//
// No fetch goes anywhere new. Same origin only, same files the page already
// loads. A new build (new VERSION below, stamped by tools/release.mjs) makes
// a new cache and the old one is deleted on activate.

const VERSION = '3.0.0';
const CACHE = `paths-${VERSION}`;
const v = (p) => `${p}?v=${VERSION}`;

const SHELL = [
  './',
  './index.html',
  v('./assets/css/tokens3.css'), v('./assets/css/base.css'),
  v('./assets/css/app.css'), v('./assets/css/play.css'),
  v('./assets/fonts/literata-var-latin.woff2'),
  v('./assets/js/main.js'), v('./assets/js/state.js'),
  v('./assets/js/data-loader.js'), v('./assets/js/sound.js'),
  v('./assets/js/engine/rules.js'), v('./assets/js/engine/reach.js'),
  v('./assets/js/engine/project.js'), v('./assets/js/engine/pulse.js'),
  v('./assets/js/engine/possible.js'), v('./assets/js/engine/journey4.js'),
  v('./assets/js/ui/dom.js'), v('./assets/js/ui/sheet.js'),
  v('./assets/js/ui/icons.js'), v('./assets/js/ui/glossary.js'),
  v('./assets/js/ui/map.js'), v('./assets/js/ui/destsheet.js'),
  v('./assets/js/ui/storymap.js'), v('./assets/js/ui/scenes.js'),
  v('./assets/js/screens/home.js'), v('./assets/js/screens/plan.js'),
  v('./assets/js/screens/play.js'), v('./assets/js/screens/act.js'),
  v('./assets/js/screens/adults.js'), v('./assets/js/screens/info.js'),
];
const DATA = [
  'subjects', 'pathways', 'progressions', 'lifelong', 'copy', 'parent',
  'glossary', 'dispositions', 'futures', 'chances', 'journey', 'stories',
  'moves', 'version', 'activities', 'possibilities', 'work', 'money',
  'evidence', 'schools',
].map((n) => v(`./data/${n}.json`));

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll([...SHELL, ...DATA]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  // The document itself is network-first so a new build is noticed; its
  // subresources are cache-first because their names carry the version.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreVary: true }).then((hit) => hit
      || fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }))
  );
});
