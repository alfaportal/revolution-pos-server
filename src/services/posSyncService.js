const { findLicenseByKey, normalizeKey } = require("./licenseService");
const { assertLicenseUsable } = require("../lib/licenseEnforcement");
const { getSupabase } = require("../db");
const { withPgTransaction } = require("../lib/pgPool");
const { getCatalogForPos } = require("./menuCatalogService");

async function resolveLicense(body) {
  const celesi = normalizeKey(body.celesi || body.license_key);
  if (!celesi) throw new Error("Mungon çelësi i licencës.");
  const license = await findLicenseByKey(celesi);
  assertLicenseUsable(license);
  return license;
}

async function syncCatalogFromPosSupabase(license, body) {
  const clientId = license.client_id;
  const db = getSupabase();

  const restaurantName = String(body.restaurant_name || "").trim();
  const tableCount = Math.min(30, Math.max(1, Number(body.table_count) || 10));
  const address = String(body.address || body.adresa || "").trim();
  const phone = String(body.phone || body.telefoni || "").trim();
  const nui = String(body.nui || "").trim();
  const tvshNr = String(body.tvsh_nr || body.tvsh || "").trim();
  const receiptWidth = [58, 80].includes(Number(body.receipt_width_mm))
    ? Number(body.receipt_width_mm)
    : 80;
  const fiscalNr = String(body.fiscal_nr || "").trim();
  const fiscalCom = String(body.fiscal_com_port || body.fiscal_com || "").trim();
  const fiscalOperator = String(body.fiscal_operator_name || "").trim();
  const fiscalModel = String(body.fiscal_device_model || "").trim();
  const now = new Date().toISOString();

  const settingsRow = {
    client_id: clientId,
    restaurant_name: restaurantName,
    address,
    phone,
    nui,
    tvsh_nr: tvshNr,
    receipt_width_mm: receiptWidth,
    table_count: tableCount,
    synced_at: now,
  };
  if (fiscalNr) settingsRow.fiscal_nr = fiscalNr;
  if (fiscalCom) settingsRow.fiscal_com_port = fiscalCom;
  if (fiscalOperator) settingsRow.fiscal_operator_name = fiscalOperator;
  if (fiscalModel) settingsRow.fiscal_device_model = fiscalModel;
  if (body.fiscal_enabled != null) settingsRow.fiscal_enabled = Boolean(body.fiscal_enabled);

  await db.from("pos_settings").upsert(settingsRow);

  const categories = Array.isArray(body.categories) ? body.categories : [];
  await db.from("pos_categories").delete().eq("client_id", clientId);
  let catCount = 0;
  if (categories.length) {
    const catRows = categories
      .map((c, i) => ({
        client_id: clientId,
        name: String(c.name || c).trim(),
        sort_order: Number(c.sort_order ?? i) || i,
      }))
      .filter(c => c.name);
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
    const menuRows = menuItems
      .map((m, i) => ({
        client_id: clientId,
        local_id: Number(m.local_id ?? m.id ?? i + 1) || i + 1,
        name: String(m.name || m.emri || "").trim(),
        category: String(m.category || m.kategoria || "").trim(),
        price: Number(m.price ?? m.cmimi ?? 0) || 0,
        active: m.active !== false && m.active !== 0,
      }))
      .filter(m => m.name);
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
    const staffRows = staff
      .map(s => ({
        client_id: clientId,
        name: String(s.name || s.emri || "").trim(),
        active: s.active !== false && s.active !== 0,
      }))
      .filter(s => s.name);
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
    transactional: false,
  };
}

