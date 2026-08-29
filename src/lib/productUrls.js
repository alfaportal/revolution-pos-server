/**
 * URL publike: revolution-pos.com/{tipi}/{slug}/{roli}
 * {tipi} = clients.tipi (normalizuar për URL)
 * {slug} = clients.kitchen_slug
 */
const { featuresForTier } = require("./packages");
const { normalizeClientTipi, MARKET_TIPI, HOTEL_TIPI } = require("../utils/businessTipi");

/** DB tipi → segment URL (shembuj: fast_food → fastfood, klub_nate → klub) */
const DB_TIPI_TO_URL = {
  restorant: "restorant",
  kafene: "kafene",
  bar: "bar",
  lounge_bar: "bar",
  pub: "pub",
  pub_lounge: "pub",
  fast_food: "fastfood",
  piceri: "piceri",
  doner_kebab: "fastfood",
  kebab: "fastfood",
  gjelltore: "restorant",
  fish_restaurant: "restorant",
  sushi_bar: "bar",
  klub_nate: "klub",
  klub: "klub",
  diskoteke: "klub",
  bar_nate: "klub",
  dyqan_pijesh: "bar",
  pasticeri: "pasticeri",
  furre_buke: "furra",
  akullore: "market",
  gjeltore: "restorant",
  hotel: "hotel",
  motel: "motel",
  hostel: "hotel",
  resort: "resort",
  ville_me_qira: "ville",
  ville: "ville",
  bujtine: "bujtine",
  hotel_restorant: "hotel",
  minimarket: "market",
  mini_market: "market",
  market: "market",
  pilar: "market",
  supermarket: "supermarket",
  dyqan_ushqimor: "dyqan",
  dyqan: "dyqan",
  manav: "dyqan",
  bulmetore: "dyqan",
  kasap: "dyqan",
  dyqan_peshku: "dyqan",
  peshkore: "dyqan",
  farmaci: "barnatore",
  kompani_sigurie: "security",
  pastrim: "pastrim",
  ndertimtari: "ndertimtari",
  transport_logjistike: "transport",
  transport: "transport",
  kuriere_dergesa: "kurier",
  kurier: "kurier",
  magazinim: "transport",
  mirembajtje_nderte: "sherbime",
  agjenci_marketingu: "sherbime",
  sherbime: "sherbime",
  bujqesi: "bujqesi",
  kontabiliste: "kontabilist",
  kontabilist: "kontabilist",
  fiskale: "fiskale",
  security: "security",
  furra: "furra",
};

const POS_URL_TIPI = new Set([
  "kafene",
  "restorant",
  "bar",
  "pub",
  "klub",
  "fastfood",
  "piceri",
]);

const HOTEL_URL_TIPI = new Set(["hotel", "motel", "ville", "resort", "bujtine"]);

const SECURITY_URL_TIPI = new Set([
  "security",
  "pastrim",
  "ndertimtari",
  "transport",
  "sherbime",
  "bujqesi",
  "kurier",
]);

const FURRA_URL_TIPI = new Set(["furra", "pasticeri"]);

const MARKET_URL_TIPI = new Set(["market", "minimarket", "supermarket", "dyqan", "barnatore"]);

const SIMPLE_URL_TIPI = new Set(["kontabilist", "fiskale"]);

/** Segmente të rezervuara — jo tipi biznesi */
const RESERVED_URL_TIPI = new Set([
  "api",
  "admin",
  "owner",
  "health",
  "panel",
  "waiter",
  "kitchen",
  "menu",
  "kiosk",
  "r",
  "s",
  "css",
  "js",
  "icons",
  "blog",
  "privacy",
  "terms",
  "website",
  "ri-super",
  "restaurant",
  "panel.html",
  "logo-source.png",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

function urlTipiSegment(client) {
  if (!client) return "kafene";
  const normalized = normalizeClientTipi(client.tipi || "kafene");
  if (DB_TIPI_TO_URL[normalized]) return DB_TIPI_TO_URL[normalized];
  return String(normalized || "kafene")
    .toLowerCase()
    .replace(/_/g, "")
    .replace(/[^a-z0-9-]/g, "")
    || "kafene";
}

function tipiCategory(urlTipi) {
  const t = String(urlTipi || "").toLowerCase();
  if (POS_URL_TIPI.has(t)) return "pos";
  if (HOTEL_URL_TIPI.has(t)) return "hotel";
  if (SECURITY_URL_TIPI.has(t)) return "security";
  if (FURRA_URL_TIPI.has(t)) return "furra";
  if (MARKET_URL_TIPI.has(t)) return "market";
  if (SIMPLE_URL_TIPI.has(t)) return "simple";
  if (MARKET_TIPI.includes(t) || t === "market") return "market";
  if (HOTEL_TIPI.includes(t)) return "hotel";
  return "pos";
}

function isReservedUrlTipi(tipi) {
  return RESERVED_URL_TIPI.has(String(tipi || "").toLowerCase());
}

function buildRolePath(urlTipi, slug, role, table) {
  const s = encodeURIComponent(String(slug || "").trim());
  const t = String(urlTipi || "kafene").replace(/^\/+|\/+$/g, "");
  if (!s || !t) return "";
  if (!role || role === "public") return `/${t}/${s}`;
  if (role === "menu" && table != null && table !== "") {
    return `/${t}/${s}/menu/${Math.max(1, Number(table) || 1)}`;
  }
  return `/${t}/${s}/${role}`;
}

function withQuery(url, query = {}) {
  if (!url) return "";
  const q = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== "") q.set(k, String(v).trim());
  });
  const qs = q.toString();
  return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
}

