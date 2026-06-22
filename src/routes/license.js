const express = require("express");
const { licenseApiKeyOptional } = require("../middleware/auth");
const { validateLicense } = require("../services/licenseService");

const router = express.Router();

function clientIp(req) {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "";
}

/**
 * POST /api/v1/license/validate
 * Body: { celesi, device_id, app_type?, hostname? }
 * Headers (opsionale): x-api-key
 */
router.post("/validate", licenseApiKeyOptional, async (req, res) => {
  try {
    const { celesi, license_key, device_id, app_type, hostname } = req.body;
    const key = celesi || license_key;
    if (!key) {
      return res.status(400).json({ valid: false, gabim: "Mungon çelësi i licencës." });
    }

    const result = await validateLicense({
      celesi: key,
      device_id,
      app_type,
      hostname,
      client_ip: clientIp(req),
    });

    const status = result.valid ? 200 : 403;
    res.status(status).json(result);
  } catch (e) {
    res.status(500).json({ valid: false, gabim: e.message });
  }
});

/**
 * GET /api/v1/license/health — për POS të kontrollojë serverin
 */
router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "revolution-pos-license" });
});

module.exports = router;
