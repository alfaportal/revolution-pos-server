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
const {
  buildDailyZReport,
  saveDailyZReport,
  listZReportHistory,
  zReportToCsv,
  zReportToHtml,
} = require("../services/zReportService");
const { getFiscalSettings, updateFiscalSettings } = require("../services/fiscalService");
const {
  listOwnerMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../services/menuService");
const { buildKitchenUrl, ensureKitchenCredentials } = require("../lib/kitchenAccess");
const { featuresForTier } = require("../lib/packages");

const router = express.Router();

router.use(authOwner, ownerOnly);

router.get("/client", async (req, res) => {
  try {
    let client = await getClientById(req.user.client_id);
    if (client) {
      client = await ensureKitchenCredentials(client);
    }
    const base = `${req.protocol}://${req.get("host")}`.replace(/\/$/, "");
    const features = featuresForTier(client?.package_tier);
    const links = {};
    if (client?.id && features.waiter) {
      links.waiter = buildKitchenUrl(base, client, "waiter");
    }
    if (client?.id && features.kds) {
      links.kitchen = buildKitchenUrl(base, client, "kitchen");
      links.bar = buildKitchenUrl(base, client, "bar");
    }
    if (client?.id && features.kiosk) {
      links.kiosk = `${buildKitchenUrl(base, client, "kiosk")}&table=1`;
    }
    res.json({
      ok: true,
      client: client
        ? {
            emri: client.emri,
            tipi: client.tipi,
            adresa: client.adresa,
            telefoni: client.telefoni,
            email: client.email,
            package_tier: client.package_tier,
          }
        : null,
      features,
      links,
      waiter_url: links.waiter || null,
      kitchen_url: links.kitchen || null,
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

router.get("/fiscal/settings", async (req, res) => {
  try {
    const settings = await getFiscalSettings(req.user.client_id);
    res.json({ ok: true, settings });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.patch("/fiscal/settings", async (req, res) => {
  try {
    const settings = await updateFiscalSettings(req.user.client_id, req.body);
    res.json({ ok: true, settings });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/z-report", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const report = await buildDailyZReport(req.user.client_id, date);
    res.json({ ok: true, report });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/z-report/close", async (req, res) => {
  try {
    const date = req.body?.date || new Date().toISOString().slice(0, 10);
    const report = await saveDailyZReport(req.user.client_id, date, { close: true });
    res.json({ ok: true, report });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/z-report/history", async (req, res) => {
  try {
    const history = await listZReportHistory(req.user.client_id, Number(req.query.limit) || 60);
    res.json({ ok: true, history });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/z-report/export", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const format = String(req.query.format || "csv").toLowerCase();
    const report = await buildDailyZReport(req.user.client_id, date);

    if (format === "html" || format === "pdf") {
      const html = zReportToHtml(report);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `inline; filename="z-report-${date}.html"`);
      return res.send(html);
    }

    const csv = zReportToCsv(report);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="z-report-${date}.csv"`);
    res.send("\uFEFF" + csv);
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/menu", async (req, res) => {
  try {
    const menu = await listOwnerMenu(req.user.client_id);
    res.json({ ok: true, ...menu });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/menu", async (req, res) => {
  try {
    const result = await addMenuItem(req.user.client_id, req.body);
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.patch("/menu/:id", async (req, res) => {
  try {
    const result = await updateMenuItem(req.user.client_id, req.params.id, req.body);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.delete("/menu/:id", async (req, res) => {
  try {
    const result = await deleteMenuItem(req.user.client_id, req.params.id);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

module.exports = router;
