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
  getProblemsReport,
  getSettings,
  getSettingsAsync,
  updateSettingsAsync,
  listBillingInvoices,
  listBillingInvoicesAsync,
  createBillingInvoice,
  updateBillingInvoiceStatus,
  buildBillingInvoicePdf,
  PRODUCT_LINES,
} = require("../services/superAdminDashboardService");
const {
  createSecurityClient,
  issueSecurityLicense,
  setSecurityLicenseStatus,
} = require("../services/securityAdminBridge");
const { normalizeProductLine } = require("../utils/productLine");
const {
  blockLicense,
  unblockLicense,
  updateLicense,
  updateLicenseStatus,
  revokeLicenseRemote,
  reactivateLicenseRemote,
  requestWipeDataForLicense,
} = require("../services/licenseService");
const { addMonthsISO, todayISO } = require("../lib/licenseDates");
const { logAdminActivity, activityFromReq } = require("../services/activityLogService");

const router = express.Router();

router.use(authRequired, superAdminOnly);

/**
 * Gjenero LICENSE_KEY nga HARDWARE_ID i klientit (telefoni i Super Admin).
 * Body: { hardwareId, licenseType?: "trial"|"annual" }
 * → { licenseKey, licenseType, expiresAt, ... }
 */
router.post(
  "/generate-license-key",
  asyncHandler(async (req, res) => {
    const hardwareId = req.body?.hardwareId || req.body?.hardware_id || "";
    const licenseType = req.body?.licenseType || req.body?.license_type || "annual";
    try {
      const result = generateHardwareLicenseKey(hardwareId, { licenseType });
      res.json({
        ok: true,
        licenseKey: result.licenseKey,
        celesi: result.licenseKey,
        licenseType: result.licenseType,
        expiresAt: result.expiresAt,
        expiresYmd: result.expiresYmd,
        trialDays: result.trialDays || null,
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
  "/dashboard/products",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, products: PRODUCT_LINES });
  }),
);

router.get(
  "/dashboard/overview",
  asyncHandler(async (req, res) => {
    const product = req.query.product || req.query.industry || "all";
    res.json({ ok: true, ...(await getOverview({ product })) });
  }),
);

router.get(
  "/dashboard/clients",
  asyncHandler(async (req, res) => {
    const product = req.query.product || req.query.industry || "kafene";
    res.json({ ok: true, ...(await getClientsGrouped({ product })) });
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
  asyncHandler(async (req, res) => {
    const product = req.query.product || req.query.industry || "kafene";
    res.json({ ok: true, ...(await getLicensesView({ product })) });
  }),
);

/** Krijo klient (+ opsionalisht licencë) sipas produktit — kafene lokal / security upstream */
router.post(
  "/dashboard/clients",
  asyncHandler(async (req, res) => {
    const product = normalizeProductLine(
      req.body?.product_line || req.body?.industry_type || req.query.product,
    );
    if (product === "security") {
      const data = await createSecurityClient(req.body || {});
      let license = null;
      if (req.body?.issue_license !== false) {
        try {
          const issued = await issueSecurityLicense({
            client_id: data.client?.id,
            max_terminals: req.body?.max_terminals || 1,
            expires_at: req.body?.expires_at || null,
          });
          license = issued.license || issued;
        } catch (e) {
          console.warn("[super] security license issue:", e.message);
        }
      }
      await logAdminActivity({
        ...activityFromReq(req),
        action: "security_client_create",
        targetType: "client",
        targetId: data.client?.id,
        targetLabel: data.client?.emri,
      }).catch(() => {});
      return res.status(201).json({ ok: true, client: data.client, license, product_line: "security" });
    }

    const { createClient, createLicense } = require("../services/licenseService");
    const client = await createClient({ ...(req.body || {}), product_line: "kafene" });
    let license = null;
    if (req.body?.issue_license !== false) {
      try {
        license = await createLicense({
          client_id: client.id,
          app_type: req.body?.app_type,
          product_line: "kafene",
          muaj: req.body?.muaj || 12,
          max_terminals: req.body?.max_terminals || 1,
        });
      } catch (e) {
        console.warn("[super] kafene license issue:", e.message);
      }
    }
    await logAdminActivity({
      ...activityFromReq(req),
      action: "client_create",
      targetType: "client",
      targetId: client.id,
      targetLabel: client.emri,
    }).catch(() => {});
    res.status(201).json({ ok: true, client, license, product_line: "kafene" });
  }),
);

router.post(
  "/dashboard/security/licenses/:id/status",
  asyncHandler(async (req, res) => {
    const license = await setSecurityLicenseStatus(req.params.id, req.body?.statusi || req.body?.status);
    await logAdminActivity({
      ...activityFromReq(req),
      action: "security_license_status",
      targetType: "license",
      targetId: req.params.id,
      details: { status: req.body?.statusi || req.body?.status },
    }).catch(() => {});
    res.json({ ok: true, license: license.license || license });
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

/** Çaktivizo menjëherë (REVOKED) — heartbeat mbyll POS. */
router.post(
  "/dashboard/licenses/:id/revoke",
  asyncHandler(async (req, res) => {
    const result = await revokeLicenseRemote(req.params.id, {
      hardwareId: req.body?.hardware_id || req.body?.hardwareId,
      reason: req.body?.reason,
      actor: req.user,
    });
    await logAdminActivity({
      ...activityFromReq(req),
      action: "license_revoke",
      targetType: "license",
      targetId: result.license.id,
      targetLabel: result.license.celesi,
      details: { hardware_id: result.hardware_id, reason: req.body?.reason || "" },
    }).catch(() => {});
    res.json({ ok: true, ...result });
  }),
);

/** Riaktivizo pas çaktivizimit. */
router.post(
  "/dashboard/licenses/:id/reactivate",
  asyncHandler(async (req, res) => {
    const result = await reactivateLicenseRemote(req.params.id, {
      hardwareId: req.body?.hardware_id || req.body?.hardwareId,
      reason: req.body?.reason,
      actor: req.user,
    });
    await logAdminActivity({
      ...activityFromReq(req),
      action: "license_reactivate",
      targetType: "license",
      targetId: result.license.id,
      targetLabel: result.license.celesi,
      details: { hardware_id: result.hardware_id, reason: req.body?.reason || "" },
    }).catch(() => {});
    res.json({ ok: true, ...result });
  }),
);

/**
 * Fshi të dhënat lokale te POS (factory reset) — NUK çaktivizon licencën.
 * Body: { confirm: "FSHI TE DHENAT", reason?, hardware_id? }
 */
router.post(
  "/dashboard/licenses/:id/wipe-data",
  asyncHandler(async (req, res) => {
    const result = await requestWipeDataForLicense(req.params.id, {
      hardwareId: req.body?.hardware_id || req.body?.hardwareId,
      reason: req.body?.reason,
      confirm: req.body?.confirm,
      actor: req.user,
    });
    await logAdminActivity({
      ...activityFromReq(req),
      action: "license_wipe_data",
      targetType: "license",
      targetId: result.license_id,
      targetLabel: result.hardware_id || result.license_id,
      details: { hardware_id: result.hardware_id, reason: req.body?.reason || "" },
    }).catch(() => {});
    res.json({ ok: true, ...result });
  }),
);

/** Zgjat licencën me N muaj (nga sot ose nga data_skadimit nëse ende aktive). */
router.post(
  "/dashboard/licenses/:id/extend",
  asyncHandler(async (req, res) => {
    const months = Math.max(1, Math.min(36, Number(req.body?.months) || 12));
    const { getSupabase } = require("../db");
    const db = getSupabase();
    const { data: lic, error } = await db
      .from("licenses")
      .select("id, celesi, data_skadimit, statusi")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error || !lic) return res.status(404).json({ ok: false, gabim: "Licenca nuk u gjet." });
    const base =
      lic.data_skadimit && String(lic.data_skadimit) > todayISO()
        ? String(lic.data_skadimit)
        : todayISO();
    const data_skadimit = addMonthsISO(base, months);
    await updateLicense(lic.id, { data_skadimit });
    const license = await updateLicenseStatus(lic.id, "aktive");
    await logAdminActivity({
      ...activityFromReq(req),
      action: "license_extend",
      targetType: "license",
      targetId: license.id,
      targetLabel: license.celesi,
      details: { months, data_skadimit },
    }).catch(() => {});
    res.json({ ok: true, license, data_skadimit, months });
  }),
);

router.get(
  "/dashboard/ai-usage",
  asyncHandler(async (req, res) => {
    res.json({ ok: true, ...(await getAiUsageDashboard({ month: req.query.month })) });
  }),
);

/** Raportet = VETËM probleme (jo shitje). */
router.get(
  "/dashboard/reports",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, ...(await getProblemsReport()) });
  }),
);

router.get(
  "/dashboard/problems",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, ...(await getProblemsReport()) });
  }),
);

router.get(
  "/dashboard/billing/invoices",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, invoices: await listBillingInvoicesAsync() });
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
    const all = await listBillingInvoicesAsync();
    const inv = all.find((x) => x.id === req.params.id) || listBillingInvoices().find((x) => x.id === req.params.id);
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
    res.json({ ok: true, settings: await getSettingsAsync() });
  }),
);

router.put(
  "/dashboard/settings",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const settings = await updateSettingsAsync({
      ...body,
      _prices_are_marketing: true,
      package_prices_ui: body.package_prices_ui || body.package_prices || undefined,
    });
    res.json({ ok: true, settings });
  }),
);

module.exports = router;
