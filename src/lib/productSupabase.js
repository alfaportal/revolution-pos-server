/**
 * POS server — vetëm Supabase POS (kafene / furra).
 * MARKET dhe HOTEL kanë Railway + Supabase të vet. Security → securityAdminBridge.
 */
const { getSupabase } = require("../db");
const { normalizeProductLine } = require("../utils/productLine");

const MARKET_SERVER = "https://revolution-market-server-production.up.railway.app";
const HOTEL_SERVER = "https://revolution-hotel-server-production.up.railway.app";

function isDedicatedProduct(product) {
  const p = normalizeProductLine(product);
  return p === "market" || p === "hotel";
}

function dedicatedServerError(product) {
  const p = normalizeProductLine(product);
  const err = new Error(
    p === "hotel"
      ? `HOTEL nuk kalon nga POS. Përdor ${HOTEL_SERVER}`
      : `MARKET nuk kalon nga POS. Përdor ${MARKET_SERVER}`,
  );
  err.code = "PRODUCT_WRONG_SERVER";
  err.status = 400;
  return err;
}

function productEnv() {
  return { product: "kafene", url: "", key: "" };
}

function getSupabaseForProduct(product) {
  const p = normalizeProductLine(product || "kafene");
  if (p === "security") {
    throw new Error("Security nuk përdor këtë klient Supabase — përdor securityAdminBridge.");
  }
  if (p === "market" || p === "hotel") {
    throw dedicatedServerError(p);
  }
  return getSupabase();
}

function rememberLicenseHome() {
  /* POS s’ruan “home” për MARKET/HOTEL */
}

function rememberedProduct() {
  return null;
}

async function findLicenseOnProductDbs(lookup) {
  const db = getSupabase();
  try {
    const row = await lookup(db, "kafene");
    if (row) return { row, product: "kafene", db };
  } catch (e) {
    const msg = String(e.message || e.code || "");
    if (/PGRST205|schema cache|does not exist/i.test(msg)) {
      return { row: null, product: null, db: null };
    }
    throw e;
  }
  return { row: null, product: null, db: null };
}

async function dbForLicenseId() {
  return { db: getSupabase(), product: "kafene" };
}

async function dbForClientId() {
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
  dedicatedServerError,
};
