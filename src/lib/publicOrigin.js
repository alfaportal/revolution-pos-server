/** URL publike e aplikacionit (domain prod) dhe kontakt mbështetjeje. */

const DEFAULT_PUBLIC_ORIGIN = "https://revolution-pos.com";
const DEFAULT_SUPPORT_PHONE = "+383 48707880";
const DEFAULT_SUPPORT_EMAIL = "revolutioninvest05@gmail.com";
/** Setup Windows — shkarkim i drejtpërdrejtë (pa Railway Variables). */
const DEFAULT_SETUP_DOWNLOAD_URL =
  "https://github.com/alfaportal/revolution-pos-server/releases/download/setup-v1.0.234/KAFENE-Setup.exe";
const DEFAULT_SETUP_VERSION = "1.0.234";

function getPublicAppOrigin() {
  const raw = process.env.PUBLIC_APP_ORIGIN?.trim();
  return (raw || DEFAULT_PUBLIC_ORIGIN).replace(/\/+$/, "");
}

function getSupportPhone() {
  // Numri zyrtar publik — mos lejo numër të vjetër nga env (p.sh. 44555294).
  const fromEnv = (
    process.env.SUPPORT_PHONE?.trim() ||
    process.env.TRIAL_SUPPORT_PHONE?.trim() ||
    ""
  );
  if (fromEnv && !fromEnv.replace(/\D/g, "").includes("44555294")) {
    return fromEnv;
  }
  return DEFAULT_SUPPORT_PHONE;
}

function getSupportPhoneDigits() {
  return getSupportPhone().replace(/\D/g, "");
}

function getSupportEmail() {
  const fromEnv = process.env.SUPPORT_EMAIL?.trim() || "";
  // Mos lejo email fiktiv info@revolution-pos.com
  if (fromEnv && !/info@revolution/i.test(fromEnv)) {
    return fromEnv;
  }
  return DEFAULT_SUPPORT_EMAIL;
}

/** URL për shkarkim Setup — njerëzit e marrin vetë nga webfaqja (default i gatshëm). */
function getSetupDownloadUrl(plan) {
  const fallback =
    process.env.SETUP_DOWNLOAD_URL?.trim() || DEFAULT_SETUP_DOWNLOAD_URL;
  const key = String(plan || "").toLowerCase();
  const byPlan = {
    p1:
      process.env.SETUP_DOWNLOAD_P1_URL?.trim() ||
      process.env.SETUP_DOWNLOAD_STANDARD_URL?.trim() ||
      fallback,
    p2:
      process.env.SETUP_DOWNLOAD_P2_URL?.trim() ||
      process.env.SETUP_DOWNLOAD_PRO_URL?.trim() ||
      fallback,
    p3:
      process.env.SETUP_DOWNLOAD_P3_URL?.trim() ||
      process.env.SETUP_DOWNLOAD_FULL_URL?.trim() ||
      fallback,
    p4:
      process.env.SETUP_DOWNLOAD_P4_URL?.trim() ||
      process.env.SETUP_DOWNLOAD_FULL_URL?.trim() ||
      fallback,
  };
  return byPlan[key] || fallback;
}

/** Versioni i Setup që shfaqet në webfaqe (p.sh. 1.0.231). */
function getSetupVersion() {
  const fromEnv = process.env.SETUP_VERSION?.trim();
  if (fromEnv) return fromEnv.replace(/^v/i, "");
  const url = getSetupDownloadUrl();
  const m = String(url).match(/setup-v?(\d+\.\d+\.\d+)/i) || String(url).match(/(\d+\.\d+\.\d+)/);
  return (m && m[1]) || DEFAULT_SETUP_VERSION;
}

function getPublicAppConfig() {
  const { isSetupDownloadConfigured } = require("./setupDownloadAuth");
  return {
    public_origin: getPublicAppOrigin(),
    support_phone: getSupportPhone(),
    support_phone_digits: getSupportPhoneDigits(),
    support_email: getSupportEmail(),
    setup_version: getSetupVersion(),
    setup_requires_token: true,
    setup_download_configured: isSetupDownloadConfigured(),
    /* URL direkte NUK ekspozohet publike — vetëm me token nga admin */
    setup_download_url: null,
    setup_downloads: null,
  };
}

module.exports = {
  DEFAULT_PUBLIC_ORIGIN,
  DEFAULT_SUPPORT_PHONE,
  DEFAULT_SUPPORT_EMAIL,
  DEFAULT_SETUP_DOWNLOAD_URL,
  DEFAULT_SETUP_VERSION,
  getPublicAppOrigin,
  getSupportPhone,
  getSupportPhoneDigits,
  getSupportEmail,
  getSetupDownloadUrl,
  getSetupVersion,
  getPublicAppConfig,
};
