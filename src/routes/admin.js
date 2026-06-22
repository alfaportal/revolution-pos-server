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
  resetLicenseDevice,
  getDashboardStats,
  generateLicenseKey,
} = require("../services/licenseService");
const {
  listOwners,
  createOwner,
  updateOwner,
  deleteOwner,
  setOwnerActive,
  regenerateOwnerInvite,
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

router.get("/clients", asyncHandler(async (_req, res) => {
  res.json({ ok: true, clients: await listClients() });
}));

router.post("/clients", asyncHandler(async (req, res) => {
  console.log("[admin] POST /clients", { emri: req.body?.emri, tipi: req.body?.tipi });
  try {
    const client = await createClient(req.body);
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

router.delete("/clients/:id", asyncHandler(async (req, res) => {
  try {
    await deleteClient(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    const msg = logRouteError("admin:DELETE /clients", e);
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
  res.json({ ok: true, license });
}));

router.post("/licenses/:id/reset-device", asyncHandler(async (req, res) => {
  try {
    const license = await resetLicenseDevice(req.params.id);
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
    res.json({ ok: true, owner });
  } catch (e) {
    const msg = logRouteError("admin:POST /owners/:id/invite", e);
    res.status(400).json({ gabim: msg });
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
