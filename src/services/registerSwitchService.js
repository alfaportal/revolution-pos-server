const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");
const { notifyVenueSettingsUpdate } = require("./kdsEvents");

const REGISTER_CODE_RE = /^\d{4,6}$/;

function assertRegisterCode(code) {
  const c = String(code || "").trim();
  if (!REGISTER_CODE_RE.test(c)) {
    throw new Error("Kodi duhet të jetë 4–6 shifra.");
  }
  return c;
}

function normalizeCouponType(raw) {
  return String(raw || "thermal").trim().toLowerCase() === "fiscal" ? "fiscal" : "thermal";
}

async function hashRegisterCode(code) {
  return bcrypt.hash(assertRegisterCode(code), 10);
}

async function codeMatches(code, hash) {
  if (!hash) return false;
  try {
    return bcrypt.compare(assertRegisterCode(code), hash);
  } catch {
    return false;
  }
}

async function loadRegisterRow(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_settings")
    .select(
      "register_code_fiscal_hash, register_code_thermal_hash, active_coupon_type, register_mode_updated_at",
    )
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data || {};
}

async function getRegisterSwitchState(clientId) {
  const row = await loadRegisterRow(clientId);
  const fiscalHash = String(row.register_code_fiscal_hash || "").trim();
  const thermalHash = String(row.register_code_thermal_hash || "").trim();
  return {
    active_coupon_type: normalizeCouponType(row.active_coupon_type),
    codes_configured: Boolean(fiscalHash && thermalHash),
    register_mode_updated_at: row.register_mode_updated_at || null,
  };
}

async function setRegisterCodes(clientId, body = {}) {
  const fiscalRaw = body.fiscal_code != null ? String(body.fiscal_code).trim() : null;
  const thermalRaw = body.thermal_code != null ? String(body.thermal_code).trim() : null;

  if (fiscalRaw == null && thermalRaw == null) {
    throw new Error("Jepni të paktën një kod.");
  }

  const row = await loadRegisterRow(clientId);
  const patch = {};
  const now = new Date().toISOString();

  if (fiscalRaw != null && fiscalRaw !== "") {
    patch.register_code_fiscal_hash = await hashRegisterCode(fiscalRaw);
  }
  if (thermalRaw != null && thermalRaw !== "") {
    patch.register_code_thermal_hash = await hashRegisterCode(thermalRaw);
  }

  const nextFiscal = patch.register_code_fiscal_hash || row.register_code_fiscal_hash;
  const nextThermal = patch.register_code_thermal_hash || row.register_code_thermal_hash;
  if (nextFiscal && nextThermal) {
    const sameFiscal = fiscalRaw != null && fiscalRaw !== ""
      ? assertRegisterCode(fiscalRaw)
      : null;
    const sameThermal = thermalRaw != null && thermalRaw !== ""
      ? assertRegisterCode(thermalRaw)
      : null;
    if (sameFiscal && sameThermal && sameFiscal === sameThermal) {
      throw new Error("Kodet fiskale dhe termike duhet të jenë të ndryshme.");
    }
    if (sameFiscal && !sameThermal && await codeMatches(sameFiscal, nextThermal)) {
      throw new Error("Kodet fiskale dhe termike duhet të jenë të ndryshme.");
    }
    if (sameThermal && !sameFiscal && await codeMatches(sameThermal, nextFiscal)) {
      throw new Error("Kodet fiskale dhe termike duhet të jenë të ndryshme.");
    }
  }

  patch.register_mode_updated_at = now;

  const db = getSupabase();
  const { data, error } = await db
    .from("pos_settings")
    .upsert({ client_id: clientId, ...patch }, { onConflict: "client_id" })
    .select(
      "register_code_fiscal_hash, register_code_thermal_hash, active_coupon_type, register_mode_updated_at",
    )
    .single();
  if (error) throw error;

  const state = {
    active_coupon_type: normalizeCouponType(data.active_coupon_type),
    codes_configured: Boolean(data.register_code_fiscal_hash && data.register_code_thermal_hash),
    register_mode_updated_at: data.register_mode_updated_at || now,
  };

  notifyVenueSettingsUpdate(clientId, {
    type: "register_mode_changed",
    active_coupon_type: state.active_coupon_type,
    codes_configured: state.codes_configured,
  });

  return state;
}

async function applyRegisterCode(clientId, code) {
  const row = await loadRegisterRow(clientId);
  const fiscalHash = String(row.register_code_fiscal_hash || "").trim();
  const thermalHash = String(row.register_code_thermal_hash || "").trim();
  if (!fiscalHash || !thermalHash) {
    return { ok: false, matched: false };
  }

  const raw = String(code || "").trim();
  if (!REGISTER_CODE_RE.test(raw)) {
    return { ok: false, matched: false };
  }

  let nextMode = null;
  if (await codeMatches(raw, fiscalHash)) nextMode = "fiscal";
  else if (await codeMatches(raw, thermalHash)) nextMode = "thermal";
  else return { ok: false, matched: false };

  const now = new Date().toISOString();
  const db = getSupabase();
  const { error } = await db
    .from("pos_settings")
    .update({
      active_coupon_type: nextMode,
      register_mode_updated_at: now,
    })
    .eq("client_id", clientId);
  if (error) throw error;

  notifyVenueSettingsUpdate(clientId, {
    type: "register_mode_changed",
    active_coupon_type: nextMode,
    codes_configured: true,
  });

  return { ok: true, matched: true };
}

module.exports = {
  getRegisterSwitchState,
  setRegisterCodes,
  applyRegisterCode,
  normalizeCouponType,
};
