require("./lib/env");

const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const { logEnvStatus } = require("./lib/env");
const { formatError } = require("./lib/errors");
const {
  corsMiddleware,
  requestLogger,
  jsonErrorHandler,
  noCachePanel,
} = require("./lib/http");
const { testSupabaseConnection } = require("./db");
const authRoutes = require("./routes/auth");
const licenseRoutes = require("./routes/license");
const salesRoutes = require("./routes/sales");
const adminRoutes = require("./routes/admin");
const superRoutes = require("./routes/super");
const ownerRoutes = require("./routes/owner");
const kdsRoutes = require("./routes/kds");
const waiterRoutes = require("./routes/waiter");
const kioskRoutes = require("./routes/kiosk");
const tableMenuRoutes = require("./routes/tableMenu");
const posRoutes = require("./routes/pos");
const receiptRoutes = require("./routes/receipt");
const fiscalRoutes = require("./routes/fiscal");
const aiRoutes = require("./routes/ai");
const { apiRouter: publicApiRouter, manifestHandler, serviceWorkerHandler } = require("./routes/public");
const {
  apiRouter: shopApiRouter,
  shopManifestHandler,
  shopServiceWorkerHandler,
} = require("./routes/shop");
const { resolvePublicClient } = require("./middleware/publicAuth");
const { ensureSuperAdmin } = require("./services/licenseService");
const { startLicenseExpiryCron } = require("./jobs/expireLicenses");
const { startRefusedOrdersExpiryJob } = require("./jobs/expireRefusedOrders");
const { startTrialNotificationCron } = require("./jobs/trialNotifications");
const { startOfflineNotificationCron } = require("./jobs/offlineNotifications");
const { startAiDailyReportCron } = require("./jobs/aiDailyReports");
const { startAiWeeklyReportCron } = require("./jobs/aiWeeklyReports");
const { startSupplySuggestionCron } = require("./jobs/supplySuggestions");
const { startNotificationDailyCron } = require("./jobs/notificationDailyReports");
const { startCloudHealthMonitor } = require("./jobs/cloudHealthMonitor");
const { startWeeklyDataExportCron } = require("./jobs/weeklyDataExport");
const { startTelegramBotWebhook } = require("./jobs/telegramBotWebhook");
const telegramRoutes = require("./routes/telegram");
const systemRoutes = require("./routes/system");
const { router: paymentsRouter, stripeWebhookHandler } = require("./routes/payments");
const {
  getPublicAppConfig,
  getPublicAppOrigin,
  getSetupDownloadUrl,
} = require("./lib/publicOrigin");
const { adminPanelPath } = require("./lib/admin-path");
const { paymentsConfigured } = require("./lib/stripeConfig");

const pkg = require("../package.json");
const ADMIN_PATH = adminPanelPath();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.set("trust proxy", 1);

app.use(corsMiddleware);

// Stripe webhook — RAW body (para express.json), si KetuJemi
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    void stripeWebhookHandler(req, res);
  },
);

app.use(express.json({ limit: "12mb" }));
app.use(jsonErrorHandler);
app.use(cookieParser());
app.use(requestLogger);
app.use(noCachePanel);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "revolution-pos-server",
    version: pkg.version || "1.0.0",
    site_version: "2026-06-28-spotlight-v13",
    git_commit: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null,
    git_branch: process.env.RAILWAY_GIT_BRANCH || null,
    time: new Date().toISOString(),
    public_origin: getPublicAppOrigin(),
  });
});

app.get("/api/public/config", (_req, res) => {
  res.json({
    ok: true,
    ...getPublicAppConfig(),
    stripe_enabled: paymentsConfigured(),
  });
});

/**
 * Kërkesë Setup link — email ose SMS (pa WhatsApp). Rate-limited.
 * Body: { channel: 'email'|'sms', email?, phone?, plan?, lang? }
 */
