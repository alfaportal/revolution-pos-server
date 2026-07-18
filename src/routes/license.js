const express = require("express");
const { licenseApiKeyOptional } = require("../middleware/auth");
const { validateLicense, getLicenseAccessLinks } = require("../services/licenseService");
const { verifyMasterPin, verifyDailyEmergencyCode, getDailyEmergencyCode, isMasterPinConfigured } = require("../lib/emergencyPin");
const { logAdminActivity } = require("../services/activityLogService");
const { verifyWaiterPin, listWaitersForOwner } = require("../services/waiterPinService");
const { getClientById } = require("../services/salesService");
const { getPublicAppOrigin } = require("../lib/publicOrigin");
const { ensureKitchenCredentials, enrichWaitersWithWebLinks } = require("../lib/kitchenAccess");
const { createKasaSessionToken } = require("../lib/kasaSession");
const {
  listOwnerReservations,
  createOwnerReservation,
  updateOwnerReservationStatus,
  getMaxTableNumber,
} = require("../services/reservationService");
const { acknowledgeBarOrders, cancelBarOrders } = require("../services/kdsService");
const {
  listPendingOnlineOrders,
  listBarMobileOrderedForPos,
  countPendingOnlineOrders,
  refusePendingOnlineOrder,
} = require("../services/onlineOrdersService");
const {
  listClosedWebWaiterSalesForPos,
  listAllClosedSalesForPosRebuild,
} = require("../services/salesService");

const router = express.Router();

function clientIp(req) {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "";
}

