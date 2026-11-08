/* The test version at e21cclog/next/ was folded into the E21CC Log (Version 4) on 8 November 2026.
   A device that opened it still has its offline copy, which would keep showing the old test version.
   This worker replaces that copy: it clears its caches, removes itself, and reloads any open page,
   which then forwards to the E21CC Log. Nothing in the log itself is touched. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('e21cclognext-')).map(k => caches.delete(k)));
    await self.registration.unregister();
    const open = await self.clients.matchAll({type:'window'});
    for (const c of open){ try{ await c.navigate(c.url); }catch{} }
  })());
});
