/* PWA Master Admin — scope /admin/ */
const CACHE_NAME = "rev-admin-v1";
const OFFLINE_MSG = "Nuk ka internet — lidhuni dhe provoni përsëri";

const PRECACHE = [
  "/admin/manifest.json",
  "/admin/icon-192.png",
  "/admin/icon-512.png",
  "/admin/dashboard.html",
  "/admin/dashboard.css?v=34",
  "/admin/dashboard.js?v=45",
];

function offlineHtml() {
  return `<!DOCTYPE html><html lang="sq"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#FF6B35"><title>Revolution Admin</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1a1a2e;color:#e2e8f0;font-family:system-ui,sans-serif;padding:1.5rem;text-align:center}p{max-width:22rem;line-height:1.5;font-size:1.05rem}</style></head><body><p>${OFFLINE_MSG}</p></body></html>`;
}

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

function isAdminAsset(pathname) {
  return (
    pathname === "/admin/dashboard"
    || pathname === "/admin/dashboard/"
    || pathname === "/admin/dashboard.html"
    || pathname === "/admin/manifest.json"
    || pathname === "/admin/sw.js"
    || pathname.startsWith("/admin/icon-")
    || pathname === "/admin/dashboard.css"
    || pathname.startsWith("/admin/dashboard.css?")
    || pathname === "/admin/dashboard.js"
    || pathname.startsWith("/admin/dashboard.js?")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* API — gjithmonë live, pa cache */
  if (url.pathname.startsWith("/api/")) return;

  if (!isAdminAsset(url.pathname) && !url.pathname.startsWith("/admin/")) return;

  const navigate = request.mode === "navigate";

  if (navigate) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/admin/dashboard.html", clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match("/admin/dashboard.html");
          if (cached) return cached;
          return new Response(offlineHtml(), {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && isAdminAsset(url.pathname)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (url.pathname.includes("dashboard.css") || url.pathname.includes("dashboard.js")) {
            return caches.match(request);
          }
          return new Response(OFFLINE_MSG, {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        });
    }),
  );
});
