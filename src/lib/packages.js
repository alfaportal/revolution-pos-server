/** Pakot e softuerit dhe funksionet e lejuara. */

const PACKAGE_TIERS = ["pako_1", "pako_2", "pako_3", "pako_4", "pako_5"];

/** Tier që shfaqen në Super Admin (Pako 4 marketing = pako_5). */
const ADMIN_PACKAGE_TIERS = ["pako_1", "pako_2", "pako_3", "pako_5"];

/** Tier të vjetër → tier i ri (para migrimit DB). */
const LEGACY_TIER_MAP = {
  legacy: "pako_1",
  pako_1_1: "pako_3",
  pako_2_1: "pako_4",
};

/** Emra/alias marketing → id backend. */
const PACKAGE_TIER_ALIASES = {
  "pako 4": "pako_5",
  "pako 4 ai profesionale": "pako_5",
  "pako 4 — ai profesionale": "pako_5",
  "pako 4 - ai profesionale": "pako_5",
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
  const raw = String(tier || "pako_1").trim().toLowerCase();
  const t = raw.replace(/\./g, "_").replace(/\s+/g, " ");
  const alias = PACKAGE_TIER_ALIASES[t] || PACKAGE_TIER_ALIASES[raw.replace(/_/g, " ")] || null;
  const mapped = alias || LEGACY_TIER_MAP[t] || t;
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

const AI_UPGRADE_MESSAGE = "Kontaktoni Revolution POS për upgrade";

function packageUpgradeMessage(feature) {
  if (feature === "ai") return AI_UPGRADE_MESSAGE;
  const labels = {
    kds: "KDS (kuzhina)",
    waiter: "Kamarieri",
    kiosk: "Kiosk",
    mobile: "Aplikacioni mobile",
    website: "Website",
    online_orders: "Porosi online (takeaway & delivery)",
  };
  const name = labels[feature] || feature;
  return `${name} nuk përfshihet në paketën tuaj. Kontaktoni administratorin për upgrade.`;
}

module.exports = {
  PACKAGE_TIERS,
  ADMIN_PACKAGE_TIERS,
  LEGACY_TIER_MAP,
  PACKAGE_TIER_ALIASES,
  TIER_FEATURES,
  TIER_LABELS,
  normalizePackageTier,
  featuresForTier,
  clientHasFeature,
  packageUpgradeMessage,
  AI_UPGRADE_MESSAGE,
};