app.post("/api/public/setup-link-request", async (req, res) => {
  try {
    const { requestSetupLink } = require("./services/setupLinkRequestService");
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const result = await requestSetupLink({
      channel: req.body?.channel,
      email: req.body?.email,
      phone: req.body?.phone || req.body?.telefon,
      plan: req.body?.plan,
      lang: req.body?.lang,
      ip,
    });
    res.json(result);
  } catch (e) {
    const code = e.code || "ERROR";
    const status =
      code === "RATE_LIMIT"
        ? 429
        : code === "SETUP_SECRET_MISSING" || code === "EMAIL_OFF" || code === "SMS_OFF"
          ? 503
          : 400;
    res.status(status).json({ ok: false, gabim: e.message, code });
  }
});

/**
 * Shkarkim Setup — VETËM me token të nënshkruar (Super Admin).
 * Pa token → 403 (jo më publik i hapur).
 */
app.get("/api/public/setup-download", (req, res) => {
  const {
    verifySetupDownloadToken,
    isSetupDownloadConfigured,
  } = require("./lib/setupDownloadAuth");
  if (!isSetupDownloadConfigured()) {
    return res.status(503).json({
      ok: false,
      gabim: "Shkarkimi i Setup kërkon SETUP_DOWNLOAD_SECRET në server.",
      code: "SETUP_SECRET_MISSING",
    });
  }
  const token = String(req.query.t || req.query.token || "").trim();
  const check = verifySetupDownloadToken(token);
  if (!check.ok) {
    return res.status(403).json({
      ok: false,
      gabim:
        check.reason === "expired"
          ? "Linku i shkarkimit ka skaduar. Kërkoni link të ri nga Revolution Invest."
          : "Shkarkimi i Setup nuk është publik. Kontaktoni Revolution Invest për link zyrtar.",
      code: "SETUP_TOKEN_REQUIRED",
    });
  }
  const plan = String(req.query.plan || check.plan || "").trim().toLowerCase();
  const url = getSetupDownloadUrl(plan);
  res.redirect(302, url);
});

/** Ndihmë AI për manualin publik — max 3 pyetje / sesion, përgjigje të shkurtra. */
app.get("/api/public/manual-help/status", (req, res) => {
  try {
    const { remainingFor, MAX_QUESTIONS } = require("./services/manualHelpService");
    const { isAiEnabled, isAiPaused } = require("./lib/aiConfig");
    const sessionId = String(req.query.session || "").trim();
    res.json({
      ok: true,
      enabled: isAiEnabled() && !isAiPaused(),
      remaining: remainingFor(sessionId),
      max: MAX_QUESTIONS,
    });
  } catch (e) {
    res.status(500).json({ ok: false, gabim: e.message });
  }
});

app.post("/api/public/manual-help", async (req, res) => {
  try {
    const { askManualHelp } = require("./services/manualHelpService");
    const result = await askManualHelp({
      sessionId: req.body?.session || req.body?.sessionId,
      message: req.body?.message || req.body?.pyetje,
    });
    res.json(result);
  } catch (e) {
    const status = e.code === "LIMIT" ? 429 : e.code === "AI_OFF" ? 503 : 400;
    res.status(status).json({
      ok: false,
      gabim: e.message,
      code: e.code || null,
      remaining: e.remaining != null ? e.remaining : undefined,
    });
  }
});

app.use("/api/payments", paymentsRouter);

app.get("/health/db", async (_req, res) => {
  const result = await testSupabaseConnection();
  res.status(result.ok ? 200 : 503).json(result);
});

