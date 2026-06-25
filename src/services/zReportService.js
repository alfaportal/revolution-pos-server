const { getSupabase } = require("../db");
const { VAT_CATEGORIES, VAT_KEYS, emptyVatBreakdown, sumVatBreakdowns } = require("../lib/vatCategories");
const { getFiscalSettings } = require("./fiscalService");
const { normalizeItems } = require("./salesService");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dayBounds(dateStr) {
  const d = dateStr || todayISO();
  return {
    date: d,
    from: `${d}T00:00:00.000Z`,
    to: `${d}T23:59:59.999Z`,
  };
}

async function fetchDayFiscalReceipts(clientId, dateStr) {
  const { from, to } = dayBounds(dateStr);
  const db = getSupabase();
  const { data, error } = await db
    .from("fiscal_receipts")
    .select("*")
    .eq("client_id", clientId)
    .gte("printed_at", from)
    .lte("printed_at", to)
    .order("printed_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchDayClosedSales(clientId, dateStr) {
  const { from, to } = dayBounds(dateStr);
  const db = getSupabase();
  const { data, error } = await db
    .from("sales_orders")
    .select("id, table_number, waiter_name, items_json, total, receipt_number, closed_at, payment_status, payment_method, fiscal_receipt_id")
    .eq("client_id", clientId)
    .eq("status", "closed")
    .gte("closed_at", from)
    .lte("closed_at", to)
    .order("closed_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(o => ({
    ...o,
    items_json: normalizeItems(o.items_json),
  }));
}

async function getCumulativeTurnover(clientId, beforeDate) {
  const db = getSupabase();
  const { data, error } = await db
    .from("fiscal_receipts")
    .select("total_gross")
    .eq("client_id", clientId)
    .lt("printed_at", `${beforeDate}T00:00:00.000Z`);
  if (error) throw error;
  return Math.round((data || []).reduce((s, r) => s + Number(r.total_gross), 0) * 100) / 100;
}

async function buildDailyZReport(clientId, dateStr) {
  const date = dateStr || todayISO();
  const settings = await getFiscalSettings(clientId);
  const receipts = await fetchDayFiscalReceipts(clientId, date);
  const sales = await fetchDayClosedSales(clientId, date);

  const totals = sumVatBreakdowns(receipts);
  const couponCount = receipts.filter(r => r.status === "printed" || r.status === "manual").length;
  const cashRegisterBalance = receipts.reduce((s, r) => s + Number(r.cash_given || r.total_gross), 0);
  const cumulativeBefore = await getCumulativeTurnover(clientId, date);
  const cumulativeTurnover = Math.round((cumulativeBefore + totals.totalGross) * 100) / 100;

  const salesDetail = sales.map(s => {
    const receipt = receipts.find(r => r.sale_order_id === s.id);
    const pm = s.payment_method === "karte" ? "karte" : "cash";
    return {
      id: s.id,
      time: s.closed_at,
      table_number: s.table_number,
      waiter_name: s.waiter_name,
      total: Number(s.total),
      payment_status: s.payment_status,
      payment_method: pm,
      payment_label: pm === "karte" ? "Kartë" : "Cash",
      receipt_number: s.receipt_number,
      coupon_nr: receipt?.coupon_nr || "",
      serial_nr: receipt?.serial_nr || "",
      items: s.items_json,
    };
  });

  const payment_totals = { cash: 0, karte: 0 };
  for (const s of salesDetail) {
    payment_totals[s.payment_method] = Math.round((payment_totals[s.payment_method] + s.total) * 100) / 100;
  }

  return {
    report_date: date,
    business_name: settings.business_name,
    fiscal_nr: settings.fiscal_nr,
    responsible_person: settings.fiscal_operator_name || settings.business_name,
    coupon_count: couponCount,
    turnover_total: totals.totalGross,
    turnover_net: totals.totalNet,
    turnover_vat: totals.totalVat,
    vat_breakdown: totals.breakdown,
    vat_categories: VAT_CATEGORIES,
    cash_register_balance: Math.round(cashRegisterBalance * 100) / 100,
    cumulative_turnover: cumulativeTurnover,
    cumulative_before: cumulativeBefore,
    sales: salesDetail,
    payment_totals,
    fiscal_receipts: receipts,
    generated_at: new Date().toISOString(),
  };
}

