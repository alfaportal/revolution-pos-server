/**
 * Supabase sipas produktit — POS / MARKET / HOTEL të ndarë.
 * Security mbetet te bridge-i i vet. POS default nuk ndryshohet.
 */
const { createClient } = require("@supabase/supabase-js");
const { getSupabase } = require("../db");
const { trimEnv } = require("./env");
const { normalizeProductLine } = require("../utils/productLine");

const cache = new Map();
const licenseHome = new Map();

/** URL të publike të projekteve të ndara (të njëjtat si bootstrap_*.sql). Railway i mbishkruan. */
const DEFAULT_PRODUCT_DB = {
  market: {
    url: "https://lbcjmpwvfqonsfjlutfp.supabase.co",
    // Anon i dhënë nga pronari për Super Admin → MARKET. Railway: MARKET_SUPABASE_SERVICE_ROLE_KEY.
    anon:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiY2ptcHd2ZnFvbnNmamx1dGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDA1ODksImV4cCI6MjEwMjI3NjU4OX0.yf2MdWyi3oGimDJVyEO3hWHSrKpHWZmB18FKG9krBH4",
  },
  hotel: {
    url: "https://mnzmbgaqtdxrtutfjesr.supabase.co",
    anon:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uem1iZ2FxdGR4cnR1dGZqZXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2OTk0NzQsImV4cCI6MjEwMjI3NTQ3NH0.8A9tvxH7Bm7hB-PdJrSa9EkVHsBRfJ0vaWaLPKPSMEg",
  },
};

function productEnv(product) {
  const p = normalizeProductLine(product);
  const defaults = DEFAULT_PRODUCT_DB[p];
  if (p === "market" || p === "hotel") {
    return {
      product: p,
      url: trimEnv(`${p.toUpperCase()}_SUPABASE_URL`) || defaults.url,
      key:
        trimEnv(`${p.toUpperCase()}_SUPABASE_SERVICE_ROLE_KEY`)
        || trimEnv(`${p.toUpperCase()}_SUPABASE_KEY`)
        || trimEnv(`${p.toUpperCase()}_SUPABASE_ANON_KEY`)
        || defaults.anon,
    };
  }
  return { product: "kafene", url: "", key: "" };
}

function isDedicatedProduct(product) {
  const p = normalizeProductLine(product);
  return p === "market" || p === "hotel";
}

function getSupabaseForProduct(product) {
  const p = normalizeProductLine(product || "kafene");
  if (p === "security") {
    throw new Error("Security nuk përdor këtë klient Supabase — përdor securityAdminBridge.");
  }
  if (!isDedicatedProduct(p)) {
    return getSupabase();
  }
  if (cache.has(p)) return cache.get(p);
  const { url, key } = productEnv(p);
  if (!url || !key) {
    const err = new Error(
      `Mungon ${p.toUpperCase()}_SUPABASE_URL ose çelësi. Vendosi në Railway / .env.products — mos përdor Supabase të POS.`,
    );
    err.code = "PRODUCT_SUPABASE_MISSING";
    throw err;
  }
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cache.set(p, client);
  return client;
}

function rememberLicenseHome(licenseId, product) {
  const id = String(licenseId || "").trim();
  if (!id) return;
  licenseHome.set(id, normalizeProductLine(product) || "kafene");
}

function rememberedProduct(licenseId) {
  return licenseHome.get(String(licenseId || "").trim()) || null;
}

async function findLicenseOnProductDbs(lookup) {
  const order = ["kafene", "market", "hotel"];
  for (const product of order) {
    try {
      const db = getSupabaseForProduct(product);
      const row = await lookup(db, product);
      if (row) {
        rememberLicenseHome(row.id, product);
        return { row, product, db };
      }
    } catch (e) {
      const msg = String(e.message || e.code || "");
      if (e.code === "PRODUCT_SUPABASE_MISSING") continue;
      if (/PGRST205|schema cache|does not exist/i.test(msg)) continue;
      console.warn(`[productSupabase] ${product}:`, msg);
    }
  }
  return { row: null, product: null, db: null };
}

async function dbForLicenseId(licenseId, productHint) {
  const hint = productHint ? normalizeProductLine(productHint) : rememberedProduct(licenseId);
  const order = [];
  if (hint && hint !== "security") order.push(hint);
  for (const p of ["kafene", "market", "hotel"]) {
    if (!order.includes(p)) order.push(p);
  }
  for (const product of order) {
    try {
      const db = getSupabaseForProduct(product);
      const { data } = await db.from("licenses").select("id").eq("id", licenseId).maybeSingle();
      if (data) {
        rememberLicenseHome(licenseId, product);
        return { db, product };
      }
    } catch (e) {
      if (e.code === "PRODUCT_SUPABASE_MISSING") continue;
      console.warn(`[productSupabase] license ${product}:`, e.message || e);
    }
  }
  return { db: getSupabase(), product: "kafene" };
}

async function dbForClientId(clientId, productHint) {
  const hint = productHint ? normalizeProductLine(productHint) : null;
  const order = [];
  if (hint && hint !== "security") order.push(hint);
  for (const p of ["kafene", "market", "hotel"]) {
    if (!order.includes(p)) order.push(p);
  }
  for (const product of order) {
    try {
      const db = getSupabaseForProduct(product);
      const { data } = await db.from("clients").select("id").eq("id", clientId).maybeSingle();
      if (data) return { db, product };
    } catch (e) {
      if (e.code === "PRODUCT_SUPABASE_MISSING") continue;
      console.warn(`[productSupabase] client ${product}:`, e.message || e);
    }
  }
  return { db: getSupabase(), product: "kafene" };
}

module.exports = {
  isDedicatedProduct,
  getSupabaseForProduct,
  rememberLicenseHome,
  rememberedProduct,
  findLicenseOnProductDbs,
  dbForLicenseId,
  dbForClientId,
  productEnv,
};
