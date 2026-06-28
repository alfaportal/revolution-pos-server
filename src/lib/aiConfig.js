const { trimEnv } = require("./env");

function pickProvider() {
  const explicit = trimEnv("AI_PROVIDER").toLowerCase();
  if (explicit === "openai" || explicit === "anthropic") return explicit;

  if (trimEnv("OPENAI_API_KEY")) return "openai";
  if (trimEnv("ANTHROPIC_API_KEY")) return "anthropic";
  return "";
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

module.exports = { getAiConfig, pickProvider };
