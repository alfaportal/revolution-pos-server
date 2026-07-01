const { trimEnv } = require("../lib/env");
const {
  isTelegramConfigured,
  callTelegramApi,
} = require("../services/telegramService");
const { handleTelegramCommand } = require("../services/telegramBotService");
const { appendSystemFailure } = require("../services/systemFailureLog");

let pollTimer = null;
let updateOffset = 0;
let polling = false;

async function pollTelegramUpdates() {
  if (polling || !isTelegramConfigured()) return;
  polling = true;
  try {
    const data = await callTelegramApi("getUpdates", {
      offset: updateOffset,
      timeout: 25,
      allowed_updates: ["message"],
    });
    const updates = data.result || [];
    for (const update of updates) {
      updateOffset = Math.max(updateOffset, update.update_id + 1);
      const msg = update.message;
      if (!msg?.text || !msg.chat?.id) continue;
      await handleTelegramCommand(msg.chat.id, msg.text).catch(err => {
        console.error("[telegram-bot]", err.message || err);
      });
    }
  } catch (err) {
    appendSystemFailure({
      source: "telegram",
      event: "poll_error",
      message: err.message || String(err),
    });
    console.error("[telegram-bot] poll:", err.message || err);
  } finally {
    polling = false;
  }
}

async function ensurePollingMode() {
  try {
    const info = await callTelegramApi("getWebhookInfo");
    if (info.result?.url) {
      await callTelegramApi("deleteWebhook", { drop_pending_updates: false });
      console.log("[telegram-bot] Webhook u hoq — aktivizohet polling.");
    }
  } catch (err) {
    console.warn("[telegram-bot] webhook check:", err.message || err);
  }
}

function startTelegramBotPoll() {
  if (pollTimer) return;
  if (!isTelegramConfigured()) {
    console.log("  ⚠️  Telegram Bot: TELEGRAM_BOT_TOKEN mungon — komandat çaktivizohen.");
    return;
  }
  if (!trimEnv("TELEGRAM_SUPER_ADMIN_IDS")) {
    console.log("  ⚠️  Telegram Bot: TELEGRAM_SUPER_ADMIN_IDS mungon — komandat çaktivizohen.");
    return;
  }

  ensurePollingMode()
    .then(() => pollTelegramUpdates())
    .catch(() => {});

  pollTimer = setInterval(() => {
    pollTelegramUpdates().catch(() => {});
  }, 3000);

  console.log("  🤖 Telegram Bot: polling aktiv (/start, /status, /restart, /backup, /logs)");
}

module.exports = {
  startTelegramBotPoll,
  pollTelegramUpdates,
};
