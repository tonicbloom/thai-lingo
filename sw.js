// Offline support + fast updates.
// Always asks the server for the newest files first (revalidating, so GitHub's
// 10-minute cache can't serve stale code) and falls back to the saved copy offline.
// Bump CACHE on every release: that's what tells installed apps to update.
const CACHE = "thai-lingo-v11";
const FILES = ["./", "index.html", "style.css", "app.js", "data.js", "letters.js", "manifest.json",
  "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: "no-cache" });
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    } catch {
      const cached = await caches.match(req, { ignoreSearch: true });
      return cached || caches.match("index.html");
    }
  })());
});
