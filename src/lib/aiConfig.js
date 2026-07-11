const { trimEnv } = require("./env");

/**
 * Master switch për të gjitha funksionet AI.
 * Vendos true për ta riaktivizuar (Pako 5). Kodi mbetet; vetëm ky flag ndryshon.
 */
const AI_ENABLED = false;

function pickProvider() {
  const explicit = trimEnv("AI_PROVIDER").toLowerCase();
  if (explicit === "openai" || explicit === "anthropic") return explicit;

  if (trimEnv("OPENAI_API_KEY")) return "openai";
  if (trimEnv("ANTHROPIC_API_KEY")) return "anthropic";
  return "";
}

/** AI i ndalur — AI_ENABLED=false ose AI_PAUSED=1 në .env. */
function isAiPaused() {
  if (!AI_ENABLED) return true;
  const v = trimEnv("AI_PAUSED");
  if (v === "0" || v.toLowerCase() === "false") return false;
  if (v === "1" || v.toLowerCase() === "true") return true;
  return true;
}

function isAiEnabled() {
  if (!AI_ENABLED || isAiPaused()) return false;
  return getAiConfig().ready;
}

function getAiConfig() {
  const provider = pickProvider();
  const openaiKey = trimEnv("OPENAI_API_KEY");
  const anthropicKey = trimEnv("ANTHROPIC_API_KEY");

  if (provider === "openai") {
    return {
      provider: "openai",
      ready: !!openaiKey,
      apiKey: openaiKey,
      model: trimEnv("OPENAI_MODEL") || "gpt-4o-mini",
      maxTokens: Math.min(4096, Math.max(256, Number(process.env.AI_CHAT_MAX_TOKENS) || 1024)),
    };
  }

  if (provider === "anthropic") {
    return {
      provider: "anthropic",
      ready: !!anthropicKey,
      apiKey: anthropicKey,
      model: trimEnv("ANTHROPIC_MODEL") || "claude-3-5-haiku-latest",
      maxTokens: Math.min(4096, Math.max(256, Number(process.env.AI_CHAT_MAX_TOKENS) || 1024)),
    };
  }

  return { provider: "", ready: false, apiKey: "", model: "", maxTokens: 1024 };
}

module.exports = { AI_ENABLED, getAiConfig, pickProvider, isAiPaused, isAiEnabled };
