/**
 * Rrugë publike: /{tipi}/:slug/{roli}  (tipi = clients.tipi në URL)
 */
const fs = require("fs");
const path = require("path");
const { asyncHandler } = require("../lib/asyncHandler");
const { getClientBySlugOrId } = require("../lib/kitchenAccess");
const {
  legacyRedirectTarget,
  urlTipiSegment,
  tipiCategory,
  isReservedUrlTipi,
} = require("../lib/productUrls");
const { formatError } = require("../lib/errors");

function notFoundHtml() {
  return `<!DOCTYPE html><html lang="sq"><head><meta charset="utf-8"><title>Biznesi nuk u gjet</title></head><body style="font-family:system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:1.5rem;text-align:center"><h1>Biznesi nuk u gjet</h1><p>Kontrollo linkun ose kontakto administratorin.</p></body></html>`;
}

function unconfiguredHtml(label) {
  return `<!DOCTYPE html><html lang="sq"><head><meta charset="utf-8"><title>Ende pa konfiguruar</title></head><body style="font-family:system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:1.5rem;text-align:center"><h1>Ende pa konfiguruar</h1><p>Moduli <strong>${label}</strong> nuk është aktiv ende.</p></body></html>`;
}

function querySuffix(req) {
  const i = req.url.indexOf("?");
  return i >= 0 ? req.url.slice(i) : "";
}

function redirectToCorrectTipi(req, res, client) {
  const expected = urlTipiSegment(client);
  if (req.params.tipi === expected) return false;
  const parts = req.path.split("/").filter(Boolean);
  const rest = parts.slice(2).join("/");
  const dest = `/${expected}/${encodeURIComponent(req.params.slug)}${rest ? `/${rest}` : ""}${querySuffix(req)}`;
  res.redirect(302, dest);
  return true;
}

function serveWaiterPage(req, res, publicDir) {
  const tipi = encodeURIComponent(String(req.params.tipi || "kafene").trim());
  const slug = encodeURIComponent(String(req.params.slug || "").trim());
  const key = String(req.query.key || "").trim();
  const w = String(req.query.w || "").trim();
  const manQ = new URLSearchParams();
  if (key) manQ.set("key", key);
  if (w) manQ.set("w", w);
  const manifestHref = `/${tipi}/${slug}/kamarier/manifest.json${manQ.toString() ? `?${manQ.toString()}` : ""}`;
  const filePath = path.join(publicDir, "waiter.html");
  let html;
  try {
    html = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("[kamarier] read waiter.html:", formatError(err));
    return res.status(500).type("text").send("Gabim serveri.");
  }
  if (!html.includes("/js/product-path.js")) {
    html = html.replace(
      /<script src="\/js\/waiter\.js/,
      '<script src="/js/product-path.js?v=2"></script>\n  <script src="/js/waiter.js',
    );
  }
  html = html.replace(/<link\s+rel="manifest"[^>]*>/i, `<link rel="manifest" href="${manifestHref}">`);
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.type("html").send(html);
}

async function resolveTipiSlugClient(req, res, next) {
  if (isReservedUrlTipi(req.params.tipi)) return next("route");
  const client = await getClientBySlugOrId(req.params.slug);
  if (!client) return res.status(404).type("html").send(notFoundHtml());
  if (redirectToCorrectTipi(req, res, client)) return;
  req.slugClient = client;
  req.urlTipi = urlTipiSegment(client);
  req.tipiCategory = tipiCategory(req.urlTipi);
  return next();
}

function allowsPosStaffRoutes(cat) {
  return cat === "pos" || cat === "hotel";
}

