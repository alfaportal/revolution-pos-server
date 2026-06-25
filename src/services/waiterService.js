const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../db");
const { getClientById, normalizeItems, mergeOrderItems, updateActiveSaleFromPos, syncSaleFromPos } = require("./salesService");
const { assertLicenseUsable } = require("../lib/licenseEnforcement");
const { WEB_WAITER, isKioskWaiterName } = require("../lib/orderSource");
const { buildMenuCategories, mapMenuItemForWeb } = require("./menuCatalogService");
const {
  buildTablesFromAreas,
  loadAreasForClient,
} = require("./venueService");
const { resolveWaiterForOrder } = require("./waiterPinService");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WEB_DEVICE = WEB_WAITER;

async function assertClient(clientId) {
  const id = String(clientId || "").trim();
  if (!UUID_RE.test(id)) throw new Error("ID klienti nuk është i vlefshëm.");
  const client = await getClientById(id);
  if (!client) throw new Error("Klienti nuk u gjet.");
  return client;
}

async function getActiveTableOrders(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("sales_orders")
    .select("id, table_number, waiter_name, waiter_id, status, total, ordered_at, items_json, local_order_id, device_id")
    .eq("client_id", clientId)
    .in("status", ["ordered", "ready"])
    .order("ordered_at", { ascending: false });
  if (error) throw error;
  const byTable = new Map();
  for (const row of data || []) {
    const n = Number(row.table_number);
    if (!n || byTable.has(n)) continue;
    byTable.set(n, row);
  }
  return byTable;
}

async function getLicenseForClient(clientId) {
  const db = getSupabase();
  const { data: license } = await db
    .from("licenses")
    .select("id, celesi, device_id, statusi, data_skadimit, trial_ends_at")
    .eq("client_id", clientId)
    .eq("statusi", "aktive")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!license?.celesi) throw new Error("Nuk ka licencë aktive për këtë klient.");
  assertLicenseUsable(license);
  return license;
}

