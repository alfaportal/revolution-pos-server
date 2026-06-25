const crypto = require("crypto");
const { todayISO } = require("./licenseDates");

function getMasterEmergencyPin() {
  return String(process.env.MASTER_EMERGENCY_PIN || "").trim();
}

function isMasterPinConfigured() {
  return getMasterEmergencyPin().length >= 4;
}

function verifyMasterPin(pin) {
  const expected = getMasterEmergencyPin();
  if (!expected) return false;
  const provided = String(pin || "").trim();
  if (!provided) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return expected === provided;
  }
}

/** Kodi ditor emergjence (6 shifra) — funksionon offline në POS me të njëjtin algoritëm. */
function getDailyEmergencyCode(dateStr = todayISO()) {
  const pin = getMasterEmergencyPin();
  if (!pin) return null;
  return crypto
    .createHmac("sha256", `rip-emergency-v1:${pin}`)
    .update(String(dateStr))
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
}

function verifyDailyEmergencyCode(code, dateStr = todayISO()) {
  const expected = getDailyEmergencyCode(dateStr);
  if (!expected) return false;
  const provided = String(code || "").trim().toUpperCase();
  if (!provided) return false;
  if (provided === expected) return true;
  const yesterday = new Date(dateStr);
  yesterday.setDate(yesterday.getDate() - 1);
  const prev = getDailyEmergencyCode(yesterday.toISOString().slice(0, 10));
  return prev && provided === prev;
}

module.exports = {
  getMasterEmergencyPin,
  isMasterPinConfigured,
  verifyMasterPin,
  getDailyEmergencyCode,
  verifyDailyEmergencyCode,
};
