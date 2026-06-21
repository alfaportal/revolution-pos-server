const express = require("express");
const { authRequired, superAdminOnly } = require("../middleware/auth");
const {
  listClients,
  listLicenses,
  createClient,
  createLicense,
  updateLicenseStatus,
  resetLicenseDevice,
  getDashboardStats,
  generateLicenseKey,
} = require("../services/licenseService");
const { listOwners, createOwner, setOwnerActive } = require("../services/userService");

const router = express.Router();

router.use(authRequired, superAdminOnly);

router.get("/stats", async (_req, res) => {
  try {
    res.json({ ok: true, ...(await getDashboardStats()) });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.get("/clients", async (_req, res) => {
  try {
    res.json({ ok: true, clients: await listClients() });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/clients", async (req, res) => {
  try {
    const client = await createClient(req.body);
    res.status(201).json({ ok: true, client });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/licenses", async (_req, res) => {
  try {
    res.json({ ok: true, licenses: await listLicenses() });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/licenses", async (req, res) => {
  try {
    const license = await createLicense(req.body);
    res.status(201).json({ ok: true, license });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/licenses/generate-key", (_req, res) => {
  res.json({ ok: true, celesi: generateLicenseKey() });
});

router.patch("/licenses/:id/status", async (req, res) => {
  try {
    const { statusi } = req.body;
    const allowed = ["aktive", "skaduar", "revokuar", "pezulluar"];
    if (!allowed.includes(statusi)) {
      return res.status(400).json({ gabim: "Status i pavlefshëm." });
    }
    const license = await updateLicenseStatus(req.params.id, statusi);
    res.json({ ok: true, license });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.post("/licenses/:id/reset-device", async (req, res) => {
  try {
    const license = await resetLicenseDevice(req.params.id);
    res.json({ ok: true, license });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.get("/owners", async (_req, res) => {
  try {
    res.json({ ok: true, owners: await listOwners() });
  } catch (e) {
    res.status(500).json({ gabim: e.message });
  }
});

router.post("/owners", async (req, res) => {
  try {
    const owner = await createOwner(req.body);
    res.status(201).json({ ok: true, owner });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

router.patch("/owners/:id/status", async (req, res) => {
  try {
    const { aktiv } = req.body;
    if (typeof aktiv !== "boolean") {
      return res.status(400).json({ gabim: "aktiv duhet true ose false." });
    }
    const owner = await setOwnerActive(req.params.id, aktiv);
    res.json({ ok: true, owner });
  } catch (e) {
    res.status(400).json({ gabim: e.message });
  }
});

module.exports = router;
