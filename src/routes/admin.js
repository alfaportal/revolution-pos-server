const express = require("express");
const { authRequired, superAdminOnly } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");
const { logRouteError } = require("../lib/errors");
const {
  listClients,
  listLicenses,
  createClient,
  updateClient,
  deleteClient,
  createLicense,
  updateLicense,
  deleteLicense,
  updateLicenseStatus,
  blockLicense,
  unblockLicense,
  resetLicenseDevice,
  regenerateKitchenAccess,
  getDashboardStats,
  generateLicenseKey,
} = require("../services/licenseService");
const { PACKAGE_TIERS, TIER_LABELS, featuresForTier } = require("../lib/packages");
const { getFiscalSettings, updateFiscalSettings } = require("../services/fiscalService");
const { getDailyEmergencyCode, isMasterPinConfigured } = require("../lib/emergencyPin");
const { logAdminActivity, listAdminActivityLog, activityFromReq } = require("../services/activityLogService");
const {
  listOwners,
  createOwner,
  updateOwner,
  deleteOwner,
  setOwnerActive,
  regenerateOwnerInvite,
  adminResetOwnerPassword,
} = require("../services/userService");

function requestBaseUrl(req) {
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  const host = req.get("x-forwarded-host") || req.get("host");
  return `${proto}://${host}`;
}

const router = express.Router();

router.use(authRequired, superAdminOnly);

router.get("/stats", asyncHandler(async (_req, res) => {
  res.json({ ok: true, ...(await getDashboardStats()) });
}));

router.get("/package-tiers", (_req, res) => {
  res.json({
    ok: true,
    tiers: PACKAGE_TIERS.map(id => ({
      id,
      label: TIER_LABELS[id] || id,
      features: featuresForTier(id),
    })),
  });
});

router.get("/emergency-code", (_req, res) => {
  res.json({
    ok: true,
    configured: isMasterPinConfigured(),
    daily_code: isMasterPinConfigured() ? getDailyEmergencyCode() : null,
    hint: "Kodi ditor për hapje offline POS në emergjence (ndryshon çdo ditë).",
  });
});

router.get("/activity-log", asyncHandler(async (req, res) => {
  const logs = await listAdminActivityLog({ limit: req.query.limit });
  res.json({ ok: true, logs });
}));

router.get("/clients", asyncHandler(async (_req, res) => {
  res.json({ ok: true, clients: await listClients() });
}));

router.post("/clients", asyncHandler(async (req, res) => {
  console.log("[admin] POST /clients", { emri: req.body?.emri, tipi: req.body?.tipi });
  try {
    const client = await createClient(req.body);
    await logAdminActivity({
      ...activityFromReq(req),
      action: "client_create",
      targetType: "client",
      targetId: client.id,
      targetLabel: client.emri,
    });
    console.log("[admin] Klienti u krijua:", client.id);
    res.status(201).json({ ok: true, client });
  } catch (e) {
    const msg = logRouteError("admin:POST /clients", e, { body: req.body });
    res.status(400).json({ gabim: msg, code: e?.code || null });
  }
}));

