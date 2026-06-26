const express = require("express");
const { resolveKitchenClient } = require("../middleware/kitchenAuth");
const { requirePackageFeature } = require("../middleware/packageTier");
const {
  getWaiterBootstrap,
  loginWaiterWithPin,
  submitWaiterOrder,
  closeWaiterTable,
} = require("../services/waiterService");

const { getKitchenMenuItemPhoto } = require("../services/menuService");

const router = express.Router();

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

router.get("/:slug/bootstrap", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const data = await getWaiterBootstrap(req.kitchenClient.id, {
      kitchenSlug: req.kitchenClient.kitchen_slug,
      channel: "waiter",
    });
    res.json({ ok: true, ...data, kitchen_slug: req.kitchenClient.kitchen_slug });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/login", resolveKitchenClient, requirePackageFeature("waiter"), async (req, res) => {
  try {
    const waiter = await loginWaiterWithPin(req.kitchenClient.id, req.body?.pin);
    res.json({ ok: true, waiter });
  } catch (e) {
    res.status(401).json({ ok: false, gabim: e.message });
  }
});

async function postWaiterOrder(req, res) {
  try {
    const result = await submitWaiterOrder(req.kitchenClient.id, req.body);
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
