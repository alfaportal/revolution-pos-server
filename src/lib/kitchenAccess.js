const crypto = require("crypto");
const { getSupabase } = require("../db");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateKitchenKey() {
  return crypto.randomBytes(24).toString("hex");
}

function slugifyName(emri) {
  const base = String(emri || "lokal")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return base || "lokal";
}

function generateKitchenSlug(emri) {
  return `${slugifyName(emri)}-${crypto.randomBytes(3).toString("hex")}`;
}

function extractKitchenKey(req) {
  return String(req.query.key || req.headers["x-kitchen-key"] || "").trim();
}

function verifyKitchenKey(client, key) {
  const expected = String(client?.kitchen_key || "").trim();
  if (!expected) return false;
  const provided = String(key || "").trim();
  if (!provided) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return expected === provided;
  }
}

async function getClientBySlugOrId(identifier) {
  const id = String(identifier || "").trim();
  if (!id) return null;

  const db = getSupabase();
  if (UUID_RE.test(id)) {
    const { data, error } = await db.from("clients").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  const { data, error } = await db.from("clients").select("*").eq("kitchen_slug", id).maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureKitchenCredentials(client) {
  if (!client?.id) return client;
  if (client.kitchen_slug && client.kitchen_key) return client;

  const db = getSupabase();
  const patch = {};
  if (!client.kitchen_key) patch.kitchen_key = generateKitchenKey();
  if (!client.kitchen_slug) patch.kitchen_slug = generateKitchenSlug(client.emri);

  const { data, error } = await db
    .from("clients")
    .update(patch)
    .eq("id", client.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

function buildKitchenUrl(baseUrl, client, kind) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  const slug = client.kitchen_slug || client.id;
  const key = client.kitchen_key || "";
  const path = kind === "waiter" ? "waiter" : kind === "kiosk" ? "kiosk" : "kitchen";
  return `${base}/${path}/${encodeURIComponent(slug)}?key=${encodeURIComponent(key)}`;
}

module.exports = {
  UUID_RE,
  generateKitchenKey,
  generateKitchenSlug,
  extractKitchenKey,
  verifyKitchenKey,
  getClientBySlugOrId,
  ensureKitchenCredentials,
  buildKitchenUrl,
};
