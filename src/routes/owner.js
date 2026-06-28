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
const { getFiscalSettings, updateFiscalSettings, getFiscalDiagnostics } = require("../services/fiscalService");
const {
  listOwnerMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getOwnerMenuItemPhoto,
} = require("../services/menuService");
const {
  listCatalogForOwner,
  addItemsFromCatalog,
} = require("../services/menuCatalogTemplateService");
const {
  listStockForOwner,
  getStockSummary,
  updateStockSettings,
  restockItem,
} = require("../services/stockService");
const {
  listVenue,
  addArea,
  updateArea,
  deleteArea,
  addStaff,
  updateStaff,
  deleteStaff,
} = require("../services/venueService");
const {
  listWaitersForOwner,
  addWaiterWithPin,
  updateWaiterWithPin,
  deleteWaiterWithPin,
} = require("../services/waiterPinService");
const { ensureKitchenCredentials, buildClientWebLinks, buildWaiterUrl } = require("../lib/kitchenAccess");
const { featuresForTier } = require("../lib/packages");
const { listKioskQrCodes, listTableQrMeta, getTableQrCode, getTableQrPng, qrPrintHtml, singleQrPrintHtml, tableMenuUrl } = require("../services/kioskQrService");
const {
  getOwnerPublicPageSettings,
  updateOwnerPublicPageSettings,
  updateOwnerKitchenSlug,
  getOwnerPublicPageQr,
  getOwnerPublicPageQrPng,
} = require("../services/publicPageService");
const { getPublicAppOrigin } = require("../lib/publicOrigin");
const {
  listOwnerReservations,
  createOwnerReservation,
  updateOwnerReservationStatus,
  getMaxTableNumber,
} = require("../services/reservationService");
const {
  listIngredients,
  listInventoryAlerts,
  createIngredient,
  updateIngredient,
} = require("../services/inventoryService");

const router = express.Router();

router.use(authOwner, ownerOnly);

