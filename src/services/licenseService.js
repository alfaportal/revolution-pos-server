const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../db");
const { formatError, logRouteError } = require("../lib/errors");
const { normalizePackageTier } = require("../lib/packages");
const { generateKitchenKey, generateKitchenSlug } = require("../lib/kitchenAccess");
const { todayISO, isExpired, addMonthsISO, addMonthsTimestamp } = require("../lib/licenseDates");
const { isLicenseUsable } = require("../lib/licenseEnforcement");

function normalizeKey(key) {
  const raw = String(key || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(raw)) return raw;

  const parts = raw.split(/[^A-Z0-9]+/).filter(Boolean);
  if (parts.length === 5 && parts[0] === parts[1] && parts.every(p => p.length === 4)) {
    return [parts[0], parts[2], parts[3], parts[4]].join("-");
  }
  if (parts.length === 4 && parts.every(p => p.length === 4)) return parts.join("-");

  const alnum = raw.replace(/[^A-Z0-9]/g, "");
  if (alnum.length === 16) return alnum.match(/.{1,4}/g).join("-");
  if (alnum.length >= 20) {
    const groups = alnum.match(/.{1,4}/g) || [];
    if (groups.length === 5 && groups[0] === groups[1]) {
      return [groups[0], groups[2], groups[3], groups[4]].join("-");
    }
  }
  return raw;
}

function compactKey(key) {
  return normalizeKey(key).replace(/-/g, "");
}

/** Shkronja të ngatërruara shpesh në çelësin e licencës (0/O, 1/I, …). */
function charsEquivalent(a, b) {
  if (a === b) return true;
  const pairs = [
    ["O", "0"],
    ["0", "O"],
    ["I", "1"],
    ["1", "I"],
    ["S", "5"],
    ["5", "S"],
  ];
  return pairs.some(([x, y]) => a === x && b === y);
}