function buildRoleUrl(baseUrl, urlTipi, slug, role, { query = {}, table } = {}) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  const path = buildRolePath(urlTipi, slug, role, table);
  if (!path) return "";
  return withQuery(`${base}${path}`, query);
}

function buildStaffUrl(baseUrl, client, role, { webToken = "" } = {}) {
  const slug = client?.kitchen_slug || client?.id;
  const key = client?.kitchen_key || "";
  const urlTipi = urlTipiSegment(client);
  if (!slug) return "";
  const query = {};
  if (key) query.key = key;
  const w = String(webToken || "").trim();
  if (w) query.w = w;
  return buildRoleUrl(baseUrl, urlTipi, slug, role, { query });
}

function appendPosStaffLinks(links, baseUrl, urlTipi, slug, features, keyQuery) {
  if (features.waiter) links.waiter_url = buildRoleUrl(baseUrl, urlTipi, slug, "kamarier", { query: keyQuery });
  if (features.kds) {
    links.bar_url = buildRoleUrl(baseUrl, urlTipi, slug, "bar", { query: keyQuery });
    links.kitchen_url = buildRoleUrl(baseUrl, urlTipi, slug, "kuzhina", { query: keyQuery });
  }
  if (features.kiosk) {
    links.kiosk_url = buildRoleUrl(baseUrl, urlTipi, slug, "menu", { table: 1 });
    links.menu_url = buildRoleUrl(baseUrl, urlTipi, slug, "menu");
  }
  if (features.online_orders) links.public_order_url = buildRoleUrl(baseUrl, urlTipi, slug, "takeaway");
}

function buildClientWebLinks(baseUrl, client, packageTier) {
  const features = featuresForTier(packageTier);
  const urlTipi = urlTipiSegment(client);
  const slug = client?.kitchen_slug || client?.id;
  const key = client?.kitchen_key || "";
  const links = {};
  if (!slug) return links;

  const cat = tipiCategory(urlTipi);
  const keyQuery = key ? { key } : {};

  if (cat === "pos") {
    links.owner_url = buildRoleUrl(baseUrl, urlTipi, slug, "owner");
    appendPosStaffLinks(links, baseUrl, urlTipi, slug, features, keyQuery);
    if (features.website) links.public_page_url = buildRoleUrl(baseUrl, urlTipi, slug, "public");
  } else if (cat === "hotel") {
    links.owner_url = buildRoleUrl(baseUrl, urlTipi, slug, "owner");
    links.recepsion_url = buildRoleUrl(baseUrl, urlTipi, slug, "recepsion", { query: keyQuery });
    links.sherbimi_url = buildRoleUrl(baseUrl, urlTipi, slug, "sherbimi", { query: keyQuery });
    appendPosStaffLinks(links, baseUrl, urlTipi, slug, features, keyQuery);
    if (features.website) links.public_page_url = buildRoleUrl(baseUrl, urlTipi, slug, "public");
  } else if (cat === "security") {
    links.owner_url = buildRoleUrl(baseUrl, urlTipi, slug, "pronari");
    links.rojtar_url = buildRoleUrl(baseUrl, urlTipi, slug, "rojtar", { query: keyQuery });
    links.punetor_url = buildRoleUrl(baseUrl, urlTipi, slug, "punetor", { query: keyQuery });
    links.public_page_url = buildRoleUrl(baseUrl, urlTipi, slug, "public");
  } else if (cat === "furra") {
    links.owner_url = buildRoleUrl(baseUrl, urlTipi, slug, "owner");
    links.takeaway_url = buildRoleUrl(baseUrl, urlTipi, slug, "takeaway");
    links.menu_url = buildRoleUrl(baseUrl, urlTipi, slug, "menu");
    links.public_page_url = buildRoleUrl(baseUrl, urlTipi, slug, "public");
  } else if (cat === "market") {
    links.owner_url = buildRoleUrl(baseUrl, urlTipi, slug, "owner");
    links.kasa_url = buildRoleUrl(baseUrl, urlTipi, slug, "kasa", { query: keyQuery });
    links.public_page_url = buildRoleUrl(baseUrl, urlTipi, slug, "public");
  } else if (cat === "simple") {
    links.owner_url = buildRoleUrl(baseUrl, urlTipi, slug, "owner");
  }

  return links;
}

