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
  ackProblem,
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
const { normalizeProductLine } = require("../utils/productLine");
const {
  blockLicense,
  unblockLicense,
  updateLicense,
  updateLicenseStatus,
  updateClient,
  deleteLicense,
  deleteClient,
  revokeLicenseRemote,
  reactivateLicenseRemote,
  requestWipeDataForLicense,
} = require("../services/licenseService");
const {
  setOwnerPasswordForClient,
  sendPasswordResetForClient,
} = require("../services/userService");
const { addMonthsISO, todayISO } = require("../lib/licenseDates");
const { logAdminActivity, activityFromReq } = require("../services/activityLogService");
const { getPublicAppOrigin } = require("../lib/publicOrigin");

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
    const product = normalizeProductLine(req.query.product || req.query.industry || "kafene");
    if (product === "hotel") {
      const { getHotelClientDetail } = require("../lib/hotelAdminBridge");
      const detail = await getHotelClientDetail(req.params.id);
      return res.json({ ok: true, ...detail });
    }
    if (product === "market") {
      const { getMarketClientDetail } = require("../lib/marketAdminBridge");
      const detail = await getMarketClientDetail(req.params.id);
      return res.json({ ok: true, ...detail });
    }
    if (product === "security") {
      const { getSecurityClientDetail } = require("../lib/securityAdminBridge");
      const detail = await getSecurityClientDetail(req.params.id);
      return res.json({ ok: true, ...detail, product_line: "security" });
    }
    const detail = await getClientDetail(req.params.id);
    res.json({ ok: true, ...detail, product_line: "kafene" });
  }),
);

/** Master Admin — vendos fjalëkalim të ri për pronarin e klientit */
router.post(
  "/dashboard/clients/:id/set-password",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id || "").trim();
    const password = req.body?.password || req.body?.new_password;
    const result = await setOwnerPasswordForClient(id, password, {
      email: req.body?.email,
      emri: req.body?.emri,
      baseUrl: getPublicAppOrigin(),
    });
    await logAdminActivity({
      ...activityFromReq(req),
      action: "owner_password_set",
      targetType: "client",
      targetId: id,
      details: { created: result.created, owners: (result.owners || []).map((o) => o.email) },
    }).catch(() => {});
    res.json({ ok: true, ...result, product_line: "kafene" });
  }),
);

/** Master Admin — dërgo kod rivendosjeje me email */
router.post(
  "/dashboard/clients/:id/send-password-reset",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id || "").trim();
    const result = await sendPasswordResetForClient(id, getPublicAppOrigin());
    await logAdminActivity({
      ...activityFromReq(req),
      action: "owner_password_reset_email",
      targetType: "client",
      targetId: id,
      details: { sent: result.sent },
    }).catch(() => {});
    res.json({
      ok: true,
      message: `Kodi / ftesa u dërgua te: ${(result.sent || []).map((s) => s.email).join(", ")}`,
      ...result,
      product_line: "kafene",
    });
  }),
);

/**
 * Master Admin — ruaj klient (+ licenca) pa kufizime.
 * Body: { product_line?, emri, email, telefoni, …, licenses?: [{ id, celesi, hardware_id, device_id, statusi, data_skadimit }] }
 */
