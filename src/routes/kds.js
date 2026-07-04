const express = require("express");
const { resolveKitchenClient } = require("../middleware/kitchenAuth");
const { requirePackageFeature } = require("../middleware/packageTier");
const { listKitchenOrders, listBarOrders, listRecentlyCancelledOrders, listBarCancelledOrders, markKitchenOrderReady, fetchOrderedSales, filterWaiterAcceptOrders } = require("../services/kdsService");
const { getLiveTablesForOwner } = require("../services/salesService");
const { subscribe } = require("../services/kdsEvents");
const { getStaffBrandingForClient } = require("../lib/staffBranding");
const { getWaiterByWebToken } = require("../services/waiterPinService");
const { getAssignmentState } = require("../services/waiterTablesService");

const router = express.Router();

function extractWaiterToken(req) {
  return String(req.query.w || req.body?.web_token || "").trim().toLowerCase();
}

/** Zgjidh kamarierin nga token-i personal (?w=) ose kthen null. */
async function resolveWaiterFromToken(clientId, req) {
  const token = extractWaiterToken(req);
  if (!token) return null;
  return getWaiterByWebToken(clientId, token);
}

/**
 * Filtron porositë sipas tavolinave të caktuara për kamarierin.
 * Nëse pronari nuk ka caktuar asnjë tavolinë, kthen krejt (pa filtrim).
 */
async function filterOrdersForWaiter(clientId, orders, waiterId) {
  const state = await getAssignmentState(clientId);
  if (!state.hasAny) return orders;
  const allowed = new Set(state.byWaiter.get(waiterId) || []);
  return (orders || []).filter(o => allowed.has(Number(o.table_number)));
}

router.get("/:slug/events", resolveKitchenClient, requirePackageFeature("kds"), (req, res) => {
  subscribe(req.kitchenClient.id, res);
});

router.get("/:slug/bar/tables/live", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const live = await getLiveTablesForOwner(req.kitchenClient.id);
    res.json({ ok: true, ...live });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/bar/orders", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    // Telefoni i kamarierit: të gjitha porositë në pritje — pa ndarje banak/kuzhinë.
    let orders = await fetchOrderedSales(client.id);
    let cancelled = await listRecentlyCancelledOrders(client.id);
    const branding = await getStaffBrandingForClient(client, req.params.slug);

    // Link personal i kamarierit: filtro vetëm tavolinat e caktuara.
    let assigned_waiter = null;
    const waiter = await resolveWaiterFromToken(client.id, req);
    if (waiter?.id) {
      assigned_waiter = { id: waiter.id, name: waiter.name };
      orders = await filterOrdersForWaiter(client.id, orders, waiter.id);
      orders = filterWaiterAcceptOrders(orders, waiter.id);
      cancelled = await filterOrdersForWaiter(client.id, cancelled, waiter.id);
    }

    res.json({
      ok: true,
      client_name: client.emri,
      kitchen_slug: client.kitchen_slug,
      ...branding,
      orders,
      cancelled,
      assigned_waiter,
    });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.get("/:slug/orders", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const orders = await listBarOrders(client.id);
    const cancelled = await listBarCancelledOrders(client.id);
    const branding = await getStaffBrandingForClient(client, req.params.slug);
    res.json({
      ok: true,
      client_name: client.emri,
      kitchen_slug: client.kitchen_slug,
      ...branding,
      orders,
      cancelled,
    });
  } catch (e) {
    res.status(404).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/orders/:orderId/accept", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const { acceptBarOrder } = require("../services/kdsService");

    // Rrjedha e re: kamarieri me link personal (?w=) — pranon pa PIN, i identifikuar tashmë.
    const waiter = await resolveWaiterFromToken(client.id, req);
    if (waiter?.id) {
      const order = await acceptBarOrder(client.id, req.params.orderId, {
        waiterId: waiter.id,
        waiterName: waiter.name,
      });
      res.json({ ok: true, order, accepted_by: waiter.name });
      return;
    }

    // Rrjedha e vjetër (ekran i përbashkët pa token): pranim me PIN.
    const pin = String(req.body?.pin || req.body?.waiter_pin || "").trim();
    if (!pin) {
      return res.status(400).json({
        ok: false,
        gabim: "Vendosni PIN-in e kamarierit që e pranon porosinë.",
      });
    }
    const { verifyWaiterPin } = require("../services/waiterPinService");
    const handler = await verifyWaiterPin(client.id, pin);
    const order = await acceptBarOrder(client.id, req.params.orderId, {
      waiterId: handler.id,
      waiterName: handler.name,
    });
    res.json({ ok: true, order, accepted_by: handler.name });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

// Refuzimi i porosisë nga kamarieri — 2 minuta grace për kamarierët e tjerë.
router.post("/:slug/orders/:orderId/refuse", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const waiter = await resolveWaiterFromToken(client.id, req);
    if (!waiter?.id) {
      return res.status(400).json({ ok: false, gabim: "Mungon identifikimi i kamarierit (link personal)." });
    }
    const { refuseBarOrderWithGrace } = require("../services/kdsService");
    const order = await refuseBarOrderWithGrace(client.id, req.params.orderId, {
      waiterId: waiter.id,
      waiterName: waiter.name,
    });
    res.json({ ok: true, order, grace_minutes: 2 });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

router.post("/:slug/orders/:orderId/ready", resolveKitchenClient, requirePackageFeature("kds"), async (req, res) => {
  try {
    const client = req.kitchenClient;
    const { markKitchenOrderReady } = require("../services/kdsService");
    const order = await markKitchenOrderReady(client.id, req.params.orderId);
    res.json({ ok: true, order });
  } catch (e) {
    res.status(400).json({ ok: false, gabim: e.message });
  }
});

module.exports = router;
