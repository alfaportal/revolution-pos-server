const express = require("express");
const { licenseApiKeyOptional } = require("../middleware/auth");
const { syncSaleFromPos, updateActiveSaleFromPos } = require("../services/salesService");

const router = express.Router();

/**
 * POST /api/v1/sales/sync
 * POS Electron dërgon shitje në kohë reale (zakonisht closed)
 */
router.post("/sync", licenseApiKeyOptional, async (req, res) => {
  try {
    const sale = await syncSaleFromPos(req.body);
    res.status(201).json({ ok: true, sale });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

/**
 * POST /api/v1/sales/update
 * Përditëson porosinë aktive (ordered / cancelled) — tavolinat live
 */
router.post("/update", licenseApiKeyOptional, async (req, res) => {
  try {
    const sale = await updateActiveSaleFromPos(req.body);
    res.json({ ok: true, sale });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
