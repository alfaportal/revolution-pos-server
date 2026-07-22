/**
 * Kërkesë publike për link Setup (email / SMS) — me rate-limit.
 */
const {
  createSetupDownloadToken,
  isSetupDownloadConfigured,
} = require("../lib/setupDownloadAuth");
const { getPublicAppOrigin, getSetupVersion } = require("../lib/publicOrigin");
const { deliverEmail, isEmailConfigured } = require("./emailService");
const { sendSms, isSmsConfigured, normalizePhone } = require("./smsService");

const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_MAX = 5;
const DEST_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEST_MAX = 5;
const TOKEN_TTL_HOURS = 72;

/** @type {Map<string, number[]>} */
const hitsByKey = new Map();

function prune(timestamps, windowMs) {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

function allowHit(key, windowMs, max) {
  const prev = prune(hitsByKey.get(key) || [], windowMs);
  if (prev.length >= max) {
    hitsByKey.set(key, prev);
    return false;
  }
  prev.push(Date.now());
  hitsByKey.set(key, prev);
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function buildSetupUrl(plan = "") {
  const token = createSetupDownloadToken({ ttlHours: TOKEN_TTL_HOURS, plan });
  const origin = getPublicAppOrigin();
  const qs = new URLSearchParams({ t: token });
  if (plan) qs.set("plan", String(plan).toLowerCase());
  return `${origin}/api/public/setup-download?${qs.toString()}`;
}

async function sendSetupLinkEmail({ to, url, lang = "sq" }) {
  const version = getSetupVersion();
  const en = lang === "en";
  const subject = en
    ? `Official Revolution POS Setup download (v${version})`
    : `Link zyrtar Setup Revolution POS (v${version})`;
  const text = en
    ? [
        "Your official protected Setup download link:",
        "",
        url,
        "",
        `Version: v${version}`,
        `Expires in about ${TOKEN_TTL_HOURS} hours.`,
        "",
        "Do not share this link publicly. Download only on your PC.",
      ].join("\n")
    : [
        "Linku juaj zyrtar i mbrojtur për shkarkim Setup:",
        "",
        url,
        "",
        `Versioni: v${version}`,
        `Skadon për rreth ${TOKEN_TTL_HOURS} orë.`,
        "",
        "Mos e shpërndani publikisht. Shkarkoni vetëm në kompjuterin tuaj.",
      ].join("\n");
  const html = en
    ? `<p>Your official protected <strong>Setup</strong> download link:</p>
       <p><a href="${url}">Download Setup v${version}</a></p>
       <p style="color:#666;font-size:13px">Expires in about ${TOKEN_TTL_HOURS} hours. Do not share publicly.</p>`
    : `<p>Linku juaj zyrtar i mbrojtur për <strong>Setup</strong>:</p>
       <p><a href="${url}">Shkarko Setup v${version}</a></p>
       <p style="color:#666;font-size:13px">Skadon për rreth ${TOKEN_TTL_HOURS} orë. Mos e shpërndani publikisht.</p>`;
  return deliverEmail({ to, subject, text, html });
}

async function sendSetupLinkSms({ to, url, lang = "sq" }) {
  const version = getSetupVersion();
  const text =
    lang === "en"
      ? `Revolution POS Setup v${version}: ${url} (expires ~${TOKEN_TTL_HOURS}h)`
      : `Revolution POS Setup v${version}: ${url} (skadon ~${TOKEN_TTL_HOURS}h)`;
  return sendSms(to, text);
}

/**
 * @param {{ channel: 'email'|'sms', email?: string, phone?: string, plan?: string, lang?: string, ip?: string }} opts
 */
async function requestSetupLink(opts = {}) {
  const channel = String(opts.channel || "").toLowerCase();
  const lang = opts.lang === "en" ? "en" : "sq";
  const plan = String(opts.plan || "").trim().toLowerCase().slice(0, 8);
  const ip = String(opts.ip || "unknown").slice(0, 64);

  if (!isSetupDownloadConfigured()) {
    const err = new Error(
      lang === "en"
        ? "Setup download is not configured on the server."
        : "Shkarkimi i Setup nuk është i konfiguruar në server.",
    );
    err.code = "SETUP_SECRET_MISSING";
    throw err;
  }

  if (channel !== "email" && channel !== "sms") {
    const err = new Error(
      lang === "en" ? "Choose email or SMS." : "Zgjidhni email ose SMS.",
    );
    err.code = "BAD_CHANNEL";
    throw err;
  }

  if (!allowHit(`ip:${ip}`, IP_WINDOW_MS, IP_MAX)) {
    const err = new Error(
      lang === "en"
        ? "Too many requests from this network. Try again later."
        : "Shumë kërkesa nga kjo rrjetë. Provoni më vonë.",
    );
    err.code = "RATE_LIMIT";
    throw err;
  }

  const url = buildSetupUrl(plan);

  if (channel === "email") {
    if (!isEmailConfigured()) {
      const err = new Error(
        lang === "en"
          ? "Email is not available right now. Use SMS or WhatsApp."
          : "Emaili nuk është i disponueshëm tani. Përdorni SMS ose WhatsApp.",
      );
      err.code = "EMAIL_OFF";
      throw err;
    }
    const email = String(opts.email || "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      const err = new Error(
        lang === "en" ? "Enter a valid email." : "Vendosni një email të vlefshëm.",
      );
      err.code = "BAD_EMAIL";
      throw err;
    }
    if (!allowHit(`email:${email}`, DEST_WINDOW_MS, DEST_MAX)) {
      const err = new Error(
        lang === "en"
          ? "Too many emails to this address today. Try again tomorrow."
          : "Shumë email te kjo adresë sot. Provoni nesër.",
      );
      err.code = "RATE_LIMIT";
      throw err;
    }
    await sendSetupLinkEmail({ to: email, url, lang });
    return {
      ok: true,
      channel: "email",
      message:
        lang === "en"
          ? "Setup link sent to your email. Check inbox (and spam)."
          : "Linku i Setup u dërgua në email. Kontrolloni inbox (dhe spam).",
    };
  }

  if (!isSmsConfigured()) {
    const err = new Error(
      lang === "en"
        ? "SMS is not available right now. Use email or WhatsApp."
        : "SMS nuk është i disponueshëm tani. Përdorni email ose WhatsApp.",
    );
    err.code = "SMS_OFF";
    throw err;
  }
  const phone = normalizePhone(opts.phone);
  if (!phone || phone.length < 8) {
    const err = new Error(
      lang === "en"
        ? "Enter a valid phone number (e.g. +38348…)."
        : "Vendosni numër telefoni të vlefshëm (p.sh. +38348…).",
    );
    err.code = "BAD_PHONE";
    throw err;
  }
  if (!allowHit(`sms:${phone}`, DEST_WINDOW_MS, DEST_MAX)) {
    const err = new Error(
      lang === "en"
        ? "Too many SMS to this number today. Try again tomorrow."
        : "Shumë SMS te ky numër sot. Provoni nesër.",
    );
    err.code = "RATE_LIMIT";
    throw err;
  }
  await sendSetupLinkSms({ to: phone, url, lang });
  return {
    ok: true,
    channel: "sms",
    message:
      lang === "en"
        ? "Setup link sent by SMS."
        : "Linku i Setup u dërgua me SMS.",
  };
}

function setupLinkChannelsStatus() {
  return {
    email: isEmailConfigured(),
    sms: isSmsConfigured(),
    download_configured: isSetupDownloadConfigured(),
  };
}

module.exports = {
  requestSetupLink,
  setupLinkChannelsStatus,
  TOKEN_TTL_HOURS,
};
