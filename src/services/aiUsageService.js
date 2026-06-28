const { getSupabase } = require("../db");
const { estimateCostUsd, normalizeFeatureType, normalizeTokens } = require("../lib/aiPricing");

async function insertAiUsageLog({ restaurantId, featureType, tokensUsed, costUsd }) {
  const db = getSupabase();
  const tokens = normalizeTokens(tokensUsed);
  const row = {
    restaurant_id: String(restaurantId).trim(),
    feature_type: normalizeFeatureType(featureType),
    tokens_used: tokens,
    cost_usd: costUsd != null ? costUsd : estimateCostUsd(featureType, tokens),
  };

  const { data, error } = await db.from("ai_usage_logs").insert(row).select().single();
  if (error) throw error;
  return data;
}

module.exports = {
  insertAiUsageLog,
};
