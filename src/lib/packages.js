/** Pakot e softuerit dhe funksionet e lejuara. */

const PACKAGE_TIERS = ["pako_1", "pako_1_1", "pako_2", "pako_2_1"];

const TIER_FEATURES = {
  pako_1: {
    pos: true,
    owner_panel: true,
    website: false,
    mobile: false,
    kds: false,
    kiosk: false,
    waiter: false,
  },
  pako_1_1: {
    pos: true,
    owner_panel: true,
    website: false,
    mobile: true,
    kds: false,
    kiosk: false,
    waiter: false,
  },
  pako_2: {
    pos: true,
    owner_panel: true,
    website: false,
    mobile: false,
    kds: true,
    kiosk: true,
    waiter: true,
  },
  pako_2_1: {
    pos: true,
    owner_panel: true,
    website: false,
    mobile: true,
    kds: true,
    kiosk: true,
    waiter: true,
  },
};

const TIER_LABELS = {
  pako_1: "Pako 1 — POS",
  pako_1_1: "Pako 1.1 — POS + Mobile",
  pako_2: "Pako 2 — POS + KDS + Kiosk + Kamarier",
  pako_2_1: "Pako 2.1 — Gjithçka + Mobile",
};

function normalizePackageTier(tier) {
  const t = String(tier || "pako_1").trim().toLowerCase();
  return PACKAGE_TIERS.includes(t) ? t : "pako_1";
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
  };
  const name = labels[feature] || feature;
  return `${name} nuk përfshihet në paketën tuaj. Kontaktoni administratorin për upgrade.`;
}

module.exports = {
  PACKAGE_TIERS,
  TIER_FEATURES,
  TIER_LABELS,
  normalizePackageTier,
  featuresForTier,
  clientHasFeature,
  packageUpgradeMessage,
};
