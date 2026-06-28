const fs = require("fs");
const path = require("path");
const { getSupabase } = require("../db");
const { getClientBySlugOrId, ensureKitchenCredentials } = require("../lib/kitchenAccess");
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

const {
  parseImageDataUrl,
  validateImageDataUrl,
  imageBufferFromDataUrl,
  imageMimeFromDataUrl,
} = require("../lib/imageDataUrl");

const MAX_LOGO_BYTES = 512_000;
const MAX_LOGO_CHARS = 700_000;
const MAX_COVER_BYTES = 800_000;
const MAX_COVER_CHARS = 1_100_000;
const MAX_GALLERY_BYTES = 512_000;
const MAX_GALLERY_CHARS = 700_000;
const MAX_GALLERY_COUNT = 5;
const MAX_REVIEWS = 5;
const MAX_DAILY_OFFER = 500;
const MAX_REVIEW_NAME = 80;
const MAX_REVIEW_TEXT = 500;
const MAX_MENU_PHOTO_BYTES = 512_000;
const MAX_MENU_PHOTO_CHARS = 700_000;

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
  return parseImageDataUrl(raw, MAX_LOGO_BYTES);
}

function validateLogoInput(logo) {
  return validateImageDataUrl(logo, {
    maxBytes: MAX_LOGO_BYTES,
    maxChars: MAX_LOGO_CHARS,
    label: "Logo",
  });
}

function validateCoverInput(cover) {
  return validateImageDataUrl(cover, {
    maxBytes: MAX_COVER_BYTES,
    maxChars: MAX_COVER_CHARS,
    label: "Foto cover",
  });
}

function normalizeGallery(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_GALLERY_COUNT)
    .map(item => String(item || "").trim())
    .filter(Boolean);
}

function validateGalleryInput(raw) {
  if (raw == null) return undefined;
  if (!Array.isArray(raw)) throw new Error("Galeria duhet të jetë listë.");
  if (raw.length > MAX_GALLERY_COUNT) {
    throw new Error(`Maksimum ${MAX_GALLERY_COUNT} foto në galeri.`);
  }
  const out = [];
  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i];
    if (item == null || item === "") continue;
    out.push(validateImageDataUrl(item, {
      maxBytes: MAX_GALLERY_BYTES,
      maxChars: MAX_GALLERY_CHARS,
      label: `Foto galeri ${i + 1}`,
    }));
  }
  return out;
}

function normalizeReviews(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_REVIEWS)
    .map(row => {
      const name = String(row?.name || "").trim().slice(0, MAX_REVIEW_NAME);
      let stars = Math.round(Number(row?.stars) || 0);
      if (stars < 1) stars = 1;
      if (stars > 5) stars = 5;
      const text = String(row?.text || "").trim().slice(0, MAX_REVIEW_TEXT);
      if (!name) return null;
      return { name, stars, ...(text ? { text } : {}) };
    })
    .filter(Boolean);
}

function normalizeSocialUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s.slice(0, 500);
  return `https://${s.replace(/^\/+/, "")}`.slice(0, 500);
}

function normalizeWhatsAppPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 8) return "";
  return digits.slice(0, 20);
}