function buildClientWebLinksList(baseUrl, client, packageTier) {
  const links = buildClientWebLinks(baseUrl, client, packageTier);
  const urlTipi = urlTipiSegment(client);
  const cat = tipiCategory(urlTipi);
  const rows = [];
  const push = (key, label, url) => {
    if (url) rows.push({ key, label, url });
  };

  if (cat === "pos") {
    push("owner", "Pronari", links.owner_url);
    push("kamarier", "Kamarieri", links.waiter_url);
    push("kuzhina", "Kuzhina", links.kitchen_url);
    push("bar", "Banak", links.bar_url);
    push("takeaway", "Takeaway", links.public_order_url);
    push("menu", "Menu publike", links.menu_url || links.kiosk_url);
    push("public", "Faqja publike", links.public_page_url);
  } else if (cat === "hotel") {
    push("owner", "Pronari", links.owner_url);
    push("recepsion", "Recepsion", links.recepsion_url);
    push("sherbimi", "Room service", links.sherbimi_url);
    push("kamarier", "Kamarieri", links.waiter_url);
    push("kuzhina", "Kuzhina", links.kitchen_url);
    push("bar", "Banak", links.bar_url);
    push("takeaway", "Takeaway", links.public_order_url);
    push("menu", "Menu / QR tavolina", links.menu_url || links.kiosk_url);
    push("public", "Faqja publike", links.public_page_url);
  } else if (cat === "security") {
    push("pronari", "Pronari", links.owner_url);
    push("rojtar", "Rojtar", links.rojtar_url);
    push("punetor", "Punëtori", links.punetor_url);
    push("public", "Faqja publike", links.public_page_url);
  } else if (cat === "furra") {
    push("owner", "Pronari", links.owner_url);
    push("takeaway", "Takeaway", links.takeaway_url);
    push("menu", "Menu", links.menu_url);
    push("public", "Faqja publike", links.public_page_url);
  } else if (cat === "market") {
    push("owner", "Pronari", links.owner_url);
    push("kasa", "Kasa", links.kasa_url);
    push("public", "Faqja publike", links.public_page_url);
  } else if (cat === "simple") {
    push("owner", "Pronari", links.owner_url);
  }

  return rows;
}

/** Legacy → URL e re (kërkon tipi — default kafene nëse mungon klienti) */
function legacyRedirectTarget(pathname, search = "", urlTipi = "kafene") {
  const parts = String(pathname || "").split("/").filter(Boolean);
  const q = search && search.startsWith("?") ? search : search ? `?${search}` : "";
  const t = encodeURIComponent(urlTipi || "kafene");

  if (parts[0] === "restaurant" && parts[1]) {
    const slug = encodeURIComponent(parts[1]);
    const role = parts[2] || "";
    if (role === "kamarier") return `/${t}/${slug}/kamarier${q}`;
    if (role === "kuzhina") return `/${t}/${slug}/kuzhina${q}`;
    if (role === "bar") return `/${t}/${slug}/bar${q}`;
    if (role === "takeaway") return `/${t}/${slug}/takeaway${q}`;
    if (role === "menu" && parts[3]) return `/${t}/${slug}/menu/${encodeURIComponent(parts[3])}${q}`;
    if (role === "menu") return `/${t}/${slug}/menu${q}`;
    if (role === "owner") return `/${t}/${slug}/owner${q}`;
    return `/${t}/${slug}${q}`;
  }
  if (parts[0] === "waiter" && parts[1]) {
    return `/${t}/${encodeURIComponent(parts[1])}/kamarier${q}`;
  }
  if (parts[0] === "kitchen" && parts[1]) {
    return `/${t}/${encodeURIComponent(parts[1])}/kuzhina${q}`;
  }
  if (parts[0] === "bar" && parts[1]) {
    return `/${t}/${encodeURIComponent(parts[1])}/bar${q}`;
  }
  if (parts[0] === "menu" && parts[1] && parts[2]) {
    return `/${t}/${encodeURIComponent(parts[1])}/menu/${encodeURIComponent(parts[2])}${q}`;
  }
  if (parts[0] === "menu" && parts[1]) {
    return `/${t}/${encodeURIComponent(parts[1])}/menu${q}`;
  }
  if (parts[0] === "kiosk" && parts[1]) {
    return `/${t}/${encodeURIComponent(parts[1])}/menu${q}`;
  }
  if (parts[0] === "r" && parts[1]) {
    const slug = encodeURIComponent(parts[1]);
    if (parts[2] === "order") return `/${t}/${slug}/takeaway${q}`;
    if (parts[2] === "menu") return `/${t}/${slug}/menu${q}`;
    return `/${t}/${slug}${q}`;
  }
  if (parts[0] === "s" && parts[1]) {
    const slug = encodeURIComponent(parts[1]);
    if (parts[2] === "order") return `/market/${slug}/takeaway${q}`;
    return `/market/${slug}${q}`;
  }
  return null;
}

module.exports = {
  DB_TIPI_TO_URL,
  RESERVED_URL_TIPI,
  urlTipiSegment,
  tipiCategory,
  isReservedUrlTipi,
  buildRolePath,
  buildRoleUrl,
  buildStaffUrl,
  buildClientWebLinks,
  buildClientWebLinksList,
  legacyRedirectTarget,
  withQuery,
  // alias
  productPrefix: urlTipiSegment,
  buildRestaurantStaffUrl: buildStaffUrl,
};
