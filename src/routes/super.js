const express = require("express");
const { authRequired, superAdminOnly } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");
const { listAiUsageSummary, aiUsageRowsToCsv, aiUsageDetailRowsToCsv } = require("../services/aiUsageReportService");
const { buildAiUsageInvoicePdf } = require("../services/aiBillingPdfService");
const { getClientById } = require("../services/salesService");
const { packageLabel } = require("../lib/packages");

const router = express.Router();

router.use(authRequired, superAdminOnly);

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

module.exports = router;
