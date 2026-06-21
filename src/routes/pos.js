const express = require("express");
const { licenseApiKeyOptional } = require("../middleware/auth");
const { syncCatalogFromPos } = require("../services/posSyncService");

const router = express.Router();

router.post("/catalog/sync", licenseApiKeyOptional, async (req, res) => {
  try {
    const result = await syncCatalogFromPos(req.body);
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
