const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../db");
const { normalizeItems, mergeOrderItems, updateActiveSaleFromPos } = require("./salesService");
const { getActiveTableOrders, getLicenseForClient } = require("./waiterService");
const { WEB_KIOSK, isKioskWaiterName } = require("../lib/orderSource");

const KIOSK_DEVICE = WEB_KIOSK;

function tableWaiterLabel(tableNumber) {
  return `Tavolinë T${tableNumber}`;
}

async function getKioskMenu(clientId) {
  const db = getSupabase();
  const [{ data: settings }, { data: categories }, { data: menu }] = await Promise.all([
    db.from("pos_settings").select("*").eq("client_id", clientId).maybeSingle(),
    db.from("pos_categories").select("name, sort_order").eq("client_id", clientId).order("sort_order"),
    db
      .from("pos_menu_items")
      .select("local_id, name, category, price, active")
      .eq("client_id", clientId)
      .eq("active", true)
      .order("category")
      .order("name"),
  ]);

  return {
    restaurant_name: settings?.restaurant_name || "",
    table_count: Math.min(30, Math.max(1, Number(settings?.table_count) || 10)),
    synced_at: settings?.synced_at || null,
    categories: (categories || []).map(c => c.name),
    menu: (menu || []).map(m => ({
      id: m.local_id,
      name: m.name,
      category: m.category,
      price: Number(m.price),
    })),
  };
}

async function submitKioskOrder(client, body) {
  const tableNumber = Number(body.table_number);
  if (!tableNumber || tableNumber < 1) {
    throw new Error("Mungon numri i tavolinës (?table=... në link).");
  }

  const newItems = normalizeItems(body.items);
  if (!newItems.length) throw new Error("Shtoni të paktën një artikull.");

  const active = await getActiveTableOrders(client.id);
  const existing = active.get(tableNumber);
  const items = existing
    ? mergeOrderItems(existing.items_json, newItems)
    : newItems;
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const now = new Date().toISOString();
  const license = await getLicenseForClient(client.id);
  const localOrderId = existing?.local_order_id || `kiosk-${uuidv4()}`;
  const waiterName = existing?.waiter_name && !isKioskWaiterName(existing.waiter_name)
    ? existing.waiter_name
    : tableWaiterLabel(tableNumber);

  const sale = await updateActiveSaleFromPos({
    celesi: license.celesi,
    device_id: existing?.device_id || KIOSK_DEVICE,
    local_order_id: localOrderId,
    table_number: tableNumber,
    waiter_name: waiterName,
    items,
    total,
    status: "ordered",
    ordered_at: existing?.ordered_at || now,
  });

  return {
    ok: true,
    order: sale,
    client_name: client.emri,
    sent_to: "bar",
    table_number: tableNumber,
  };
}

module.exports = {
  getKioskMenu,
  submitKioskOrder,
};
