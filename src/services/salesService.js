const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");
const { findLicenseByKey, normalizeKey } = require("./licenseService");
const { assertLicenseUsable } = require("../lib/licenseEnforcement");

function dateRanges() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  return {
    today,
    week_from: weekAgo.toISOString().slice(0, 10),
    month_from: monthStart,
  };
}

function normalizeItems(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map(it => ({
      name: String(it.name || it.emri || "").trim(),
      quantity: Number(it.quantity ?? it.sasia ?? 1) || 1,
      price: Number(it.price ?? it.cmimi ?? 0) || 0,
      menu_id: it.menu_id ?? it.id ?? it.local_id ?? null,
    }))
    .filter(it => it.name);
}

function mergeOrderItems(existingItems, newItems) {
  const merged = normalizeItems(existingItems).map(it => ({ ...it }));
  for (const item of normalizeItems(newItems)) {
    const match = merged.find(
      it => it.name === item.name && Number(it.price) === Number(item.price),
    );
    if (match) match.quantity += item.quantity;
    else merged.push({ ...item });
  }
  return merged;
}

/** Një porosi aktive për tavolinë — mbyll rreshtat e vjetër (WEB-WAITER vs POS etj.) */
async function cancelOtherActiveOrdersForTable(clientId, tableNumber, except = null) {
  const num = Number(tableNumber);
  if (!num || num < 1) return 0;
  const db = getSupabase();
  const { data: rows, error } = await db
    .from("sales_orders")
    .select("id, local_order_id, device_id")
    .eq("client_id", clientId)
    .eq("table_number", num)
    .in("status", ["ordered", "ready"]);
  if (error) throw error;

  const now = new Date().toISOString();
  let cancelled = 0;
  for (const row of rows || []) {
    if (
      except &&
      String(row.local_order_id) === String(except.local_order_id) &&
      String(row.device_id).toUpperCase() === String(except.device_id).toUpperCase()
    ) {
      continue;
    }
    const { error: updErr } = await db
      .from("sales_orders")
      .update({ status: "cancelled", closed_at: now, total: 0, ready_at: null })
      .eq("id", row.id);
    if (!updErr) cancelled += 1;
    else console.warn("[sales] cancel stale row:", updErr.message);
  }
  return cancelled;
}

async function freeTableFromPos(body) {
  const celesi = normalizeKey(body.celesi || body.license_key);
  if (!celesi) throw new Error("Mungon çelësi i licencës.");
  const license = await findLicenseByKey(celesi);
  assertLicenseUsable(license);
  const tableNum = Number(body.table_number);
  if (!tableNum || tableNum < 1) throw new Error("Mungon numri i tavolinës.");
  const cancelled = await cancelOtherActiveOrdersForTable(license.client_id, tableNum);
  try {
    require("./kdsEvents").notifyKitchenUpdate(license.client_id, {
      table_number: tableNum,
      status: "free",
    });
  } catch {
    /* optional */
  }
  return { ok: true, cancelled };
}

