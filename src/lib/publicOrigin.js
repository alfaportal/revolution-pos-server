/** URL publike e aplikacionit (domain prod) dhe kontakt mbështetjeje. */

const DEFAULT_PUBLIC_ORIGIN = "https://revolution-pos.com";
const DEFAULT_SUPPORT_PHONE = "+383 48707880";

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

function getPublicAppConfig() {
  return {
    public_origin: getPublicAppOrigin(),
    support_phone: getSupportPhone(),
    support_phone_digits: getSupportPhoneDigits(),
    support_email: process.env.SUPPORT_EMAIL?.trim() || "info@revolution-pos.com",
  };
}

module.exports = {
  DEFAULT_PUBLIC_ORIGIN,
  DEFAULT_SUPPORT_PHONE,
  getPublicAppOrigin,
  getSupportPhone,
  getSupportPhoneDigits,
  getPublicAppConfig,
};
