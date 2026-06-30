const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { isAiPaused, isAiEnabled } = require("../lib/aiConfig");
const { aiStaffAuth, licenseApiKeyOptional } = require("../middleware/aiAuth");
const { handleMenuScanUpload } = require("../middleware/menuScanUpload");
const { extractMenuScanImage } = require("../lib/menuScanImage");
const { trackAiUsage, resolveRestaurantId } = require("../middleware/trackAiUsage");
const { sendStaffChat } = require("../services/aiChatService");
const { scanMenuFromImage } = require("../services/aiMenuScanService");

const router = express.Router();

const AI_PAUSED_MSG = "AI është i ndalur për momentin. Provoni përsëri më vonë.";

router.get("/status", (_req, res) => {
  res.json({
    enabled: isAiEnabled(),
    paused: isAiPaused(),
  });
});

router.post(
  "/chat",
  licenseApiKeyOptional,
  aiStaffAuth,
  asyncHandler(async (req, res) => {
    if (isAiPaused()) {
      return res.status(503).json({ ok: false, gabim: AI_PAUSED_MSG });
    }
    const restaurantId = resolveRestaurantId(req);
    if (!restaurantId) {
      return res.status(403).json({ ok: false, gabim: "Restoranti nuk u identifikua." });
    }

    const { message, history } = req.body || {};
    const result = await sendStaffChat({ message, history });

    await trackAiUsage(restaurantId, "chat", result.tokensUsed);

    res.json({
      ok: true,
      reply: result.reply,
      usage: {
        tokens_used: result.tokensUsed,
        provider: result.provider,
        model: result.model,
      },
    });
  }),
);

router.post(
  "/scan-menu",
  licenseApiKeyOptional,
  handleMenuScanUpload,
  aiStaffAuth,
  asyncHandler(async (req, res) => {
    if (isAiPaused()) {
      return res.status(503).json({ ok: false, gabim: AI_PAUSED_MSG });
    }
    const restaurantId = resolveRestaurantId(req);
    if (!restaurantId) {
      return res.status(403).json({ ok: false, gabim: "Restoranti nuk u identifikua." });
    }

    const image = extractMenuScanImage(req);
    const result = await scanMenuFromImage(image);

    await trackAiUsage(restaurantId, "ocr", result.tokensUsed);

    res.json({
      ok: true,
      items: result.items,
      usage: {
        tokens_used: result.tokensUsed,
        provider: result.provider,
        model: result.model,
      },
    });
  }),
);

module.exports = router;
