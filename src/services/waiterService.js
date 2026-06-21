const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../db");
const { getClientById, normalizeItems, syncSaleFromPos } = require("./salesService");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WEB_DEVICE = "WEB-WAITER";

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
    .select("table_number, waiter_name, status, total, ordered_at")
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
    });
  }

  return {
    client_name: client.emri,
    restaurant_name: settings?.restaurant_name || client.emri,
    table_count: tableCount,
    synced_at: settings?.synced_at || null,
    categories: (categories || []).map(c => c.name),
    menu: (menu || []).map(m => ({
      id: m.local_id,
      name: m.name,
      category: m.category,
      price: Number(m.price),
    })),
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

  const db = getSupabase();
  const { data: staffRow } = await db
    .from("pos_staff")
    .select("name")
    .eq("client_id", clientId)
    .eq("active", true);

  if (staffRow?.length) {
    const names = staffRow.map(s => s.name.toLowerCase());
    if (!names.includes(waiterName.toLowerCase())) {
      throw new Error("Ky emër nuk është në listën e stafit. Kontrolloni emrin.");
    }
  }

  const active = await getActiveTableOrders(clientId);
  const existing = active.get(tableNumber);
  if (existing && existing.waiter_name &&
      existing.waiter_name.toLowerCase() !== waiterName.toLowerCase()) {
    throw new Error(`Tavolina T${tableNumber} është e kamarierit: ${existing.waiter_name}`);
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const now = new Date().toISOString();
  const localOrderId = `web-${uuidv4()}`;

  const { data: license } = await db
    .from("licenses")
    .select("id, celesi, device_id")
    .eq("client_id", clientId)
    .eq("statusi", "aktive")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!license?.celesi) {
    throw new Error("Nuk ka licencë aktive për këtë klient.");
  }

  const sale = await syncSaleFromPos({
    celesi: license.celesi,
    device_id: WEB_DEVICE,
    local_order_id: localOrderId,
    table_number: tableNumber,
    waiter_name: waiterName,
    items,
    total,
    status: "ordered",
    ordered_at: now,
  });

  return { ok: true, order: sale };
}

module.exports = {
  getWaiterBootstrap,
  submitWaiterOrder,
};
