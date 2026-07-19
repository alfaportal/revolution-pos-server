const express = require("express");
const { authRequired, superAdminOnly } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");
const { listAiUsageSummary, aiUsageRowsToCsv, aiUsageDetailRowsToCsv } = require("../services/aiUsageReportService");
const { buildAiUsageInvoicePdf } = require("../services/aiBillingPdfService");
const { getClientById } = require("../services/salesService");
const { packageLabel } = require("../lib/packages");
const {
  generateHardwareLicenseKey,
  normalizeHardwareId,
  formatGrouped16,
} = require("../lib/hardwareLicense");
const {
  getOverview,
  getClientsGrouped,
  getClientDetail,
  getLicensesView,
  getAiUsageDashboard,
  getSalesReport,
  reportToCsv,
  getSettings,
  updateSettings,
  listBillingInvoices,
  createBillingInvoice,
  updateBillingInvoiceStatus,
  buildBillingInvoicePdf,
} = require("../services/superAdminDashboardService");
const { blockLicense, unblockLicense } = require("../services/licenseService");
const { logAdminActivity, activityFromReq } = require("../services/activityLogService");

const router = express.Router();

router.use(authRequired, superAdminOnly);

/**
 * Gjenero LICENSE_KEY nga HARDWARE_ID i klientit (telefoni i Super Admin).
 * Body: { hardwareId: "XXXX-XXXX-XXXX-XXXX" }
 * → { licenseKey: "XXXX-XXXX-XXXX-XXXX" }
 */
router.post(
  "/generate-license-key",
  asyncHandler(async (req, res) => {
    const hardwareId = req.body?.hardwareId || req.body?.hardware_id || "";
    try {
      const licenseKey = generateHardwareLicenseKey(hardwareId);
      res.json({
        ok: true,
        licenseKey,
        hardwareId: formatGrouped16(normalizeHardwareId(hardwareId)),
      });
    } catch (e) {
      res.status(400).json({ ok: false, gabim: e.message || String(e) });
    }
  }),
);

router.get(
  "/ai-usage",
  asyncHandler(async (req, res) => {
    const summary = await listAiUsageSummary({ month: req.query.month });

    if (String(req.query.format || "").toLowerCase() === "csv") {
      const csv =
        String(req.query.detail || "").toLowerCase() === "1"
          ? aiUsageDetailRowsToCsv(summary.rows)
          : aiUsageRowsToCsv(summary.rows);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="ai-usage-${summary.month}.csv"`,
      );
      return res.send(csv);
    }

    res.json({
      ok: true,
      month: summary.month,
      rows: summary.rows,
      totals: summary.totals,
      table_missing: summary.table_missing || false,
    });
  }),
);

/** Faturë PDF për një klient (tokenë AI të muajit). */
router.get(
  "/ai-usage/invoice-pdf",
  asyncHandler(async (req, res) => {
    const restaurantId = String(req.query.restaurant_id || "").trim();
    if (!restaurantId) {
      return res.status(400).json({ ok: false, gabim: "Mungon restaurant_id." });
    }
    const summary = await listAiUsageSummary({ month: req.query.month });
    const row = (summary.rows || []).find((r) => String(r.restaurant_id) === restaurantId);
    const client = await getClientById(restaurantId).catch(() => null);
    const pdf = buildAiUsageInvoicePdf({
      clientName: row?.local_name || client?.emri || restaurantId,
      month: summary.month,
      tokensTotal: row?.tokens_total || 0,
      costEur: row?.cost_eur_total || 0,
      calls: row?.calls || 0,
      packageTier: packageLabel(client?.package_tier),
      invoiceNo: `AI-${summary.month}-${String(restaurantId).slice(0, 8)}`,
      breakdown: row?.breakdown || {},
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ai-invoice-${summary.month}-${String(restaurantId).slice(0, 8)}.pdf"`,
    );
    res.send(pdf);
  }),
);

// ---- Desktop Super Admin dashboard (/admin/dashboard) — endpoint-e të reja ----

router.get(
  "/dashboard/overview",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, ...(await getOverview()) });
  }),
);

router.get(
  "/dashboard/clients",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, ...(await getClientsGrouped()) });
  }),
);

router.get(
  "/dashboard/clients/:id",
  asyncHandler(async (req, res) => {
    res.json({ ok: true, ...(await getClientDetail(req.params.id)) });
  }),
);

router.get(
  "/dashboard/licenses",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, ...(await getLicensesView()) });
  }),
);

router.post(
  "/dashboard/licenses/:id/block",
  asyncHandler(async (req, res) => {
    const license = await blockLicense(req.params.id);
    await logAdminActivity({
      ...activityFromReq(req),
      action: "license_block",
      targetType: "license",
      targetId: license.id,
      targetLabel: license.celesi,
    }).catch(() => {});
    res.json({ ok: true, license });
  }),
);

router.post(
  "/dashboard/licenses/:id/unblock",
  asyncHandler(async (req, res) => {
    const license = await unblockLicense(req.params.id);
    await logAdminActivity({
      ...activityFromReq(req),
      action: "license_unblock",
      targetType: "license",
      targetId: license.id,
      targetLabel: license.celesi,
    }).catch(() => {});
    res.json({ ok: true, license });
  }),
);

router.get(
  "/dashboard/ai-usage",
  asyncHandler(async (req, res) => {
    res.json({ ok: true, ...(await getAiUsageDashboard({ month: req.query.month })) });
  }),
);

router.get(
  "/dashboard/reports",
  asyncHandler(async (req, res) => {
    const report = await getSalesReport({
      from: req.query.from,
      to: req.query.to,
      group: req.query.group || "day",
    });
    if (String(req.query.format || "").toLowerCase() === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="raport-shitje-${report.from}-${report.to}.csv"`,
      );
      return res.send(reportToCsv(report));
    }
    res.json({ ok: true, ...report });
  }),
);

router.get(
  "/dashboard/billing/invoices",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, invoices: listBillingInvoices() });
  }),
);

router.post(
  "/dashboard/billing/invoices",
  asyncHandler(async (req, res) => {
    const invoice = await createBillingInvoice(req.body || {});
    res.status(201).json({ ok: true, invoice });
  }),
);

router.patch(
  "/dashboard/billing/invoices/:id",
  asyncHandler(async (req, res) => {
    const invoice = updateBillingInvoiceStatus(req.params.id, req.body?.status);
    res.json({ ok: true, invoice });
  }),
);

router.get(
  "/dashboard/billing/invoices/:id/pdf",
  asyncHandler(async (req, res) => {
    const inv = listBillingInvoices().find((x) => x.id === req.params.id);
    if (!inv) return res.status(404).json({ ok: false, gabim: "Fatura nuk u gjet" });
    const pdf = buildBillingInvoicePdf(inv);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${inv.id}.pdf"`);
    res.send(pdf);
  }),
);

router.get(
  "/dashboard/settings",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, settings: getSettings() });
  }),
);

router.put(
  "/dashboard/settings",
  asyncHandler(async (req, res) => {
    const settings = updateSettings(req.body || {});
    res.json({ ok: true, settings });
  }),
);

module.exports = router;
