/**
 * Aggregime për Super Admin desktop dashboard (/admin/dashboard).
 * Lexon të dhëna ekzistuese — nuk ndryshon licenseService / owner / waiter.
 */
const fs = require("fs");
const path = require("path");
const { getSupabase } = require("../db");
const { listClients, listLicenses } = require("./licenseService");
const { listAiUsageSummary } = require("./aiUsageReportService");
const { listStockAlertsForAdmin } = require("./stockService");
const { packageLabel } = require("../lib/packages");
const {
  CLIENT_SECTORS,
  normalizeClientTipi,
  labelForTipi,
  sectorForTipi,
} = require("../utils/businessTipi");
const { buildAiUsageInvoicePdf } = require("./aiBillingPdfService");

const SETTINGS_PATH = path.join(__dirname, "../../data/super-admin-settings.json");
const INVOICES_PATH = path.join(__dirname, "../../data/super-admin-invoices.json");

const DEFAULT_SETTINGS = {
  admin_name: "Naser",
  admin_email: "admin@revolutioninvest.com",
  package_prices: {
    pako_1: 29,
    pako_2: 49,
    pako_3: 79,
    pako_4: 129,
  },
  ai_price_per_1k_tokens: 0.0025,
  currency: "EUR",
};

function ensureDataDir() {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return structuredClone(fallback);
    return { ...structuredClone(fallback), ...JSON.parse(fs.readFileSync(filePath, "utf8")) };
  } catch {
    return structuredClone(fallback);
  }
}

