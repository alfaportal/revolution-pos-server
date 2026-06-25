const express = require("express");
const { resolveKitchenClient } = require("../middleware/kitchenAuth");
const { requirePackageFeature } = require("../middleware/packageTier");
const { getWaiterBootstrap, submitWaiterOrder, closeWaiterTable } = require("../services/waiterService");

const router = express.Router();

router.get("/:slug/bootstrap", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const data = await getWaiterBootstrap(req.kitchenClient.id);
    res.json({ ok: true, ...data, kitchen_slug: req.kitchenClient.kitchen_slug });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/orders", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const result = await submitWaiterOrder(req.kitchenClient.id, req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/orders/close", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const result = await closeWaiterTable(req.kitchenClient.id, req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