router.get("/client", async (req, res) => {
  try {
    let client = await getClientById(req.user.client_id);
    if (client) {
      client = await ensureKitchenCredentials(client);
    }
    const base = getPublicAppOrigin();
    const features = featuresForTier(client?.package_tier);
    const built = buildClientWebLinks(base, client, client?.package_tier);
    const links = {
      waiter: built.waiter_url || null,
      kitchen: built.kitchen_url || null,
      bar: built.bar_url || null,
      kiosk: built.kiosk_url || null,
      public_page: built.public_page_url || null,
    };
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
      bar_url: links.bar || null,
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

router.get("/fiscal/diagnostics", async (req, res) => {
  try {
    const diagnostics = await getFiscalDiagnostics(req.user.client_id);
    res.json({ ok: true, diagnostics });
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

router.get("/menu/catalog", async (req, res) => {
  try {
    const catalog = await listCatalogForOwner(req.user.client_id);
    res.json({ ok: true, ...catalog });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/menu/from-catalog", async (req, res) => {
  try {
    const result = await addItemsFromCatalog(req.user.client_id, req.body.items);
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/menu/:id/photo", async (req, res) => {
  try {
    const photo = await getOwnerMenuItemPhoto(req.user.client_id, req.params.id);
    if (!photo) {
      return res.status(404).type("text/plain").send("Not found");
    }
    res.setHeader("Cache-Control", "private, max-age=300");
    res.type(photo.mime).send(photo.buffer);
  } catch (e) {
    res.status(400).type("text/plain").send(e.message);
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

router.get("/stock", async (req, res) => {
  try {
    const stock = await listStockForOwner(req.user.client_id);
    res.json({ ok: true, ...stock });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/stock/summary", async (req, res) => {
  try {
    const summary = await getStockSummary(req.user.client_id);
    res.json({ ok: true, summary });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.patch("/stock/:id", async (req, res) => {
  try {
    const result = await updateStockSettings(req.user.client_id, req.params.id, req.body);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.post("/stock/:id/restock", async (req, res) => {
  try {
    const add = req.body.add ?? req.body.quantity ?? req.body.qty;
    const result = await restockItem(req.user.client_id, req.params.id, add);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/ingredients", async (req, res) => {
  try {
    const ingredients = await listIngredients(req.user.client_id);
    res.json({ ok: true, ingredients });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.post("/ingredients", async (req, res) => {
  try {
    const ingredient = await createIngredient(req.user.client_id, req.body);
    res.status(201).json({ ok: true, ingredient });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.patch("/ingredients/:id", async (req, res) => {
  try {
    const ingredient = await updateIngredient(req.user.client_id, req.params.id, req.body);
    res.json({ ok: true, ingredient });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/inventory/alerts", async (req, res) => {
  try {
    const alerts = await listInventoryAlerts(req.user.client_id);
    res.json({ ok: true, alerts, count: alerts.length });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/venue", async (req, res) => {
  try {
    const venue = await listVenue(req.user.client_id);
    res.json({ ok: true, ...venue });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/venue/areas", async (req, res) => {
  try {
    const result = await addArea(req.user.client_id, req.body);
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.patch("/venue/areas/:id", async (req, res) => {
  try {
    const result = await updateArea(req.user.client_id, req.params.id, req.body);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.delete("/venue/areas/:id", async (req, res) => {
  try {
    const result = await deleteArea(req.user.client_id, req.params.id);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.post("/venue/staff", async (req, res) => {
  try {
    const result = await addStaff(req.user.client_id, req.body);
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.patch("/venue/staff/:id", async (req, res) => {
  try {
    const result = await updateStaff(req.user.client_id, req.params.id, req.body);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.delete("/venue/staff/:id", async (req, res) => {
  try {
    const result = await deleteStaff(req.user.client_id, req.params.id);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/waiters", async (req, res) => {
  try {
    let client = await getClientById(req.user.client_id);
    if (client) client = await ensureKitchenCredentials(client);
    const base = getPublicAppOrigin();
    const waiters = await listWaitersForOwner(req.user.client_id);
    const shared_waiter_url = client ? buildWaiterUrl(base, client, "") : "";
    res.json({
      ok: true,
      waiters: waiters.map(w => ({
        ...w,
        waiter_url: client && w.web_token ? buildWaiterUrl(base, client, w.web_token) : "",
      })),
      shared_waiter_url,
    });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/waiters", async (req, res) => {
  try {
    const result = await addWaiterWithPin(req.user.client_id, req.body);
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.patch("/waiters/:id", async (req, res) => {
  try {
    const result = await updateWaiterWithPin(req.user.client_id, req.params.id, req.body);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.delete("/waiters/:id", async (req, res) => {
  try {
    const result = await deleteWaiterWithPin(req.user.client_id, req.params.id);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/kiosk/qrs", async (req, res) => {
  try {
    const base = getPublicAppOrigin();
    const data = await listKioskQrCodes(req.user.client_id, base);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/tables/qr", async (req, res) => {
  try {
    const base = getPublicAppOrigin();
    const data = await listTableQrMeta(req.user.client_id, base);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/kiosk/qrs/print", async (req, res) => {
  try {
    const base = getPublicAppOrigin();
    const client = await getClientById(req.user.client_id);
    const data = await listKioskQrCodes(req.user.client_id, base);
    const html = qrPrintHtml(data.tables, client?.emri || "");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    res.status(400).send(`<pre>${e.message}</pre>`);
  }
});

router.get("/kiosk/qrs/:table/png", async (req, res) => {
  try {
    const base = getPublicAppOrigin();
    const table = req.params.table;
    const client = await getClientById(req.user.client_id);
    const png = await getTableQrPng(req.user.client_id, base, table);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="qr-tavolina-${table}.png"`);
    res.send(png);
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/kiosk/qrs/:table/print", async (req, res) => {
  try {
    const base = getPublicAppOrigin();
    const client = await getClientById(req.user.client_id);
    const data = await getTableQrCode(req.user.client_id, base, req.params.table);
    const html = singleQrPrintHtml(data, client?.emri || "");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    res.status(400).send(`<pre>${e.message}</pre>`);
  }
});

router.get("/kiosk/qrs/:table", async (req, res) => {
  try {
    const base = getPublicAppOrigin();
    const data = await getTableQrCode(req.user.client_id, base, req.params.table);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/public-page/qr/png", async (req, res) => {
  try {
    const base = getPublicAppOrigin();
    const client = await getClientById(req.user.client_id);
    const png = await getOwnerPublicPageQrPng(req.user.client_id, base);
    const slug = client?.kitchen_slug || req.user.client_id;
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="qr-faqe-${slug}.png"`);
    res.send(png);
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/public-page/qr", async (req, res) => {
  try {
    const base = getPublicAppOrigin();
    const data = await getOwnerPublicPageQr(req.user.client_id, base);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

async function saveOwnerKitchenSlug(req, res) {
  try {
    await updateOwnerKitchenSlug(req.user.client_id, req.body?.slug);
    const base = getPublicAppOrigin();
    const settings = await getOwnerPublicPageSettings(req.user.client_id, base);
    res.json({ ok: true, ...settings });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
}

router.put("/slug", saveOwnerKitchenSlug);
router.patch("/public-page/slug", saveOwnerKitchenSlug);

router.get("/public-page", async (req, res) => {
  try {
    const base = getPublicAppOrigin();
    const settings = await getOwnerPublicPageSettings(req.user.client_id, base);
    res.json({ ok: true, ...settings });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.patch("/public-page", async (req, res) => {
  try {
    await updateOwnerPublicPageSettings(req.user.client_id, req.body);
    const base = getPublicAppOrigin();
    const settings = await getOwnerPublicPageSettings(req.user.client_id, base);
    res.json({ ok: true, ...settings });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/reservations", async (req, res) => {
  try {
    const rows = await listOwnerReservations(req.user.client_id, {
      date: req.query.date,
      from: req.query.from,
      to: req.query.to,
    });
    const table_count = await getMaxTableNumber(req.user.client_id);
    res.json({ ok: true, reservations: rows, table_count });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.post("/reservations", async (req, res) => {
  try {
    const reservation = await createOwnerReservation(req.user.client_id, req.body);
    res.status(201).json({ ok: true, reservation });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.patch("/reservations/:id", async (req, res) => {
  try {
    const reservation = await updateOwnerReservationStatus(
      req.user.client_id,
      req.params.id,
      req.body?.status,
    );
    res.json({ ok: true, reservation });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

module.exports = router;
