/** Dërgim email transaksional (Resend). */

const DEFAULT_EMAIL_FROM = "Revolution POS <noreply@ketujemi.com>";
const { getPublicAppOrigin, getSupportPhone } = require("../lib/publicOrigin");

function resolveEmailFrom() {
  const raw = process.env.EMAIL_FROM?.trim();
  if (!raw) return DEFAULT_EMAIL_FROM;
  return raw.replace(/@revolutioninvest\.com/gi, "@ketujemi.com");
}

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function deliverEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    throw new Error(
      "Emaili nuk është i konfiguruar. Vendosni RESEND_API_KEY në Railway.",
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resolveEmailFrom(),
      to: [String(to).trim().toLowerCase()],
      subject,
      text,
      html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.message || data.error || `HTTP ${res.status}`;
    throw new Error(`Email send failed: ${detail}`);
  }
  return data;
}

async function sendOwnerPasswordResetEmail({ to, code }) {
  const origin = getPublicAppOrigin();
  const loginUrl = `${origin}/owner/login`;
  const subject = "Rivendos fjalëkalimin — Revolution POS";
  const text = [
    "Keni provuar të hyni në panelin e pronarit me fjalëkalim të gabuar.",
    "",
    `Kodi për fjalëkalim të ri: ${code}`,
    "",
    loginUrl,
    "",
    "Kodi skadon pas 15 minutash.",
    "Nëse nuk e keni kërkuar ju, injoroni këtë email.",
  ].join("\n");

  const html = `
    <p>Kodi për fjalëkalim të ri në <strong>Revolution POS</strong>:</p>
    <p style="font-size:22px;font-weight:bold;letter-spacing:4px;margin:16px 0">${code}</p>
    <p><a href="${loginUrl}">Hap hyrjen e pronarit</a> dhe vendosni kodin + fjalëkalimin e ri.</p>
    <p style="color:#666;font-size:13px">Skadon pas 15 minutash.</p>
  `;

  return deliverEmail({ to, subject, text, html });
}

function resolveSupportPhone() {
  return getSupportPhone();
}

function resolveAdminNotifyEmail() {
  return (
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    process.env.SUPER_ADMIN_NOTIFY_EMAIL?.trim() ||
    "novelto22@gmail.com"
  ).toLowerCase();
}

async function sendTrialExpiry7DayEmail({ to, clientName, expiryDate }) {
  const subject = "Pakoja juaj skadon së shpejti — Revolution Invest POS";
  const text = [
    clientName ? `Përshëndetje ${clientName},` : "Përshëndetje,",
    "",
    `Pakoja juaj skadon më ${expiryDate}. Kontaktoni Revolution Invest POS për të vazhduar.`,
    "",
    `Telefon: ${resolveSupportPhone()}`,
  ].join("\n");

  const html = `
    <p>${clientName ? `Përshëndetje <strong>${clientName}</strong>,` : "Përshëndetje,"}</p>
    <p>Pakoja juaj skadon më <strong>${expiryDate}</strong>.</p>
    <p>Kontaktoni <strong>Revolution Invest POS</strong> për të vazhduar shërbimin.</p>
    <p style="margin-top:16px">Telefon: <strong>${resolveSupportPhone()}</strong></p>
  `;

  return deliverEmail({ to, subject, text, html });
}

async function sendTrialExpiry1DayEmail({ to, clientName, expiryDate }) {
  const subject = "Kujtesë: pakoja skadon nesër — Revolution Invest POS";
  const text = [
    clientName ? `Përshëndetje ${clientName},` : "Përshëndetje,",
    "",
    `Pakoja juaj skadon më ${expiryDate} (nesër). Kontaktoni Revolution Invest POS për të vazhduar.`,
    "",
    `Telefon: ${resolveSupportPhone()}`,
  ].join("\n");

  const html = `
    <p>${clientName ? `Përshëndetje <strong>${clientName}</strong>,` : "Përshëndetje,"}</p>
    <p><strong>Kujtesë:</strong> pakoja juaj skadon më <strong>${expiryDate}</strong> (nesër).</p>
    <p>Kontaktoni <strong>Revolution Invest POS</strong> për të vazhduar.</p>
    <p style="margin-top:16px">Telefon: <strong>${resolveSupportPhone()}</strong></p>
  `;

  return deliverEmail({ to, subject, text, html });
}

