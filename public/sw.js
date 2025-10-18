self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());
self.addEventListener('fetch', (e) => {
  // Simple network-first for HTML; cache-first for static
  const req = e.request;
  if (req.mode === 'navigate') return; // let your router handle HTML
  e.respondWith(caches.open('static-v2').then(async (cache) => {
    const hit = await cache.match(req);
    if (hit) return hit;
    const resp = await fetch(req);
    if (req.method === 'GET' && resp.ok && req.url.startsWith(self.location.origin)) {
      cache.put(req, resp.clone());
    }
    return resp;
  }));
});
