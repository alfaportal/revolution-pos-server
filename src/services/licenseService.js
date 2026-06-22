const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../db");
const { formatError, logRouteError } = require("../lib/errors");

function normalizeKey(key) {
  return String(key || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function compactKey(key) {
  return normalizeKey(key).replace(/-/g, "");
}

function licenseAppType(license) {
  if (license.app_type) return license.app_type;
  const clientTipi = license.clients?.tipi;
  if (clientTipi && clientTipi !== "tjeter") return clientTipi;
  return "restorant";
}

function generateLicenseKey() {
  const part = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4).padEnd(4, "X");
  return `${part()}-${part()}-${part()}-${part()}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isExpired(dateStr) {
  if (!dateStr) return true;
  return dateStr < todayISO();
}

async function findLicenseByKey(celesi) {
  const db = getSupabase();
  const normalized = normalizeKey(celesi);
  if (!normalized) return null;

  const select = "*, clients(id, emri, adresa, telefoni, email, tipi)";

  const { data, error } = await db
    .from("licenses")
    .select(select)
    .eq("celesi", normalized)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: ilikeRows, error: ilikeErr } = await db
    .from("licenses")
    .select(select)
    .ilike("celesi", normalized);
  if (ilikeErr) throw ilikeErr;
  if (ilikeRows?.length === 1) return ilikeRows[0];

  const compact = compactKey(normalized);
  if (compact.length >= 8) {
    const { data: allRows, error: allErr } = await db.from("licenses").select(select);
    if (allErr) throw allErr;
    const match = (allRows || []).find((row) => compactKey(row.celesi) === compact);
    if (match) return match;
  }

  return null;
}

function sanitizeClientIp(ip) {
  return String(ip || "").trim().split(",")[0].trim().slice(0, 64);
}

function sanitizeHostname(hostname) {
  return String(hostname || "").trim().slice(0, 128);
}

async function patchLicenseMeta(licenseId, patch) {
  const db = getSupabase();
  const { error } = await db.from("licenses").update(patch).eq("id", licenseId);
  if (error) {
    const skip = /device_hostname|last_activated|last_validation|last_ip/i.test(error.message || "");
    if (!skip) throw error;
  }
}

async function recordValidationFailure(license, code, message, client_ip) {
  const ip = sanitizeClientIp(client_ip);
  await patchLicenseMeta(license.id, {
    last_validation_at: new Date().toISOString(),
    last_validation_error: `${code}: ${message}`,
    ...(ip ? { last_ip: ip } : {}),
  });
}

async function validateLicense({ celesi, device_id, app_type, hostname, client_ip }) {
  const license = await findLicenseByKey(celesi);
  if (!license) {
    return { valid: false, code: "NOT_FOUND", message: "Liçenca nuk u gjet." };
  }

  const fail = async (code, message) => {
    await recordValidationFailure(license, code, message, client_ip);
    return { valid: false, code, message };
  };

  if (license.statusi === "revokuar") {
    return fail("REVOKED", "Liçenca është revokuar.");
  }
  if (license.statusi === "pezulluar") {
    return fail("SUSPENDED", "Liçenca është pezulluar.");
  }
  if (license.statusi === "skaduar" || isExpired(license.data_skadimit)) {
    return fail("EXPIRED", "Liçenca ka skaduar.");
  }

  if (app_type) {
    const expected = licenseAppType(license);
    if (expected !== "tjeter" && app_type !== expected) {
      return fail("WRONG_APP", `Liçenca është për ${expected}, jo për ${app_type}.`);
    }
  }

  const deviceId = String(device_id || "").trim().toUpperCase();
  const host = sanitizeHostname(hostname);
  const ip = sanitizeClientIp(client_ip);
  const now = new Date().toISOString();

  if (deviceId) {
    if (license.device_id && license.device_id !== deviceId) {
      return fail("DEVICE_MISMATCH", "Liçenca është aktivizuar në një pajisje tjetër.");
    }
  }

  const successPatch = {
    last_activated_at: now,
    last_validation_at: now,
    last_validation_error: "",
    ...(ip ? { last_ip: ip } : {}),
    ...(host ? { device_hostname: host } : {}),
  };
  if (deviceId) {
    successPatch.device_id = deviceId;
  }

  await patchLicenseMeta(license.id, successPatch);
  if (deviceId) license.device_id = deviceId;
  if (host) license.device_hostname = host;

  return {
    valid: true,
    license_id: license.id,
    client_id: license.client_id,
    client_name: license.clients?.emri || "",
    client_type: licenseAppType(license),
    device_id: license.device_id,
    device_hostname: license.device_hostname || host,
    last_activated_at: now,
    last_ip: ip,
    status: license.statusi,
    valid_from: license.data_fillimit,
    valid_until: license.data_skadimit,
    message: "Liçenca është aktive.",
  };
}

async function listClients() {
  const db = getSupabase();
  let { data, error } = await db
    .from("clients")
    .select("*, licenses(count)")
    .order("created_at", { ascending: false });
  if (error) {
    const fallback = await db.from("clients").select("*").order("created_at", { ascending: false });
    if (fallback.error) throw fallback.error;
    data = fallback.data;
  }
  return data || [];
}

async function listLicenses() {
  const db = getSupabase();
  const { data, error } = await db
    .from("licenses")
    .select("*, clients(id, emri, tipi, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function createClient(body) {
  const db = getSupabase();
  const row = {
    emri: String(body.emri || "").trim(),
    adresa: String(body.adresa || "").trim(),
    telefoni: String(body.telefoni || "").trim(),
    email: String(body.email || "").trim(),
    tipi: body.tipi || "restorant",
  };
  if (!row.emri) throw new Error("Emri i klientit është i detyrueshëm.");

  const allowed = ["restorant", "kafene", "tjeter"];
  if (!allowed.includes(row.tipi)) {
    throw new Error(`Tipi i pavlefshëm: ${row.tipi}`);
  }

  const { data, error } = await db.from("clients").insert(row).select().single();
  if (error) {
    logRouteError("createClient", error, { row });
    throw error;
  }
  return data;
}

async function updateClient(id, body) {
  const db = getSupabase();
  const patch = {};
  if (body.emri != null) {
    patch.emri = String(body.emri).trim();
    if (!patch.emri) throw new Error("Emri i klientit është i detyrueshëm.");
  }
  if (body.tipi != null) {
    const allowed = ["restorant", "kafene", "tjeter"];
    if (!allowed.includes(body.tipi)) throw new Error(`Tipi i pavlefshëm: ${body.tipi}`);
    patch.tipi = body.tipi;
  }
  if (body.telefoni != null) patch.telefoni = String(body.telefoni).trim();
  if (body.email != null) patch.email = String(body.email).trim();
  if (body.adresa != null) patch.adresa = String(body.adresa).trim();

  const { data, error } = await db.from("clients").update(patch).eq("id", id).select().single();
  if (error) throw error;
  if (!data) throw new Error("Klienti nuk u gjet.");
  return data;
}

async function deleteClient(id) {
  const db = getSupabase();
  await db.from("users").delete().eq("client_id", id).eq("roli", "client_admin");
  const { error } = await db.from("clients").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}

async function createLicense(body) {
  const db = getSupabase();
  const months = Number(body.muaj) || 12;
  const start = body.data_fillimit || todayISO();
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + months);

  if (!body.client_id) throw new Error("client_id mungon.");

  let appType = body.app_type ? String(body.app_type).trim().toLowerCase() : "";
  const allowedApp = ["restorant", "kafene"];
  if (!allowedApp.includes(appType)) {
    const { data: client } = await db.from("clients").select("tipi").eq("id", body.client_id).maybeSingle();
    if (client?.tipi && allowedApp.includes(client.tipi)) {
      appType = client.tipi;
    } else {
      appType = "restorant";
    }
  }

  const row = {
    client_id: body.client_id,
    app_type: appType,
    celesi: normalizeKey(body.celesi) || generateLicenseKey(),
    device_id: String(body.device_id || "").trim().toUpperCase(),
    statusi: body.statusi || "aktive",
    data_fillimit: start,
    data_skadimit: body.data_skadimit || endDate.toISOString().slice(0, 10),
  };

  const { data, error } = await db.from("licenses").insert(row).select("*, clients(emri, tipi)").single();
  if (error) throw error;
  return data;
}

async function updateLicense(id, body) {
  const db = getSupabase();
  const patch = {};
  if (body.data_skadimit != null) patch.data_skadimit = String(body.data_skadimit).slice(0, 10);
  if (body.statusi != null) {
    const allowed = ["aktive", "skaduar", "revokuar", "pezulluar"];
    if (!allowed.includes(body.statusi)) throw new Error("Status i pavlefshëm.");
    patch.statusi = body.statusi;
  }
  if (body.device_id != null) {
    patch.device_id = String(body.device_id).trim().toUpperCase();
  }
  if (body.app_type != null) {
    const allowedApp = ["restorant", "kafene"];
    const appType = String(body.app_type).trim().toLowerCase();
    if (!allowedApp.includes(appType)) throw new Error(`Tipi i aplikacionit i pavlefshëm: ${body.app_type}`);
    patch.app_type = appType;
  }
  if (!Object.keys(patch).length) throw new Error("Nuk ka fusha për përditësim.");

  const { data, error } = await db.from("licenses").update(patch).eq("id", id).select("*, clients(emri, tipi)").single();
  if (error) throw error;
  if (!data) throw new Error("Liçenca nuk u gjet.");
  return data;
}

async function deleteLicense(id) {
  const db = getSupabase();
  const { error } = await db.from("licenses").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}

async function updateLicenseStatus(id, statusi) {
  const db = getSupabase();
  const { data, error } = await db
    .from("licenses")
    .update({ statusi })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function resetLicenseDevice(id) {
  const db = getSupabase();
  const patch = {
    device_id: "",
    device_hostname: "",
    last_ip: "",
    last_validation_error: "",
  };
  const { data, error } = await db
    .from("licenses")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    const { data: fallback, error: err2 } = await db
      .from("licenses")
      .update({ device_id: "" })
      .eq("id", id)
      .select()
      .single();
    if (err2) throw err2;
    return fallback;
  }
  return data;
}

async function findUserByEmail(email) {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("email", String(email).trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function verifyUserPassword(user, password) {
  if (!user?.passwordi) return false;
  return bcrypt.compare(password, user.passwordi);
}

async function ensureSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || "admin@revolutioninvest.com").toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  const password = process.env.SUPER_ADMIN_PASSWORD || "Revolution2026!";
  const hash = await bcrypt.hash(password, 12);
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .insert({
      client_id: null,
      emri: process.env.SUPER_ADMIN_NAME || "Super Admin",
      email,
      passwordi: hash,
      roli: "super_admin",
      aktiv: true,
    })
    .select()
    .single();

  if (error) throw error;
  console.log(`  👤 Super Admin u krijua: ${email}`);
  return data;
}

async function getDashboardStats() {
  const db = getSupabase();
  const [clients, licenses] = await Promise.all([
    db.from("clients").select("id", { count: "exact", head: true }),
    db.from("licenses").select("id, statusi"),
  ]);
  const lic = licenses.data || [];
  return {
    clients_total: clients.count || 0,
    licenses_total: lic.length,
    licenses_active: lic.filter(l => l.statusi === "aktive").length,
    licenses_expired: lic.filter(l => l.statusi === "skaduar").length,
    licenses_revoked: lic.filter(l => l.statusi === "revokuar").length,
  };
}

module.exports = {
  normalizeKey,
  generateLicenseKey,
  validateLicense,
  listClients,
  listLicenses,
  createClient,
  updateClient,
  deleteClient,
  createLicense,
  updateLicense,
  deleteLicense,
  updateLicenseStatus,
  resetLicenseDevice,
  findUserByEmail,
  verifyUserPassword,
  ensureSuperAdmin,
  getDashboardStats,
};
