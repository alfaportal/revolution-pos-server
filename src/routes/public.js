const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { resolvePublicClient } = require("../middleware/publicAuth");
const {
  getPublicRestaurantPage,
  buildManifest,
  buildServiceWorkerScript,
  getLogoResponse,
} = require("../services/publicPageService");
const { submitPublicOrder } = require("../services/publicOrderService");

const router = express.Router();

function pageBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`.replace(/\/+$/, "");
}

router.get("/:slug", resolvePublicClient, asyncHandler(async (req, res) => {
  try {
    const page = await getPublicRestaurantPage(req.params.slug, pageBaseUrl(req));
    if (!page) {
      return res.status(404).json({ ok: false, gabim: "Faqja publike nuk është e aktivizuar ose nuk u gjet." });
    }
    res.json({ ok: true, ...page });
  } catch (e) {
    if (e.code === "PACKAGE") {
      return res.status(403).json({ ok: false, gabim: e.message, code: "PACKAGE" });
    }
    throw e;
  }
}));

router.post("/:slug/order", resolvePublicClient, asyncHandler(async (req, res) => {
  try {
    const result = await submitPublicOrder(req.publicClient, req.body);
    res.json(result);
  } catch (e) {
    if (e.code === "PACKAGE") {
      return res.status(403).json({ ok: false, gabim: e.message, code: "PACKAGE" });
    }
    res.status(400).json({ ok: false, gabim: e.message || "Porosia nuk u dërgua." });
  }
}));

router.get("/:slug/logo", resolvePublicClient, asyncHandler(async (req, res) => {
  const size = Number(req.query.size) || 192;
  const logo = await getLogoResponse(req.params.slug, size);
  if (!logo) {
    return res.status(404).type("text/plain").send("Not found");
  }
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.type(logo.mime).send(logo.buffer);
}));

async function manifestHandler(req, res) {
  try {
    const page = await getPublicRestaurantPage(req.params.slug, pageBaseUrl(req));
    if (!page) {
      return res.status(404).type("text/plain").send("Not found");
    }
    const manifest = buildManifest(page, pageBaseUrl(req));
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(manifest);
  } catch (e) {
    res.status(e.code === "PACKAGE" ? 403 : 500).type("text/plain").send(e.message);
  }
}

async function serviceWorkerHandler(req, res) {
  const client = req.publicClient;
  if (!client) {
    return res.status(404).type("text/plain").send("Not found");
  }
  const slug = client.kitchen_slug || client.id;
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Service-Worker-Allowed", `/r/${encodeURIComponent(slug)}/`);
  res.setHeader("Cache-Control", "no-cache");
  res.send(buildServiceWorkerScript(slug));
}

module.exports = {
  apiRouter: router,
  manifestHandler,
  serviceWorkerHandler,
};