router.patch("/clients/:id", asyncHandler(async (req, res) => {
  try {
    const client = await updateClient(req.params.id, req.body);
    res.json({ ok: true, client });
  } catch (e) {
    const msg = logRouteError("admin:PATCH /clients", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.get("/clients/:id/fiscal", asyncHandler(async (req, res) => {
  try {
    const settings = await getFiscalSettings(req.params.id);
    res.json({ ok: true, settings });
  } catch (e) {
    const msg = logRouteError("admin:GET /clients/:id/fiscal", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.patch("/clients/:id/fiscal", asyncHandler(async (req, res) => {
  try {
    const settings = await updateFiscalSettings(req.params.id, req.body);
    res.json({ ok: true, settings });
  } catch (e) {
    const msg = logRouteError("admin:PATCH /clients/:id/fiscal", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.delete("/clients/:id", asyncHandler(async (req, res) => {
  try {
    await deleteClient(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    const msg = logRouteError("admin:DELETE /clients", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.post("/clients/:id/regenerate-kitchen-access", asyncHandler(async (req, res) => {
  try {
    const base = requestBaseUrl(req);
    const client = await regenerateKitchenAccess(req.params.id);
    res.json({
      ok: true,
      client,
      kitchen_url: buildKitchenUrl(base, client, "kitchen"),
      bar_url: buildKitchenUrl(base, client, "bar"),
      waiter_url: buildKitchenUrl(base, client, "waiter"),
      kiosk_url: `${buildKitchenUrl(base, client, "kiosk")}&table=1`,
    });
  } catch (e) {
    const msg = logRouteError("admin:POST /clients/:id/regenerate-kitchen-access", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.get("/licenses", asyncHandler(async (_req, res) => {
  res.json({ ok: true, licenses: await listLicenses() });
}));

router.post("/licenses", asyncHandler(async (req, res) => {
  try {
    const license = await createLicense(req.body);
    res.status(201).json({ ok: true, license });
  } catch (e) {
    const msg = logRouteError("admin:POST /licenses", e);
    res.status(400).json({ gabim: msg, code: e?.code || null });
  }
}));

router.get("/licenses/generate-key", (_req, res) => {
  res.json({ ok: true, celesi: generateLicenseKey() });
});

router.patch("/licenses/:id", asyncHandler(async (req, res) => {
  try {
    const license = await updateLicense(req.params.id, req.body);
    res.json({ ok: true, license });
  } catch (e) {
    const msg = logRouteError("admin:PATCH /licenses", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.delete("/licenses/:id", asyncHandler(async (req, res) => {
  try {
    await deleteLicense(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    const msg = logRouteError("admin:DELETE /licenses", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.patch("/licenses/:id/status", asyncHandler(async (req, res) => {
  const { statusi } = req.body;
  const allowed = ["aktive", "skaduar", "revokuar", "pezulluar"];
  if (!allowed.includes(statusi)) {
    return res.status(400).json({ gabim: "Status i pavlefshëm." });
  }
  const license = await updateLicenseStatus(req.params.id, statusi);
  await logAdminActivity({
    ...activityFromReq(req),
    action: statusi === "aktive" ? "license_unblock" : "license_block",
    targetType: "license",
    targetId: license.id,
    targetLabel: license.clients?.emri || license.celesi,
    details: { statusi, force_logout: statusi !== "aktive" },
  });
  res.json({ ok: true, license, force_logout: statusi !== "aktive" });
}));

router.post("/licenses/:id/block", asyncHandler(async (req, res) => {
  const license = await blockLicense(req.params.id);
  await logAdminActivity({
    ...activityFromReq(req),
    action: "license_block",
    targetType: "license",
    targetId: license.id,
    targetLabel: license.clients?.emri || license.celesi,
    details: { statusi: "pezulluar", force_logout: true },
  });
  res.json({ ok: true, license, force_logout: true, message: "POS do të shkyçet brenda ~60 sekondave." });
}));

router.post("/licenses/:id/unblock", asyncHandler(async (req, res) => {
  const license = await unblockLicense(req.params.id);
  await logAdminActivity({
    ...activityFromReq(req),
    action: "license_unblock",
    targetType: "license",
    targetId: license.id,
    targetLabel: license.clients?.emri || license.celesi,
    details: { statusi: "aktive" },
  });
  res.json({ ok: true, license });
}));

router.post("/licenses/:id/reset-device", asyncHandler(async (req, res) => {
  try {
    const license = await resetLicenseDevice(req.params.id);
    await logAdminActivity({
      ...activityFromReq(req),
      action: "license_reset_device",
      targetType: "license",
      targetId: license.id,
      targetLabel: license.clients?.emri || license.celesi,
    });
    res.json({ ok: true, license });
  } catch (e) {
    const msg = logRouteError("admin:POST /licenses/:id/reset-device", e);
    res.status(400).json({ gabim: msg });
  }
}));

/** Alias PATCH — disa klientë/proxy e pranojnë më mirë PATCH */
router.patch("/licenses/:id/reset-device", asyncHandler(async (req, res) => {
  try {
    const license = await resetLicenseDevice(req.params.id);
    res.json({ ok: true, license });
  } catch (e) {
    const msg = logRouteError("admin:PATCH /licenses/:id/reset-device", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.get("/owners", asyncHandler(async (req, res) => {
  res.json({ ok: true, owners: await listOwners(requestBaseUrl(req)) });
}));

router.post("/owners", asyncHandler(async (req, res) => {
  console.log("[admin] POST /owners", { emri: req.body?.emri, email: req.body?.email });
  try {
    const owner = await createOwner(req.body, requestBaseUrl(req));
    console.log("[admin] Pronari u krijua:", owner.id);
    res.status(201).json({ ok: true, owner });
  } catch (e) {
    const msg = logRouteError("admin:POST /owners", e, { body: { ...req.body, password: "[redacted]" } });
    res.status(400).json({ gabim: msg, code: e?.code || null });
  }
}));

router.post("/owners/:id/invite", asyncHandler(async (req, res) => {
  try {
    const owner = await regenerateOwnerInvite(req.params.id, requestBaseUrl(req));
    await logAdminActivity({
      ...activityFromReq(req),
      action: "owner_invite_resend",
      targetType: "owner",
      targetId: owner.id,
      targetLabel: owner.email,
    });
    res.json({ ok: true, owner });
  } catch (e) {
    const msg = logRouteError("admin:POST /owners/:id/invite", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.post("/owners/:id/reset-password", asyncHandler(async (req, res) => {
  try {
    const owner = await adminResetOwnerPassword(req.params.id, requestBaseUrl(req));
    await logAdminActivity({
      ...activityFromReq(req),
      action: "owner_reset_password",
      targetType: "owner",
      targetId: owner.id,
      targetLabel: owner.email,
    });
    res.json({
      ok: true,
      owner,
      message: owner.account_status === "pending"
        ? "U dërgua email me link ftese të ri."
        : "U dërgua email me kod rivendosjeje fjalëkalimi.",
    });
  } catch (e) {
    const msg = logRouteError("admin:POST /owners/:id/reset-password", e);
    res.status(400).json({ gabim: msg, code: e?.code || null });
  }
}));

router.patch("/owners/:id", asyncHandler(async (req, res) => {
  try {
    const owner = await updateOwner(req.params.id, req.body, requestBaseUrl(req));
    res.json({ ok: true, owner });
  } catch (e) {
    const msg = logRouteError("admin:PATCH /owners", e, { body: { ...req.body, password: "[redacted]" } });
    res.status(400).json({ gabim: msg });
  }
}));

router.delete("/owners/:id", asyncHandler(async (req, res) => {
  try {
    await deleteOwner(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    const msg = logRouteError("admin:DELETE /owners", e);
    res.status(400).json({ gabim: msg });
  }
}));

router.post("/users", asyncHandler(async (req, res) => {
  console.log("[admin] POST /users (alias → owners)");
  try {
    const owner = await createOwner(req.body, requestBaseUrl(req));
    res.status(201).json({ ok: true, owner });
  } catch (e) {
    const msg = logRouteError("admin:POST /users", e);
    res.status(400).json({ gabim: msg, code: e?.code || null });
  }
}));

router.get("/users", asyncHandler(async (req, res) => {
  res.json({ ok: true, owners: await listOwners(requestBaseUrl(req)) });
}));

router.patch("/owners/:id/status", asyncHandler(async (req, res) => {
  const { aktiv } = req.body;
  if (typeof aktiv !== "boolean") {
    return res.status(400).json({ gabim: "aktiv duhet true ose false." });
  }
  const owner = await setOwnerActive(req.params.id, aktiv);
  res.json({ ok: true, owner });
}));

module.exports = router;
