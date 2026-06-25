const { randomInt } = require("crypto");
const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");
const { findUserByEmail } = require("./licenseService");
const { isEmailConfigured, sendOwnerPasswordResetEmail } = require("./emailService");

/** Pas kaq përpjekjeve të gabuara → kod rivendosjeje në email. */
const FAIL_THRESHOLD = 2;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const CHALLENGE_TTL_MS = 15 * 60 * 1000;
const MIN_PASSWORD = 6;

const failCounts = new Map();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sixDigitCode() {
  return String(randomInt(100_000, 1_000_000));
}

function incrementFailCount(email) {
  const key = normalizeEmail(email);
  const now = Date.now();
  const row = failCounts.get(key);
  if (!row || row.expiresAt < now) {
    failCounts.set(key, { count: 1, expiresAt: now + FAIL_WINDOW_MS });
    return 1;
  }
  row.count += 1;
  return row.count;
}

function clearFailCount(email) {
  failCounts.delete(normalizeEmail(email));
}

function isResettableOwner(user) {
  return (
    user &&
    user.roli === "client_admin" &&
    user.passwordi &&
    user.aktiv !== false &&
    user.client_id
  );
}

async function storeResetChallenge(email, codeHash) {
  const db = getSupabase();
  const e = normalizeEmail(email);
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();

  await db.from("owner_password_resets").delete().eq("email", e);

  const { error } = await db.from("owner_password_resets").insert({
    email: e,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(
      "Tabela owner_password_resets mungon. Ekzekutoni supabase/migrations/008_owner_password_reset.sql",
    );
  }
}

async function sendOwnerResetChallenge(email) {
  if (!isEmailConfigured()) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }
  const code = sixDigitCode();
  const codeHash = await bcrypt.hash(code, 10);
  await storeResetChallenge(email, codeHash);
  await sendOwnerPasswordResetEmail({ to: email, code });
}

async function handleOwnerWrongPassword(user, email) {
  const failCount = incrementFailCount(email);
  const remaining = FAIL_THRESHOLD - failCount;

  if (failCount >= FAIL_THRESHOLD && isResettableOwner(user) && isEmailConfigured()) {
    try {
      await sendOwnerResetChallenge(email);
      return {
        gabim: "Fjalëkalim i gabuar. Ta dërguam një kod për rivendosje fjalëkalimi në email.",
        code: "PASSWORD_RESET_SENT",
        fail_count: failCount,
        password_reset_sent: true,
      };
    } catch (err) {
      console.error("[owner-login] reset email failed:", err.message);
    }
  }

  const message =
    remaining > 0
      ? `Fjalëkalim i gabuar. Pas ${remaining} përpjekje${remaining === 1 ? "je" : "sh"} të tjera do ta dërgojmë kodin e rivendosjes në email.`
      : "Fjalëkalim i gabuar.";

  return {
    gabim: message,
    code: "INVALID_CREDENTIALS",
    fail_count: failCount,
  };
}

async function requestOwnerPasswordReset(email) {
  const e = normalizeEmail(email);
  if (!e) throw new Error("Email i detyrueshëm.");

  const generic = {
    ok: true,
    message: "Nëse ky email është i regjistruar, do të marrësh një kod.",
  };

  const user = await findUserByEmail(e);
  if (!isResettableOwner(user)) return generic;

  if (!isEmailConfigured()) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  await sendOwnerResetChallenge(e);
  return generic;
}

async function completeOwnerPasswordReset(email, code, newPassword) {
  const e = normalizeEmail(email);
  const c = String(code || "").trim();
  const pw = String(newPassword || "").trim();

  if (!e || c.length < 4 || pw.length < MIN_PASSWORD) {
    throw new Error(`Email, kodi dhe fjalëkalimi i ri (min ${MIN_PASSWORD} karaktere) kërkohen.`);
  }

  const user = await findUserByEmail(e);
  if (!isResettableOwner(user)) {
    throw new Error("Llogaria nuk u gjet ose nuk është e aktivizuar.");
  }

  const db = getSupabase();
  const nowIso = new Date().toISOString();

  const { data: challenge, error: findErr } = await db
    .from("owner_password_resets")
    .select("*")
    .eq("email", e)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findErr) throw findErr;
  if (!challenge) {
    const err = new Error("Kodi ka skaduar. Kërkoni kod të ri.");
    err.code = "CODE_EXPIRED";
    throw err;
  }

  const ok = await bcrypt.compare(c, challenge.code_hash);
  if (!ok) {
    const err = new Error("Kodi është i gabuar. Provo përsëri.");
    err.code = "INVALID_CODE";
    throw err;
  }

  const hash = await bcrypt.hash(pw, 12);
  const { error: updErr } = await db
    .from("users")
    .update({
      passwordi: hash,
      password_set_at: nowIso,
    })
    .eq("id", user.id);

  if (updErr) throw updErr;

  await db.from("owner_password_resets").delete().eq("email", e);
  clearFailCount(e);

  return user;
}

module.exports = {
  FAIL_THRESHOLD,
  MIN_PASSWORD,
  clearFailCount,
  handleOwnerWrongPassword,
  requestOwnerPasswordReset,
  completeOwnerPasswordReset,
  isEmailConfigured,
};
