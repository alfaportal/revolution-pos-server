const { getClientById, normalizeItems } = require("./salesService");
const { getSupabase } = require("../db");
const { notifyKitchenUpdate } = require("./kdsEvents");
const { isBarMobileOrder, isKioskWaiterName, isDirectCustomerKitchenOrder, isStaffWaiterOrder, WEB_KIOSK, WEB_PUBLIC } = require("../lib/orderSource");
const { isDrinkCategory, isFoodCategory } = require("../lib/menuGroups");
const { selectWithAcceptanceFallback, updateOrdersAcceptance, normalizeAcceptanceFields, isMissingAcceptanceColumnError } = require("../lib/salesOrderSelect");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const categoryCache = new Map();
const CATEGORY_CACHE_MS = 60_000;
const REFUSAL_GRACE_MS = 2 * 60 * 1000;

function isMissingRefusalColumnError(error) {
  return /refused_|order_expires_at/i.test(String(error?.message || error || ""));
}

function parseRefusedWaiterIds(order) {
  const raw = order?.refused_by_waiter_ids;
  if (Array.isArray(raw)) return raw.map(id => String(id || "").trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(id => String(id || "").trim()).filter(Boolean);
    } catch { /* ignore */ }
  }
  return [];
}

function normalizeRefusalFields(row = {}) {
  return {
    ...row,
    refused_at: row.refused_at ?? null,
    order_expires_at: row.order_expires_at ?? null,
    refused_by_waiter_ids: parseRefusedWaiterIds(row),
  };
}

/** Porosi që kërkojnë PRANO/REFUZO (jo porositë e kamarierit nga telefoni). */
function needsWaiterAcceptance(order) {
  if (!order || isStaffWaiterOrder(order)) return false;
  const device = String(order?.device_id || "").trim().toUpperCase();
  if (device === WEB_KIOSK || device === WEB_PUBLIC) return true;
  if (isKioskWaiterName(order?.waiter_name)) return true;
  if (device && !device.startsWith("WEB-")) return true;
  return false;
}

function isOrderExpired(order, nowMs = Date.now()) {
  const exp = order?.order_expires_at;
  if (!exp) return false;
  return new Date(exp).getTime() <= nowMs;
}

function waiterRefusedOrder(order, waiterId) {
  const wid = String(waiterId || "").trim().toLowerCase();
  if (!wid) return false;
  return parseRefusedWaiterIds(order).some(id => id.toLowerCase() === wid);
}

/** Filtron porositë për modalin PRANO/REFUZO të kamarierit. */
function filterWaiterAcceptOrders(orders, waiterId) {
  const wid = String(waiterId || "").trim();
  return (orders || []).filter(o => {
    if (!needsWaiterAcceptance(o)) return false;
    if (o.accepted_at || String(o.accepted_by_waiter_name || "").trim()) return false;
    if (waiterRefusedOrder(o, wid)) return false;
    if (isOrderExpired(o)) return false;
    return true;
  });
}

