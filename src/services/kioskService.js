const { v4: uuidv4 } = require("uuid");
const { normalizeItems, mergeOrderItems, updateActiveSaleFromPos } = require("./salesService");const { getActiveTableOrders, getLicenseForClient } = require("./waiterService");
const { WEB_KIOSK, isKioskWaiterName } = require("../lib/orderSource");
const { getClientMenuCatalog } = require("./menuCatalogService");

const KIOSK_DEVICE = WEB_KIOSK;

function tableWaiterLabel(tableNumber) {
  return `Tavolinë T${tableNumber}`;
}

async function getKioskMenu(clientId, { kitchenSlug = "" } = {}) {
  return getClientMenuCatalog(clientId, {
    activeOnly: true,
    kitchenSlug,
    channel: "kiosk",
  });
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
