const { getSupabase } = require("../db");
const { isVisibleOnWebMenu, isOutOfStock } = require("../lib/stockHelpers");
const { getCatalogFlatMap, normMenuName } = require("../data/menuCatalogTemplate");

let _catalogPhotoByName = null;

function catalogPhotoByName(name) {
  if (!_catalogPhotoByName) {
    _catalogPhotoByName = new Map();
    for (const item of getCatalogFlatMap().values()) {
      if (item.photoUrl) {
        _catalogPhotoByName.set(normMenuName(item.name), item.photoUrl);
      }
    }
  }
  return _catalogPhotoByName.get(normMenuName(name)) || "";
}

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
    has_photo: Boolean(String(row.photo || "").trim()),
  };
}

function mapMenuItemForKitchen(row, { slug, channel = "waiter" } = {}) {
  const item = mapMenuItemForWeb(row);
  if (item.has_photo && slug) {
    return {
      ...item,
      photo_url: `/api/${channel}/${encodeURIComponent(slug)}/menu/${item.id}/photo`,
    };
  }
  const templatePhoto = catalogPhotoByName(item.name);
  if (templatePhoto) {
    return { ...item, has_photo: true, photo_url: templatePhoto };
  }
  return item;
}

function mapMenuItemForPos(row) {
  const photo = String(row.photo || "").trim();
  const outOfStock = isOutOfStock(row);
  return {
    local_id: row.local_id,
    name: row.name,
    category: String(row.category || "").trim(),
    price: Number(row.price),
    active: row.active !== false,
    has_photo: Boolean(photo),
    photo: photo || null,
    track_stock: Boolean(row.track_stock),
    stock_quantity: row.stock_quantity != null ? Number(row.stock_quantity) : null,
    stock_alert_threshold: Number(row.stock_alert_threshold) || 5,
    out_of_stock: outOfStock,
    sold_out_label: outOfStock ? "Mbaroi" : null,
  };
}

async function loadMenuCatalogRows(clientId, { activeOnly = false } = {}) {
  const db = getSupabase();
  let menuQuery = db
    .from("pos_menu_items")
    .select("local_id, name, category, price, active, photo, track_stock, stock_quantity, stock_alert_threshold")
    .eq("client_id", clientId)
    .order("category")
    .order("name");
  if (activeOnly) menuQuery = menuQuery.eq("active", true);

  const [{ data: settings }, { data: categories }, { data: menu }, { data: staff }, { data: areas }] =
    await Promise.all([
      db.from("pos_settings").select("*").eq("client_id", clientId).maybeSingle(),
      db.from("pos_categories").select("name, sort_order").eq("client_id", clientId).order("sort_order"),
      menuQuery,
      db
        .from("pos_staff")
        .select("name, role, active, source")
        .eq("client_id", clientId)
        .order("name"),
      db
        .from("pos_areas")
        .select("name, table_count, sort_order, active")
        .eq("client_id", clientId)
        .order("sort_order"),
    ]);

  return { settings, categories, menu, staff, areas };
}

async function getClientMenuCatalog(clientId, { activeOnly = true, kitchenSlug = "", channel = "kiosk" } = {}) {
  const { settings, categories, menu, staff } = await loadMenuCatalogRows(clientId, { activeOnly });
  const mapItem = row =>
    kitchenSlug
      ? mapMenuItemForKitchen(row, { slug: kitchenSlug, channel })
      : mapMenuItemForWeb(row);
  return {
    restaurant_name: settings?.restaurant_name || "",
    table_count: Math.min(30, Math.max(1, Number(settings?.table_count) || 10)),
    synced_at: settings?.synced_at || null,
    categories: buildMenuCategories(categories, menu),
    menu: (menu || []).filter(row => !activeOnly || isVisibleOnWebMenu(row)).map(mapItem),
    staff: (staff || []).map(s => s.name),
  };
}

async function getCatalogForPos(clientId) {
  const { settings, categories, menu, staff, areas } = await loadMenuCatalogRows(clientId, { activeOnly: false });
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
    areas: (areas || []).map(a => ({
      name: a.name,
      table_count: Number(a.table_count) || 0,
      sort_order: Number(a.sort_order) || 0,
      active: a.active !== false,
    })),
    categories: (categories || []).map(c => ({
      name: c.name,
      sort_order: Number(c.sort_order) || 0,
    })),
    menu_items: (menu || []).map(mapMenuItemForPos),
    staff: (staff || []).map(s => ({
      name: s.name,
      role: s.role || "waiter",
      active: s.active !== false,
      source: s.source || "owner",
    })),
  };
}

module.exports = {
  buildMenuCategories,
  mapMenuItemForWeb,
  mapMenuItemForKitchen,
  getClientMenuCatalog,
  getCatalogForPos,
};
