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

function productEnv(product) {
  const p = normalizeProductLine(product);
  if (p === "market") {
    return {
      product: "market",
      url: trimEnv("MARKET_SUPABASE_URL"),
      key:
        trimEnv("MARKET_SUPABASE_SERVICE_ROLE_KEY")
        || trimEnv("MARKET_SUPABASE_KEY")
        || trimEnv("MARKET_SUPABASE_ANON_KEY"),
    };
  }
  if (p === "hotel") {
    return {
      product: "hotel",
      url: trimEnv("HOTEL_SUPABASE_URL"),
      key:
        trimEnv("HOTEL_SUPABASE_SERVICE_ROLE_KEY")
        || trimEnv("HOTEL_SUPABASE_KEY")
        || trimEnv("HOTEL_SUPABASE_ANON_KEY"),
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