app.use("/api/auth", authRoutes);
app.use("/api/v1/license", licenseRoutes);
app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/pos", posRoutes);
app.use("/api/v1/receipt", receiptRoutes);
app.use("/api/v1/fiscal", fiscalRoutes);
app.use("/api/v1/system", systemRoutes.router);
app.use("/api/telegram", telegramRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super", superRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/kds", kdsRoutes);
app.use("/api/waiter", waiterRoutes);
app.use("/api/kiosk", kioskRoutes);
app.use("/api/menu", tableMenuRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/r", publicApiRouter);
app.use("/api/s", shopApiRouter);

app.get("/panel.html", (_req, res) => {
  res.status(404).type("text/plain").send("Not found");
});

app.use((req, res, next) => {
  if (/^\/(js\/panel\.js|css\/panel\.css)/.test(req.path)) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  next();
});

const PUBLIC_DIR = path.join(__dirname, "../public");
const SITE_INDEX = path.join(PUBLIC_DIR, "site/index.html");
const SITE_DIR = path.join(PUBLIC_DIR, "site");

function sendMarketingPage(res, filePath) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(filePath);
}

app.get("/", (_req, res) => sendMarketingPage(res, SITE_INDEX));

app.get(["/blog", "/blog/"], (_req, res) => {
  res.redirect(301, "/");
});

app.get("/blog/:slug", (req, res, next) => {
  if (req.params.slug.includes(".")) return next();
  sendMarketingPage(res, SITE_INDEX);
});

app.get("/privacy", (_req, res) => sendMarketingPage(res, SITE_INDEX));
app.get("/terms", (_req, res) => sendMarketingPage(res, SITE_INDEX));

app.use(express.static(SITE_DIR));

app.use((req, res, next) => {
  if (req.path === "/js/waiter.js" || req.path === "/sw.js") {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  next();
});

// Never serve the root waiter-manifest with start_url "/" or "/waiter/" —
// PWA install must use /waiter/:slug/manifest.json (injected in waiter.html).
app.get("/waiter-manifest.json", (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.status(404).type("application/manifest+json").json({
    error: "Use /waiter/:slug/manifest.json?key=...",
  });
});

app.use(express.static(PUBLIC_DIR));

app.get(ADMIN_PATH, (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(__dirname, "../public/panel.html"));
});

/** Super Admin desktop dashboard (Naser) — vetëm /admin/dashboard */
app.get(["/admin/dashboard", "/admin/dashboard/"], (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(__dirname, "../public/admin/dashboard.html"));
});

app.get("/admin", (_req, res) => {
  res.redirect(302, "/admin/dashboard");
});

app.get("/panel", (_req, res) => {
  res.status(404).type("text/plain").send("Not found");
});

app.get("/owner/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/owner/login.html"));
});

app.get("/owner/setup", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/owner/setup.html"));
});

app.get("/owner/register", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/owner/register.html"));
});

app.get("/owner/panel", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/owner/panel.html"));
});

app.get("/bar/:slug", (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(__dirname, "../public/bar.html"));
});

app.get("/kiosk/:slug", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/kiosk.html"));
});

app.get("/menu/:slug/:tableNumber", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/kiosk.html"));
});

app.get("/kitchen/:slug", (req, res) => {
  const token = String(req.query.w || "").trim();
  if (token) {
    const q = new URLSearchParams(req.query);
    return res.redirect(302, `/waiter/${encodeURIComponent(req.params.slug)}?${q.toString()}`);
  }
  res.sendFile(path.join(__dirname, "../public/kitchen.html"));
});

