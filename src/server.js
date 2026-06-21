require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const licenseRoutes = require("./routes/license");
const adminRoutes = require("./routes/admin");
const { ensureSuperAdmin } = require("./services/licenseService");

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "revolution-pos-server",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/v1/license", licenseRoutes);
app.use("/api/admin", adminRoutes);

app.get("/panel", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/panel.html"));
});

app.get("/", (_req, res) => {
  res.redirect("/panel");
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ gabim: "Gabim i brendshëm serveri." });
});

async function start() {
  try {
    await ensureSuperAdmin();
  } catch (e) {
    console.warn("  ⚠️  Super Admin seed:", e.message);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  🚀 Revolution POS Server — http://localhost:${PORT}`);
    console.log(`  📋 Panel: /panel`);
    console.log(`  🔑 License API: POST /api/v1/license/validate\n`);
  });
}

start();
