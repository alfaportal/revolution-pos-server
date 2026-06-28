const express = require("express");
const { licenseApiKeyOptional } = require("../middleware/auth");
const { validateLicense, getLicenseAccessLinks } = require("../services/licenseService");
const { verifyMasterPin, verifyDailyEmergencyCode, getDailyEmergencyCode, isMasterPinConfigured } = require("../lib/emergencyPin");
const { logAdminActivity } = require("../services/activityLogService");

const router = express.Router();

function clientIp(req) {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "";
}

/**
 * POST /api/v1/license/validate
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
 * POST /api/v1/license/access-links — linket e plota për POS (kamarier, KDS, kiosk, website)
 */
router.post("/access-links", licenseApiKeyOptional, async (req, res) => {
  try {
    const { celesi, license_key, device_id, app_type, hostname } = req.body;
    const key = celesi || license_key;
    if (!key) {
      return res.status(400).json({ ok: false, valid: false, gabim: "Mungon çelësi i licencës." });
    }

    const result = await getLicenseAccessLinks({
      celesi: key,
      device_id,
      app_type,
      hostname,
      client_ip: clientIp(req),
    });

    const status = result.valid ? 200 : 403;
    res.status(status).json(result);
  } catch (e) {
    res.status(500).json({ ok: false, valid: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/heartbeat — POS kontrollon çdo ≤60s për bllokim / force logout
 */
router.post("/heartbeat", licenseApiKeyOptional, async (req, res) => {
  try {
    const { celesi, license_key, device_id, app_type, hostname } = req.body;
    const key = celesi || license_key;
    if (!key) {
      return res.status(400).json({ ok: false, valid: false, gabim: "Mungon çelësi i licencës." });
    }

    const result = await validateLicense({
      celesi: key,
      device_id,
      app_type,
      hostname,
      client_ip: clientIp(req),
    });

    res.status(result.valid ? 200 : 403).json({
      ok: result.valid,
      ...result,
      server_time: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ ok: false, valid: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/emergency-unlock — Master PIN (online) ose kod ditor (offline backup)
 * Body: { master_pin?, emergency_code?, device_id, app_type?, hostname? }
 */
router.post("/emergency-unlock", licenseApiKeyOptional, async (req, res) => {
  try {
    const { master_pin, emergency_code, device_id, app_type, hostname } = req.body;
    const pinOk = verifyMasterPin(master_pin);
    const codeInput = String(emergency_code || "").trim() || String(master_pin || "").trim();
    const codeOk = verifyDailyEmergencyCode(codeInput);

    if (!pinOk && !codeOk) {
      return res.status(403).json({
        valid: false,
        code: "EMERGENCY_DENIED",
        message: "PIN ose kodi emergjence i gabuar.",
      });
    }

    if (!isMasterPinConfigured() && !codeOk) {
      return res.status(503).json({
        valid: false,
        code: "NOT_CONFIGURED",
        message: "MASTER_EMERGENCY_PIN nuk është konfiguruar në server.",
      });
    }

    await logAdminActivity({
      actorEmail: "emergency@pos",
      action: pinOk ? "emergency_unlock_pin" : "emergency_unlock_code",
      targetType: "device",
      targetId: String(device_id || "").trim().toUpperCase(),
      targetLabel: hostname || "",
      details: { app_type: app_type || null, method: pinOk ? "pin" : "daily_code" },
    });

    const until = new Date();
    until.setHours(23, 59, 59, 999);

    res.json({
      valid: true,
      emergency: true,
      message: "Hapje emergjence e autorizuar.",
      valid_until: until.toISOString(),
      device_id: String(device_id || "").trim().toUpperCase(),
    });
  } catch (e) {
    res.status(500).json({ valid: false, gabim: e.message });
  }
});

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "revolution-pos-license",
    emergency_pin_configured: isMasterPinConfigured(),
    daily_emergency_code: isMasterPinConfigured() ? getDailyEmergencyCode() : null,
  });
});

module.exports = router;
