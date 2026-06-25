const { getSupabase } = require("../db");

function buildMenuCategories(dbCategories, menuItems) {
  const fromDb = (dbCategories || []).map(c => String(c.name || "").trim()).filter(Boolean);
  const fromMenu = [
    ...new Set((menuItems || []).map(m => String(m.category || "").trim()).filter(Boolean)),
  ];
  if (!fromDb.length) return fromMenu;
  const seen = new Set(fromDb);
  const merged = [...fromDb];
  for (const name of fromMenu) {
    if (!seen.has(name)) {
      seen.add(name);
      merged.push(name);
    }
  }
  return merged;
}

function mapMenuItemForWeb(row) {
  return {
    id: row.local_id,
    name: row.name,
    category: String(row.category || "").trim(),
    price: Number(row.price),
  };
}

function mapMenuItemForPos(row) {
  return {
    local_id: row.local_id,
    name: row.name,
    category: String(row.category || "").trim(),
    price: Number(row.price),
    active: row.active !== false,
  };
}

async function loadMenuCatalogRows(clientId, { activeOnly = false } = {}) {
  const db = getSupabase();
  let menuQuery = db
    .from("pos_menu_items")
    .select("local_id, name, category, price, active")
    .eq("client_id", clientId)
    .order("category")
    .order("name");
  if (activeOnly) menuQuery = menuQuery.eq("active", true);

  const [{ data: settings }, { data: categories }, { data: menu }, { data: staff }] =
    await Promise.all([
      db.from("pos_settings").select("*").eq("client_id", clientId).maybeSingle(),
      db.from("pos_categories").select("name, sort_order").eq("client_id", clientId).order("sort_order"),
      menuQuery,
      db.from("pos_staff").select("name, active").eq("client_id", clientId).eq("active", true).order("name"),
    ]);

  return { settings, categories, menu, staff };
}

async function getClientMenuCatalog(clientId, { activeOnly = true } = {}) {
  const { settings, categories, menu, staff } = await loadMenuCatalogRows(clientId, { activeOnly });
  return {
    restaurant_name: settings?.restaurant_name || "",
    table_count: Math.min(30, Math.max(1, Number(settings?.table_count) || 10)),
    synced_at: settings?.synced_at || null,
    categories: buildMenuCategories(categories, menu),
    menu: (menu || []).map(mapMenuItemForWeb),
    staff: (staff || []).map(s => s.name),
  };
}

async function getCatalogForPos(clientId) {
  const { settings, categories, menu, staff } = await loadMenuCatalogRows(clientId, { activeOnly: false });
  return {
    client_id: clientId,
    restaurant_name: settings?.restaurant_name || "",
    address: settings?.address || "",
    phone: settings?.phone || "",
    nui: settings?.nui || "",
    tvsh_nr: settings?.tvsh_nr || "",
    receipt_width_mm: settings?.receipt_width_mm || 80,
    table_count: Math.min(30, Math.max(1, Number(settings?.table_count) || 10)),
    synced_at: settings?.synced_at || null,
    categories: (categories || []).map(c => ({
      name: c.name,
      sort_order: Number(c.sort_order) || 0,
    })),
    menu_items: (menu || []).map(mapMenuItemForPos),
    staff: (staff || []).map(s => ({
      name: s.name,
      active: s.active !== false,
    })),
  };
}

module.exports = {
  buildMenuCategories,
  mapMenuItemForWeb,
  getClientMenuCatalog,
  getCatalogForPos,
};