function writeJsonFile(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function getSettings() {
  const s = readJsonFile(SETTINGS_PATH, DEFAULT_SETTINGS);
  s.package_prices = { ...DEFAULT_SETTINGS.package_prices, ...(s.package_prices || {}) };
  return s;
}

function updateSettings(patch = {}) {
  const cur = getSettings();
  const next = {
    ...cur,
    ...patch,
    package_prices: {
      ...cur.package_prices,
      ...(patch.package_prices || {}),
    },
  };
  if (patch.ai_price_per_1k_tokens != null) {
    next.ai_price_per_1k_tokens = Number(patch.ai_price_per_1k_tokens) || cur.ai_price_per_1k_tokens;
  }
  writeJsonFile(SETTINGS_PATH, next);
  return next;
}

function listBillingInvoices() {
  const data = readJsonFile(INVOICES_PATH, { invoices: [] });
  return Array.isArray(data.invoices) ? data.invoices : [];
}

function saveBillingInvoices(invoices) {
  writeJsonFile(INVOICES_PATH, { invoices });
}

function dayStartIso(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isoDate(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function fetchClosedSales({ fromIso, toIso }) {
  const db = getSupabase();
  let q = db
    .from("sales_orders")
    .select("id, client_id, total, closed_at, status, waiter_name")
    .eq("status", "closed")
    .gte("closed_at", fromIso);
  if (toIso) q = q.lt("closed_at", toIso);
  const { data, error } = await q.limit(20000);
  if (error) {
    console.warn("[super-dashboard] sales_orders:", error.message);
    return [];
  }
  return data || [];
}

async function salesTodayByClient() {
  const fromIso = dayStartIso();
  const rows = await fetchClosedSales({ fromIso });
  const map = new Map();
  let total = 0;
  for (const r of rows) {
    const t = Number(r.total) || 0;
    total += t;
    const cid = r.client_id;
    if (!cid) continue;
    map.set(cid, (map.get(cid) || 0) + t);
  }
  return { total: Number(total.toFixed(2)), byClient: map };
}

async function weeklySalesSeries() {
  const days = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    days.push(isoDate(d));
  }
  const fromIso = dayStartIso(addDays(today, -6));
  const rows = await fetchClosedSales({ fromIso });
  const byDay = Object.fromEntries(days.map((d) => [d, 0]));
  for (const r of rows) {
    const d = isoDate(r.closed_at);
    if (byDay[d] == null) continue;
    byDay[d] += Number(r.total) || 0;
  }
  return days.map((date) => ({
    date,
    total: Number((byDay[date] || 0).toFixed(2)),
  }));
}

function licenseLastSeen(lic) {
  const terminals = lic.terminals || [];
  let latest = lic.last_activated_at || lic.updated_at || lic.created_at || null;
  for (const t of terminals) {
    if (t.last_seen_at && (!latest || new Date(t.last_seen_at) > new Date(latest))) {
      latest = t.last_seen_at;
    }
  }
  return latest;
}

function isOfflineOver48h(lic) {
  const seen = licenseLastSeen(lic);
  if (!seen) return true;
  return Date.now() - new Date(seen).getTime() > 48 * 60 * 60 * 1000;
}

async function getOverview() {
  const [clients, licenses, stockAlerts, salesToday, weekly] = await Promise.all([
    listClients(),
    listLicenses(),
    listStockAlertsForAdmin().catch(() => []),
    salesTodayByClient(),
    weeklySalesSeries(),
  ]);

  const activeClients = clients.filter((c) => c.aktiv !== false);
  const licByClient = new Map();
  for (const lic of licenses) {
    const cid = lic.client_id || lic.clients?.id;
    if (!cid) continue;
    if (!licByClient.has(cid)) licByClient.set(cid, []);
    licByClient.get(cid).push(lic);
  }

  const stockZeroClientIds = new Set(
    (stockAlerts || []).filter((a) => (a.out_count || 0) > 0).map((a) => a.client_id),
  );

  const problems = [];
  for (const c of clients) {
    const lics = licByClient.get(c.id) || [];
    const reasons = [];
    if (lics.some((l) => ["skaduar", "revokuar", "pezulluar"].includes(l.statusi))) {
      reasons.push("licencë skaduar/bllokuar");
    }
    if (lics.length && lics.every((l) => isOfflineOver48h(l))) {
      reasons.push("offline >48h");
    }
    if (stockZeroClientIds.has(c.id)) {
      reasons.push("stok zero");
    }
    if (reasons.length) {
      problems.push({
        id: c.id,
        emri: c.emri,
        tipi: normalizeClientTipi(c.tipi),
        tipi_label: labelForTipi(c.tipi),
        reasons,
      });
    }
  }

  return {
    active_clients: activeClients.length,
    clients_total: clients.length,
    sales_today_total: salesToday.total,
    problem_clients: problems,
    weekly_sales: weekly,
  };
}

async function getClientsGrouped() {
  const [clients, licenses, salesToday] = await Promise.all([
    listClients(),
    listLicenses(),
    salesTodayByClient(),
  ]);

  const licByClient = new Map();
  for (const lic of licenses) {
    const cid = lic.client_id || lic.clients?.id;
    if (!cid) continue;
    if (!licByClient.has(cid)) licByClient.set(cid, []);
    licByClient.get(cid).push(lic);
  }

  const sectors = CLIENT_SECTORS.map((s) => ({
    num: s.num,
    id: s.id,
    label: s.label,
    tipet: s.tipet,
    keywords: s.keywords || [],
    clients: [],
  }));
  const bySectorId = new Map(sectors.map((s) => [s.id, s]));

  for (const c of clients) {
    const tipi = normalizeClientTipi(c.tipi);
    const sector = sectorForTipi(tipi);
    const lics = licByClient.get(c.id) || [];
    const activeLic = lics.some((l) => l.statusi === "aktive");
    const row = {
      id: c.id,
      emri: c.emri,
      tipi,
      tipi_label: labelForTipi(c.tipi),
      package_tier: c.package_tier,
      package_label: packageLabel(c.package_tier),
      status: c.aktiv === false ? "joaktiv" : activeLic ? "aktiv" : "joaktiv",
      sales_today: Number((salesToday.byClient.get(c.id) || 0).toFixed(2)),
      email: c.email || "",
      telefoni: c.telefoni || "",
      icon: iconForTipi(tipi),
      sector_num: sector.num,
      sector_id: sector.id,
    };
    const bucket = bySectorId.get(sector.id) || bySectorId.get("other");
    bucket.clients.push(row);
  }

  return {
    sectors,
    groups: sectors, // alias për UI të vjetër
    total: clients.length,
  };
}

function iconForTipi(tipi) {
  const map = {
    kafene: "☕",
    restorant: "🍽️",
    bar: "🍸",
    pub_lounge: "🛋️",
    piceri: "🍕",
    fast_food: "🍔",
    kebab: "🥙",
    pasticeri: "🧁",
    akullore: "🍦",
    gjeltore: "🍗",
    furre_buke: "🥖",
    hotel_restorant: "🏨",
    bar_nate: "🌙",
    klub: "🎶",
    market: "🛒",
    minimarket: "🧺",
    dyqan_rroba: "👕",
    dyqan_kepuce: "👟",
    dyqan: "🏬",
    farmaci: "💊",
    optike: "👓",
    berber: "💈",
    sallon_bukurie: "💅",
    tjeter: "🏪",
  };
  return map[normalizeClientTipi(tipi)] || "🏪";
}

async function getClientDetail(clientId) {
  const db = getSupabase();
  const id = String(clientId || "").trim();
  if (!id) throw new Error("Mungon client_id");

  const { data: client, error } = await db.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!client) throw new Error("Klienti nuk u gjet");

  const fromIso = dayStartIso(addDays(new Date(), -30));
  const [salesRows, licenses, stockAlerts, aiSummary, staff] = await Promise.all([
    fetchClosedSales({ fromIso }).then((rows) => rows.filter((r) => r.client_id === id)),
    listLicenses().then((all) => all.filter((l) => (l.client_id || l.clients?.id) === id)),
    listStockAlertsForAdmin()
      .then((a) => a.filter((x) => x.client_id === id))
      .catch(() => []),
    listAiUsageSummary({}).catch(() => ({ rows: [], totals: {} })),
    db
      .from("pos_staff")
      .select("id, name, role, active, pin_hash")
      .eq("client_id", id)
      .order("name", { ascending: true })
      .then((r) => r.data || [])
      .catch(() => []),
  ]);

  const salesToday = salesRows
    .filter((r) => isoDate(r.closed_at) === isoDate(new Date()))
    .reduce((s, r) => s + (Number(r.total) || 0), 0);
  const sales30 = salesRows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const aiRow = (aiSummary.rows || []).find((r) => String(r.restaurant_id) === id);

  const { data: menuStock } = await db
    .from("pos_menu_items")
    .select("id, name, stock_quantity, track_stock, active")
    .eq("client_id", id)
    .limit(500)
    .then((r) => r)
    .catch(() => ({ data: [] }));

  const zeroStock = (menuStock || []).filter(
    (m) => m.track_stock && m.active !== false && Number(m.stock_quantity || 0) <= 0,
  );

  return {
    client: {
      ...client,
      tipi_label: labelForTipi(client.tipi),
      package_label: packageLabel(client.package_tier),
      icon: iconForTipi(client.tipi),
    },
    sales: {
      today: Number(salesToday.toFixed(2)),
      last_30_days: Number(sales30.toFixed(2)),
      order_count_30d: salesRows.length,
      recent: salesRows.slice(0, 40).map((r) => ({
        id: r.id,
        total: Number(r.total) || 0,
        closed_at: r.closed_at,
        waiter_name: r.waiter_name || "",
      })),
    },
    stock: {
      alerts: stockAlerts,
      zero_items: zeroStock.slice(0, 50),
      zero_count: zeroStock.length,
    },
    waiters: (staff || []).map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role || "waiter",
      active: s.active !== false,
    })),
    licenses: licenses.map((l) => ({
      id: l.id,
      celesi: l.celesi,
      device_id: l.display_device_id || l.device_id || "",
      statusi: l.statusi,
      activated_at: l.last_activated_at || l.created_at,
      last_seen_at: licenseLastSeen(l),
    })),
    ai_usage: aiRow || {
      tokens_total: 0,
      cost_eur_total: 0,
      calls: 0,
    },
  };
}