function registerProductPageRoutes(app, ctx) {
  const publicDir = ctx.publicDir;
  const sendPublicStorefront = ctx.sendPublicStorefront;
  const manifestHandler = ctx.manifestHandler;
  const serviceWorkerHandler = ctx.serviceWorkerHandler;
  const resolvePublicClient = ctx.resolvePublicClient;

  const resolve = asyncHandler(resolveTipiSlugClient);

  /** POS — owner (hyrje pa kërkuar klient në DB; slug vetëm për URL) */
  app.get("/:tipi/:slug/owner", asyncHandler(async (req, res, next) => {
    if (isReservedUrlTipi(req.params.tipi)) return next("route");
    const client = await getClientBySlugOrId(req.params.slug);
    if (client) {
      const expected = urlTipiSegment(client);
      if (req.params.tipi !== expected) {
        return res.redirect(
          302,
          `/${expected}/${encodeURIComponent(req.params.slug)}/owner${querySuffix(req)}`,
        );
      }
    }
    res.sendFile(path.join(publicDir, "owner/login.html"));
  }));

  app.get("/:tipi/:slug/kamarier/manifest.json", (req, res, next) => {
    if (isReservedUrlTipi(req.params.tipi)) return next();
    const tipi = encodeURIComponent(String(req.params.tipi || "").trim());
    const slug = encodeURIComponent(String(req.params.slug || "").trim());
    const key = String(req.query.key || "").trim();
    const w = String(req.query.w || "").trim();
    const q = new URLSearchParams();
    if (key) q.set("key", key);
    if (w) q.set("w", w);
    const qs = q.toString();
    const startUrl = `/${tipi}/${slug}/kamarier${qs ? `?${qs}` : ""}`;
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.type("application/manifest+json");
    res.json({
      name: "Revolution Invest POS — Kamarieri",
      short_name: "Kamarieri",
      start_url: startUrl,
      scope: `/${tipi}/${slug}/`,
      display: "standalone",
      orientation: "portrait-primary",
      theme_color: "#0f1b3d",
      background_color: "#0f1b3d",
      icons: [
        { src: "/logo-source.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      ],
    });
  });

  app.get("/:tipi/:slug/kamarier", resolve, (req, res) => {
    if (!allowsPosStaffRoutes(req.tipiCategory)) {
      return res.status(404).type("html").send(notFoundHtml());
    }
    serveWaiterPage(req, res, publicDir);
  });

  app.get("/:tipi/:slug/kuzhina", resolve, (req, res) => {
    if (!allowsPosStaffRoutes(req.tipiCategory)) return res.status(404).type("html").send(notFoundHtml());
    const token = String(req.query.w || "").trim();
    if (token) {
      return res.redirect(
        302,
        `/${encodeURIComponent(req.params.tipi)}/${encodeURIComponent(req.params.slug)}/kamarier${querySuffix(req)}`,
      );
    }
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.sendFile(path.join(publicDir, "kitchen.html"));
  });

  app.get("/:tipi/:slug/bar", resolve, (req, res) => {
    if (!allowsPosStaffRoutes(req.tipiCategory)) return res.status(404).type("html").send(notFoundHtml());
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.sendFile(path.join(publicDir, "bar.html"));
  });

  app.get("/:tipi/:slug/takeaway", resolve, (req, res) => {
    if (req.tipiCategory === "furra" || req.tipiCategory === "pos" || req.tipiCategory === "hotel") {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.sendFile(path.join(publicDir, "r-order.html"));
    }
    return res.status(404).type("html").send(notFoundHtml());
  });

  app.get("/:tipi/:slug/menu/:tableNumber", resolve, (req, res) => {
    if (req.tipiCategory !== "pos" && req.tipiCategory !== "furra" && req.tipiCategory !== "hotel") {
      return res.status(404).type("html").send(notFoundHtml());
    }
    res.sendFile(path.join(publicDir, "kiosk.html"));
  });

  app.get(
    "/:tipi/:slug/menu",
    resolve,
    asyncHandler(async (req, res) => {
      if (req.tipiCategory === "furra") {
        return res.status(503).type("html").send(unconfiguredHtml("FURRA menu"));
      }
      if (req.tipiCategory !== "pos" && req.tipiCategory !== "hotel") {
        return res.status(404).type("html").send(notFoundHtml());
      }
      return sendPublicStorefront(req, res, "r", "restorant");
    }),
  );

  /** MARKET — kasa */
  app.get("/:tipi/:slug/kasa", resolve, (req, res) => {
    if (req.tipiCategory !== "market") return res.status(404).type("html").send(notFoundHtml());
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.sendFile(path.join(publicDir, "bar.html"));
  });

  /** HOTEL — recepsion, sherbimi (HTML lokal; hotel cloud proxy për /hotel/*) */
  app.get("/:tipi/:slug/recepsion", resolve, (req, res) => {
    if (req.tipiCategory !== "hotel") return res.status(404).type("html").send(notFoundHtml());
    serveWaiterPage(req, res, publicDir);
  });

  app.get("/:tipi/:slug/sherbimi", resolve, (req, res) => {
    if (req.tipiCategory !== "hotel") return res.status(404).type("html").send(notFoundHtml());
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.sendFile(path.join(publicDir, "kitchen.html"));
  });

  /** SECURITY — pronari, rojtar, punetor (proxy te /security/*; fallback HTML) */
  app.get("/:tipi/:slug/pronari", resolve, (req, res) => {
    if (req.tipiCategory !== "security") return res.status(404).type("html").send(notFoundHtml());
    res.sendFile(path.join(publicDir, "owner/login.html"));
  });

  app.get("/:tipi/:slug/rojtar", resolve, (req, res) => {
    if (req.tipiCategory !== "security") return res.status(404).type("html").send(notFoundHtml());
    res.status(503).type("html").send(unconfiguredHtml("Security rojtar"));
  });

  app.get("/:tipi/:slug/punetor", resolve, (req, res) => {
    if (req.tipiCategory !== "security") return res.status(404).type("html").send(notFoundHtml());
    res.status(503).type("html").send(unconfiguredHtml("Security punëtor"));
  });

  /** Faqja publike + manifest */
  app.get("/:tipi/:slug/manifest.json", resolve, manifestHandler);
  app.get("/:tipi/:slug/sw.js", resolve, resolvePublicClient, serviceWorkerHandler);

  app.get(
    "/:tipi/:slug",
    resolve,
    asyncHandler(async (req, res) => {
      if (req.tipiCategory === "market") {
        return sendPublicStorefront(req, res, "s", "shop");
      }
      if (req.tipiCategory === "pos" || req.tipiCategory === "hotel") {
        return sendPublicStorefront(req, res, "r", "restorant");
      }
      if (req.tipiCategory === "furra") {
        return res.status(503).type("html").send(unconfiguredHtml("FURRA"));
      }
      if (req.tipiCategory === "security") {
        return res.status(503).type("html").send(unconfiguredHtml("Security"));
      }
      if (req.tipiCategory === "simple") {
        return res.sendFile(path.join(publicDir, "owner/login.html"));
      }
      return sendPublicStorefront(req, res, "r", "restorant");
    }),
  );

  /** Legacy + /restaurant/ redirect */
  async function legacyRedirectWithClient(req, res, pathname) {
    const slug = req.params.slug;
    let urlTipi = "kafene";
    if (slug) {
      try {
        const client = await getClientBySlugOrId(slug);
        if (client) urlTipi = urlTipiSegment(client);
      } catch {
        /* default kafene */
      }
    }
    const target = legacyRedirectTarget(pathname || req.path, querySuffix(req), urlTipi);
    if (target) return res.redirect(302, target);
    return res.status(404).type("html").send(notFoundHtml());
  }

  app.get("/restaurant/:slug/menu/:tableNumber", asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));
  app.get("/restaurant/:slug/:role", asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));
  app.get("/restaurant/:slug", asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));

  app.get(["/waiter/:slug/manifest.json"], asyncHandler(async (req, res) => {
    await legacyRedirectWithClient(req, res, `/waiter/${req.params.slug}/manifest.json`);
  }));
  app.get(["/waiter/:slug", "/waiter/:slug/"], asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));
  app.get("/kitchen/:slug", asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));
  app.get("/bar/:slug", asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));
  app.get("/menu/:slug/:tableNumber", asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));
  app.get("/kiosk/:slug", asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));
  app.get(["/r/:slug/order", "/r/:slug/menu", "/r/:slug/menu/", "/r/:slug"], asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));
  app.get("/r/:slug/manifest.json", asyncHandler(async (req, res) => {
    const client = await getClientBySlugOrId(req.params.slug).catch(() => null);
    const t = client ? urlTipiSegment(client) : "kafene";
    res.redirect(302, `/${t}/${encodeURIComponent(req.params.slug)}/manifest.json${querySuffix(req)}`);
  }));
  app.get("/r/:slug/sw.js", asyncHandler(async (req, res) => {
    const client = await getClientBySlugOrId(req.params.slug).catch(() => null);
    const t = client ? urlTipiSegment(client) : "kafene";
    res.redirect(302, `/${t}/${encodeURIComponent(req.params.slug)}/sw.js${querySuffix(req)}`);
  }));
  app.get(["/s/:slug/order", "/s/:slug"], asyncHandler((req, res) => legacyRedirectWithClient(req, res, req.path)));
}

module.exports = { registerProductPageRoutes, notFoundHtml };
