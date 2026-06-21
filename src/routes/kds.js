const express = require("express");
const {
  getClientForKitchen,
  listKitchenOrders,
  markKitchenOrderReady,
} = require("../services/kdsService");

const router = express.Router();

function kitchenKey(req) {
  return req.query.k || req.query.key || "";
}

router.get("/:slug/orders", async (req, res) => {
  try {
    const client = await getClientForKitchen(req.params.slug, kitchenKey(req));
    const orders = await listKitchenOrders(client.id);
    res.json({
      ok: true,
      client_name: client.emri,
      orders,
    });
  } catch (e) {
    res.status(403).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/orders/:orderId/ready", async (req, res) => {
  try {
    const client = await getClientForKitchen(req.params.slug, kitchenKey(req));
    const order = await markKitchenOrderReady(client.id, req.params.orderId);
    res.json({ ok: true, order });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
