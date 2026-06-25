const express = require("express");
const { resolveKitchenClient } = require("../middleware/kitchenAuth");
const { requirePackageFeature } = require("../middleware/packageTier");
const {
  listKitchenOrders,
  markKitchenOrderReady,
} = require("../services/kdsService");
const { subscribe } = require("../services/kdsEvents");

const router = express.Router();

router.get("/:slug/events", resolveKitchenClient, requirePackageFeature("kds"), (req, res) => {
  subscribe(req.kitchenClient.id, res);
});

router.get("/:slug/orders", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const orders = await listKitchenOrders(client.id);
    res.json({
      ok: true,
      client_name: client.emri,
      kitchen_slug: client.kitchen_slug,
      orders,
    });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/orders/:orderId/ready", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const order = await markKitchenOrderReady(client.id, req.params.orderId);
    res.json({ ok: true, order });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