function sameWaiterId(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function assertWaiterOnTable(existing, waiter, tableNumber) {
  if (!existing?.waiter_name) return;
  if (isKioskWaiterName(existing.waiter_name)) return;
  if (waiter?.id && existing.waiter_id && !sameWaiterId(existing.waiter_id, waiter.id)) {
    throw new Error(`Tavolina T${tableNumber} është e kamarierit: ${existing.waiter_name}`);
  }
  if (existing.waiter_name.toLowerCase() !== waiter.name.toLowerCase()) {
    throw new Error(`Tavolina T${tableNumber} është e kamarierit: ${existing.waiter_name}`);
  }
}

async function getWaiterBootstrap(clientId) {
  const client = await assertClient(clientId);
  const db = getSupabase();

  const [{ data: settings }, { data: categories }, { data: menu }] =
    await Promise.all([
      db.from("pos_settings").select("*").eq("client_id", clientId).maybeSingle(),
      db.from("pos_categories").select("name, sort_order").eq("client_id", clientId).order("sort_order"),
      db.from("pos_menu_items").select("local_id, name, category, price, active").eq("client_id", clientId).eq("active", true).order("category").order("name"),
    ]);

  const areas = await loadAreasForClient(clientId);
  const activeTables = await getActiveTableOrders(clientId);
  const activeByTable = new Map();
  for (const [n, row] of activeTables) {
    activeByTable.set(n, {
      waiter_name: row.waiter_name,
      waiter_id: row.waiter_id || null,
      total: row.total,
      active_items: normalizeItems(row.items_json),
    });
  }
  const layout = buildTablesFromAreas(areas, settings?.table_count, activeByTable);
  const pinWaiters = await loadPinWaitersCount(clientId);

  return {
    client_name: client.emri,
    restaurant_name: settings?.restaurant_name || client.emri,
    table_count: layout.table_count,
    synced_at: settings?.synced_at || null,
    pin_auth: true,
    waiter_count: pinWaiters,
    categories: buildMenuCategories(categories, menu),
    menu: (menu || []).map(mapMenuItemForWeb),
    areas: layout.areas,
    tables: layout.tables,
  };
}

async function loadPinWaitersCount(clientId) {
  const db = getSupabase();
  const { count, error } = await db
    .from("pos_staff")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("role", "waiter")
    .eq("active", true)
    .not("pin_hash", "is", null);
  if (error) return 0;
  return count || 0;
}

async function loginWaiterWithPin(clientId, pin) {
  await assertClient(clientId);
  const { verifyWaiterPin } = require("./waiterPinService");
  return verifyWaiterPin(clientId, pin);
}

async function submitWaiterOrder(clientId, body) {
  await assertClient(clientId);
  const waiter = await resolveWaiterForOrder(clientId, body.waiter_id, body.waiter_name);

  const tableNumber = Number(body.table_number);
  if (!tableNumber || tableNumber < 1) throw new Error("Zgjidhni tavolinën.");

  const newItems = normalizeItems(body.items);
  if (!newItems.length) throw new Error("Shtoni të paktën një artikull.");

  const active = await getActiveTableOrders(clientId);
  const existing = active.get(tableNumber);
  assertWaiterOnTable(existing, waiter, tableNumber);

  const items = existing
    ? mergeOrderItems(existing.items_json, newItems)
    : newItems;
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const now = new Date().toISOString();
  const license = await getLicenseForClient(clientId);
  const localOrderId = existing?.local_order_id || `web-${uuidv4()}`;

  const sale = await updateActiveSaleFromPos({
    celesi: license.celesi,
    device_id: existing?.device_id || WEB_DEVICE,
    local_order_id: localOrderId,
    table_number: tableNumber,
    waiter_name: waiter.name,
    waiter_id: waiter.id,
    items,
    total,
    status: "ordered",
    ordered_at: existing?.ordered_at || now,
  });

  return { ok: true, order: sale, sent_to: "bar", waiter };
}

async function closeWaiterTable(clientId, body) {
  await assertClient(clientId);
  const waiter = await resolveWaiterForOrder(clientId, body.waiter_id, body.waiter_name);

  const tableNumber = Number(body.table_number);
  if (!tableNumber || tableNumber < 1) throw new Error("Zgjidhni tavolinën.");

  const active = await getActiveTableOrders(clientId);
  const existing = active.get(tableNumber);
  assertWaiterOnTable(existing, waiter, tableNumber);

  const cartItems = normalizeItems(body.items);
  const items = cartItems.length
    ? cartItems
    : normalizeItems(existing?.items_json);
  if (!items.length) {
    throw new Error("Nuk ka artikuj për të mbyllur tavolinën.");
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const now = new Date().toISOString();
  const license = await getLicenseForClient(clientId);
  const receiptNumber = `R-${Date.now().toString(36).toUpperCase()}`;
  const localOrderId = existing?.local_order_id || `web-${uuidv4()}`;

  const saleResult = await syncSaleFromPos({
    celesi: license.celesi,
    device_id: existing?.device_id || WEB_DEVICE,
    local_order_id: localOrderId,
    table_number: tableNumber,
    waiter_name: waiter.name,
    waiter_id: waiter.id,
    items,
    total,
    receipt_number: receiptNumber,
    status: "closed",
    ordered_at: existing?.ordered_at || now,
    closed_at: now,
  });

  const receiptBundle = saleResult.receipt || null;

  return {
    ok: true,
    order: saleResult.sale,
    receipt: receiptBundle
      ? {
          ...receiptBundle.receipt,
          text: receiptBundle.text,
          html: receiptBundle.html,
          escpos_base64: receiptBundle.escpos_base64,
          paper_width_mm: receiptBundle.paper_width_mm,
        }
      : {
          receipt_number: receiptNumber,
          table_number: tableNumber,
          waiter_name: waiter.name,
          items,
          total,
          closed_at: now,
        },
  };
}

module.exports = {
  getWaiterBootstrap,
  loginWaiterWithPin,
  submitWaiterOrder,
  closeWaiterTable,
  getActiveTableOrders,
  getLicenseForClient,
};
