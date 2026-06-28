const { getClientById, normalizeItems } = require("./salesService");
const { getSupabase } = require("../db");
const { notifyKitchenUpdate } = require("./kdsEvents");
const { isBarMobileOrder, isKioskWaiterName } = require("../lib/orderSource");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchOrderedSales(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("sales_orders")
    .select(
      "id, table_number, waiter_name, waiter_id, items_json, total, ordered_at, created_at, local_order_id, device_id",
    )
    .eq("client_id", clientId)
    .eq("status", "ordered")
    .order("ordered_at", { ascending: true, nullsFirst: false })
    .limit(80);

  if (error) throw error;
  return (data || []).map(o => ({
    ...o,
    items_json: normalizeItems(o.items_json),
  }));
}

/** Porosi që duhen te banaku (QR, kamarier web, online, POS lokal) */
function isBanakOrder(order) {
  if (isBarMobileOrder(order)) return true;
  if (isKioskWaiterName(order?.waiter_name)) return true;
  const device = String(order?.device_id || "").trim();
  if (!device) return true;
  return !device.startsWith("WEB-");
}

async function getClientForKitchen(clientId) {
  const id = String(clientId || "").trim();
  if (!UUID_RE.test(id)) throw new Error("ID klienti nuk është i vlefshëm.");
  const client = await getClientById(id);
  if (!client) throw new Error("Klienti nuk u gjet.");
  return client;
}

/** Banak — porosi QR, kamarier, online, POS (rruga /kitchen/ në link) */
async function listBarOrders(clientId) {
  const orders = await fetchOrderedSales(clientId);
  return orders.filter(isBanakOrder);
}

/** Kuzhina — vetëm porosi ushqimi (rruga /bar/ në link) */
async function listKitchenOrders(clientId) {
  const orders = await fetchOrderedSales(clientId);
  return orders.filter(o => !isBanakOrder(o));
}

async function markKitchenOrderReady(clientId, orderId) {
  const db = getSupabase();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("sales_orders")
    .update({ status: "ready", ready_at: now })
    .eq("id", orderId)
    .eq("client_id", clientId)
    .eq("status", "ordered")
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Porosia nuk u gjet ose është përfunduar.");
  notifyKitchenUpdate(clientId, { order_id: orderId, status: "ready" });
  return data;
}

async function listRecentlyCancelledOrders(clientId, windowSec = 30) {
  const db = getSupabase();
  const since = new Date(Date.now() - windowSec * 1000).toISOString();
  const { data, error } = await db
    .from("sales_orders")
    .select(
      "id, table_number, waiter_name, waiter_id, items_json, total, ordered_at, created_at, closed_at, local_order_id, device_id",
    )
    .eq("client_id", clientId)
    .eq("status", "cancelled")
    .gte("closed_at", since)
    .order("closed_at", { ascending: false })
    .limit(40);

  if (error) throw error;
  return (data || []).map(o => ({
    ...o,
    items_json: normalizeItems(o.items_json),
    cancelled: true,
  }));
}

async function listBarCancelledOrders(clientId, windowSec = 30) {
  const orders = await listRecentlyCancelledOrders(clientId, windowSec);
  return orders.filter(isBanakOrder);
}

module.exports = {
  getClientForKitchen,
  listKitchenOrders,
  listBarOrders,
  listRecentlyCancelledOrders,
  listBarCancelledOrders,
  markKitchenOrderReady,
  isBanakOrder,
};
