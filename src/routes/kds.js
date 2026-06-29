const express = require("express");
const { resolveKitchenClient } = require("../middleware/kitchenAuth");
const { requirePackageFeature } = require("../middleware/packageTier");
const { listKitchenOrders, listBarOrders, listRecentlyCancelledOrders, listBarCancelledOrders, markKitchenOrderReady } = require("../services/kdsService");
const { getLiveTablesForOwner } = require("../services/salesService");
const { subscribe } = require("../services/kdsEvents");
const { getStaffBrandingForClient } = require("../lib/staffBranding");

const router = express.Router();

router.get("/:slug/events", resolveKitchenClient, requirePackageFeature("kds"), (req, res) => {
  subscribe(req.kitchenClient.id, res);
});

router.get("/:slug/bar/tables/live", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const live = await getLiveTablesForOwner(req.kitchenClient.id);
    res.json({ ok: true, ...live });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/bar/orders", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const orders = await listKitchenOrders(client.id);
    const cancelled = await listRecentlyCancelledOrders(client.id);
    const branding = await getStaffBrandingForClient(client, req.params.slug);
    res.json({
      ok: true,
      client_name: client.emri,
      kitchen_slug: client.kitchen_slug,
      ...branding,
      orders,
      cancelled,
    });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/orders", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const orders = await listBarOrders(client.id);
    const cancelled = await listBarCancelledOrders(client.id);
    const branding = await getStaffBrandingForClient(client, req.params.slug);
    res.json({
      ok: true,
      client_name: client.emri,
      kitchen_slug: client.kitchen_slug,
      ...branding,
      orders,
      cancelled,
    });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/orders/:orderId/accept", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const pin = String(req.body?.pin || req.body?.waiter_pin || "").trim();
    if (!pin) {
      return res.status(400).json({
        ok: false,
        gabim: "Vendosni PIN-in e kamarierit që e pranon porosinë.",
      });
    }
    const { verifyWaiterPin } = require("../services/waiterPinService");
    const handler = await verifyWaiterPin(client.id, pin);
    const { acceptBarOrder } = require("../services/kdsService");
    const order = await acceptBarOrder(client.id, req.params.orderId, {
      waiterId: handler.id,
      waiterName: handler.name,
    });
    res.json({ ok: true, order, accepted_by: handler.name });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/orders/:orderId/ready", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const { markKitchenOrderReady } = require("../services/kdsService");
    const order = await markKitchenOrderReady(client.id, req.params.orderId);
    res.json({ ok: true, order });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
