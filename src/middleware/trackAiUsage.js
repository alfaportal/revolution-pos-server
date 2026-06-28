const { insertAiUsageLog } = require("../services/aiUsageService");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveRestaurantId(req) {
  return (
    req.user?.client_id ||
    req.kitchenClient?.id ||
    req.publicClient?.id ||
    req.client?.id ||
    req.license?.client_id ||
    null
  );
}

function isValidRestaurantId(restaurantId) {
  return typeof restaurantId === "string" && UUID_RE.test(restaurantId.trim());
}

/**
 * Regjistron një thirrje AI në ai_usage_logs (mos e ndal operacionin nëse dështon logu).
 * @param {string} restaurantId - UUID i restorantit (clients.id)
 * @param {'chat'|'ocr'} featureType
 * @param {number} tokensUsed
 * @param {{ costUsd?: number }} [options]
 * @returns {Promise<object|null>}
 */
async function trackAiUsage(restaurantId, featureType, tokensUsed, options = {}) {
  if (!isValidRestaurantId(restaurantId)) {
    console.warn("[ai-usage] restaurant_id mungon ose është i pavlefshëm");
    return null;
  }

  try {
    return await insertAiUsageLog({
      restaurantId: restaurantId.trim(),
      featureType,
      tokensUsed,
      costUsd: options.costUsd,
    });
  } catch (err) {
    console.warn("[ai-usage]", err.message);
    return null;
  }
}

/** E njëjta si trackAiUsage, por merr restaurant_id nga req (owner, kitchen, license, etj.). */
async function trackAiUsageFromReq(req, featureType, tokensUsed, options = {}) {
  const restaurantId = options.restaurantId || resolveRestaurantId(req);
  return trackAiUsage(restaurantId, featureType, tokensUsed, options);
}

module.exports = {
  trackAiUsage,
  trackAiUsageFromReq,
  resolveRestaurantId,
};