async function upsertSaleFromPos(body, { defaultStatus = "closed" } = {}) {
  const celesi = normalizeKey(body.celesi || body.license_key);
  if (!celesi) throw new Error("Mungon çelësi i licencës.");

  const license = await findLicenseByKey(celesi);
  assertLicenseUsable(license);

  const deviceId = String(body.device_id || license.device_id || "").trim().toUpperCase();
  const rawItems = Array.isArray(body.items) ? body.items : JSON.parse(body.items_json || "[]");
  const items = normalizeItems(rawItems);
  const total = Number(body.total) || items.reduce((s, i) => s + i.price * i.quantity, 0);
  const now = new Date().toISOString();
  const incomingStatus = String(body.status || defaultStatus).toLowerCase();
  const allowed = ["ordered", "ready", "closed", "cancelled"];
  const status = allowed.includes(incomingStatus) ? incomingStatus : defaultStatus;

  const localOrderId = String(body.local_order_id || body.order_id || Date.now());
  const db = getSupabase();

  const { data: existing } = await db
    .from("sales_orders")
    .select("status, closed_at, ordered_at, items_json")
    .eq("client_id", license.client_id)
    .eq("local_order_id", localOrderId)
    .eq("device_id", deviceId)
    .maybeSingle();

  let finalStatus = status;
  if (existing?.status === "closed" && status === "ordered") {
    finalStatus = "closed";
  } else if (existing?.status === "ready" && status === "ordered") {
    const prevItems = JSON.stringify(normalizeItems(existing.items_json));
    const nextItems = JSON.stringify(items);
    finalStatus = prevItems === nextItems ? "ready" : "ordered";
  }

  const tableNum = Number(body.table_number) || 0;
  const keepKey = { local_order_id: localOrderId, device_id: deviceId };
  if (tableNum >= 1 && ["ordered", "ready", "closed", "cancelled"].includes(finalStatus)) {
    await cancelOtherActiveOrdersForTable(license.client_id, tableNum, keepKey);
  }

  const row = {
    client_id: license.client_id,
    license_id: license.id,
    local_order_id: localOrderId,
    device_id: deviceId,
    table_number: Number(body.table_number) || 0,
    waiter_name: String(body.waiter_name || "").trim(),
    items_json: items,
    total,
    receipt_number: String(body.receipt_number || "").trim(),
    status: finalStatus,
  };

  const waiterId = String(body.waiter_id || "").trim();
  if (waiterId) row.waiter_id = waiterId;

  const pmRaw = String(body.payment_method || "cash").trim().toLowerCase();
  row.payment_method = ["karte", "kartë", "card", "kart"].includes(pmRaw) ? "karte" : "cash";

  if (finalStatus === "ordered") {
    row.ordered_at = body.ordered_at || now;
    row.closed_at = row.ordered_at;
    row.ready_at = null;
  } else if (finalStatus === "cancelled") {
    row.ordered_at = body.ordered_at || existing?.ordered_at || now;
    row.closed_at = now;
    row.ready_at = null;
    const preserveItems = items.length
      ? items
      : normalizeItems(existing?.items_json || []);
    row.items_json = preserveItems;
    row.total = 0;
  } else if (finalStatus === "ready") {
    row.ready_at = body.ready_at || now;
    row.closed_at = body.closed_at || existing?.closed_at || now;
  } else {
    row.closed_at = body.closed_at || now;
    if (finalStatus === "closed") {
      row.payment_status = "paid";
      if (!existing) {
        row.ordered_at = body.ordered_at || row.closed_at;
      }
    }
  }

  let { data, error } = await db
    .from("sales_orders")
    .upsert(row, { onConflict: "client_id,local_order_id,device_id" })
    .select()
    .single();

  if (error && row.waiter_id && /waiter_id|schema cache/i.test(String(error.message || ""))) {
    delete row.waiter_id;
    ({ data, error } = await db
      .from("sales_orders")
      .upsert(row, { onConflict: "client_id,local_order_id,device_id" })
      .select()
      .single());
  }

  if (error) {
    const msg = String(error.message || error.details || error.hint || "Gabim në ruajtjen e porosisë.");
    if (/waiter_id/i.test(msg) && /column|schema cache/i.test(msg)) {
      throw new Error("Mungon migrimi i bazës së të dhënave (014_waiter_pin.sql). Ekzekutojeni në Supabase.");
    }
    if (/payment_method/i.test(msg) && /column|schema cache/i.test(msg)) {
      throw new Error("Mungon kolona payment_method te sales_orders. Ekzekutoni supabase/migrations/020_sales_payment_method.sql në Supabase.");
    }
    throw new Error(msg);
  }

  if (finalStatus === "ordered" || finalStatus === "cancelled" || finalStatus === "ready" || finalStatus === "closed") {
    try {
      require("./kdsEvents").notifyKitchenUpdate(license.client_id, {
        order_id: data?.id,
        status: finalStatus,
      });
    } catch {
      /* optional */
    }
  }

  return data;
}