router.patch(
  "/dashboard/clients/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id || "").trim();
    const body = req.body || {};
    const product = normalizeProductLine(
      body.product_line || req.query.product || req.query.industry || "kafene",
    );

    if (product === "hotel") {
      const { updateHotelClient } = require("../lib/hotelAdminBridge");
      const result = await updateHotelClient(id, body);
      await logAdminActivity({
        ...activityFromReq(req),
        action: "client_update",
        targetType: "client",
        targetId: result.client?.id || id,
        targetLabel: result.client?.emri || body.emri,
        details: {
          licenses_updated: (result.licenses || []).map((l) => l.id),
          license_errors: result.license_errors || [],
          product_line: "hotel",
        },
      }).catch(() => {});
      return res.json({
        ok: true,
        client: result.client,
        licenses: result.licenses || [],
        license_errors: result.license_errors || [],
        product_line: "hotel",
      });
    }

    if (product === "market") {
      const { updateMarketClient } = require("../lib/marketAdminBridge");
      const result = await updateMarketClient(id, body);
      await logAdminActivity({
        ...activityFromReq(req),
        action: "client_update",
        targetType: "client",
        targetId: result.client?.id || id,
        targetLabel: result.client?.emri || body.emri,
        details: {
          licenses_updated: (result.licenses || []).map((l) => l.id),
          license_errors: result.license_errors || [],
          product_line: "market",
        },
      }).catch(() => {});
      return res.json({
        ok: true,
        client: result.client,
        licenses: result.licenses || [],
        license_errors: result.license_errors || [],
        product_line: "market",
      });
    }

    const licPatches = Array.isArray(body.licenses) ? body.licenses : [];

    // Kafene / POS — ruaj klientin GJITHMONË; licencat veç e veç (një gabim licence mos e prish klientin)
    const client = await updateClient(id, body);
    const licenses = [];
    const license_errors = [];
    for (const lp of licPatches) {
      if (!lp?.id) continue;
      try {
        const patch = {};
        const key = String(lp.celesi || lp.license_key || "").trim();
        if (key) patch.celesi = key;
        if (lp.hardware_id != null || lp.hardwareId != null) {
          const hw = String(lp.hardware_id || lp.hardwareId || "").trim();
          if (hw) patch.hardware_id = hw;
        }
        if (lp.device_id != null && String(lp.device_id).trim()) {
          patch.device_id = lp.device_id;
        }
        if (lp.statusi != null && String(lp.statusi).trim()) patch.statusi = lp.statusi;
        if (lp.data_skadimit != null && String(lp.data_skadimit).trim()) {
          patch.data_skadimit = lp.data_skadimit;
        }
        if (lp.max_terminals != null) patch.max_terminals = lp.max_terminals;
        if (!Object.keys(patch).length) continue;
        const license = await updateLicense(lp.id, patch);
        licenses.push(license);
      } catch (licErr) {
        license_errors.push({ id: lp.id, gabim: licErr.message || "Gabim licence" });
      }
    }

    await logAdminActivity({
      ...activityFromReq(req),
      action: "client_update",
      targetType: "client",
      targetId: client.id,
      targetLabel: client.emri,
      details: {
        licenses_updated: licenses.map((l) => l.id),
        license_errors,
      },
    }).catch(() => {});

    res.json({
      ok: true,
      client,
      licenses,
      license_errors,
      product_line: "kafene",
    });
  }),
);

/** Fshi krejt klientin (+ licencat) — Super Admin */
router.delete(
  "/dashboard/clients/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id || "").trim();
    const product = normalizeProductLine(req.query.product || req.query.industry || "kafene");
    if (product === "security") {
      const { deleteSecurityClient } = require("../lib/securityAdminBridge");
      await deleteSecurityClient(id);
      await logAdminActivity({
        ...activityFromReq(req),
        action: "client_delete",
        targetType: "client",
        targetId: id,
        details: { product_line: "security" },
      }).catch(() => {});
      return res.json({ ok: true, product_line: "security" });
    }
    if (product === "hotel") {
      const { deleteHotelClient } = require("../lib/hotelAdminBridge");
      await deleteHotelClient(id);
      await logAdminActivity({
        ...activityFromReq(req),
        action: "client_delete",
        targetType: "client",
        targetId: id,
        details: { product_line: "hotel" },
      }).catch(() => {});
      return res.json({ ok: true, product_line: "hotel" });
    }
    if (product === "market") {
      const { deleteMarketClient } = require("../lib/marketAdminBridge");
      await deleteMarketClient(id);
      await logAdminActivity({
        ...activityFromReq(req),
        action: "client_delete",
        targetType: "client",
        targetId: id,
        details: { product_line: "market" },
      }).catch(() => {});
      return res.json({ ok: true, product_line: "market" });
    }
    await deleteClient(id);
    await logAdminActivity({
      ...activityFromReq(req),
      action: "client_delete",
      targetType: "client",
      targetId: id,
    }).catch(() => {});
    res.json({ ok: true, product_line: "kafene" });
  }),
);

