const { trimEnv } = require("../lib/env");
const { getPublicAppOrigin } = require("../lib/publicOrigin");
const { isTelegramConfigured, callTelegramApi } = require("../services/telegramService");
const { appendSystemFailure } = require("../services/systemFailureLog");

function getTelegramWebhookUrl() {
  const custom = trimEnv("TELEGRAM_WEBHOOK_URL");
  if (custom) return custom.replace(/\/+$/, "");
  return `${getPublicAppOrigin()}/api/telegram/webhook`;
}

async function registerTelegramWebhook() {
  const url = getTelegramWebhookUrl();
  const secret = trimEnv("TELEGRAM_WEBHOOK_SECRET");
  const payload = {
    url,
    allowed_updates: ["message"],
    drop_pending_updates: false,
  };
  if (secret) payload.secret_token = secret;

  const data = await callTelegramApi("setWebhook", payload);
  return { url, ok: data.ok !== false };
}

async function startTelegramBotWebhook() {
  if (!isTelegramConfigured()) {
    console.log("  ⚠️  Telegram Bot: TELEGRAM_BOT_TOKEN mungon — webhook çaktivizohet.");
    return;
  }
  if (!trimEnv("TELEGRAM_SUPER_ADMIN_IDS")) {
    console.log("  ⚠️  Telegram Bot: TELEGRAM_SUPER_ADMIN_IDS mungon — webhook çaktivizohet.");
    return;
  }

  try {
    const { url } = await registerTelegramWebhook();
    console.log(`  🤖 Telegram Bot: webhook aktiv → ${url}`);
  } catch (err) {
    appendSystemFailure({
      source: "telegram",
      event: "webhook_register_failed",
      message: err.message || String(err),
    });
    console.error("[telegram-bot] setWebhook:", err.message || err);
  }
}

module.exports = {
  getTelegramWebhookUrl,
  registerTelegramWebhook,
  startTelegramBotWebhook,
};
