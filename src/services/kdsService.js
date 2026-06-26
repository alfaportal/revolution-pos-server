const { getClientById, normalizeItems } = require("./salesService");
const { getSupabase } = require("../db");
const { notifyKitchenUpdate } = require("./kdsEvents");
const { isBarMobileOrder } = require("../lib/orderSource");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getClientForKitchen(clientId) {
  const id = String(clientId || "").trim();
  if (!UUID_RE.test(id)) throw new Error("ID klienti nuk është i vlefshëm.");
  const client = await getClientById(id);
  if (!client) throw new Error("Klienti nuk u gjet.");
  return client;
}

async function listKitchenOrders(clientId) {
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

async function listBarOrders(clientId) {
  const orders = await listKitchenOrders(clientId);
  return orders.filter(isBarMobileOrder);
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
  return orders.filter(isBarMobileOrder);
}

module.exports = {
  getClientForKitchen,
  listKitchenOrders,
  listBarOrders,
  listRecentlyCancelledOrders,
  listBarCancelledOrders,
  markKitchenOrderReady,
};