async function buildSaleReceipt(sale, body = {}) {
  if (!sale || sale.status !== "closed") return null;
  const { formatReceiptBundle } = require("./receiptService");
  return formatReceiptBundle(sale.client_id, {
    receipt_number: sale.receipt_number || body.receipt_number,
    order_number: sale.local_order_id || body.local_order_id,
    table_number: sale.table_number ?? body.table_number,
    waiter_name: sale.waiter_name || body.waiter_name,
    items: sale.items_json || body.items,
    total: sale.total ?? body.total,
    closed_at: sale.closed_at || body.closed_at,
    register_name: body.register_name || body.arka,
    cashier_name: body.cashier_name || body.operator_name,
  });
}

async function syncSaleFromPos(body) {
  const sale = await upsertSaleFromPos(body, { defaultStatus: "closed" });
  const device = String(body.device_id || sale?.device_id || "").trim().toUpperCase();
  const { WEB_WAITER, WEB_KIOSK, WEB_PUBLIC } = require("../lib/orderSource");
  const isWeb = [WEB_WAITER, WEB_KIOSK, WEB_PUBLIC].includes(device);
  if (!isWeb && sale?.status === "closed") {
    try {
      const { deductStockForOrder } = require("./stockService");
      await deductStockForOrder(sale.client_id, sale.items_json || body.items);
    } catch (err) {
      console.warn("[stock] POS deduct failed:", err.message);
    }
    try {
      const { deductIngredientsForOrder } = require("./inventoryService");
      await deductIngredientsForOrder(sale.client_id, sale.items_json || body.items);
    } catch (err) {
      console.warn("[inventory] POS deduct failed:", err.message);
    }
  }
  const receipt = await buildSaleReceipt(sale, body);
  return { sale, receipt };
}

async function updateActiveSaleFromPos(body) {
  const status = String(body.status || "ordered").toLowerCase();
  if (!["ordered", "cancelled"].includes(status)) {
    throw new Error("Statusi duhet të jetë ordered ose cancelled.");
  }
  return upsertSaleFromPos({ ...body, status }, { defaultStatus: "ordered" });
}

async function getLiveTablesForOwner(clientId) {
  const db = getSupabase();
  const { loadAreasForClient } = require("./venueService");
  const { buildTablesFromAreas } = require("../lib/tableLayout");

  const [{ data: settings }, { data: activeOrders, error }, areas] = await Promise.all([
    db.from("pos_settings").select("table_count, restaurant_name").eq("client_id", clientId).maybeSingle(),
    db
      .from("sales_orders")
      .select("table_number, waiter_name, waiter_id, items_json, total, ordered_at, local_order_id, status")
      .eq("client_id", clientId)
      .in("status", ["ordered", "ready"])
      .order("ordered_at", { ascending: false }),
    loadAreasForClient(clientId),
  ]);

  if (error) throw error;

  const metaByTable = new Map();
  const activeByTable = new Map();
  for (const o of activeOrders || []) {
    const num = Number(o.table_number) || 0;
    if (num < 1 || metaByTable.has(num)) continue;
    metaByTable.set(num, {
      ordered_at: o.ordered_at,
      local_order_id: o.local_order_id,
      order_status: o.status || "ordered",
    });
    activeByTable.set(num, {
      waiter_name: o.waiter_name || "",
      waiter_id: o.waiter_id || null,
      total: Number(o.total) || 0,
      active_items: normalizeItems(o.items_json),
    });
  }

  const layout = buildTablesFromAreas(areas, settings?.table_count, activeByTable);
  const tables = layout.tables.map(t => {
    const meta = metaByTable.get(t.number);
    const order = t.status === "occupied"
      ? {
          table_number: t.number,
          waiter_name: t.waiter_name || "",
          waiter_id: t.waiter_id || null,
          items: t.active_items || [],
          total: t.order_total || 0,
          ordered_at: meta?.ordered_at || null,
          local_order_id: meta?.local_order_id || null,
          order_status: meta?.order_status || "ordered",
        }
      : null;
    return {
      number: t.number,
      label: `T${t.number}`,
      area_name: t.area_name || null,
      status: t.status === "occupied" ? "occupied" : "free",
      order,
    };
  });

  return {
    table_count: layout.table_count,
    tables,
    areas: layout.areas,
    updated_at: new Date().toISOString(),
  };
}

