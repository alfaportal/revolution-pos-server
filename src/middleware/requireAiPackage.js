const { getClientById } = require("../services/licenseService");
const { clientHasFeature, packageUpgradeMessage } = require("../lib/packages");
const { resolveRestaurantId } = require("./trackAiUsage");

async function requireAiPackage(req, res, next) {
  try {
    const restaurantId = resolveRestaurantId(req);
    if (!restaurantId) {
      return res.status(403).json({ ok: false, gabim: "Restoranti nuk u identifikua." });
    }
    const client = await getClientById(restaurantId);
    if (!client) {
      return res.status(404).json({ ok: false, gabim: "Klienti nuk u gjet." });
    }
    if (!clientHasFeature(client, "ai")) {
      return res.status(403).json({
        ok: false,
        gabim: packageUpgradeMessage("ai"),
        code: "PACKAGE_UPGRADE_REQUIRED",
        feature: "ai",
        package_tier: client.package_tier || "pako_1",
      });
    }
    req.client = client;
    return next();
  } catch (e) {
    return res.status(500).json({ ok: false, gabim: e.message || "Gabim serveri." });
  }
}

module.exports = { requireAiPackage };
