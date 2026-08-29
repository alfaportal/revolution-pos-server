const { getSupabase } = require("../db");
const { daysUntilTrialEnd, formatTrialDateSq } = require("../lib/trialDates");
const {
  isEmailConfigured,
  sendLicenseExpiry7DayEmail,
  sendLicenseExpiredEmail,
  sendOwnerPackageChangedEmail,
  sendOwnerLicenseRevokedEmail,
} = require("./emailService");

const LICENSE_SELECT =
  "id, client_id, data_skadimit, statusi, trial_ends_at, clients(id, emri, telefoni, email, package_tier)";

async function resolveOwnerEmail(clientId, clientRow) {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("email")
    .eq("client_id", clientId)
    .in("roli", ["client_admin", "owner", "pronari"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const ownerEmail = String(data?.email || "").trim().toLowerCase();
  if (ownerEmail) return ownerEmail;
  return String(clientRow?.email || "").trim().toLowerCase() || null;
}

async function fetchSentNotificationKeys(licenseIds) {
  if (!licenseIds.length) return new Set();
  const db = getSupabase();
  const { data, error } = await db
    .from("license_email_notifications")
    .select("license_id, kind, expiry_date")
    .in("license_id", licenseIds);
  if (error) {
    if (/license_email_notifications/i.test(String(error.message || ""))) {
      return new Set();
    }
    throw error;
  }
  const keys = new Set();
  for (const row of data || []) {
    keys.add(`${row.license_id}:${row.kind}:${row.expiry_date}`);
  }
  return keys;
}

async function recordLicenseEmailNotification(licenseId, kind, expiryDate) {
  const db = getSupabase();
  const { error } = await db.from("license_email_notifications").upsert(
    {
      license_id: licenseId,
      kind,
      expiry_date: expiryDate,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "license_id,kind,expiry_date" },
  );
  if (error && !/license_email_notifications/i.test(String(error.message || ""))) {
    throw error;
  }
}

async function fetchAnnualLicenses() {
  const db = getSupabase();
  const { data, error } = await db
    .from("licenses")
    .select(LICENSE_SELECT)
    .not("data_skadimit", "is", null)
    .neq("statusi", "revokuar")
    .order("data_skadimit", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function processLicenseOwnerNotifications() {
  if (!isEmailConfigured()) {
    console.log("[cron] licenseOwnerNotifications: RESEND_API_KEY mungon — anashkalohet.");
    return { skipped: true, reason: "email_not_configured" };
  }

  const licenses = await fetchAnnualLicenses();
  if (!licenses.length) {
    return { processed: 0, sent: {} };
  }

  const sentKeys = await fetchSentNotificationKeys(licenses.map((l) => l.id));
  const stats = { expiry_7d: 0, expired: 0, errors: 0 };

  for (const license of licenses) {
    if (license.trial_ends_at) {
      const trialDays = daysUntilTrialEnd(license.trial_ends_at);
      if (trialDays != null && trialDays >= 0) continue;
    }

    const expiryRaw = String(license.data_skadimit || "").slice(0, 10);
    if (!expiryRaw) continue;

    const days = daysUntilTrialEnd(expiryRaw);
    if (days == null) continue;

    const client = license.clients || {};
    const clientName = client.emri || "";
    const expiryDate = formatTrialDateSq(expiryRaw);
    const ownerEmail = await resolveOwnerEmail(license.client_id, client);
    if (!ownerEmail) continue;

    const key7d = `${license.id}:expiry_7d:${expiryRaw}`;
    const keyExpired = `${license.id}:expired:${expiryRaw}`;

    try {
      if (days === 7 && !sentKeys.has(key7d)) {
        await sendLicenseExpiry7DayEmail({ to: ownerEmail, clientName, expiryDate });
        await recordLicenseEmailNotification(license.id, "expiry_7d", expiryRaw);
        sentKeys.add(key7d);
        stats.expiry_7d += 1;
      }

      if (days <= 0 && !sentKeys.has(keyExpired)) {
        await sendLicenseExpiredEmail({ to: ownerEmail, clientName });
        await recordLicenseEmailNotification(license.id, "expired", expiryRaw);
        sentKeys.add(keyExpired);
        stats.expired += 1;
      }
    } catch (err) {
      stats.errors += 1;
      console.error(
        `[cron] licenseOwnerNotifications license ${license.id}:`,
        err.message || err,
      );
    }
  }

  const total = stats.expiry_7d + stats.expired;
  if (total) {
    console.log(
      `[cron] licenseOwnerNotifications: expiry_7d=${stats.expiry_7d} expired=${stats.expired}`,
    );
  }

  return { processed: licenses.length, sent: stats };
}

async function notifyOwnerPackageChanged({ clientId, clientName, oldTier, newTier }) {
  if (!isEmailConfigured()) return { skipped: true, reason: "email_not_configured" };
  const db = getSupabase();
  const { data: client } = await db
    .from("clients")
    .select("emri, email")
    .eq("id", clientId)
    .maybeSingle();
  const name = clientName || client?.emri || "";
  const to = await resolveOwnerEmail(clientId, client);
  if (!to) return { skipped: true, reason: "no_owner_email" };
  await sendOwnerPackageChangedEmail({
    to,
    clientName: name,
    oldTier,
    newTier,
  });
  return { ok: true, emailed: true };
}

async function notifyOwnerLicenseRevoked(licenseId) {
  if (!isEmailConfigured()) return { skipped: true, reason: "email_not_configured" };
  const db = getSupabase();
  const { data: license, error } = await db
    .from("licenses")
    .select("id, client_id, clients(emri, email)")
    .eq("id", licenseId)
    .maybeSingle();
  if (error) throw error;
  if (!license) return { skipped: true, reason: "license_not_found" };

  const client = license.clients || {};
  const to = await resolveOwnerEmail(license.client_id, client);
  if (!to) return { skipped: true, reason: "no_owner_email" };

  await sendOwnerLicenseRevokedEmail({
    to,
    clientName: client.emri || "",
  });
  return { ok: true, emailed: true };
}

module.exports = {
  processLicenseOwnerNotifications,
  notifyOwnerPackageChanged,
  notifyOwnerLicenseRevoked,
  resolveOwnerEmail,
};