async function getLicensesView() {
  const licenses = await listLicenses();
  return {
    licenses: licenses.map((l) => ({
      id: l.id,
      client_id: l.client_id || l.clients?.id,
      client_name: l.clients?.emri || "—",
      hardware_id: l.display_device_id || l.device_id || "",
      license_key: l.celesi || "",
      statusi: l.statusi,
      activated_at: l.last_activated_at || l.created_at,
      last_seen_at: licenseLastSeen(l),
    })),
  };
}

async function getAiUsageDashboard({ month } = {}) {
  const summary = await listAiUsageSummary({ month });
  const db = getSupabase();
  const rangeMonth = summary.month;
  const [y, m] = rangeMonth.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
  const end = new Date(Date.UTC(y, m, 1)).toISOString();

  const { data: logs } = await db
    .from("ai_usage_logs")
    .select("created_at, tokens_used, cost_eur")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: true })
    .limit(10000)
    .then((r) => r)
    .catch(() => ({ data: [] }));

  const byDay = new Map();
  for (const row of logs || []) {
    const d = isoDate(row.created_at);
    if (!byDay.has(d)) byDay.set(d, { date: d, tokens: 0, cost_eur: 0 });
    const e = byDay.get(d);
    e.tokens += Number(row.tokens_used) || 0;
    e.cost_eur += Number(row.cost_eur) || 0;
  }

  const timeline = [...byDay.values()].map((e) => ({
    date: e.date,
    tokens: e.tokens,
    cost_eur: Number(e.cost_eur.toFixed(4)),
  }));

  const rows = (summary.rows || []).map((r) => ({
    ...r,
    last_used_at: null,
  }));

  // last used per restaurant
  const lastByRest = new Map();
  for (const row of logs || []) {
    /* logs may not include restaurant_id in this select — refetch if needed */
  }
  const { data: lastLogs } = await db
    .from("ai_usage_logs")
    .select("restaurant_id, created_at")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false })
    .limit(5000)
    .then((r) => r)
    .catch(() => ({ data: [] }));
  for (const row of lastLogs || []) {
    if (!row.restaurant_id || lastByRest.has(row.restaurant_id)) continue;
    lastByRest.set(row.restaurant_id, row.created_at);
  }
  for (const r of rows) {
    r.last_used_at = lastByRest.get(r.restaurant_id) || null;
  }

  return {
    month: summary.month,
    rows,
    totals: summary.totals,
    timeline,
    table_missing: summary.table_missing || false,
  };
}