async function sumSales(clientId, fromDate, toDate) {
  const db = getSupabase();
  let q = db
    .from("sales_orders")
    .select("total, closed_at")
    .eq("client_id", clientId)
    .eq("status", "closed");

  if (fromDate) q = q.gte("closed_at", `${fromDate}T00:00:00.000Z`);
  if (toDate) q = q.lte("closed_at", `${toDate}T23:59:59.999Z`);

  const { data, error } = await q;
  if (error) throw error;
  const rows = data || [];
  return {
    total: rows.reduce((s, r) => s + Number(r.total), 0),
    count: rows.length,
  };
}

async function getOwnerStats(clientId) {
  const r = dateRanges();
  const [today, week, month] = await Promise.all([
    sumSales(clientId, r.today, r.today),
    sumSales(clientId, r.week_from, r.today),
    sumSales(clientId, r.month_from, r.today),
  ]);
  return {
    sot: today,
    java: week,
    muaj: month,
  };
}

async function listOwnerOrders(clientId, opts = {}) {
  const limit = Math.min(100, Number(opts.limit) || 50);
  const db = getSupabase();
  let q = db
    .from("sales_orders")
    .select("id, table_number, waiter_name, waiter_id, items_json, total, receipt_number, closed_at, status")
    .eq("client_id", clientId)
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(limit);

  if (opts.waiter) q = q.eq("waiter_name", String(opts.waiter).trim());
  if (opts.table != null && opts.table !== "") {
    q = q.eq("table_number", Number(opts.table));
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(o => ({
    ...o,
    items_json: normalizeItems(o.items_json),
  }));
}

async function getOwnerOrderFilters(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("sales_orders")
    .select("waiter_name, table_number")
    .eq("client_id", clientId)
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  const rows = data || [];
  const waiters = [...new Set(rows.map(r => r.waiter_name).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "sq"),
  );
  const tables = [...new Set(rows.map(r => r.table_number).filter(n => n != null && n !== ""))]
    .map(Number)
    .sort((a, b) => a - b);
  return { waiters, tables };
}

async function getOwnerReport(clientId, from, to) {
  const db = getSupabase();
  const fromD = from || new Date().toISOString().slice(0, 10);
  const toD = to || fromD;

  const { data, error } = await db
    .from("sales_orders")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "closed")
    .gte("closed_at", `${fromD}T00:00:00.000Z`)
    .lte("closed_at", `${toD}T23:59:59.999Z`)
    .order("closed_at", { ascending: false });

  if (error) throw error;
  const orders = data || [];
  const total = orders.reduce((s, o) => s + Number(o.total), 0);

  const byDay = {};
  for (const o of orders) {
    const d = o.closed_at.slice(0, 10);
    if (!byDay[d]) byDay[d] = { date: d, total: 0, count: 0 };
    byDay[d].total += Number(o.total);
    byDay[d].count += 1;
  }

  return {
    from: fromD,
    to: toD,
    total,
    order_count: orders.length,
    by_day: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    orders,
  };
}

async function getClientById(clientId) {
  const db = getSupabase();
  const { data, error } = await db.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = {
  normalizeItems,
  mergeOrderItems,
  syncSaleFromPos,
  buildSaleReceipt,
  updateActiveSaleFromPos,
  freeTableFromPos,
  getLiveTablesForOwner,
  getOwnerStats,
  listOwnerOrders,
  getOwnerOrderFilters,
  getOwnerReport,
  getClientById,
};
