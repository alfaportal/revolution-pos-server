const express = require("express");
const { getWaiterBootstrap, submitWaiterOrder, closeWaiterTable } = require("../services/waiterService");

const router = express.Router();

router.get("/:clientId/bootstrap", async (req, res) => {
  try {
    const data = await getWaiterBootstrap(req.params.clientId);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.post("/:clientId/orders", async (req, res) => {
  try {
    const result = await submitWaiterOrder(req.params.clientId, req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:clientId/orders/close", async (req, res) => {
  try {
    const result = await closeWaiterTable(req.params.clientId, req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
