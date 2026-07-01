const { trimEnv } = require("../lib/env");

function getTelegramBotToken() {
  return trimEnv("TELEGRAM_BOT_TOKEN");
}

function isTelegramConfigured() {
  return Boolean(getTelegramBotToken());
}

async function sendTelegramMessage(chatId, text) {
  const token = getTelegramBotToken();
  if (!token) {
    throw new Error("Telegram nuk është i konfiguruar (TELEGRAM_BOT_TOKEN).");
  }
  const chat = String(chatId || "").trim();
  if (!chat) throw new Error("Mungon Telegram Chat ID.");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      text: String(text || "").slice(0, 4000),
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.description || `Telegram gabim (${res.status})`);
  }
  return data;
}

module.exports = {
  getTelegramBotToken,
  isTelegramConfigured,
  sendTelegramMessage,
};