/** Master Admin — patch i lirë i çdo fushe licence */
router.patch(
  "/dashboard/licenses/:id",
  asyncHandler(async (req, res) => {
    const license = await updateLicense(req.params.id, req.body || {});
    await logAdminActivity({
      ...activityFromReq(req),
      action: "license_update",
      targetType: "license",
      targetId: license.id,
      targetLabel: license.celesi,
    }).catch(() => {});
    res.json({ ok: true, license });
  }),
);

router.get(
  "/dashboard/licenses",
  asyncHandler(async (req, res) => {
    const product = req.query.product || req.query.industry || "kafene";
    res.json({ ok: true, ...(await getLicensesView({ product })) });
  }),
);

/** Krijo klient (+ licencë + pronar) në një kërkesë */
router.post(
  "/dashboard/clients",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const hasOwner = Boolean(
      String(body.owner_email || "").trim()
      && String(body.owner_emri || "").trim()
      && String(body.owner_password || "").trim(),
    );

    if (hasOwner) {
      const { registerFullDashboardClient } = require("../services/dashboardClientRegister");
      const result = await registerFullDashboardClient(body, getPublicAppOrigin());
      await logAdminActivity({
        ...activityFromReq(req),
        action: "client_create",
        targetType: "client",
        targetId: result.client?.id || null,
        targetLabel: result.client?.emri || body.emri || "—",
        details: {
          license_id: result.license?.id,
          license_celesi: result.license_key || result.license?.celesi || null,
          owner_email: body.owner_email,
          product_line: result.product_line,
        },
      }).catch(() => {});
      return res.status(201).json(result);
    }

    const product = normalizeProductLine(
      body.product_line || body.industry_type || req.query.product,
    );
    const {
      generateHardwareLicenseKey,
      normalizeHardwareId,
      formatGrouped16,
    } = require("../lib/hardwareLicense");

    const wantLicense = req.body?.issue_license !== false && req.body?.issue_license !== "false";
    let celesi = String(req.body?.celesi || req.body?.license_key || "").trim();
    let hardwareId = String(req.body?.hardware_id || req.body?.hardwareId || "").trim();
    const licenseType =
      String(req.body?.license_type || req.body?.licenseType || "annual").toLowerCase() === "trial"
        ? "trial"
        : "annual";
    let dataSkadimit = req.body?.data_skadimit || null;
    let trialEndsAt = req.body?.trial_ends_at || null;
    let expiresAt = req.body?.expires_at || null;

    const hwHex = normalizeHardwareId(hardwareId);
    if (wantLicense && hwHex.length === 16) {
      hardwareId = formatGrouped16(hwHex);
      if (!celesi) {
        const gen = generateHardwareLicenseKey(hwHex, { licenseType });
        celesi = gen.licenseKey;
        if (gen.expiresAt) {
          expiresAt = gen.expiresAt;
          dataSkadimit = String(gen.expiresAt).slice(0, 10);
        }
        if (gen.licenseType === "trial") {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() + (gen.trialDays || 7));
          trialEndsAt = d.toISOString();
          dataSkadimit = trialEndsAt.slice(0, 10);
        }
      }
    }

    if (product === "security") {
      const { registerSecurityClient } = require("../lib/securityAdminBridge");
      const result = await registerSecurityClient(req.body || {});
      await logAdminActivity({
        ...activityFromReq(req),
        action: "client_create",
        targetType: "client",
        targetId: result.client?.id || null,
        targetLabel: result.client?.emri || req.body?.emri || "Security",
        details: {
          license_key: result.license_key || null,
          hardware_id: result.hardware_id || null,
          product_line: "security",
        },
      }).catch(() => {});
      return res.status(201).json({
        ok: true,
        client: result.client,
        license: result.license,
        license_key: result.license_key,
        celesi: result.license_key,
        hardware_id: result.hardware_id || null,
        product_line: "security",
        already_exists: !!result.already_exists,
      });
    }

    if (product === "hotel") {
      const { registerHotelClient } = require("../lib/hotelAdminBridge");
      const result = await registerHotelClient({
        ...(req.body || {}),
        celesi: celesi || undefined,
        license_key: celesi || undefined,
        hardware_id: hardwareId || undefined,
        hardwareId: hardwareId || undefined,
        license_type: licenseType,
        issue_license: wantLicense,
      });
      await logAdminActivity({
        ...activityFromReq(req),
        action: "client_create",
        targetType: "client",
        targetId: result.client?.id || null,
        targetLabel: result.client?.emri || req.body?.emri || "Hotel",
        details: {
          license_key: result.license_key || null,
          hardware_id: result.hardware_id || null,
          product_line: "hotel",
        },
      }).catch(() => {});
      return res.status(201).json({
        ok: true,
        client: result.client,
        license: result.license,
        license_key: result.license_key,
        celesi: result.license_key,
        hardware_id: result.hardware_id || null,
        product_line: "hotel",
        already_exists: !!result.already_exists,
      });
    }

    if (product === "market") {
      const { registerMarketClient } = require("../lib/marketAdminBridge");
      const { normalizeClientTipi, MARKET_TIPI } = require("../utils/businessTipi");
      let tipi = normalizeClientTipi(req.body?.tipi || "minimarket");
      if (!MARKET_TIPI.includes(tipi)) tipi = "minimarket";
      const result = await registerMarketClient({
        ...(req.body || {}),
        tipi,
        celesi: celesi || undefined,
        license_key: celesi || undefined,
        hardware_id: hardwareId || undefined,
        hardwareId: hardwareId || undefined,
        license_type: licenseType,
        data_skadimit: dataSkadimit,
        trial_ends_at: trialEndsAt,
        expires_at: expiresAt,
        issue_license: wantLicense,
      });
      await logAdminActivity({
        ...activityFromReq(req),
        action: "client_create",
        targetType: "client",
        targetId: result.client?.id || null,
        targetLabel: result.client?.emri || req.body?.emri || "Market",
        details: {
          license_key: result.license_key || null,
          hardware_id: result.hardware_id || null,
          product_line: "market",
        },
      }).catch(() => {});
      return res.status(201).json({
        ok: true,
        client: result.client,
        license: result.license,
        license_key: result.license_key,
        celesi: result.license_key,
        hardware_id: result.hardware_id || null,
        product_line: "market",
        already_exists: !!result.already_exists,
      });
    }

    if (product === "furra") {
      const err = new Error("FURRA nuk menaxhohet nga ky server.");
      err.status = 400;
      throw err;
    }

    const { createClient, createLicense } = require("../services/licenseService");
    const { normalizeClientTipi } = require("../utils/businessTipi");
    let tipi = normalizeClientTipi(req.body?.tipi || "restorant");
    if (["hotel_restorant", "furre_buke", "pasticeri"].includes(tipi)) tipi = "restorant";
    const client = await createClient({
      ...(req.body || {}),
      tipi,
      product_line: "kafene",
    });
    let license = null;
    if (wantLicense) {
      try {
        license = await createLicense({
          client_id: client.id,
          app_type: req.body?.app_type,
          product_line: "kafene",
          license_type: licenseType,
          muaj: licenseType === "trial" ? 1 : req.body?.muaj || 12,
          max_terminals: req.body?.max_terminals || 1,
          celesi: celesi || undefined,
          hardware_id: hwHex.length === 16 ? hardwareId : undefined,
          data_skadimit: dataSkadimit || undefined,
          // annual → null (jo 3 muaj “trial” të rremë)
          trial_ends_at: licenseType === "trial" ? (trialEndsAt || undefined) : null,
        });
      } catch (e) {
        console.warn("[super] kafene license issue:", e.message);
        const err = new Error(e.message || "Licenca dështoi");
        err.status = 400;
        throw err;
      }
    }
    await logAdminActivity({
      ...activityFromReq(req),
      action: "client_create",
      targetType: "client",
      targetId: client.id,
      targetLabel: client.emri,
      details: {
        license_id: license?.id,
        license_celesi: license?.celesi || celesi || null,
        hardware_id: hardwareId || null,
      },
    }).catch(() => {});
    res.status(201).json({
      ok: true,
      client,
      license,
      hardware_id: hardwareId || null,
      product_line: "kafene",
    });
  }),
);

