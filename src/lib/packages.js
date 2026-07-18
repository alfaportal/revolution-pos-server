/** Pakot e softuerit dhe funksionet e lejuara. */

const {
  ADMIN_LEGACY_ORDER,
  labelForTier,
  toNewTier,
  toLegacyTier,
  isAiLegacyTier,
} = require("./packageTierMap");

const PACKAGE_TIERS = ["pako_1", "pako_2", "pako_3", "pako_4", "pako_5"];

/** Pako 1–4 në Super Admin (ID legacy që ruhen në DB). */
const ADMIN_PACKAGE_TIERS = [...ADMIN_LEGACY_ORDER];

/** Tier të vjetër → tier i ri (para migrimit DB). */
const LEGACY_TIER_MAP = {
  legacy: "pako_1",
  pako_1_1: "pako_3",
  pako_2_1: "pako_4",
};

/** Emra/alias marketing → id backend (legacy). */
const PACKAGE_TIER_ALIASES = {
  "pako 1": "pako_3",
  "pako 2": "pako_4",
  "pako 3": "pako_2",
  "pako 4": "pako_5",
  "pako 4 ai": "pako_5",
  "pako 4 ai profesionale": "pako_5",
  "pako 4 — ai profesionale": "pako_5",
  "pako 4 - ai profesionale": "pako_5",
};

const FULL_NO_AI = {
  pos: true,
  owner_panel: true,
  website: true,
  mobile: true,
  kds: true,
  kiosk: true,
  waiter: true,
  online_orders: true,
  ai: false,
};

const TIER_FEATURES = {
  /** Legacy ultra-minimal (rrallë) */
  pako_1: {
    pos: true,
    owner_panel: true,
    website: true,
    mobile: false,
    kds: false,
    kiosk: false,
    waiter: false,
    online_orders: false,
    ai: false,
  },
  /** Pako 3 — Full pa AI (ID i ripërdorur nga Basic) */
  pako_2: { ...FULL_NO_AI },
  /** Pako 1 — Standard */
  pako_3: {
    pos: true,
    owner_panel: true,
    website: true,
    mobile: true,
    kds: true,
    kiosk: true,
    waiter: true,
    online_orders: false,
    ai: false,
  },
  /** Pako 2 — Pro */
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
  /** Pako 4 — AI */
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
  pako_1: "Legacy — POS & faqe",
  pako_2: "Pako 3 — Full (pa AI)",
  pako_3: "Pako 1 — Standard (KDS, kamarier, cloud)",
  pako_4: "Pako 2 — Pro (porosi online)",
  pako_5: "Pako 4 — AI Profesionale",
};

const TIER_SHORT_LABELS = {
  pako_1: "Legacy",
  pako_2: "Pako 3",
  pako_3: "Pako 1",
  pako_4: "Pako 2",
  pako_5: "Pako 4",
};

/** Numri marketing 1–4 për shfaqje. */
function marketingPakoNumber(tier) {
  const n = toNewTier(tier);
  const map = { pako_1: 1, pako_2: 2, pako_3: 3, pako_4: 4 };
  return map[n] || null;
}

function normalizePackageTier(tier) {
  const raw = String(tier || "pako_3").trim().toLowerCase();
  /* ID exact (pako_3…pako_5) — mos e ngatërro me alias marketing "pako 4" */
  if (PACKAGE_TIERS.includes(raw)) return raw;

  const spaced = raw.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const alias = PACKAGE_TIER_ALIASES[spaced] || PACKAGE_TIER_ALIASES[raw] || null;
  if (alias && PACKAGE_TIERS.includes(alias)) return alias;

  const underscored = raw.replace(/\./g, "_").replace(/\s+/g, "_");
  if (PACKAGE_TIERS.includes(underscored)) return underscored;

  const legacy = LEGACY_TIER_MAP[underscored] || LEGACY_TIER_MAP[raw];
  if (legacy && PACKAGE_TIERS.includes(legacy)) return legacy;

  try {
    return toLegacyTier(underscored);
  } catch {
    return "pako_3";
  }
}

function featuresForTier(tier) {
  const id = normalizePackageTier(tier);
  const base = { ...(TIER_FEATURES[id] || TIER_FEATURES.pako_3) };
  if (isAiLegacyTier(id)) base.ai = true;
  return base;
}

function clientHasFeature(client, feature) {
  const features = featuresForTier(client?.package_tier);
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

function packageLabel(tier) {
  return labelForTier(tier);
}

module.exports = {
  PACKAGE_TIERS,
  ADMIN_PACKAGE_TIERS,
  LEGACY_TIER_MAP,
  PACKAGE_TIER_ALIASES,
  TIER_FEATURES,
  TIER_LABELS,
  TIER_SHORT_LABELS,
  normalizePackageTier,
  featuresForTier,
  clientHasFeature,
  packageUpgradeMessage,
  AI_UPGRADE_MESSAGE,
  marketingPakoNumber,
  packageLabel,
  toNewTier,
  toLegacyTier,
  labelForTier,
};