function buildWhatsAppUrl(digits) {
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function galleryUrlsForSlug(pageSlug, count) {
  const enc = encodeURIComponent(pageSlug);
  return Array.from({ length: count }, (_, i) => `/api/r/${enc}/gallery/${i}`);
}

function settingsProfileFields(settings, pageSlug) {
  const gallery = normalizeGallery(settings?.public_gallery);
  const reviews = normalizeReviews(settings?.public_reviews);
  const whatsapp = normalizeWhatsAppPhone(settings?.public_whatsapp);
  const instagram = normalizeSocialUrl(settings?.public_social_instagram);
  const facebook = normalizeSocialUrl(settings?.public_social_facebook);
  const tiktok = normalizeSocialUrl(settings?.public_social_tiktok);
  const dailyOffer = String(settings?.public_daily_offer || "").trim().slice(0, MAX_DAILY_OFFER);

  return {
    cover_url: settings?.public_cover ? `/api/r/${encodeURIComponent(pageSlug)}/cover` : null,
    gallery_urls: gallery.length ? galleryUrlsForSlug(pageSlug, gallery.length) : [],
    daily_offer: dailyOffer,
    reviews,
    social: {
      instagram: instagram || null,
      facebook: facebook || null,
      tiktok: tiktok || null,
    },
    whatsapp_url: buildWhatsAppUrl(whatsapp),
    whatsapp_phone: whatsapp || null,
  };
}

function ownerProfileFields(settings) {
  return {
    cover_preview: settings?.public_cover || null,
    gallery_previews: normalizeGallery(settings?.public_gallery),
    daily_offer: String(settings?.public_daily_offer || "").trim(),
    reviews: normalizeReviews(settings?.public_reviews),
    social_instagram: String(settings?.public_social_instagram || "").trim(),
    social_facebook: String(settings?.public_social_facebook || "").trim(),
    social_tiktok: String(settings?.public_social_tiktok || "").trim(),
    public_whatsapp: String(settings?.public_whatsapp || "").trim(),
  };
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

  const base = String(baseUrl || "").replace(/\/+$/, "");
  let order_url = null;
  if (clientHasFeature(client, "online_orders")) {
    order_url = `${base}/r/${encodeURIComponent(pageSlug)}/order`;
  }

  const name = String(settings?.restaurant_name || client.emri || "Restorant").trim();
  const hours = normalizeHours(settings?.public_hours);

  const address = String(settings?.address || client.adresa || "").trim();
  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return {
    slug: pageSlug,
    name,
    description: String(settings?.public_description || "").trim(),
    address,
    maps_url: mapsUrl,
    phone: String(settings?.phone || client.telefoni || "").trim(),
    hours,
    hours_display: formatHoursForDisplay(hours),
    logo_url: settings?.public_logo ? `/api/r/${encodeURIComponent(pageSlug)}/logo` : null,
    theme_color: String(settings?.public_theme_color || "#c2410c").trim(),
    categories: menuData.categories,
    menu: (menuData.menu || []).map(item => ({
      ...item,
      photo_url: item.has_photo
        ? `/api/r/${encodeURIComponent(pageSlug)}/menu/${item.id}/photo`
        : null,
    })),
    order_url,
    public_url: `${base}/r/${encodeURIComponent(pageSlug)}`,
    ...settingsProfileFields(settings, pageSlug),
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
    online_orders_enabled: clientHasFeature(client, "online_orders"),
    ...ownerProfileFields(settings),
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
  if (body.public_cover !== undefined) {
    if (body.public_cover === null || body.public_cover === "") {
      patch.public_cover = "";
    } else {
      patch.public_cover = validateCoverInput(body.public_cover);
    }
  }
  if (body.public_gallery !== undefined) {
    patch.public_gallery = validateGalleryInput(body.public_gallery);
  }
  if (body.public_daily_offer != null) {
    patch.public_daily_offer = String(body.public_daily_offer).trim().slice(0, MAX_DAILY_OFFER);
  }
  if (body.public_reviews != null) {
    patch.public_reviews = normalizeReviews(body.public_reviews);
  }
  if (body.public_social_instagram != null) {
    patch.public_social_instagram = normalizeSocialUrl(body.public_social_instagram);
  }
  if (body.public_social_facebook != null) {
    patch.public_social_facebook = normalizeSocialUrl(body.public_social_facebook);
  }
  if (body.public_social_tiktok != null) {
    patch.public_social_tiktok = normalizeSocialUrl(body.public_social_tiktok);
  }
  if (body.public_whatsapp != null) {
    patch.public_whatsapp = normalizeWhatsAppPhone(body.public_whatsapp);
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
    public_cover: existing?.public_cover || "",
    public_gallery: existing?.public_gallery || [],
    public_daily_offer: existing?.public_daily_offer || "",
    public_reviews: existing?.public_reviews || [],
    public_social_instagram: existing?.public_social_instagram || "",
    public_social_facebook: existing?.public_social_facebook || "",
    public_social_tiktok: existing?.public_social_tiktok || "",
    public_whatsapp: existing?.public_whatsapp || "",
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
const CACHE = "ri-restaurant-${encSlug}-v5";
const PRECACHE = [
  "/r/${encSlug}",
  "/r/${encSlug}/order",
  "/css/r.css",
  "/js/r.js",
  "/js/r-order.js",
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

  // Always fetch restaurant HTML from network (avoid stale markup from old caches).
  if (url.pathname.startsWith("/r/") && !url.pathname.endsWith(".js")
      && !url.pathname.endsWith(".json") && url.pathname !== "/css/r.css") {
    e.respondWith(
      fetch(req).catch(() => caches.match(req)),
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  if (!url.pathname.startsWith("/r/") && !url.pathname.startsWith("/css/r.css")
      && !url.pathname.startsWith("/js/r.js") && !url.pathname.startsWith("/js/r-order.js")
      && !url.pathname.startsWith("/icons/")) {
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

async function getMenuItemPhotoResponse(slug, localId) {
  const client = await getClientBySlugOrId(slug);
  if (!client) return null;
  const db = getSupabase();
  const idNum = Number(localId);
  if (!idNum) return null;
  const { data, error } = await db
    .from("pos_menu_items")
    .select("photo")
    .eq("client_id", client.id)
    .eq("local_id", idNum)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  const buffer = imageBufferFromDataUrl(data?.photo, MAX_MENU_PHOTO_BYTES);
  const mime = imageMimeFromDataUrl(data?.photo, MAX_MENU_PHOTO_BYTES);
  if (!buffer || !mime) return null;
  return { buffer, mime };
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

async function getCoverResponse(slug) {
  const client = await getClientBySlugOrId(slug);
  if (!client) return null;
  const settings = await loadSettings(client.id);
  const parsed = parseImageDataUrl(settings?.public_cover, MAX_COVER_BYTES);
  if (!parsed) return null;
  return { buffer: parsed.buffer, mime: parsed.mime };
}

async function getGalleryPhotoResponse(slug, index) {
  const client = await getClientBySlugOrId(slug);
  if (!client) return null;
  const settings = await loadSettings(client.id);
  const gallery = normalizeGallery(settings?.public_gallery);
  const idx = Number(index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= gallery.length) return null;
  const parsed = parseImageDataUrl(gallery[idx], MAX_GALLERY_BYTES);
  if (!parsed) return null;
  return { buffer: parsed.buffer, mime: parsed.mime };
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
  getCoverResponse,
  getGalleryPhotoResponse,
  getMenuItemPhotoResponse,
  normalizeReviews,
  normalizeGallery,
};
