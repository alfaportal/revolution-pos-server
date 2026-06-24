const express = require("express");
const { authOwner, ownerOnly } = require("../middleware/auth");
const {
  getOwnerStats,
  listOwnerOrders,
  getOwnerOrderFilters,
  getOwnerReport,
  getClientById,
  getLiveTablesForOwner,
} = require("../services/salesService");
const {
  getOwnerLicenseView,
  verifyOwnerLicenseKey,
} = require("../services/licenseService");

const router = express.Router();

router.use(authOwner, ownerOnly);

router.get("/client", async (req, res) => {
  try {
    const client = await getClientById(req.user.client_id);
    const base = `${req.protocol}://${req.get("host")}`.replace(/\/$/, "");
    const id = req.user.client_id;
    res.json({
      ok: true,
      client: client
        ? {
            emri: client.emri,
            tipi: client.tipi,
            adresa: client.adresa,
            telefoni: client.telefoni,
            email: client.email,
          }
        : null,
      waiter_url: `${base}/waiter/${id}`,
      kitchen_url: `${base}/kitchen/${id}`,
    });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const stats = await getOwnerStats(req.user.client_id);
    res.json({ ok: true, ...stats });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/orders/filters", async (req, res) => {
  try {
    const filters = await getOwnerOrderFilters(req.user.client_id);
    res.json({ ok: true, ...filters });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const orders = await listOwnerOrders(req.user.client_id, {
      limit: req.query.limit,
      waiter: req.query.waiter,
      table: req.query.table,
    });
    res.json({ ok: true, orders });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/tables/live", async (req, res) => {
  try {
    const live = await getLiveTablesForOwner(req.user.client_id);
    res.json({ ok: true, ...live });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/reports", async (req, res) => {
  try {
    const report = await getOwnerReport(
      req.user.client_id,
      req.query.from,
      req.query.to,
    );
    res.json({ ok: true, report });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/license", async (req, res) => {
  try {
    res.json({ ok: true, ...(await getOwnerLicenseView(req.user.client_id)) });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.put("/license", async (req, res) => {
  try {
    const { license_key } = req.body || {};
    const view = await verifyOwnerLicenseKey(req.user.client_id, license_key);
    res.json({
      ok: true,
      ...view,
      info: "Çelësi u verifikua. Për aktivizim të plotë, vendoseni të njëjtin çelës te POS: Admin → Licenca (në kompjuterin e restorantit).",
    });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

module.exports = router;
