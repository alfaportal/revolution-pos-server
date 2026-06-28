require("./lib/env");

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
const { resolvePublicClient } = require("./middleware/publicAuth");
const { ensureSuperAdmin } = require("./services/licenseService");
const { startLicenseExpiryCron } = require("./jobs/expireLicenses");
const { startTrialNotificationCron } = require("./jobs/trialNotifications");
const { getPublicAppConfig, getPublicAppOrigin } = require("./lib/publicOrigin");
const { adminPanelPath } = require("./lib/admin-path");

const pkg = require("../package.json");
const ADMIN_PATH = adminPanelPath();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.set("trust proxy", 1);

app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(jsonErrorHandler);
app.use(cookieParser());
app.use(requestLogger);
app.use(noCachePanel);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "revolution-pos-server",
    version: pkg.version || "1.0.0",
    site_version: "2026-06-28-unified-home-v12",
    git_commit: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null,
    git_branch: process.env.RAILWAY_GIT_BRANCH || null,
    time: new Date().toISOString(),
    public_origin: getPublicAppOrigin(),
  });
});

app.get("/api/public/config", (_req, res) => {
  res.json({ ok: true, ...getPublicAppConfig() });
});

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
app.use("/api/admin", adminRoutes);
app.use("/api/super", superRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/kds", kdsRoutes);
app.use("/api/waiter", waiterRoutes);
app.use("/api/kiosk", kioskRoutes);
app.use("/api/menu", tableMenuRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/r", publicApiRouter);

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

app.use(express.static(PUBLIC_DIR));

app.get(ADMIN_PATH, (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(__dirname, "../public/panel.html"));
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
  res.sendFile(path.join(__dirname, "../public/bar.html"));
});

app.get("/kiosk/:slug", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/kiosk.html"));
});

app.get("/menu/:slug/:tableNumber", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/kiosk.html"));
});

app.get("/kitchen/:slug", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/kitchen.html"));
});

app.get("/waiter/:slug", (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(__dirname, "../public/waiter.html"));
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

  startLicenseExpiryCron();
  startTrialNotificationCron();

  const publicOrigin = getPublicAppOrigin();
  console.log(`  🌐 Public URL:  ${publicOrigin}`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  🚀 Revolution POS Server — http://localhost:${PORT}`);
    console.log(`  📋 Super Admin: ${ADMIN_PATH}`);
    console.log(`  🏠 Website:     /  (revolution-pos.com)`);
    console.log(`  🏪 Pronarët:    /owner/login`);
    console.log(`  🍹 Banak:       /kitchen/:slug?key=...  (porosi tavolinë/online/POS)`);
    console.log(`  🍳 Kuzhina KDS:  /bar/:slug?key=...  (ushqim)`);
    console.log(`  🧑‍🍳 Kamarieri:   /waiter/:slug?key=...`);
    console.log(`  🪑 Tavolinë:    /menu/:slug/:tableNumber  (QR publike)`);
    console.log(`  🪑 Kiosk vjetër: /kiosk/:slug?key=...&table=5`);
    console.log(`  🍽️  Restorant:   /r/:slug`);
    console.log(`  🛵 Porosi web:  /r/:slug/order`);
    console.log(`  📋 POS catalog:  GET /api/v1/pos/catalog  POST /api/v1/pos/catalog/sync`);
    console.log(`  🔑 License API: POST /api/v1/license/validate`);
    console.log(`  📊 Sales sync:  POST /api/v1/sales/sync`);
    console.log(`  🧾 Fiscal pay:  POST /api/v1/fiscal/pay`);
    console.log(`  📋 Z-Report:    GET /api/owner/z-report`);
    console.log(`  🤖 AI chat:     POST /api/ai/chat`);
    console.log(`  📷 AI menu:     POST /api/ai/scan-menu`);
    console.log(`  🩺 Health DB:   GET /health/db\n`);
  });
}

start();