app.get("/waiter/:slug/manifest.json", (req, res) => {
  const slug = encodeURIComponent(String(req.params.slug || "").trim());
  const key = String(req.query.key || "").trim();
  const w = String(req.query.w || "").trim();
  const q = new URLSearchParams();
  if (key) q.set("key", key);
  if (w) q.set("w", w);
  const qs = q.toString();
  // Must include slug (+ key) — bare /waiter/ causes Express "Cannot GET /waiter/"
  const startUrl = `/waiter/${slug}${qs ? `?${qs}` : ""}`;
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.type("application/manifest+json");
  res.json({
    name: "Revolution Invest POS — Kamarieri",
    short_name: "Kamarieri",
    description: "Paneli i kamarierit — Revolution Invest POS",
    start_url: startUrl,
    scope: "/waiter/",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#0f1b3d",
    background_color: "#0f1b3d",
    icons: [
      {
        src: "/logo-source.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-source.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
    ],
  });
});

app.get(["/waiter", "/waiter/"], (_req, res) => {
  res
    .status(404)
    .type("html")
    .send(`<!DOCTYPE html><html lang="sq"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kamarieri</title></head><body style="font-family:system-ui,sans-serif;max-width:28rem;margin:3rem auto;padding:1.5rem;line-height:1.5;text-align:center"><h1>Linku i kamarierit mungon</h1><p>Hapni linkun e plotë nga paneli i pronarit (me <code>/waiter/emri-lokalit?key=...</code>), pastaj shtojeni në ekranin kryesor.</p><p>Mos instaloni PWA nga faqja kryesore.</p></body></html>`);
});

app.get("/waiter/:slug", (req, res) => {
  const slug = String(req.params.slug || "").trim();
  const key = String(req.query.key || "").trim();
  const w = String(req.query.w || "").trim();
  const manQ = new URLSearchParams();
  if (key) manQ.set("key", key);
  if (w) manQ.set("w", w);
  const manifestHref = `/waiter/${encodeURIComponent(slug)}/manifest.json${
    manQ.toString() ? `?${manQ.toString()}` : ""
  }`;

  const filePath = path.join(__dirname, "../public/waiter.html");
  let html;
  try {
    html = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("[waiter] failed to read waiter.html:", formatError(err));
    return res.status(500).type("text").send("Gabim serveri.");
  }

  // Inject absolute manifest BEFORE the browser can race-fetch a wrong start_url
  html = html.replace(
    /<link\s+rel="manifest"[^>]*>/i,
    `<link rel="manifest" href="${manifestHref}">`,
  );

  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.type("html").send(html);
});

app.get("/r/:slug/manifest.json", manifestHandler);
app.get("/r/:slug/sw.js", resolvePublicClient, serviceWorkerHandler);
app.get("/r/:slug/order", (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(__dirname, "../public/r-order.html"));
});
app.get("/r/:slug", (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(__dirname, "../public/r.html"));
});

app.get("/s/:slug/manifest.json", shopManifestHandler);
app.get("/s/:slug/sw.js", resolvePublicClient, shopServiceWorkerHandler);
app.get("/s/:slug/order", (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(__dirname, "../public/s-order.html"));
});
app.get("/s/:slug", (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(__dirname, "../public/s.html"));
});

app.use((err, req, res, _next) => {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, formatError(err));
  if (!res.headersSent) {
    res.status(500).json({ gabim: formatError(err) || "Gabim i brendshëm serveri." });
  }
});