function licenseKeysEquivalent(a, b) {
  const na = normalizeKey(a);
  const nb = normalizeKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (compactKey(na) === compactKey(nb)) return true;
  const sa = na.split("-");
  const sb = nb.split("-");
  if (sa.length !== 4 || sb.length !== 4) return false;
  return sa.every((seg, i) => {
    if (seg.length !== sb[i].length) return false;
    return [...seg].every((ch, j) => charsEquivalent(ch, sb[i][j]));
  });
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

async function findLicenseByKey(celesi) {
  const db = getSupabase();
  const normalized = normalizeKey(celesi);
  if (!normalized) return null;

  const select = "*, clients(id, emri, adresa, telefoni, email, tipi, package_tier, kitchen_slug, kitchen_key)";

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

  const { data: allRows, error: allErr } = await db.from("licenses").select(select);
  if (allErr) throw allErr;
  const rows = allRows || [];

  const compact = compactKey(normalized);
  if (compact.length >= 8) {
    const exact = rows.find((row) => compactKey(row.celesi) === compact);
    if (exact) return exact;
  }

  const fuzzy = rows.filter((row) => licenseKeysEquivalent(normalized, row.celesi));
  if (fuzzy.length === 1) return fuzzy[0];

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
    return { valid: false, code: "NOT_FOUND", message: "Liçenca nuk u gjet. Kontrolloni çelësin (0 = numër, O = shkronjë)." };
  }

  const fail = async (code, message) => {
    await recordValidationFailure(license, code, message, client_ip);
    const forceLogout = ["REVOKED", "SUSPENDED", "EXPIRED", "DEVICE_MISMATCH"].includes(code);
    return { valid: false, code, message, force_logout: forceLogout };
  };

  if (license.statusi === "revokuar") {
    return fail("REVOKED", "Liçenca është revokuar.");
  }
  if (license.statusi === "pezulluar") {
    return fail("SUSPENDED", "Liçenca është pezulluar.");
  }

  const usable = isLicenseUsable(license);
  if (!usable.ok) {
    return fail(usable.code, usable.message);
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
    const stored = String(license.device_id || "").trim().toUpperCase();
    if (stored && stored !== deviceId) {
      return fail(
        "DEVICE_MISMATCH",
        "Liçenca është e lidhur me një pajisje tjetër. Kontaktoni administratorin për reset pajisje.",
      );
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
    trial_active: Boolean(license.trial_ends_at && new Date(license.trial_ends_at) > new Date()),
    trial_ends_at: license.trial_ends_at || null,
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
    package_tier: normalizePackageTier(body.package_tier),
    kitchen_slug: generateKitchenSlug(body.emri || "lokal"),
    kitchen_key: generateKitchenKey(),
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
  if (body.package_tier != null) patch.package_tier = normalizePackageTier(body.package_tier);

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

async function regenerateKitchenAccess(id) {
  const db = getSupabase();
  const { data: client, error: findErr } = await db.from("clients").select("*").eq("id", id).maybeSingle();
  if (findErr) throw findErr;
  if (!client) throw new Error("Klienti nuk u gjet.");

  const patch = {
    kitchen_slug: generateKitchenSlug(client.emri),
    kitchen_key: generateKitchenKey(),
  };

  const { data, error } = await db.from("clients").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

async function createLicense(body) {
  const db = getSupabase();
  const months = Number(body.muaj) || 12;
  const start = body.data_fillimit || todayISO();

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
    data_skadimit: body.data_skadimit || addMonthsISO(start, months),
    trial_ends_at: body.trial_ends_at || addMonthsTimestamp(start, 3),
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
    patch.device_id = String(body.device_id).trim().toUpperCase().replace(/\s+/g, "");
    patch.last_validation_error = "";
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
  const now = new Date().toISOString();
  const patch = { statusi, updated_at: now };

  if (statusi === "pezulluar" || statusi === "revokuar" || statusi === "skaduar") {
    patch.force_logout_at = now;
    patch.blocked_at = now;
  } else if (statusi === "aktive") {
    patch.blocked_at = null;
  }

  const { data, error } = await db
    .from("licenses")
    .update(patch)
    .eq("id", id)
    .select("*, clients(emri, tipi)")
    .single();
  if (error) throw error;
  return data;
}

async function blockLicense(id) {
  return updateLicenseStatus(id, "pezulluar");
}

async function unblockLicense(id) {
  return updateLicenseStatus(id, "aktive");
}

async function resetLicenseDevice(id) {
  const licenseId = String(id || "").trim();
  if (!licenseId) throw new Error("ID e liçencës mungon.");

  const db = getSupabase();
  const patch = {
    device_id: "",
    device_hostname: "",
    last_ip: "",
    last_validation_error: "",
    last_activated_at: null,
  };
  const { data, error } = await db
    .from("licenses")
    .update(patch)
    .eq("id", licenseId)
    .select("*, clients(emri, tipi)")
    .single();
  if (error) {
    const { data: fallback, error: err2 } = await db
      .from("licenses")
      .update({ device_id: "", last_validation_error: "" })
      .eq("id", licenseId)
      .select("*, clients(emri, tipi)")
      .single();
    if (err2) throw err2;
    if (!fallback) throw new Error("Liçenca nuk u gjet.");
    return fallback;
  }
  if (!data) throw new Error("Liçenca nuk u gjet.");
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

async function listLicensesForClient(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("licenses")
    .select(
      "id, celesi, device_id, device_hostname, statusi, app_type, data_fillimit, data_skadimit, last_activated_at, last_validation_error",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getOwnerLicenseView(clientId) {
  const licenses = await listLicensesForClient(clientId);
  const primary = licenses.find(l => l.statusi === "aktive") || licenses[0] || null;
  if (!primary) {
    return {
      activated: false,
      machine_id: "",
      has_license: false,
      license_key: "",
      message: "Nuk ka licencë për lokalin tuaj. Kontaktoni administratorin.",
    };
  }

  const expired = isExpired(primary.data_skadimit);
  const revoked = primary.statusi === "revokuar" || primary.statusi === "pezulluar";
  const deviceId = String(primary.device_id || "").trim().toUpperCase();
  const activated = primary.statusi === "aktive" && !expired && !revoked && !!deviceId;

  let message = "Licenca nuk është aktive.";
  if (revoked) message = primary.statusi === "revokuar" ? "Licenca është revokuar." : "Licenca është pezulluar.";
  else if (expired) message = "Licenca ka skaduar.";
  else if (!deviceId) message = "Vendosni çelësin në kompjuterin POS (Admin → Licenca). ID-ja shfaqet këtu pas aktivizimit.";
  else if (activated) message = "Licenca është aktive për pajisjen POS.";

  return {
    activated,
    machine_id: deviceId,
    has_license: true,
    license_key: primary.celesi,
    statusi: primary.statusi,
    app_type: primary.app_type,
    valid_until: primary.data_skadimit,
    last_activated_at: primary.last_activated_at,
    message,
  };
}

async function verifyOwnerLicenseKey(clientId, licenseKey) {
  const normalized = normalizeKey(licenseKey);
  if (!normalized) throw new Error("Shkruani çelësin e licencës.");
  const license = await findLicenseByKey(normalized);
  if (!license) throw new Error("Çelësi i licencës nuk u gjet.");
  if (license.client_id !== clientId) throw new Error("Ky çelës nuk i përket lokalit tuaj.");
  return getOwnerLicenseView(clientId);
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
  regenerateKitchenAccess,
  createLicense,
  updateLicense,
  deleteLicense,
  updateLicenseStatus,
  blockLicense,
  unblockLicense,
  resetLicenseDevice,
  findUserByEmail,
  verifyUserPassword,
  todayISO,
  isExpired,
  ensureSuperAdmin,
  getDashboardStats,
  listLicensesForClient,
  getOwnerLicenseView,
  verifyOwnerLicenseKey,
};