router.post(
  "/dashboard/clients/send-welcome-email",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const to = String(body.to || body.owner_email || "").trim();
    if (!to) throw new Error("Mungon email i pronarit.");
    const { sendOwnerWelcomeCredentialsEmail, isEmailConfigured } = require("../services/emailService");
    if (!isEmailConfigured()) {
      return res.json({ ok: true, emailed: false, skipped: true, reason: "email_not_configured" });
    }
    await sendOwnerWelcomeCredentialsEmail({
      to,
      ownerName: body.ownerName || body.owner_emri,
      clientName: body.clientName || body.emri,
      ownerUrl: body.ownerUrl || body.owner_url,
      password: body.password || body.password_plain,
      licenseKey: body.licenseKey || body.license_key || body.celesi,
      expiresAt: body.expiresAt || body.expires_at,
    });
    res.json({ ok: true, emailed: true });
  }),
);

/** Fshi krejt licencën — POS: wipe remote; Security: bridge te serveri i Security-t */
router.delete(
  "/dashboard/licenses/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id || "").trim();
    const product = normalizeProductLine(
      req.query.product || req.query.industry || req.body?.product_line || "kafene",
    );
    if (product === "security") {
      const { deleteSecurityLicense } = require("../lib/securityAdminBridge");
      await deleteSecurityLicense(id);
      await logAdminActivity({
        ...activityFromReq(req),
        action: "license_delete",
        targetType: "license",
        targetId: id,
        details: { product_line: "security" },
      }).catch(() => {});
      return res.json({ ok: true, product_line: "security" });
    }
    if (product === "hotel") {
      const { deleteHotelLicense } = require("../lib/hotelAdminBridge");
      await deleteHotelLicense(id);
      await logAdminActivity({
        ...activityFromReq(req),
        action: "license_delete",
        targetType: "license",
        targetId: id,
        details: { product_line: "hotel" },
      }).catch(() => {});
      return res.json({ ok: true, product_line: "hotel" });
    }
    if (product === "market") {
      const { deleteMarketLicense } = require("../lib/marketAdminBridge");
      await deleteMarketLicense(id);
      await logAdminActivity({
        ...activityFromReq(req),
        action: "license_delete",
        targetType: "license",
        targetId: id,
        details: { product_line: "market" },
      }).catch(() => {});
      return res.json({ ok: true, product_line: "market" });
    }
    try {
      await revokeLicenseRemote(id, {
        hardwareId: req.body?.hardware_id || req.body?.hardwareId || req.query?.hardware_id,
        reason: "Fshirë nga Super Admin",
        actor: req.user,
      });
    } catch (e) {
      console.warn("[super] revoke before delete:", e.message || e);
    }
    await deleteLicense(id);
    await logAdminActivity({
      ...activityFromReq(req),
      action: "license_delete",
      targetType: "license",
      targetId: req.params.id,
    }).catch(() => {});
    res.json({ ok: true });
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
    const product = normalizeProductLine(
      req.query.product || req.body?.product_line || req.query.industry || "kafene",
    );
    if (product === "hotel") {
      const { revokeHotelLicense } = require("../lib/hotelAdminBridge");
      const result = await revokeHotelLicense(req.params.id, {
        reason: req.body?.reason,
        hardware_id: req.body?.hardware_id || req.body?.hardwareId,
      });
      await logAdminActivity({
        ...activityFromReq(req),
        action: "license_revoke",
        targetType: "license",
        targetId: req.params.id,
        details: {
          hardware_id: req.body?.hardware_id || req.body?.hardwareId || "",
          reason: req.body?.reason || "",
          product_line: "hotel",
        },
      }).catch(() => {});
      return res.json({ ok: true, ...result, product_line: "hotel" });
    }
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

/** Shëno problem si të zgjidhur (pa prekur ID/email/çelës — ato te Klientët). */
router.post(
  "/dashboard/problems/ack",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const row = ackProblem({
      problem_key: body.problem_key,
      kind: body.kind,
      client_id: body.client_id || body.id || null,
      note: body.note,
      resolution: body.resolution,
    });
    res.json({ ok: true, ack: row });
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
