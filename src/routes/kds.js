const express = require("express");
const {
  getClientForKitchen,
  listKitchenOrders,
  markKitchenOrderReady,
} = require("../services/kdsService");

const router = express.Router();

router.get("/:clientId/orders", async (req, res) => {
  try {
    const client = await getClientForKitchen(req.params.clientId);
    const orders = await listKitchenOrders(client.id);
    res.json({
      ok: true,
      client_name: client.emri,
      orders,
    });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.post("/:clientId/orders/:orderId/ready", async (req, res) => {
  try {
    const client = await getClientForKitchen(req.params.clientId);
    const order = await markKitchenOrderReady(client.id, req.params.orderId);
    res.json({ ok: true, order });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
