const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../db");
const { getLicenseForClient } = require("./waiterService");
const { syncSaleFromPos, normalizeItems } = require("./salesService");

const KIOSK_DEVICE = "WEB-KIOSK";
const KIOSK_WAITER = "Kiosk";

async function assertKioskAccess(identifier, req) {
  let client = await getClientBySlugOrId(identifier);
  if (!client) throw new Error("Lokali nuk u gjet.");
  client = await ensureKitchenCredentials(client);

  const key = extractKitchenKey(req);
  if (!verifyKitchenKey(client, key)) {
    const err = new Error("Kodi i aksesit (key) mungon ose është i gabuar.");
    err.code = "KITCHEN_KEY_INVALID";
    throw err;
  }
  if (!clientHasFeature(client, "kiosk")) {
    const err = new Error("Kiosk nuk përfshihet në paketën tuaj.");
    err.code = "PACKAGE_UPGRADE_REQUIRED";
    throw err;
  }
  return client;
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
  const items = normalizeItems(body.items);
  if (!items.length) throw new Error("Shtoni të paktën një artikull.");

  const tableNumber = Math.max(0, Number(body.table_number) || 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const now = new Date().toISOString();
  const license = await getLicenseForClient(client.id);
  const localOrderId = `kiosk-${uuidv4()}`;

  const sale = await syncSaleFromPos({
    celesi: license.celesi,
    device_id: KIOSK_DEVICE,
    local_order_id: localOrderId,
    table_number: tableNumber,
    waiter_name: KIOSK_WAITER,
    items,
    total,
    status: "ordered",
    ordered_at: now,
  });

  return { ok: true, order: sale, client_name: client.emri };
}

module.exports = {
  getKioskMenu,
  submitKioskOrder,
};