async function getSalesReport({ from, to, group = "day" } = {}) {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : addDays(toDate, -29);
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  const rows = await fetchClosedSales({
    fromIso: fromDate.toISOString(),
    toIso: addDays(toDate, 1).toISOString(),
  });
  const clients = await listClients();
  const nameById = new Map(clients.map((c) => [c.id, c.emri]));

  const byClient = new Map();
  const byPeriod = new Map();

  function periodKey(iso) {
    const d = new Date(iso);
    if (group === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (group === "week") {
      const tmp = new Date(d);
      tmp.setHours(0, 0, 0, 0);
      tmp.setDate(tmp.getDate() - ((tmp.getDay() + 6) % 7));
      return isoDate(tmp);
    }
    return isoDate(d);
  }

  for (const r of rows) {
    const cid = r.client_id;
    const total = Number(r.total) || 0;
    if (!byClient.has(cid)) byClient.set(cid, { client_id: cid, client_name: nameById.get(cid) || cid, total: 0, orders: 0 });
    const c = byClient.get(cid);
    c.total += total;
    c.orders += 1;

    const pk = periodKey(r.closed_at);
    if (!byPeriod.has(pk)) byPeriod.set(pk, { period: pk, total: 0, orders: 0 });
    const p = byPeriod.get(pk);
    p.total += total;
    p.orders += 1;
  }

  return {
    from: isoDate(fromDate),
    to: isoDate(toDate),
    group,
    by_client: [...byClient.values()]
      .map((r) => ({ ...r, total: Number(r.total.toFixed(2)) }))
      .sort((a, b) => b.total - a.total),
    by_period: [...byPeriod.values()]
      .map((r) => ({ ...r, total: Number(r.total.toFixed(2)) }))
      .sort((a, b) => String(a.period).localeCompare(String(b.period))),
    grand_total: Number(rows.reduce((s, r) => s + (Number(r.total) || 0), 0).toFixed(2)),
    order_count: rows.length,
  };
}

function reportToCsv(report) {
  const lines = ["Klienti,Porosi,Shitje EUR"];
  for (const r of report.by_client || []) {
    const name = String(r.client_name || "").replace(/"/g, '""');
    lines.push(`"${name}",${r.orders},${Number(r.total).toFixed(2)}`);
  }
  lines.push(`TOTALI,${report.order_count},${Number(report.grand_total).toFixed(2)}`);
  lines.push("");
  lines.push("Periudha,Porosi,Shitje EUR");
  for (const r of report.by_period || []) {
    lines.push(`${r.period},${r.orders},${Number(r.total).toFixed(2)}`);
  }
  return lines.join("\n");
}

async function createBillingInvoice({ restaurant_id, period_from, period_to, services, notes }) {
  const detail = await getClientDetail(restaurant_id);
  const settings = getSettings();
  const ai = detail.ai_usage || {};
  const packagePrice =
    Number(settings.package_prices?.[detail.client.package_tier]) ||
    Number(settings.package_prices?.pako_1) ||
    0;
  const tokenCost = Number(ai.cost_eur_total) || 0;
  const servicesTotal = Array.isArray(services)
    ? services.reduce((s, x) => s + (Number(x.amount) || 0), 0)
    : packagePrice;
  const total = Number((servicesTotal + tokenCost).toFixed(2));
  const invoice = {
    id: `INV-${Date.now()}`,
    restaurant_id,
    client_name: detail.client.emri,
    period_from: period_from || isoDate(addDays(new Date(), -30)),
    period_to: period_to || isoDate(new Date()),
    package_tier: detail.client.package_tier,
    package_price: packagePrice,
    ai_tokens: ai.tokens_total || 0,
    ai_cost: tokenCost,
    services: services || [{ label: `Pako ${packageLabel(detail.client.package_tier)}`, amount: packagePrice }],
    notes: notes || "",
    total,
    status: "papaguar",
    created_at: new Date().toISOString(),
  };
  const all = listBillingInvoices();
  all.unshift(invoice);
  saveBillingInvoices(all);
  return invoice;
}

function updateBillingInvoiceStatus(id, status) {
  const all = listBillingInvoices();
  const idx = all.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error("Fatura nuk u gjet");
  const st = String(status) === "paguar" ? "paguar" : "papaguar";
  all[idx] = { ...all[idx], status: st, updated_at: new Date().toISOString() };
  saveBillingInvoices(all);
  return all[idx];
}

function buildBillingInvoicePdf(invoice) {
  return buildAiUsageInvoicePdf({
    clientName: invoice.client_name,
    month: `${invoice.period_from} — ${invoice.period_to}`,
    tokensTotal: invoice.ai_tokens,
    costEur: invoice.total,
    calls: invoice.ai_tokens,
    packageTier: packageLabel(invoice.package_tier),
    invoiceNo: invoice.id,
    breakdown: {
      package: { calls: 1, tokens: 0, cost_eur: invoice.package_price },
      ai_tokens: { calls: 1, tokens: invoice.ai_tokens, cost_eur: invoice.ai_cost },
    },
  });
}

module.exports = {
  getOverview,
  getClientsGrouped,
  getClientDetail,
  getLicensesView,
  getAiUsageDashboard,
  getSalesReport,
  reportToCsv,
  getSettings,
  updateSettings,
  listBillingInvoices,
  createBillingInvoice,
  updateBillingInvoiceStatus,
  buildBillingInvoicePdf,
  iconForTipi,
  ADMIN_CLIENT_TIPI,
  TIPI_LABELS,
};
