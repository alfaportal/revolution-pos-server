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
    .select("status, closed_at, ordered_at")
    .eq("client_id", license.client_id)
    .eq("local_order_id", localOrderId)
    .eq("device_id", deviceId)
    .maybeSingle();

  let finalStatus = status;
  if (existing?.status === "closed" && status === "ordered") {
    finalStatus = "closed";
  } else if (existing?.status === "ready" && status === "ordered") {
    finalStatus = "ordered";
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

  if (finalStatus === "ordered") {
    row.ordered_at = body.ordered_at || existing?.ordered_at || now;
    row.closed_at = row.ordered_at;
    row.ready_at = null;
  } else if (finalStatus === "cancelled") {
    row.ordered_at = body.ordered_at || existing?.ordered_at || now;
    row.closed_at = now;
    row.ready_at = null;
    row.items_json = [];
    row.total = 0;
  } else if (finalStatus === "ready") {
    row.ready_at = body.ready_at || now;
    row.closed_at = body.closed_at || existing?.closed_at || now;
  } else {
    row.closed_at = body.closed_at || now;
    if (finalStatus === "closed" && !existing) {
      row.ordered_at = body.ordered_at || row.closed_at;
    }
  }

  const { data, error } = await db
    .from("sales_orders")
    .upsert(row, { onConflict: "client_id,local_order_id,device_id" })
    .select()
    .single();

  if (error) throw error;

  if (finalStatus === "ordered") {
    try {
      require("./kdsEvents").notifyKitchenUpdate(license.client_id, { order_id: data?.id });
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

  const [{ data: settings }, { data: activeOrders, error }] = await Promise.all([
    db.from("pos_settings").select("table_count").eq("client_id", clientId).maybeSingle(),
    db
      .from("sales_orders")
      .select("table_number, waiter_name, items_json, total, ordered_at, local_order_id")
      .eq("client_id", clientId)
      .eq("status", "ordered")
      .order("ordered_at", { ascending: false }),
  ]);

  if (error) throw error;

  const tableCount = Math.max(1, Math.min(99, Number(settings?.table_count) || 10));
  const byTable = new Map();
  for (const o of activeOrders || []) {
    const num = Number(o.table_number) || 0;
    if (num < 1 || byTable.has(num)) continue;
    byTable.set(num, {
      table_number: num,
      waiter_name: o.waiter_name || "",
      items: normalizeItems(o.items_json),
      total: Number(o.total) || 0,
      ordered_at: o.ordered_at,
      local_order_id: o.local_order_id,
    });
  }

  const tables = [];
  for (let n = 1; n <= tableCount; n += 1) {
    const order = byTable.get(n) || null;
    tables.push({
      number: n,
      label: `T${n}`,
      status: order ? "occupied" : "free",
      order,
    });
  }

  return { table_count: tableCount, tables, updated_at: new Date().toISOString() };
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
    .select("id, table_number, waiter_name, items_json, total, receipt_number, closed_at, status")
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
  getLiveTablesForOwner,
  getOwnerStats,
  listOwnerOrders,
  getOwnerOrderFilters,
  getOwnerReport,
  getClientById,
};