async function getStoredZReport(clientId, dateStr) {
  const db = getSupabase();
  const { data } = await db
    .from("daily_z_reports")
    .select("*")
    .eq("client_id", clientId)
    .eq("report_date", dateStr)
    .maybeSingle();
  return data;
}

async function saveDailyZReport(clientId, dateStr, { close = false } = {}) {
  const report = await buildDailyZReport(clientId, dateStr);
  const db = getSupabase();
  const row = {
    client_id: clientId,
    report_date: report.report_date,
    coupon_count: report.coupon_count,
    turnover_total: report.turnover_total,
    turnover_net: report.turnover_net,
    turnover_vat: report.turnover_vat,
    vat_breakdown: report.vat_breakdown,
    cash_register_balance: report.cash_register_balance,
    cumulative_turnover: report.cumulative_turnover,
    responsible_person: report.responsible_person,
    fiscal_nr: report.fiscal_nr,
    sales_json: report.sales,
    closed_at: close ? new Date().toISOString() : null,
  };

  const { data, error } = await db
    .from("daily_z_reports")
    .upsert(row, { onConflict: "client_id,report_date" })
    .select()
    .single();
  if (error) throw error;
  return { ...report, stored: data, closed: close };
}

async function listZReportHistory(clientId, limit = 60) {
  const db = getSupabase();
  const { data, error } = await db
    .from("daily_z_reports")
    .select("report_date, coupon_count, turnover_total, turnover_vat, cash_register_balance, cumulative_turnover, closed_at, created_at")
    .eq("client_id", clientId)
    .order("report_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

function zReportToCsv(report) {
  const lines = [];
  lines.push("Raporti Ditor (Z-Report)");
  lines.push(`Biznesi,${csvEsc(report.business_name)}`);
  lines.push(`Nr.Fisk,${csvEsc(report.fiscal_nr)}`);
  lines.push(`Data,${report.report_date}`);
  lines.push(`Kuponë fiskalë,${report.coupon_count}`);
  lines.push(`Qarkullimi total (€),${report.turnover_total}`);
  lines.push(`Totali pa TVSH (€),${report.turnover_net}`);
  lines.push(`TVSH total (€),${report.turnover_vat}`);
  lines.push(`Gjendja e arkës (€),${report.cash_register_balance}`);
  lines.push(`Qarkullimi kumulativ (€),${report.cumulative_turnover}`);
  lines.push(`Pagesa Cash (€),${report.payment_totals?.cash ?? 0}`);
  lines.push(`Pagesa Kartë (€),${report.payment_totals?.karte ?? 0}`);
  lines.push("");
  lines.push("TVSH breakdown");
  lines.push("Kategoria,Neto,VAT,Bruto");
  for (const k of VAT_KEYS) {
    const v = report.vat_breakdown?.[k] || { net: 0, vat: 0, gross: 0 };
    lines.push(`${k},${v.net},${v.vat},${v.gross}`);
  }
  lines.push("");
  lines.push("Shitjet");
  lines.push("Koha,Tavolina,Kamarieri,Totali,Pagesa,Kupon,Serial,Statusi");
  for (const s of report.sales || []) {
    lines.push([
      s.time || "",
      s.table_number || "",
      csvEsc(s.waiter_name),
      s.total,
      csvEsc(s.payment_label || s.payment_method || "Cash"),
      csvEsc(s.coupon_nr),
      csvEsc(s.serial_nr),
      s.payment_status || "",
    ].join(","));
  }
  return lines.join("\n");
}

function csvEsc(s) {
  const t = String(s ?? "");
  if (t.includes(",") || t.includes('"')) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function zReportToHtml(report) {
  const vatRows = VAT_KEYS.map(k => {
    const v = report.vat_breakdown?.[k] || { net: 0, vat: 0, gross: 0 };
    return `<tr><td>${VAT_CATEGORIES[k].label}</td><td>${v.net.toFixed(2)} €</td><td>${v.vat.toFixed(2)} €</td><td>${v.gross.toFixed(2)} €</td></tr>`;
  }).join("");

  const salesRows = (report.sales || []).map(s => `
    <tr>
      <td>${new Date(s.time).toLocaleString("sq-AL")}</td>
      <td>T${s.table_number || "—"}</td>
      <td>${escHtml(s.waiter_name)}</td>
      <td>${Number(s.total).toFixed(2)} €</td>
      <td>${escHtml(s.payment_label || "Cash")}</td>
      <td>${escHtml(s.coupon_nr || "—")}</td>
      <td>${escHtml(s.payment_status || "")}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html lang="sq"><head><meta charset="UTF-8">
<title>Z-Report ${report.report_date}</title>
<style>
body{font-family:Arial,sans-serif;padding:24px;color:#111}
h1{margin:0 0 4px} .meta{color:#444;margin-bottom:16px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:16px 0}
.box{border:1px solid #ccc;padding:12px;border-radius:8px;margin:12px 0}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:13px}
th{background:#f5f5f5}
.total{font-size:1.2em;font-weight:bold}
@media print{body{padding:12px}}
</style></head><body>
<h1>RAPORTI DITOR (Z-REPORT)</h1>
<div class="meta">${escHtml(report.business_name)} · Nr.Fisk: ${escHtml(report.fiscal_nr)} · ${report.report_date}</div>
<div class="grid">
  <div><strong>Kuponë fiskalë:</strong> ${report.coupon_count}</div>
  <div><strong>Qarkullimi ditor:</strong> ${report.turnover_total.toFixed(2)} €</div>
  <div><strong>Totali pa TVSH:</strong> ${report.turnover_net.toFixed(2)} €</div>
  <div><strong>TVSH total:</strong> ${report.turnover_vat.toFixed(2)} €</div>
  <div><strong>Gjendja e arkës:</strong> ${report.cash_register_balance.toFixed(2)} €</div>
  <div><strong>Pagesa Cash:</strong> ${(report.payment_totals?.cash ?? 0).toFixed(2)} €</div>
  <div><strong>Pagesa Kartë:</strong> ${(report.payment_totals?.karte ?? 0).toFixed(2)} €</div>
  <div><strong>Qarkullimi kumulativ:</strong> ${report.cumulative_turnover.toFixed(2)} €</div>
  <div><strong>Përgjegjësi:</strong> ${escHtml(report.responsible_person)}</div>
</div>
<div class="box"><strong>TVSH breakdown (A–E)</strong>
<table><thead><tr><th>Kategoria</th><th>Neto</th><th>TVSH</th><th>Bruto</th></tr></thead>
<tbody>${vatRows}</tbody></table></div>
<div class="box"><strong>Shitjet e ditës</strong>
<table><thead><tr><th>Koha</th><th>Tav.</th><th>Kamarieri</th><th>Totali</th><th>Pagesa</th><th>Kupon</th><th>Statusi</th></tr></thead>
<tbody>${salesRows || "<tr><td colspan='7'>—</td></tr>"}</tbody></table></div>
<p class="meta">Gjeneruar: ${new Date(report.generated_at).toLocaleString("sq-AL")} · RKS MF</p>
</body></html>`;
}

function escHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

module.exports = {
  buildDailyZReport,
  saveDailyZReport,
  getStoredZReport,
  listZReportHistory,
  zReportToCsv,
  zReportToHtml,
};