async function start() {
  const envOk = logEnvStatus();
  if (!envOk) {
    console.warn("  ⚠️  Serveri niset por API-t që kërkojnë Supabase/JWT do të dështojnë.\n");
  }

  const dbCheck = await testSupabaseConnection();
  if (dbCheck.ok) {
    console.log("  ✅ Lidhja me Supabase: OK");
  } else {
    console.error("  ❌ Lidhja me Supabase dështoi:", dbCheck.error);
    if (dbCheck.hint) console.error("     Hint:", dbCheck.hint);
    if (dbCheck.details) console.error("     Details:", dbCheck.details);
  }

  try {
    await ensureSuperAdmin();
  } catch (e) {
    console.warn("  ⚠️  Super Admin seed:", formatError(e));
  }

  try {
    const { ensureInventorySchema } = require("./lib/ensureInventorySchema");
    const ok = await ensureInventorySchema();
    if (ok) {
      console.log("  ✅ Inventari (025): ingredients + menu_ingredients");
    } else {
      console.warn("  ⚠️  Inventari: vendosni DATABASE_URL në Railway për auto-migrim 025");
    }
  } catch (e) {
    console.warn("  ⚠️  Inventari schema:", formatError(e));
  }

  try {
    const { ensureShopSchema } = require("./lib/ensureShopSchema");
    const shopOk = await ensureShopSchema();
    if (shopOk) {
      console.log("  ✅ Dyqani (026): tipi dyqan + fusha produktesh");
    } else {
      console.warn("  ⚠️  Dyqani: vendosni DATABASE_URL në Railway për auto-migrim 026");
    }
  } catch (e) {
    console.warn("  ⚠️  Dyqani schema:", formatError(e));
  }

  try {
    const { ensureOrderAcceptanceSchema } = require("./lib/ensureOrderAcceptanceSchema");
    const accOk = await ensureOrderAcceptanceSchema();
    if (accOk) {
      console.log("  ✅ Porosi online (021): accepted_by_waiter_* kolonat");
    } else {
      console.warn("  ⚠️  Porosi online: vendosni DATABASE_URL për auto-migrim 021");
    }
  } catch (e) {
    console.warn("  ⚠️  Porosi online schema:", formatError(e));
  }

  try {
    const { ensureOrderRefusalSchema } = require("./lib/ensureOrderRefusalSchema");
    const refOk = await ensureOrderRefusalSchema();
    if (refOk) {
      console.log("  ✅ Refuzim porosie (040): refused_by + order_expires_at");
    } else {
      console.warn("  ⚠️  Refuzim porosie: vendosni DATABASE_URL për auto-migrim 040");
    }
  } catch (e) {
    console.warn("  ⚠️  Refuzim porosie schema:", formatError(e));
  }

  startLicenseExpiryCron();
  startRefusedOrdersExpiryJob();
  startTrialNotificationCron();
  startOfflineNotificationCron();
  startAiDailyReportCron();
  startAiWeeklyReportCron();
  startSupplySuggestionCron();
  startNotificationDailyCron();
  startCloudHealthMonitor();
  startWeeklyDataExportCron();
  startTelegramBotWebhook();

  const publicOrigin = getPublicAppOrigin();
  console.log(`  🌐 Public URL:  ${publicOrigin}`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  🚀 Revolution POS Server — http://localhost:${PORT}`);
    console.log(`  📋 Super Admin: ${ADMIN_PATH}`);
    console.log(`  🏠 Website:     /  (revolution-pos.com)`);
    console.log(`  🏪 Pronarët:    /owner/login`);
    console.log(`  🍹 Banak:       /bar/:slug?key=...  (porosi tavolinë/online/POS)`);
    console.log(`  🍳 Kuzhina KDS:  /kitchen/:slug?key=...  (ushqim)`);
    console.log(`  🧑‍🍳 Kamarieri:   /waiter/:slug?key=...`);
    console.log(`  🪑 Tavolinë:    /menu/:slug/:tableNumber  (QR publike)`);
    console.log(`  🪑 Kiosk vjetër: /kiosk/:slug?key=...&table=5`);
    console.log(`  🍽️  Restorant:   /r/:slug`);
    console.log(`  🛵 Porosi web:  /r/:slug/order`);
    console.log(`  🛍️  Dyqani:      /s/:slug`);
    console.log(`  📦 Porosi dyqan: /s/:slug/order`);
    console.log(`  📋 POS catalog:  GET /api/v1/pos/catalog  POST /api/v1/pos/catalog/sync`);
    console.log(`  🔑 License API: POST /api/v1/license/validate`);
    console.log(`  📊 Sales sync:  POST /api/v1/sales/sync`);
    console.log(`  🧾 Fiscal pay:  POST /api/v1/fiscal/pay`);
    console.log(`  📋 Z-Report:    GET /api/owner/z-report`);
    console.log(`  🤖 AI chat:     POST /api/ai/chat`);
    console.log(`  📷 AI menu:     POST /api/ai/scan-menu`);
    console.log(`  🧾 AI invoice:  POST /api/ai/scan-invoice`);
    console.log(`  📊 AI reports:  GET /api/owner/ai-reports`);
    console.log(`  🩺 Health DB:   GET /health/db\n`);
  });
}

start();
