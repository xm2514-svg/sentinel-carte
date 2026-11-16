// Garde l'appli ouvrable sans réseau ; les alertes viennent toujours en direct de ntfy.
const CACHE = "sentinel-carte-v21";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.hostname === "ntfy.sh" || u.hostname === "router.project-osrm.org" || u.hostname === "wt3.autoroutes-trafic.fr") return;   // jamais en cache
  if (u.hostname.endsWith("tile.openstreetmap.org")) {                     // fonds de carte : cache d'abord
    e.respondWith(caches.open(CACHE + "-tuiles").then(c => c.match(e.request).then(r =>
      r || fetch(e.request).then(n => { c.put(e.request, n.clone()); return n; }))));
    return;
  }
  e.respondWith(fetch(e.request).then(n => {                               // appli : réseau d'abord
    const copy = n.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return n;
  }).catch(() => caches.match(e.request)));
});
