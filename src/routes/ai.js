const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { isAiPaused, isAiEnabled } = require("../lib/aiConfig");
const { aiStaffAuth, optionalAiStaffAuth, licenseApiKeyOptional } = require("../middleware/aiAuth");
const { handleMenuScanUpload } = require("../middleware/menuScanUpload");
const { extractMenuScanImage } = require("../lib/menuScanImage");
const { trackAiUsage, resolveRestaurantId } = require("../middleware/trackAiUsage");
const { requireAiPackage } = require("../middleware/requireAiPackage");
const { sendStaffChat } = require("../services/aiChatService");
const { scanMenuFromImage } = require("../services/aiMenuScanService");
const { scanInvoiceFromImage } = require("../services/aiInvoiceScanService");

const router = express.Router();

const AI_PAUSED_MSG = "AI është i ndalur për momentin. Provoni përsëri më vonë.";

const { getClientById } = require("../services/licenseService");
const { clientHasFeature } = require("../lib/packages");

router.get("/status", licenseApiKeyOptional, optionalAiStaffAuth, asyncHandler(async (req, res) => {
  const restaurantId = resolveRestaurantId(req);
  let packageAi = false;
  if (restaurantId) {
    const client = await getClientById(restaurantId).catch(() => null);
    packageAi = clientHasFeature(client, "ai");
  }
  res.json({
    enabled: isAiEnabled() && packageAi,
    paused: isAiPaused(),
    configured: isAiEnabled(),
    package_ai: packageAi,
  });
}));

router.post(
  "/chat",
  licenseApiKeyOptional,
  aiStaffAuth,
  requireAiPackage,
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
  requireAiPackage,
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

router.post(
  "/scan-invoice",
  licenseApiKeyOptional,
  handleMenuScanUpload,
  aiStaffAuth,
  requireAiPackage,
  asyncHandler(async (req, res) => {
    if (isAiPaused()) {
      return res.status(503).json({ ok: false, gabim: AI_PAUSED_MSG });
    }
    const restaurantId = resolveRestaurantId(req);
    if (!restaurantId) {
      return res.status(403).json({ ok: false, gabim: "Restoranti nuk u identifikua." });
    }

    const image = extractMenuScanImage(req);
    const result = await scanInvoiceFromImage(image);

    await trackAiUsage(restaurantId, "ocr", result.tokensUsed);

    res.json({
      ok: true,
      supplier: result.supplier,
      invoice_number: result.invoice_number,
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
