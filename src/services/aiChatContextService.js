const { getClientById } = require("./licenseService");
const {
  buildDailyReportPayload,
  getTodayReport,
  getZonedParts,
} = require("./aiDailyReportService");
const { getSuggestionsByDate } = require("./supplySuggestionService");

async function buildOwnerChatContext(clientId) {
  const today = getZonedParts().date;
  const client = await getClientById(clientId).catch(() => null);

  const [payload, aiReport, supplySuggestions] = await Promise.all([
    buildDailyReportPayload(clientId, today).catch(() => null),
    getTodayReport(clientId).catch(() => null),
    getSuggestionsByDate(clientId, today).catch(() => []),
  ]);

  return {
    business_name: client?.emri || "",
    date: today,
    sales_today: payload?.sales
      ? {
          total_revenue: payload.sales.total_revenue,
          order_count: payload.sales.order_count,
          by_payment: payload.sales.by_payment,
        }
      : null,
    top_items: (payload?.top_items || []).slice(0, 5),
    profit_estimate: payload?.profit || null,
    low_stock: payload?.low_stock || null,
    ai_daily_report: aiReport?.summary_text || null,
    supply_suggestions: (supplySuggestions || []).slice(0, 8).map(s => ({
      name: s.item_name,
      order_quantity: s.order_quantity,
      unit: s.unit,
      supplier: s.last_supplier || "",
    })),
  };
}

module.exports = {
  buildOwnerChatContext,
};
