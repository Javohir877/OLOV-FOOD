/* OLOV FOOD — service worker: saytni tez ochadi va internet uzilganda ham oxirgi nusxani ko'rsatadi.
   - Sahifa va config.json: avval internetdan (yangi bo'lsin), bo'lmasa — saqlangan nusxadan
   - Rasmlar, JS, CSS: avval saqlangan nusxadan (tez), bo'lmasa — internetdan olib saqlaymiz
   Admin panel (admin.html) va Telegram so'rovlari hech qachon keshlanmaydi. */
const CACHE = "olov-food-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // Telegram, shriftlar — to'g'ridan-to'g'ri
  if (url.pathname.endsWith("/admin.html") || url.pathname.endsWith("/sw.js")) return;

  const fresh = req.mode === "navigate" || url.pathname.endsWith("/config.json");
  if (fresh) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