async function fetchOrderedSales(clientId) {
  const db = getSupabase();
  const base =
    "id, table_number, waiter_name, waiter_id, items_json, total, ordered_at, created_at, local_order_id, device_id";
  const refusalExtra = ", refused_at, order_expires_at, refused_by_waiter_ids";

  async function runQuery(withAcceptance, withRefusal) {
    const select = [
      base,
      withAcceptance ? ", accepted_by_waiter_id, accepted_by_waiter_name, accepted_at" : "",
      withRefusal ? refusalExtra : "",
    ].join("");
    return db
      .from("sales_orders")
      .select(select)
      .eq("client_id", clientId)
      .eq("status", "ordered")
      .order("ordered_at", { ascending: true, nullsFirst: false })
      .limit(200);
  }

  let result = await runQuery(true, true);
  if (result.error && isMissingRefusalColumnError(result.error)) {
    result = await runQuery(true, false);
  }
  if (result.error && isMissingAcceptanceColumnError(result.error)) {
    result = await runQuery(false, false);
  }
  if (result.error) throw result.error;

  return (result.data || []).map(o => normalizeRefusalFields(normalizeAcceptanceFields(o))).map(o => ({
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

async function loadCategoryLookup(clientId) {
  const key = String(clientId);
  const cached = categoryCache.get(key);
  if (cached && Date.now() - cached.at < CATEGORY_CACHE_MS) {
    return cached.lookup;
  }

  const db = getSupabase();
  const { data, error } = await db
    .from("pos_menu_items")
    .select("name, local_id, category")
    .eq("client_id", clientId);
  if (error) throw error;

  const byName = new Map();
  const byLocalId = new Map();
  for (const row of data || []) {
    const name = String(row.name || "").trim().toLowerCase();
    const cat = String(row.category || "").trim();
    if (name && cat) byName.set(name, cat);
    if (row.local_id != null && cat) byLocalId.set(String(row.local_id), cat);
  }

  const lookup = { byName, byLocalId };
  categoryCache.set(key, { at: Date.now(), lookup });
  return lookup;
}

function resolveItemCategory(item, lookup) {
  const inline = String(item.category || item.kategoria || "").trim();
  if (inline) return inline;
  const name = String(item.name || "").trim().toLowerCase();
  if (name && lookup.byName.has(name)) return lookup.byName.get(name);
  const menuId = item.menu_id ?? item.menu_item_id ?? item.local_id ?? item.id;
  if (menuId != null && lookup.byLocalId.has(String(menuId))) {
    return lookup.byLocalId.get(String(menuId));
  }
  return "";
}

function isKitchenItem(item, lookup) {
  const cat = resolveItemCategory(item, lookup);
  if (cat) return isFoodCategory(cat);
  return false;
}

function isBarItem(item, lookup) {
  const cat = resolveItemCategory(item, lookup);
  if (cat) return isDrinkCategory(cat);
  return true;
}

function itemsTotal(items) {
  return (items || []).reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0,
  );
}

function mapOrderWithItems(order, items) {
  if (!items.length) return null;
  return {
    ...order,
    items_json: items,
    total: itemsTotal(items),
  };
}

async function getClientForKitchen(clientId) {
  const id = String(clientId || "").trim();
  if (!UUID_RE.test(id)) throw new Error("ID klienti nuk është i vlefshëm.");
  const client = await getClientById(id);
  if (!client) throw new Error("Klienti nuk u gjet.");
  return client;
}

/** Banak — porosi QR, kamarier, online, POS (rruga /bar/ në link) */
async function listBarOrders(clientId) {
  const orders = await fetchOrderedSales(clientId);
  const lookup = await loadCategoryLookup(clientId);
  const result = [];

  for (const order of orders) {
    if (!isBanakOrder(order)) continue;
    const items = normalizeItems(order.items_json).filter(it => isBarItem(it, lookup));
    const mapped = mapOrderWithItems(order, items.length ? items : normalizeItems(order.items_json));
    if (mapped) result.push(mapped);
  }

  return result;
}

/** Kuzhina KDS — vetëm artikuj ushqimi (rruga /kitchen/ në link) */
async function listKitchenOrders(clientId) {
  const orders = await fetchOrderedSales(clientId);
  const lookup = await loadCategoryLookup(clientId);
  const result = [];

  for (const order of orders) {
    if (isDirectCustomerKitchenOrder(order)) continue;
    const items = normalizeItems(order.items_json).filter(it => isKitchenItem(it, lookup));
    const mapped = mapOrderWithItems(order, items);
    if (mapped) result.push(mapped);
  }

  return result;
}

async function acceptBarOrder(clientId, orderId, { waiterId = null, waiterName = "" } = {}) {
  const db = getSupabase();
  const name = String(waiterName || "").trim();
  const { ids } = await updateOrdersAcceptance(db, {
    clientId,
    orderIds: [orderId],
    waiterId,
    waiterName: name,
  });
  if (!ids.length) throw new Error("Porosia nuk u gjet, është pranuar tashmë, ose është mbyllur.");

  const { data, error } = await db
    .from("sales_orders")
    .select("*")
    .eq("id", orderId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Porosia nuk u gjet.");

  try {
    await db
      .from("sales_orders")
      .update({
        order_expires_at: null,
        refused_at: null,
        refused_by_waiter_ids: [],
      })
      .eq("id", orderId)
      .eq("client_id", clientId);
  } catch (err) {
    if (!isMissingRefusalColumnError(err)) throw err;
  }

  notifyKitchenUpdate(clientId, { order_id: orderId, status: "accepted", accepted_by: name });
  return data;
}

async function refuseBarOrderWithGrace(clientId, orderId, { waiterId = null, waiterName = "" } = {}) {
  const db = getSupabase();
  const wid = String(waiterId || "").trim();
  if (!wid) throw new Error("Mungon identifikimi i kamarierit.");

  const { data: order, error: fetchErr } = await db
    .from("sales_orders")
    .select("*")
    .eq("id", orderId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!order) throw new Error("Porosia nuk u gjet.");
  if (String(order.status || "") !== "ordered") {
    throw new Error("Porosia nuk është më aktive.");
  }
  if (!needsWaiterAcceptance(order)) {
    throw new Error("Kjo porosi nuk refuzohet nga ky ekran.");
  }
  if (order.accepted_at || String(order.accepted_by_waiter_name || "").trim()) {
    throw new Error("Porosia është pranuar tashmë.");
  }

  const normalized = normalizeRefusalFields(order);
  if (waiterRefusedOrder(normalized, wid)) {
    return normalized;
  }

  const refusedIds = parseRefusedWaiterIds(normalized);
  refusedIds.push(wid);
  const now = new Date();
  const patch = {
    refused_by_waiter_ids: refusedIds,
  };
  if (!normalized.refused_at) {
    patch.refused_at = now.toISOString();
    patch.order_expires_at = new Date(now.getTime() + REFUSAL_GRACE_MS).toISOString();
  }

  const { data, error } = await db
    .from("sales_orders")
    .update(patch)
    .eq("id", orderId)
    .eq("client_id", clientId)
    .eq("status", "ordered")
    .select("*")
    .maybeSingle();

  if (error) {
    if (isMissingRefusalColumnError(error)) {
      throw new Error("Mungon migrimi 040_order_refusal_grace.sql në Supabase.");
    }
    throw error;
  }
  if (!data) throw new Error("Porosia nuk u refuzua.");

  notifyKitchenUpdate(clientId, {
    order_id: orderId,
    status: "refused",
    refused_by: String(waiterName || "").trim() || wid,
  });
  return normalizeRefusalFields(data);
}

async function expireRefusedOrders() {
  const db = getSupabase();
  const now = new Date().toISOString();

  let rows;
  try {
    const { data, error } = await db
      .from("sales_orders")
      .select("id, client_id")
      .eq("status", "ordered")
      .not("order_expires_at", "is", null)
      .lt("order_expires_at", now);
    if (error) throw error;
    rows = data || [];
  } catch (err) {
    if (isMissingRefusalColumnError(err)) return { expired: 0 };
    throw err;
  }

  let expired = 0;
  for (const row of rows) {
    const { error: updErr } = await db
      .from("sales_orders")
      .update({ status: "cancelled", closed_at: now, total: 0, ready_at: null })
      .eq("id", row.id)
      .eq("status", "ordered");
    if (updErr) {
      console.warn("[refusal-expiry] cancel row:", updErr.message);
      continue;
    }
    expired += 1;
    notifyKitchenUpdate(row.client_id, { order_id: row.id, status: "cancelled", reason: "refusal_expired" });
  }
  return { expired };
}

async function markKitchenOrderReady(clientId, orderId) {
  const db = getSupabase();
  const now = new Date().toISOString();
  const patch = { status: "ready", ready_at: now };
  const { data, error } = await db
    .from("sales_orders")
    .update(patch)
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

async function acknowledgeBarOrders(clientId, orderIds, { waiterId = null, waiterName = "" } = {}) {
  const db = getSupabase();
  const name = String(waiterName || "").trim();
  const { ids: acked } = await updateOrdersAcceptance(db, {
    clientId,
    orderIds,
    waiterId,
    waiterName: name,
  });
  if (acked.length) {
    notifyKitchenUpdate(clientId, { order_ids: acked, status: "accepted", accepted_by: name });
  }
  return { count: acked.length, ids: acked };
}

async function cancelBarOrders(clientId, orderIds) {
  const db = getSupabase();
  const ids = [...new Set((orderIds || []).map(id => String(id || "").trim()).filter(Boolean))];
  if (!ids.length) return { count: 0, ids: [] };

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("sales_orders")
    .update({ status: "cancelled", closed_at: now, total: 0, ready_at: null })
    .eq("client_id", clientId)
    .eq("status", "ordered")
    .in("id", ids)
    .select("id");

  if (error) throw error;
  const cancelled = (data || []).map(row => row.id).filter(Boolean);
  if (cancelled.length) {
    notifyKitchenUpdate(clientId, { order_ids: cancelled, status: "cancelled" });
  }
  return { count: cancelled.length, ids: cancelled };
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
  fetchOrderedSales,
  listRecentlyCancelledOrders,
  listBarCancelledOrders,
  acceptBarOrder,
  refuseBarOrderWithGrace,
  filterWaiterAcceptOrders,
  expireRefusedOrders,
  needsWaiterAcceptance,
  markKitchenOrderReady,
  acknowledgeBarOrders,
  cancelBarOrders,
  isBanakOrder,
};
