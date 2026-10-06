/* Semi Colon offline support. Fresh from the internet when there is one, the saved copy when there isn't.
   Only the app's own files are cached; writing and sign-in traffic always go straight to the network. */
const CACHE = "semicolon-app-v2";
const APP = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const net = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error("slow")), 6000))]);
      if (net && net.ok) cache.put(req.mode === "navigate" ? "index.html" : req, net.clone());
      return net;
    } catch {
      return (await cache.match(req.mode === "navigate" ? "index.html" : req)) || (await cache.match(req, {ignoreSearch:true})) || Response.error();
    }
  })());
});
