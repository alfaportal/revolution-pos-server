const express = require("express");
const { resolvePublicTableClient } = require("../middleware/kitchenAuth");
const { requirePackageFeature } = require("../middleware/packageTier");
const { getKioskMenu, submitKioskOrder, cancelKioskOrder } = require("../services/kioskService");
const { getKitchenMenuItemPhoto } = require("../services/menuService");
const { getCustomerOrderStatus } = require("../services/customerOrderTrackService");

const router = express.Router();

router.get("/:slug/menu/:itemId/photo", resolvePublicTableClient, requirePackageFeature("kiosk"), async (req, res) => {
  try {
    const photo = await getKitchenMenuItemPhoto(req.kitchenClient.id, req.params.itemId);
    if (!photo) return res.status(404).end();
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.type(photo.mime).send(photo.buffer);
  } catch {
    res.status(404).end();
  }
});

router.post("/:slug/order/cancel", resolvePublicTableClient, requirePackageFeature("kiosk"), async (req, res) => {
  try {
    const result = await cancelKioskOrder(req.kitchenClient, req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/menu", resolvePublicTableClient, requirePackageFeature("kiosk"), async (req, res) => {
  try {
    const menu = await getKioskMenu(req.kitchenClient.id, {
      kitchenSlug: req.kitchenClient.kitchen_slug,
      channel: "menu",
    });
    res.json({
      ok: true,
      client_name: req.kitchenClient.emri,
      restaurant_name: req.kitchenClient.emri,
      kitchen_slug: req.kitchenClient.kitchen_slug,
      ...menu,
    });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/order", resolvePublicTableClient, requirePackageFeature("kiosk"), async (req, res) => {
  try {
    const result = await submitKioskOrder(req.kitchenClient, req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message, code: e.code || null });
  }
});

router.get("/:slug/order/:orderId/status", resolvePublicTableClient, requirePackageFeature("kiosk"), async (req, res) => {
  try {
    const token = String(req.query.token || "").trim();
    const data = await getCustomerOrderStatus(req.kitchenClient.id, req.params.orderId, token);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(data);
  } catch (e) {
    const code = e.code === "INVALID_TOKEN" ? 403 : e.code === "NOT_FOUND" ? 404 : 400;
    res.status(code).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
