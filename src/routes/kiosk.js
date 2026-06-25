const express = require("express");
const { resolveKitchenClient } = require("../middleware/kitchenAuth");
const { requirePackageFeature } = require("../middleware/packageTier");
const { getKioskMenu, submitKioskOrder } = require("../services/kioskService");

const router = express.Router();

router.get("/:slug/menu", resolveKitchenClient, requirePackageFeature("kiosk"), async (req, res) => {
  try {
    const menu = await getKioskMenu(req.kitchenClient.id);
    res.json({
      ok: true,
      client_name: req.kitchenClient.emri,
      kitchen_slug: req.kitchenClient.kitchen_slug,
      ...menu,
    });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/order", resolveKitchenClient, requirePackageFeature("kiosk"), async (req, res) => {
  try {
    const result = await submitKioskOrder(req.kitchenClient, req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message, code: e.code || null });
  }
});

module.exports = router;
