const fs = require("fs");
const path = require("path");
const { getSupabase } = require("../db");
const { getClientBySlugOrId, ensureKitchenCredentials, buildKitchenUrl } = require("../lib/kitchenAccess");
const { getClientMenuCatalog } = require("./menuCatalogService");
const { clientHasFeature, packageUpgradeMessage } = require("../lib/packages");

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS_SQ = {
  mon: "E hënë",
  tue: "E martë",
  wed: "E mërkurë",
  thu: "E enjte",
  fri: "E premte",
  sat: "E shtunë",
  sun: "E diel",
};

const MAX_LOGO_CHARS = 450_000;

function defaultHours() {
  const hours = {};
  for (const key of DAY_KEYS) {
    hours[key] = { open: "09:00", close: "22:00", closed: false };
  }
  return hours;
}

function normalizeHours(raw) {
  const base = defaultHours();
  if (!raw || typeof raw !== "object") return base;
  for (const key of DAY_KEYS) {
    const row = raw[key];
    if (!row || typeof row !== "object") continue;
    base[key] = {
      open: String(row.open || "09:00").slice(0, 5),
      close: String(row.close || "22:00").slice(0, 5),
      closed: Boolean(row.closed),
    };
  }
  return base;
}

function formatHoursForDisplay(hours) {
  return DAY_KEYS.map(key => {
    const row = hours[key] || {};
    const label = DAY_LABELS_SQ[key];
    if (row.closed) return { key, label, text: "Mbyllur" };
    const open = row.open || "—";
    const close = row.close || "—";
    return { key, label, text: `${open} – ${close}` };
  });
}

function parseLogoDataUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  const match = s.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
  if (!match) return null;
  try {
    const buf = Buffer.from(match[2], "base64");
    if (buf.length > 350_000) return null;
    return { mime: match[1].toLowerCase(), buffer: buf };
  } catch {
    return null;
  }
}

function validateLogoInput(logo) {
  if (logo == null || logo === "") return "";
  const parsed = parseLogoDataUrl(logo);
  if (!parsed) throw new Error("Logo duhet të jetë PNG/JPG/WebP (max ~250 KB).");
  return String(logo).trim();
}

async function loadSettings(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_settings")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getPublicRestaurantPage(slug, baseUrl) {
  const client = await getClientBySlugOrId(slug);
  if (!client) return null;

  if (!clientHasFeature(client, "website")) {
    const err = new Error(packageUpgradeMessage("website"));
    err.code = "PACKAGE";
    throw err;
  }

  const settings = await loadSettings(client.id);
  if (settings?.public_enabled === false) return null;

  const menuData = await getClientMenuCatalog(client.id, { activeOnly: true });
  const creds = await ensureKitchenCredentials(client);
  const pageSlug = creds.kitchen_slug || client.id;

  let kiosk_url = null;
  if (clientHasFeature(client, "kiosk")) {
    kiosk_url = `${buildKitchenUrl(baseUrl, creds, "kiosk")}&table=1`;
  }

  const name = String(settings?.restaurant_name || client.emri || "Restorant").trim();
  const hours = normalizeHours(settings?.public_hours);

  return {
    slug: pageSlug,
    name,
    description: String(settings?.public_description || "").trim(),
    address: String(settings?.address || client.adresa || "").trim(),
    phone: String(settings?.phone || client.telefoni || "").trim(),
    hours,
    hours_display: formatHoursForDisplay(hours),
    logo_url: settings?.public_logo ? `/api/r/${encodeURIComponent(pageSlug)}/logo` : null,
    theme_color: String(settings?.public_theme_color || "#c2410c").trim(),
    categories: menuData.categories,
    menu: menuData.menu,
    kiosk_url,
    public_url: `${String(baseUrl || "").replace(/\/+$/, "")}/r/${encodeURIComponent(pageSlug)}`,
  };
}

async function getOwnerPublicPageSettings(clientId, baseUrl) {
  const db = getSupabase();
  const { data: client, error: clientErr } = await db
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (clientErr) throw clientErr;
  if (!client) throw new Error("Klienti nuk u gjet.");

  const settings = await loadSettings(clientId);
  const creds = await ensureKitchenCredentials(client);
  const slug = creds.kitchen_slug || client.id;
  const base = String(baseUrl || "").replace(/\/+$/, "");

  return {
    slug,
    public_enabled: settings?.public_enabled !== false,
    public_description: String(settings?.public_description || "").trim(),
    public_hours: normalizeHours(settings?.public_hours),
    has_logo: Boolean(settings?.public_logo),
    logo_preview: settings?.public_logo || null,
    public_theme_color: String(settings?.public_theme_color || "#c2410c").trim(),
    public_url: `${base}/r/${encodeURIComponent(slug)}`,
    restaurant_name: String(settings?.restaurant_name || client.emri || "").trim(),
    address: String(settings?.address || client.adresa || "").trim(),
    phone: String(settings?.phone || client.telefoni || "").trim(),
    website_enabled: clientHasFeature(client, "website"),
    kiosk_enabled: clientHasFeature(client, "kiosk"),
  };
}

