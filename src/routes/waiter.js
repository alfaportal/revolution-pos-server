const express = require("express");
const { resolveKitchenClient } = require("../middleware/kitchenAuth");
const { requirePackageFeature } = require("../middleware/packageTier");
const {
  getWaiterBootstrap,
  loginWaiterWithPin,
  submitWaiterOrder,
  cancelWaiterOrder,
  closeWaiterTable,
} = require("../services/waiterService");
const {
  listPendingOnlineOrders,
  acceptPendingOnlineOrders,
} = require("../services/onlineOrdersService");

const { getKitchenMenuItemPhoto } = require("../services/menuService");
const { verifyKasaSessionToken } = require("../lib/kasaSession");
const { getWaiterById } = require("../services/waiterPinService");

const router = express.Router();

function extractWaiterToken(req) {
  return String(req.query.w || req.body?.web_token || "").trim().toLowerCase();
}

router.get("/:slug/menu/:itemId/photo", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const photo = await getKitchenMenuItemPhoto(req.kitchenClient.id, req.params.itemId);
    if (!photo) return res.status(404).end();
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.type(photo.mime).send(photo.buffer);
  } catch (e) {
    res.status(404).end();
  }
});

router.post("/:slug/orders/cancel", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const result = await cancelWaiterOrder(req.kitchenClient.id, req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/bootstrap", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const data = await getWaiterBootstrap(req.kitchenClient.id, {
      kitchenSlug: req.kitchenClient.kitchen_slug,
      channel: "waiter",
      webToken: extractWaiterToken(req),
    });
    res.json({ ok: true, ...data, kitchen_slug: req.kitchenClient.kitchen_slug });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/login", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const waiter = await loginWaiterWithPin(req.kitchenClient.id, req.body?.pin, extractWaiterToken(req) || null);
    res.json({ ok: true, waiter });
  } catch (e) {
    res.status(401).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/online-orders/pending", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const orders = await listPendingOnlineOrders(req.kitchenClient.id);
    res.json({
      ok: true,
      pending: orders.length,
      has_pending: orders.length > 0,
      orders,
      connected: true,
    });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message, pending: 0, has_pending: false, orders: [] });
  }
});

router.post("/:slug/online-orders/accept", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const rawIds = Array.isArray(req.body.order_ids)
      ? req.body.order_ids
      : (req.body.order_id ? [req.body.order_id] : []);
    const pin = String(req.body.pin || req.body.waiter_pin || "").trim();
    if (!pin) {
      return res.status(400).json({ ok: false, gabim: "Vendosni PIN-in e kamarierit që e pranon porosinë." });
    }
    const { verifyWaiterPin } = require("../services/waiterPinService");
    const handler = await verifyWaiterPin(
      req.kitchenClient.id,
      pin,
      extractWaiterToken(req) || req.body?.web_token || null,
    );
    const result = await acceptPendingOnlineOrders(req.kitchenClient.id, rawIds, {
      waiterId: handler.id,
      waiterName: handler.name,
    });
    const orders = await listPendingOnlineOrders(req.kitchenClient.id);
    res.json({
      ok: !!result.ok,
      acknowledged: result.acknowledged,
      order_ids: result.order_ids,
      accepted_by: result.accepted_by,
      pending: orders.length,
      has_pending: orders.length > 0,
      orders,
      gabim: result.ok ? undefined : "Porosia nuk u shënua — provoni përsëri.",
    });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/kasa-session", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const token = String(req.body?.session_token || "").trim();
    const parsed = verifyKasaSessionToken(token, req.kitchenClient.id);
    if (!parsed?.waiterId) {
      return res.status(401).json({ ok: false, gabim: "Sesioni i kasës ka skaduar. Shkruani PIN-in." });
    }
    const waiter = await getWaiterById(req.kitchenClient.id, parsed.waiterId);
    if (!waiter) {
      return res.status(401).json({ ok: false, gabim: "Kamarieri nuk u gjet." });
    }
    res.json({ ok: true, waiter });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

async function postWaiterOrder(req, res) {
  try {
    const { getWaiterByWebToken } = require("../services/waiterPinService");
    const body = { ...(req.body || {}) };
    const token = extractWaiterToken(req);
    if (token) {
      const fromToken = await getWaiterByWebToken(req.kitchenClient.id, token);
      if (fromToken?.id) {
        if (!body.waiter_id) body.waiter_id = fromToken.id;
        if (!body.waiter_name) body.waiter_name = fromToken.name;
      }
    }
    const result = await submitWaiterOrder(req.kitchenClient.id, body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message || "Porosia nuk u dërgua." });
  }
}

router.post("/:slug/orders", resolveKitchenClient, requirePackageFeature("waiter"), postWaiterOrder);
router.post("/:slug/order", resolveKitchenClient, requirePackageFeature("waiter"), postWaiterOrder);

router.post("/:slug/orders/close", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const result = await closeWaiterTable(req.kitchenClient.id, req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
