const crypto = require("crypto");
const { trimEnv } = require("./env");

function trackSecret() {
  const secret =
    trimEnv("JWT_SECRET") ||
    trimEnv("KITCHEN_KEY_SECRET") ||
    trimEnv("SETUP_DOWNLOAD_SECRET");
  if (!secret || secret.length < 16) {
    throw new Error("Mungon sekreti i serverit për tracking porosish.");
  }
  return secret;
}

function issueOrderTrackToken(clientId, orderId) {
  const cid = String(clientId || "").trim();
  const oid = String(orderId || "").trim();
  if (!cid || !oid) return "";
  const payload = `${cid}:${oid}`;
  return crypto.createHmac("sha256", trackSecret()).update(payload).digest("hex").slice(0, 32);
}

function verifyOrderTrackToken(clientId, orderId, token) {
  const expect = issueOrderTrackToken(clientId, orderId);
  const got = String(token || "").trim();
  if (!expect || !got || expect.length !== got.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(got));
  } catch {
    return false;
  }
}

module.exports = {
  issueOrderTrackToken,
  verifyOrderTrackToken,
};
