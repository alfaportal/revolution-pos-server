/* PWA vetëm për pronarët — scope /owner/ */
const CACHE_NAME = "ri-pos-owner-v2";
const PRECACHE = [
  "/owner/panel",
  "/owner/login",
  "/owner/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/css/panel.css",
  "/css/owner.css",
  "/js/owner.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/owner/") && !url.pathname.startsWith("/icons/")
    && !url.pathname.startsWith("/css/") && !url.pathname.startsWith("/js/")) {
    return;
  }
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && shouldCache(url.pathname)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});

function shouldCache(pathname) {
  return (
    pathname.startsWith("/owner/") ||
    pathname.startsWith("/css/") ||
    pathname.startsWith("/js/") ||
    pathname.startsWith("/icons/")
  );
}