async function sendTrialExpiredEmail({ to, clientName }) {
  const phone = resolveSupportPhone();
  const subject = "Pakoja juaj ka skaduar — Revolution Invest POS";
  const text = [
    clientName ? `Përshëndetje ${clientName},` : "Përshëndetje,",
    "",
    `Pakoja juaj ka skaduar. Kontaktoni ${phone}`,
  ].join("\n");

  const html = `
    <p>${clientName ? `Përshëndetje <strong>${clientName}</strong>,` : "Përshëndetje,"}</p>
    <p>Pakoja juaj <strong>ka skaduar</strong>.</p>
    <p>Kontaktoni <strong>${phone}</strong> për të riaktivizuar shërbimin.</p>
  `;

  return deliverEmail({ to, subject, text, html });
}

function escapeHtmlEmail(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendAdminTrialExpiryAlertEmail({ clients }) {
  const to = resolveAdminNotifyEmail();
  const rows = (clients || []).map(c => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #334155">${escapeHtmlEmail(c.client_name) || "—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #334155">${escapeHtmlEmail(c.phone) || "—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #334155">${escapeHtmlEmail(c.package_label) || "—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #334155">${escapeHtmlEmail(c.expiry_date) || "—"}</td>
    </tr>`).join("");

  const textLines = (clients || []).map(c =>
    `- ${c.client_name} | ${c.phone || "—"} | ${c.package_label} | skadon ${c.expiry_date}`,
  );

  const subject = `Trial skadon së shpejti — ${clients.length} klient(ë)`;
  const text = [
    "Klientët me trial që skadon për 7 ditë:",
    "",
    ...textLines,
  ].join("\n");

  const html = `
    <p>Klientët me <strong>trial që skadon për 7 ditë</strong>:</p>
    <table style="border-collapse:collapse;width:100%;max-width:640px;font-size:14px">
      <thead>
        <tr style="background:#1e293b;color:#e2e8f0">
          <th style="padding:8px;text-align:left">Klienti</th>
          <th style="padding:8px;text-align:left">Telefoni</th>
          <th style="padding:8px;text-align:left">Pakoja</th>
          <th style="padding:8px;text-align:left">Skadimi</th>
        </tr>
      </thead>
      <tbody>${rows || "<tr><td colspan=\"4\">—</td></tr>"}</tbody>
    </table>
  `;

  return deliverEmail({ to, subject, text, html });
}

async function sendOwnerInviteEmail({ to, emri, clientName, inviteUrl }) {
  const subject = "Ftesë — Paneli i pronarit Revolution POS";
  const text = [
    `Përshëndetje ${emri || ""},`.trim(),
    "",
    clientName ? `Jeni ftuar si pronar i ${clientName}.` : "Jeni ftuar si pronar në Revolution POS.",
    "",
    "Klikoni linkun për të vendosur fjalëkalimin dhe aktivizuar llogarinë:",
    inviteUrl,
    "",
    "Linku skadon pas 48 orësh.",
  ].join("\n");

  const html = `
    <p>Përshëndetje <strong>${emri || "pronar"}</strong>,</p>
    ${clientName ? `<p>Jeni ftuar si pronar i <strong>${clientName}</strong>.</p>` : ""}
    <p><a href="${inviteUrl}">Aktivizo llogarinë dhe vendos fjalëkalimin</a></p>
    <p style="color:#666;font-size:13px">Linku skadon pas 48 orësh.</p>
  `;

  return deliverEmail({ to, subject, text, html });
}

module.exports = {
  isEmailConfigured,
  resolveSupportPhone,
  resolveAdminNotifyEmail,
  sendOwnerPasswordResetEmail,
  sendOwnerInviteEmail,
  sendTrialExpiry7DayEmail,
  sendTrialExpiry1DayEmail,
  sendTrialExpiredEmail,
  sendAdminTrialExpiryAlertEmail,
};