async function updateOwnerPublicPageSettings(clientId, body) {
  const patch = { synced_at: new Date().toISOString() };

  if (body.public_enabled != null) patch.public_enabled = Boolean(body.public_enabled);
  if (body.public_description != null) {
    patch.public_description = String(body.public_description).trim().slice(0, 2000);
  }
  if (body.public_hours != null) patch.public_hours = normalizeHours(body.public_hours);
  if (body.public_theme_color != null) {
    const color = String(body.public_theme_color).trim();
    patch.public_theme_color = /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#c2410c";
  }
  if (body.public_logo !== undefined) {
    if (body.public_logo === null || body.public_logo === "") {
      patch.public_logo = "";
    } else {
      const logo = validateLogoInput(body.public_logo);
      if (logo.length > MAX_LOGO_CHARS) throw new Error("Logo është shumë e madhe.");
      patch.public_logo = logo;
    }
  }

  if (Object.keys(patch).length <= 1) throw new Error("Nuk ka fusha për përditësim.");

  const existing = await loadSettings(clientId);
  const db = getSupabase();
  const { error } = await db.from("pos_settings").upsert({
    client_id: clientId,
    restaurant_name: existing?.restaurant_name || "",
    table_count: existing?.table_count ?? 10,
    receipt_width_mm: existing?.receipt_width_mm ?? 80,
    public_enabled: existing?.public_enabled !== false,
    public_description: existing?.public_description || "",
    public_hours: existing?.public_hours || {},
    public_logo: existing?.public_logo || "",
    public_theme_color: existing?.public_theme_color || "#c2410c",
    ...patch,
  });
  if (error) throw error;

  return patch;
}

function buildManifest(page, baseUrl) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  const slug = encodeURIComponent(page.slug);
  const iconBase = `${base}/api/r/${slug}/logo`;
  const icons = page.logo_url
    ? [
        { src: `${iconBase}?size=192`, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: `${iconBase}?size=512`, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: `${iconBase}?size=512`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ]
    : [
        { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      ];

  return {
    name: page.name,
    short_name: page.name.slice(0, 24),
    description: page.description || `Menuja e ${page.name}`,
    start_url: `/r/${slug}`,
    scope: `/r/${slug}/`,
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: page.theme_color,
    background_color: "#faf8f5",
    icons,
  };
}

function buildServiceWorkerScript(slug) {
  const encSlug = encodeURIComponent(slug);
  const scope = `/r/${encSlug}/`;
  return `/* PWA — ${scope} */
const CACHE = "ri-restaurant-${encSlug}-v1";
const PRECACHE = [
  "/r/${encSlug}",
  "/css/r.css",
  "/js/r.js",
  "/icons/icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  if (!url.pathname.startsWith("/r/") && !url.pathname.startsWith("/css/r.css")
      && !url.pathname.startsWith("/js/r.js") && !url.pathname.startsWith("/icons/")) {
    return;
  }
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(req, clone));
      }
      return res;
    }).catch(() => caches.match(req)),
  );
});
`;
}

function getDefaultIconBuffer(size) {
  const iconPath = path.join(
    __dirname,
    "../../public/icons",
    size >= 512 ? "icon-512.png" : "icon-192.png",
  );
  return fs.readFileSync(iconPath);
}

async function getLogoResponse(slug, _size) {
  const client = await getClientBySlugOrId(slug);
  if (!client) return null;
  const settings = await loadSettings(client.id);
  const parsed = parseLogoDataUrl(settings?.public_logo);
  if (parsed) {
    return { buffer: parsed.buffer, mime: parsed.mime };
  }
  return { buffer: getDefaultIconBuffer(_size), mime: "image/png" };
}

module.exports = {
  DAY_KEYS,
  DAY_LABELS_SQ,
  defaultHours,
  normalizeHours,
  formatHoursForDisplay,
  getPublicRestaurantPage,
  getOwnerPublicPageSettings,
  updateOwnerPublicPageSettings,
  buildManifest,
  buildServiceWorkerScript,
  getLogoResponse,
};
