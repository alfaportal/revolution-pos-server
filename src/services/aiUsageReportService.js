const { getSupabase } = require("../db");

function parseMonthParam(monthStr) {
  const raw = String(monthStr || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  const year = match ? Number(match[1]) : now.getUTCFullYear();
  const month = match ? Number(match[2]) : now.getUTCMonth() + 1;

  if (month < 1 || month > 12) {
    throw new Error("Muaji duhet të jetë në format YYYY-MM (01–12).");
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return {
    month: `${year}-${String(month).padStart(2, "0")}`,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function roundUsd(value) {
  return Math.round(Number(value || 0) * 1_000_000) / 1_000_000;
}

async function listAiUsageSummary({ month } = {}) {
  const range = parseMonthParam(month);
  const db = getSupabase();

  const { data, error } = await db
    .from("ai_usage_logs")
    .select("restaurant_id, tokens_used, cost_usd, clients ( id, emri )")
    .gte("created_at", range.startIso)
    .lt("created_at", range.endIso);

  if (error) {
    if (error.code === "42P01" || /ai_usage_logs/.test(error.message || "")) {
      return {
        month: range.month,
        rows: [],
        totals: { calls: 0, tokens_total: 0, cost_usd_total: 0 },
        table_missing: true,
      };
    }
    throw error;
  }

  const byRestaurant = new Map();

  for (const row of data || []) {
    const id = row.restaurant_id;
    if (!id) continue;

    let entry = byRestaurant.get(id);
    if (!entry) {
      entry = {
        restaurant_id: id,
        local_name: row.clients?.emri || id,
        calls: 0,
        tokens_total: 0,
        cost_usd_total: 0,
      };
      byRestaurant.set(id, entry);
    }

    entry.calls += 1;
    entry.tokens_total += Number(row.tokens_used) || 0;
    entry.cost_usd_total += Number(row.cost_usd) || 0;
  }

  const rows = [...byRestaurant.values()]
    .map((row) => ({
      ...row,
      cost_usd_total: roundUsd(row.cost_usd_total),
    }))
    .sort((a, b) => a.local_name.localeCompare(b.local_name, "sq"));

  const totals = rows.reduce(
    (acc, row) => {
      acc.calls += row.calls;
      acc.tokens_total += row.tokens_total;
      acc.cost_usd_total += row.cost_usd_total;
      return acc;
    },
    { calls: 0, tokens_total: 0, cost_usd_total: 0 },
  );
  totals.cost_usd_total = roundUsd(totals.cost_usd_total);

  return { month: range.month, rows, totals, table_missing: false };
}

function aiUsageRowsToCsv(rows) {
  const header = "Lokal,Calls,Tokens total,Kosto USD";
  const lines = rows.map((row) => {
    const name = String(row.local_name || "").replace(/"/g, '""');
    return `"${name}",${row.calls},${row.tokens_total},${row.cost_usd_total.toFixed(6)}`;
  });
  return `${header}\n${lines.join("\n")}\n`;
}

module.exports = {
  parseMonthParam,
  listAiUsageSummary,
  aiUsageRowsToCsv,
};
