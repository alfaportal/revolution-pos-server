const { getAiConfig } = require("../lib/aiConfig");

const SYSTEM_PROMPT =
  "Je asistent i Revolution Invest POS për restorante dhe kafene në shqip. " +
  "Ndihmo stafin me menu, porosi, raporte dhe përdorimin e sistemit. " +
  "Përgjigju shkurt, qartë dhe praktik.";

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-12)
    .map((entry) => ({
      role: entry?.role === "assistant" ? "assistant" : "user",
      content: String(entry?.content || "").trim(),
    }))
    .filter((entry) => entry.content);
}

function normalizeMessage(message) {
  const text = String(message || "").trim();
  if (!text) throw new Error("Mungon mesazhi.");
  if (text.length > 4000) throw new Error("Mesazhi është shumë i gjatë (max 4000 karaktere).");
  return text;
}

async function openaiChat(config, message, history) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: 0.4,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI gabim (${res.status})`);
  }

  const reply = String(data.choices?.[0]?.message?.content || "").trim();
  if (!reply) throw new Error("AI nuk ktheu përgjigje.");

  const tokensUsed =
    Number(data.usage?.total_tokens) ||
    Number(data.usage?.prompt_tokens || 0) + Number(data.usage?.completion_tokens || 0);

  return { reply, tokensUsed, provider: "openai", model: config.model };
}

async function anthropicChat(config, message, history) {
  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      system: SYSTEM_PROMPT,
      messages,
      max_tokens: config.maxTokens,
      temperature: 0.4,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || `Anthropic gabim (${res.status})`);
  }

  const reply = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!reply) throw new Error("AI nuk ktheu përgjigje.");

  const tokensUsed =
    Number(data.usage?.input_tokens || 0) + Number(data.usage?.output_tokens || 0);

  return { reply, tokensUsed, provider: "anthropic", model: config.model };
}

async function sendStaffChat({ message, history = [] }) {
  const config = getAiConfig();
  if (!config.ready) {
    throw new Error(
      "AI chat nuk është aktiv. Vendos OPENAI_API_KEY ose ANTHROPIC_API_KEY në environment.",
    );
  }

  const normalizedMessage = normalizeMessage(message);
  const normalizedHistory = normalizeHistory(history);

  if (config.provider === "anthropic") {
    return anthropicChat(config, normalizedMessage, normalizedHistory);
  }
  return openaiChat(config, normalizedMessage, normalizedHistory);
}

module.exports = { sendStaffChat };
