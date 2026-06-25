/** Dërgim email transaksional (Resend). */

function isEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim(),
  );
}

async function deliverEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    throw new Error(
      "Emaili nuk është i konfiguruar. Vendosni RESEND_API_KEY dhe EMAIL_FROM në Railway.",
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM.trim(),
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
  const origin = (process.env.PUBLIC_APP_ORIGIN || "https://earnest-success-production-9383.up.railway.app").replace(/\/$/, "");
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
  sendOwnerPasswordResetEmail,
  sendOwnerInviteEmail,
};
