const FEATURE_TYPES = new Set(["chat", "ocr"]);

/** USD për 1 000 tokenë — mbishkruhet me env (AI_COST_USD_PER_1K_CHAT / _OCR). */
const COST_PER_1K_TOKENS_USD = {
  chat: Number(process.env.AI_COST_USD_PER_1K_CHAT) || 0.00015,
  ocr: Number(process.env.AI_COST_USD_PER_1K_OCR) || 0.0025,
};

function normalizeFeatureType(featureType) {
  const type = String(featureType || "").trim().toLowerCase();
  if (!FEATURE_TYPES.has(type)) {
    throw new Error(`feature_type i pavlefshëm: ${featureType}. Lejohen: chat, ocr.`);
  }
  return type;
}

function normalizeTokens(tokensUsed) {
  const n = Math.floor(Number(tokensUsed));
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`tokens_used i pavlefshëm: ${tokensUsed}`);
  }
  return n;
}

function estimateCostUsd(featureType, tokensUsed) {
  const type = normalizeFeatureType(featureType);
  const tokens = normalizeTokens(tokensUsed);
  const rate = COST_PER_1K_TOKENS_USD[type] ?? COST_PER_1K_TOKENS_USD.chat;
  const cost = (tokens / 1000) * rate;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

module.exports = {
  FEATURE_TYPES,
  COST_PER_1K_TOKENS_USD,
  normalizeFeatureType,
  normalizeTokens,
  estimateCostUsd,
};
