const { getSupabase } = require("../db");
const { findLicenseByKey, normalizeKey } = require("./licenseService");

async function resolveLicense(body) {
  const celesi = normalizeKey(body.celesi || body.license_key);
  if (!celesi) throw new Error("Mungon çelësi i licencës.");
  const license = await findLicenseByKey(celesi);
  if (!license || license.statusi !== "aktive") {
    throw new Error("Liçenca nuk është aktive.");
  }
  return license;
}

async function syncCatalogFromPos(body) {
  const license = await resolveLicense(body);
  const clientId = license.client_id;
  const db = getSupabase();

  const restaurantName = String(body.restaurant_name || "").trim();
  const tableCount = Math.min(30, Math.max(1, Number(body.table_count) || 10));
  const now = new Date().toISOString();

  await db.from("pos_settings").upsert({
    client_id: clientId,
    restaurant_name: restaurantName,
    table_count: tableCount,
    synced_at: now,
  });

  const categories = Array.isArray(body.categories) ? body.categories : [];
  await db.from("pos_categories").delete().eq("client_id", clientId);
  let catCount = 0;
  if (categories.length) {
    const catRows = categories.map((c, i) => ({
      client_id: clientId,
      name: String(c.name || c).trim(),
      sort_order: Number(c.sort_order ?? i) || i,
    })).filter(c => c.name);
    catCount = catRows.length;
    if (catRows.length) {
      const { error } = await db.from("pos_categories").insert(catRows);
      if (error) throw error;
    }
  }

  const menuItems = Array.isArray(body.menu_items) ? body.menu_items : [];
  await db.from("pos_menu_items").delete().eq("client_id", clientId);
  let menuCount = 0;
  if (menuItems.length) {
    const menuRows = menuItems.map((m, i) => ({
      client_id: clientId,
      local_id: Number(m.local_id ?? m.id ?? i + 1) || i + 1,
      name: String(m.name || m.emri || "").trim(),
      category: String(m.category || m.kategoria || "").trim(),
      price: Number(m.price ?? m.cmimi ?? 0) || 0,
      active: m.active !== false && m.active !== 0,
    })).filter(m => m.name);
    menuCount = menuRows.length;
    if (menuRows.length) {
      const { error } = await db.from("pos_menu_items").insert(menuRows);
      if (error) throw error;
    }
  }

  const staff = Array.isArray(body.staff) ? body.staff : [];
  await db.from("pos_staff").delete().eq("client_id", clientId);
  let staffCount = 0;
  if (staff.length) {
    const staffRows = staff.map(s => ({
      client_id: clientId,
      name: String(s.name || s.emri || "").trim(),
      active: s.active !== false && s.active !== 0,
    })).filter(s => s.name);
    staffCount = staffRows.length;
    if (staffRows.length) {
      const { error } = await db.from("pos_staff").insert(staffRows);
      if (error) throw error;
    }
  }

  return {
    client_id: clientId,
    restaurant_name: restaurantName,
    table_count: tableCount,
    categories: catCount,
    menu_items: menuCount,
    staff: staffCount,
    synced_at: now,
  };
}

module.exports = { syncCatalogFromPos };
