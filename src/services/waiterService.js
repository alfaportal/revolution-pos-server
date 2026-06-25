const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../db");
const { getClientById, normalizeItems, mergeOrderItems, updateActiveSaleFromPos, syncSaleFromPos } = require("./salesService");
const { assertLicenseUsable } = require("../lib/licenseEnforcement");
const { WEB_WAITER, isKioskWaiterName } = require("../lib/orderSource");
const { buildMenuCategories, mapMenuItemForWeb } = require("./menuCatalogService");

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
    .select("id, table_number, waiter_name, status, total, ordered_at, items_json, local_order_id, device_id")
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

function assertWaiterOnTable(existing, waiterName, tableNumber) {
  if (!existing?.waiter_name) return;
  if (isKioskWaiterName(existing.waiter_name)) return;
  if (existing.waiter_name.toLowerCase() !== waiterName.toLowerCase()) {
    throw new Error(`Tavolina T${tableNumber} është e kamarierit: ${existing.waiter_name}`);
  }
}

async function getWaiterBootstrap(clientId) {
  const client = await assertClient(clientId);
  const db = getSupabase();

  const [{ data: settings }, { data: categories }, { data: menu }, { data: staff }] =
    await Promise.all([
      db.from("pos_settings").select("*").eq("client_id", clientId).maybeSingle(),
      db.from("pos_categories").select("name, sort_order").eq("client_id", clientId).order("sort_order"),
      db.from("pos_menu_items").select("local_id, name, category, price, active").eq("client_id", clientId).eq("active", true).order("category").order("name"),
      db.from("pos_staff").select("name").eq("client_id", clientId).eq("active", true).order("name"),
    ]);

  const tableCount = Math.min(30, Math.max(1, Number(settings?.table_count) || 10));
  const activeTables = await getActiveTableOrders(clientId);

  const tables = [];
  for (let n = 1; n <= tableCount; n++) {
    const active = activeTables.get(n);
    tables.push({
      number: n,
      status: active ? "occupied" : "free",
      waiter_name: active?.waiter_name || null,
      order_total: active ? Number(active.total) : 0,
      active_items: active ? normalizeItems(active.items_json) : [],
    });
  }

  return {
    client_name: client.emri,
    restaurant_name: settings?.restaurant_name || client.emri,
    table_count: tableCount,
    synced_at: settings?.synced_at || null,
    categories: buildMenuCategories(categories, menu),
    menu: (menu || []).map(mapMenuItemForWeb),
    staff: (staff || []).map(s => s.name),
    tables,
  };
}

async function submitWaiterOrder(clientId, body) {
  await assertClient(clientId);
  const waiterName = String(body.waiter_name || "").trim();
  if (!waiterName) throw new Error("Shkruani emrin e kamarierit.");

  const tableNumber = Number(body.table_number);
  if (!tableNumber || tableNumber < 1) throw new Error("Zgjidhni tavolinën.");

  const items = normalizeItems(body.items);
  if (!items.length) throw new Error("Shtoni të paktën një artikull.");

  const active = await getActiveTableOrders(clientId);
  const existing = active.get(tableNumber);
  assertWaiterOnTable(existing, waiterName, tableNumber);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const now = new Date().toISOString();
  const license = await getLicenseForClient(clientId);
  const localOrderId = existing?.local_order_id || `web-${uuidv4()}`;

  const sale = await updateActiveSaleFromPos({
    celesi: license.celesi,
    device_id: existing?.device_id || WEB_DEVICE,
    local_order_id: localOrderId,
    table_number: tableNumber,
    waiter_name: waiterName,
    items,
    total,
    status: "ordered",
    ordered_at: existing?.ordered_at || now,
  });

  return { ok: true, order: sale, sent_to: "bar" };
}

async function closeWaiterTable(clientId, body) {
  await assertClient(clientId);
  const waiterName = String(body.waiter_name || "").trim();
  if (!waiterName) throw new Error("Shkruani emrin e kamarierit.");

  const tableNumber = Number(body.table_number);
  if (!tableNumber || tableNumber < 1) throw new Error("Zgjidhni tavolinën.");

  const active = await getActiveTableOrders(clientId);
  const existing = active.get(tableNumber);
  assertWaiterOnTable(existing, waiterName, tableNumber);

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
    waiter_name: waiterName,
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
          waiter_name: waiterName,
          items,
          total,
          closed_at: now,
        },
  };
}

module.exports = {
  getWaiterBootstrap,
  submitWaiterOrder,
  closeWaiterTable,
  getActiveTableOrders,
  getLicenseForClient,
};
