/** Pakot e softuerit dhe funksionet e lejuara. */

const PACKAGE_TIERS = ["pako_1", "pako_2", "pako_3", "pako_4", "pako_5"];

/** Tier të vjetër → tier i ri (para migrimit DB). */
const LEGACY_TIER_MAP = {
  pako_1_1: "pako_3",
  pako_2_1: "pako_4",
};

const TIER_FEATURES = {
  pako_1: {
    pos: true,
    owner_panel: true,
    website: true,
    mobile: false,
    kds: false,
    kiosk: false,
    waiter: false,
    online_orders: false,
  },
  pako_2: {
    pos: true,
    owner_panel: true,
    website: true,
    mobile: false,
    kds: true,
    kiosk: true,
    waiter: true,
    online_orders: false,
  },
  pako_3: {
    pos: true,
    owner_panel: true,
    website: true,
    mobile: true,
    kds: true,
    kiosk: true,
    waiter: true,
    online_orders: false,
  },
  pako_4: {
    pos: true,
    owner_panel: true,
    website: true,
    mobile: true,
    kds: true,
    kiosk: true,
    waiter: true,
    online_orders: true,
    ai: false,
  },
  pako_5: {
    pos: true,
    owner_panel: true,
    website: true,
    mobile: true,
    kds: true,
    kiosk: true,
    waiter: true,
    online_orders: true,
    ai: true,
  },
};

const TIER_LABELS = {
  pako_1: "Legacy — vetëm POS, panel & faqe (pa KDS)",
  pako_2: "Pako 1 — KDS, kiosk, kamarier",
  pako_3: "Pako 2 — Mobile & cloud",
  pako_4: "Pako 3 — Porosi online & premium",
  pako_5: "Pako 4 — AI Profesionale",
};

function normalizePackageTier(tier) {
  const t = String(tier || "pako_1").trim().toLowerCase().replace(/\./g, "_");
  const mapped = LEGACY_TIER_MAP[t] || t;
  return PACKAGE_TIERS.includes(mapped) ? mapped : "pako_1";
}

function featuresForTier(tier) {
  return { ...(TIER_FEATURES[normalizePackageTier(tier)] || TIER_FEATURES.pako_1) };
}

function clientHasFeature(client, feature) {
  const tier = normalizePackageTier(client?.package_tier);
  const features = TIER_FEATURES[tier] || TIER_FEATURES.pako_1;
  return Boolean(features[feature]);
}

function packageUpgradeMessage(feature) {
  const labels = {
    kds: "KDS (kuzhina)",
    waiter: "Kamarieri",
    kiosk: "Kiosk",
    mobile: "Aplikacioni mobile",
    website: "Website",
    online_orders: "Porosi online (takeaway & delivery)",
    ai: "AI (skanim menu & asistent)",
  };
  const name = labels[feature] || feature;
  return `${name} nuk përfshihet në paketën tuaj. Kontaktoni administratorin për upgrade.`;
}

module.exports = {
  PACKAGE_TIERS,
  LEGACY_TIER_MAP,
  TIER_FEATURES,
  TIER_LABELS,
  normalizePackageTier,
  featuresForTier,
  clientHasFeature,
  packageUpgradeMessage,
};