/** Licencë pa kontroll app_type — porositë online janë për klientin, jo për modulin POS. */
async function resolveLicenseClient(req) {
  const { celesi, license_key, device_id, hostname } = req.body;
  const key = celesi || license_key;
  if (!key) {
    return { error: { status: 400, body: { ok: false, gabim: "Mungon çelësi i licencës." } } };
  }

  const licenseResult = await validateLicense({
    celesi: key,
    device_id,
    hostname,
    client_ip: clientIp(req),
  });
  if (!licenseResult.valid) {
    return {
      error: {
        status: 403,
        body: { ok: false, gabim: licenseResult.message || "Liçenca nuk është aktive." },
      },
    };
  }
  return { clientId: licenseResult.client_id };
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
 * POST /api/v1/license/ack-factory-reset — POS konfirmon që e ka marrë urdhrin e rivendosjes
 */
router.post("/ack-factory-reset", licenseApiKeyOptional, async (req, res) => {
  try {
    const { celesi, license_key } = req.body || {};
    const key = celesi || license_key;
    if (!key) {
      return res.status(400).json({ ok: false, gabim: "Mungon çelësi i licencës." });
    }
    const { ackFactoryResetByKey } = require("../services/licenseService");
    const result = await ackFactoryResetByKey(key);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
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

/**
 * POST /api/v1/license/kasa-pin — PIN kamarieri (4 shifra) ose emergjencë
 */
router.post("/kasa-pin", licenseApiKeyOptional, async (req, res) => {
  try {
    const { celesi, license_key, device_id, app_type, hostname, pin } = req.body;
    const key = celesi || license_key;
    const pinStr = String(pin || "").trim();
    if (!key) {
      return res.status(400).json({ valid: false, gabim: "Mungon çelësi i licencës." });
    }
    if (!pinStr) {
      return res.status(400).json({ valid: false, gabim: "Vendosni PIN-in." });
    }

    const licenseResult = await validateLicense({
      celesi: key,
      device_id,
      app_type,
      hostname,
      client_ip: clientIp(req),
    });
    if (!licenseResult.valid) {
      return res.status(403).json({
        valid: false,
        gabim: licenseResult.message || "Liçenca nuk është aktive.",
      });
    }

    const clientId = licenseResult.client_id;
    if (/^\d{4}$/.test(pinStr)) {
      try {
        const waiter = await verifyWaiterPin(clientId, pinStr);
        return res.json({
          valid: true,
          role: "waiter",
          waiter,
          session_token: createKasaSessionToken(clientId, waiter.id),
        });
      } catch {
        /* vazhdo te emergjenca */
      }
    }

    const pinOk = verifyMasterPin(pinStr);
    const codeOk = verifyDailyEmergencyCode(pinStr.replace(/\D/g, ""));
    if (pinOk || codeOk) {
      return res.json({
        valid: true,
        role: "admin",
        message: "Hapje e autorizuar.",
      });
    }

    return res.status(403).json({ valid: false, gabim: "PIN i gabuar." });
  } catch (e) {
    res.status(500).json({ valid: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/waiters-list — kamarierët me PIN për kasën desktop
 */
router.post("/waiters-list", licenseApiKeyOptional, async (req, res) => {
  try {
    const { celesi, license_key, device_id, app_type, hostname } = req.body;
    const key = celesi || license_key;
    if (!key) {
      return res.status(400).json({ ok: false, gabim: "Mungon çelësi i licencës." });
    }

    const licenseResult = await validateLicense({
      celesi: key,
      device_id,
      app_type,
      hostname,
      client_ip: clientIp(req),
    });
    if (!licenseResult.valid) {
      return res.status(403).json({
        ok: false,
        gabim: licenseResult.message || "Liçenca nuk është aktive.",
      });
    }

    const waiters = await listWaitersForOwner(licenseResult.client_id);
    let client = await getClientById(licenseResult.client_id);
    if (client) client = await ensureKitchenCredentials(client);
    const base = getPublicAppOrigin();
    const active = (waiters || []).filter(w => w.active !== false && w.has_pin);
    res.json({
      ok: true,
      waiters: enrichWaitersWithWebLinks(base, client, active),
    });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/waiter-login — PIN + (ops.) id kamarieri
 */
router.post("/waiter-login", licenseApiKeyOptional, async (req, res) => {
  try {
    const { celesi, license_key, device_id, app_type, hostname, pin, waiter_id, staff_id } = req.body;
    const key = celesi || license_key;
    const pinStr = String(pin || "").trim();
    const wantedId = String(waiter_id || staff_id || "").trim();
    if (!key) {
      return res.status(400).json({ ok: false, gabim: "Mungon çelësi i licencës." });
    }
    if (!/^\d{4}$/.test(pinStr)) {
      return res.status(400).json({ ok: false, gabim: "PIN duhet të jetë 4 shifra." });
    }

    const licenseResult = await validateLicense({
      celesi: key,
      device_id,
      app_type,
      hostname,
      client_ip: clientIp(req),
    });
    if (!licenseResult.valid) {
      return res.status(403).json({
        ok: false,
        gabim: licenseResult.message || "Liçenca nuk është aktive.",
      });
    }

    const waiter = await verifyWaiterPin(licenseResult.client_id, pinStr);
    if (wantedId && String(waiter.id) !== wantedId) {
      return res.status(403).json({ ok: false, gabim: "PIN i gabuar." });
    }

    res.json({ ok: true, valid: true, role: "waiter", waiter });
  } catch (e) {
    res.status(403).json({ ok: false, gabim: e.message || "PIN i gabuar." });
  }
});

/**
 * POST /api/v1/license/waiter-closed-sales — porosi WEB-WAITER të mbyllura (sync pazari lokal)
 */
router.post("/waiter-closed-sales", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }
    const rebuild = req.body.rebuild === true || req.body.rebuild === "true";
    const since = String(req.body.since || req.body.closed_after || "").trim();
    const sales = rebuild
      ? await listAllClosedSalesForPosRebuild(resolved.clientId)
      : await listClosedWebWaiterSalesForPos(resolved.clientId, since);
    console.log(
      "[license/waiter-closed-sales] client=",
      resolved.clientId,
      rebuild ? "rebuild=all-closed" : `since=${since || "(all)"}`,
      "count=",
      sales.length,
    );
    res.json({ ok: true, sales, count: sales.length });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/pending-online-orders — numri i porosive kiosk/online
 */
router.post("/pending-online-orders", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }

    const pending = await countPendingOnlineOrders(resolved.clientId);
    res.json({ ok: true, pending, has_pending: pending > 0 });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/online-orders — listë porosish banak (për ekranin e hyrjes POS)
 */
router.post("/online-orders", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }

    const allOrders = await listBarMobileOrderedForPos(resolved.clientId);
    const orders = await listPendingOnlineOrders(resolved.clientId);
    res.json({
      ok: true,
      pending: orders.length,
      has_pending: orders.length > 0,
      orders,
      all_orders: allOrders,
    });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/online-orders/acknowledge — shëno porositë e banakut si të marra (ndalon alarmin)
 */
router.post("/online-orders/acknowledge", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }

    const rawIds = Array.isArray(req.body.order_ids)
      ? req.body.order_ids
      : (req.body.order_id ? [req.body.order_id] : []);
    const pin = String(req.body.pin || req.body.waiter_pin || "").trim();

    let handler = null;
    if (pin) {
      handler = await verifyWaiterPin(resolved.clientId, pin);
    } else {
      return res.status(400).json({
        ok: false,
        gabim: "Vendosni PIN-in e kamarierit që e pranon porosinë.",
      });
    }

    const result = await acknowledgeBarOrders(resolved.clientId, rawIds, {
      waiterId: handler.id,
      waiterName: handler.name,
    });
    if (!result.count) {
      return res.json({
        ok: false,
        acknowledged: 0,
        order_ids: [],
        accepted_by: handler.name,
        gabim: "Porosia nuk u shënua në cloud — provoni përsëri ose kontrolloni migrimin e bazës.",
      });
    }
    res.json({
      ok: true,
      acknowledged: result.count,
      order_ids: result.ids,
      accepted_by: handler.name,
    });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/online-orders/refuse — REFUZO me grace 2 min (QR, Takeaway, Delivery)
 */
router.post("/online-orders/refuse", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }

    const rawIds = Array.isArray(req.body.order_ids)
      ? req.body.order_ids
      : (req.body.order_id ? [req.body.order_id] : []);
    const orderId = String(req.body.order_id || rawIds[0] || "").trim();
    const pin = String(req.body.pin || req.body.waiter_pin || "").trim();
    const reason = String(req.body.reason || req.body.refuse_reason || "").trim();

    if (!orderId) {
      return res.status(400).json({ ok: false, gabim: "Zgjidhni porosinë." });
    }

    const result = await refusePendingOnlineOrder(resolved.clientId, orderId, { pin, reason });
    console.log("[online-orders/refuse] OK", {
      clientId: resolved.clientId,
      orderId,
      refused_by: result.refused_by,
      status: result.status,
      refuse_reason: result.refuse_reason || reason,
    });
    res.json(result);
  } catch (e) {
    console.error("[online-orders/refuse] FAIL", { error: e.message });
    const status = e.code === "MISSING_PIN" || e.code === "MISSING_ORDER" ? 400 : 500;
    res.status(status).json({ ok: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/online-orders/cancel — anulo porosi në pritje (pa pranuar / pa faturë)
 */
router.post("/online-orders/cancel", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }

    const rawIds = Array.isArray(req.body.order_ids)
      ? req.body.order_ids
      : (req.body.order_id ? [req.body.order_id] : []);

    const result = await cancelBarOrders(resolved.clientId, rawIds, { reason: "license/online-orders/cancel" });
    if (!result.count) {
      if (result.skipped_grace?.length) {
        console.log("[online-orders/cancel] grace skip", {
          clientId: resolved.clientId,
          skipped_grace: result.skipped_grace,
        });
        return res.json({
          ok: true,
          cancelled: 0,
          order_ids: [],
          skipped_grace: result.skipped_grace,
          message: "Porosia në grace period pas REFUZO — mbetet aktive për kamarierët e tjerë.",
        });
      }
      return res.json({
        ok: false,
        cancelled: 0,
        order_ids: [],
        gabim: "Porosia nuk u anulua në cloud — provoni përsëri.",
      });
    }
    res.json({
      ok: true,
      cancelled: result.count,
      order_ids: result.ids,
      skipped_grace: result.skipped_grace || [],
    });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

router.post("/reservations/list", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }
    const { date, from, to } = req.body || {};
    const reservations = await listOwnerReservations(resolved.clientId, { date, from, to });
    const table_count = await getMaxTableNumber(resolved.clientId);
    res.json({ ok: true, reservations, table_count });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.post("/reservations/create", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }
    const reservation = await createOwnerReservation(resolved.clientId, req.body);
    res.status(201).json({ ok: true, reservation });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.post("/reservations/update", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }
    const id = req.body?.reservation_id || req.body?.id;
    const reservation = await updateOwnerReservationStatus(
      resolved.clientId,
      id,
      req.body?.status,
    );
    res.json({ ok: true, reservation });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/license/refused-orders — lista e refuzimeve për panelin e pronarit (POS)
 */
router.post("/refused-orders", licenseApiKeyOptional, async (req, res) => {
  try {
    const resolved = await resolveLicenseClient(req);
    if (resolved.error) {
      return res.status(resolved.error.status).json(resolved.error.body);
    }
    const { listRefusedOrders } = require("../services/orderRefusalService");
    const result = await listRefusedOrders(resolved.clientId, {
      from: req.body?.from || req.query?.from,
      to: req.body?.to || req.query?.to,
      limit: Number(req.body?.limit || req.query?.limit) || 100,
    });
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
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
