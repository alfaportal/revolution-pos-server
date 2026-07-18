/**
 * Hardware LICENSE_KEY — i njëjti algoritëm si:
 *   KAFENE/tools/generate-license.js
 *   KAFENE/fiscal/license-guard.js (getSecretSalt)
 *
 * LICENSE_KEY = 16 char të para të SHA256(HARDWARE_ID + SECRET_SALT), XXXX-XXXX-XXXX-XXXX
 */
const crypto = require("crypto");

/** Duhet të përputhet me generate-license.js / license-guard.js */
const SECRET_SALT =
  process.env.KAFENE_HW_LICENSE_SALT || "KAFENE-HWLOCK-2026-NASER-9f4c2a7b";

function normalizeHardwareId(input) {
  return String(input || "")
    .replace(/[^a-fA-F0-9]/g, "")
    .toUpperCase()
    .slice(0, 16);
}

function formatGrouped16(raw16) {
  const hex = String(raw16 || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .padEnd(16, "0")
    .slice(0, 16);
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

/**
 * @param {string} hardwareIdInput — HARDWARE_ID nga ekrani i klientit (XXXX-XXXX-XXXX-XXXX)
 * @returns {string} LICENSE_KEY në format XXXX-XXXX-XXXX-XXXX
 */
function generateHardwareLicenseKey(hardwareIdInput) {
  const id = normalizeHardwareId(hardwareIdInput);
  if (id.length < 16) {
    throw new Error(
      "HARDWARE_ID duhet të ketë 16 karaktere hex (formati XXXX-XXXX-XXXX-XXXX).",
    );
  }
  const hash = crypto
    .createHash("sha256")
    .update(id + SECRET_SALT)
    .digest("hex")
    .toUpperCase();
  return formatGrouped16(hash.slice(0, 16));
}

module.exports = {
  SECRET_SALT,
  normalizeHardwareId,
  formatGrouped16,
  generateHardwareLicenseKey,
};
