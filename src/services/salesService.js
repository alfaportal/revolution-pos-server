const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");
const { findLicenseByKey, normalizeKey } = require("./licenseService");

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

async function syncSaleFromPos(body) {
  const celesi = normalizeKey(body.celesi || body.license_key);
  if (!celesi) throw new Error("Mungon çelësi i licencës.");

  const license = await findLicenseByKey(celesi);
  if (!license || license.statusi !== "aktive") {
    throw new Error("Liçenca nuk është aktive.");
  }

  const deviceId = String(body.device_id || license.device_id || "").trim().toUpperCase();
  const items = Array.isArray(body.items) ? body.items : JSON.parse(body.items_json || "[]");
  const total = Number(body.total) || 0;
  const closedAt = body.closed_at || new Date().toISOString();

  const row = {
    client_id: license.client_id,
    license_id: license.id,
    local_order_id: String(body.local_order_id || body.order_id || Date.now()),
    device_id: deviceId,
    table_number: Number(body.table_number) || 0,
    waiter_name: String(body.waiter_name || "").trim(),
    items_json: items,
    total,
    receipt_number: String(body.receipt_number || "").trim(),
    closed_at: closedAt,
  };

  const db = getSupabase();
  const { data, error } = await db
    .from("sales_orders")
    .upsert(row, { onConflict: "client_id,local_order_id,device_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function sumSales(clientId, fromDate, toDate) {
  const db = getSupabase();
  let q = db
    .from("sales_orders")
    .select("total, closed_at")
    .eq("client_id", clientId);

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

async function listOwnerOrders(clientId, limit = 30) {
  const db = getSupabase();
  const { data, error } = await db
    .from("sales_orders")
    .select("id, table_number, waiter_name, items_json, total, receipt_number, closed_at")
    .eq("client_id", clientId)
    .order("closed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function getOwnerReport(clientId, from, to) {
  const db = getSupabase();
  const fromD = from || new Date().toISOString().slice(0, 10);
  const toD = to || fromD;

  const { data, error } = await db
    .from("sales_orders")
    .select("*")
    .eq("client_id", clientId)
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
  syncSaleFromPos,
  getOwnerStats,
  listOwnerOrders,
  getOwnerReport,
  getClientById,
};