async function syncCatalogFromPosTransactional(license, body) {
  const clientId = license.client_id;
  const restaurantName = String(body.restaurant_name || "").trim();
  const tableCount = Math.min(30, Math.max(1, Number(body.table_count) || 10));
  const address = String(body.address || body.adresa || "").trim();
  const phone = String(body.phone || body.telefoni || "").trim();
  const nui = String(body.nui || "").trim();
  const tvshNr = String(body.tvsh_nr || body.tvsh || "").trim();
  const receiptWidth = [58, 80].includes(Number(body.receipt_width_mm))
    ? Number(body.receipt_width_mm)
    : 80;
  const fiscalNr = String(body.fiscal_nr || "").trim();
  const fiscalCom = String(body.fiscal_com_port || body.fiscal_com || "").trim();
  const fiscalOperator = String(body.fiscal_operator_name || "").trim();
  const fiscalModel = String(body.fiscal_device_model || "").trim();
  const now = new Date().toISOString();

  const categories = Array.isArray(body.categories) ? body.categories : [];
  const menuItems = Array.isArray(body.menu_items) ? body.menu_items : [];
  const staff = Array.isArray(body.staff) ? body.staff : [];

  const catRows = categories
    .map((c, i) => ({
      name: String(c.name || c).trim(),
      sort_order: Number(c.sort_order ?? i) || i,
    }))
    .filter(c => c.name);

  const menuRows = menuItems
    .map((m, i) => ({
      local_id: Number(m.local_id ?? m.id ?? i + 1) || i + 1,
      name: String(m.name || m.emri || "").trim(),
      category: String(m.category || m.kategoria || "").trim(),
      price: Number(m.price ?? m.cmimi ?? 0) || 0,
      active: m.active !== false && m.active !== 0,
    }))
    .filter(m => m.name);

  const staffRows = staff
    .map(s => ({
      name: String(s.name || s.emri || "").trim(),
      active: s.active !== false && s.active !== 0,
    }))
    .filter(s => s.name);

  return withPgTransaction(async client => {
    await client.query(
      `INSERT INTO pos_settings (client_id, restaurant_name, address, phone, nui, tvsh_nr, receipt_width_mm, table_count, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (client_id) DO UPDATE SET
         restaurant_name = EXCLUDED.restaurant_name,
         address = EXCLUDED.address,
         phone = EXCLUDED.phone,
         nui = EXCLUDED.nui,
         tvsh_nr = EXCLUDED.tvsh_nr,
         receipt_width_mm = EXCLUDED.receipt_width_mm,
         table_count = EXCLUDED.table_count,
         synced_at = EXCLUDED.synced_at`,
      [clientId, restaurantName, address, phone, nui, tvshNr, receiptWidth, tableCount, now],
    );

    if (fiscalNr || fiscalCom || fiscalOperator || fiscalModel || body.fiscal_enabled != null) {
      await client.query(
        `UPDATE pos_settings SET
           fiscal_nr = COALESCE(NULLIF($2, ''), fiscal_nr),
           fiscal_com_port = COALESCE(NULLIF($3, ''), fiscal_com_port),
           fiscal_operator_name = COALESCE(NULLIF($4, ''), fiscal_operator_name),
           fiscal_device_model = COALESCE(NULLIF($5, ''), fiscal_device_model),
           fiscal_enabled = COALESCE($6, fiscal_enabled)
         WHERE client_id = $1`,
        [
          clientId,
          fiscalNr,
          fiscalCom,
          fiscalOperator,
          fiscalModel,
          body.fiscal_enabled != null ? Boolean(body.fiscal_enabled) : null,
        ],
      );
    }

    await client.query(`DELETE FROM pos_categories WHERE client_id = $1`, [clientId]);
    for (const c of catRows) {
      await client.query(
        `INSERT INTO pos_categories (client_id, name, sort_order) VALUES ($1, $2, $3)`,
        [clientId, c.name, c.sort_order],
      );
    }

    await client.query(`DELETE FROM pos_menu_items WHERE client_id = $1`, [clientId]);
    for (const m of menuRows) {
      await client.query(
        `INSERT INTO pos_menu_items (client_id, local_id, name, category, price, active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [clientId, m.local_id, m.name, m.category, m.price, m.active],
      );
    }

    await client.query(`DELETE FROM pos_staff WHERE client_id = $1`, [clientId]);
    for (const s of staffRows) {
      await client.query(
        `INSERT INTO pos_staff (client_id, name, active) VALUES ($1, $2, $3)`,
        [clientId, s.name, s.active],
      );
    }

    return {
      client_id: clientId,
      restaurant_name: restaurantName,
      table_count: tableCount,
      categories: catRows.length,
      menu_items: menuRows.length,
      staff: staffRows.length,
      synced_at: now,
      transactional: true,
    };
  });
}

async function syncCatalogFromPos(body) {
  const license = await resolveLicense(body);
  if (process.env.DATABASE_URL) {
    try {
      const txResult = await syncCatalogFromPosTransactional(license, body);
      if (txResult) return txResult;
    } catch (err) {
      console.warn("[pos-sync] transactional catalog sync failed, fallback:", err.message);
    }
  }
  return syncCatalogFromPosSupabase(license, body);
}

async function pullCatalogForLicense(body) {
  const license = await resolveLicense(body);
  return getCatalogForPos(license.client_id);
}

module.exports = { syncCatalogFromPos, pullCatalogForLicense };
