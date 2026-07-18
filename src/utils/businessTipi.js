/**
 * Llojet e biznesit (hospitality) për clients.tipi — paneli Super Admin (telefon).
 * Aliasë normalizohen që regjistrimi të mos dështojë.
 * Vlerat e vjetra (market, dyqan, tjeter) mbeten të lejuara për rreshta ekzistues.
 */

/** Dropdown-i i adminit (telefon) — radhitja e shfaqjes. */
const ADMIN_CLIENT_TIPI = [
  "kafene",
  "restorant",
  "bar",
  "pub_lounge",
  "piceri",
  "fast_food",
  "kebab",
  "pasticeri",
  "akullore",
  "gjeltore",
];

/** Të gjitha vlerat e lejuara në DB (përfshin legacy). */
const ALLOWED_CLIENT_TIPI = [
  ...ADMIN_CLIENT_TIPI,
  "market",
  "dyqan",
  "tjeter",
];

const TIPI_ALIASES = {
  restaurante: "restorant",
  restaurant: "restorant",
  resto: "restorant",
  cafe: "kafene",
  coffee: "kafene",
  cafeteria: "kafene",
  kafe: "kafene",
  pub: "pub_lounge",
  lounge: "pub_lounge",
  "pub/lounge": "pub_lounge",
  publounge: "pub_lounge",
  pub_lounge: "pub_lounge",
  pizza: "piceri",
  pizzeria: "piceri",
  "fast food": "fast_food",
  fastfood: "fast_food",
  "fast-food": "fast_food",
  fast_food: "fast_food",
  pasticeri: "pasticeri",
  "pasticeri/embeltore": "pasticeri",
  pasticeri_embeltore: "pasticeri",
  embeltore: "pasticeri",
  pastry: "pasticeri",
  gelato: "akullore",
  ice_cream: "akullore",
  icecream: "akullore",
  poultry: "gjeltore",
  shop: "dyqan",
  store: "dyqan",
  supermarket: "market",
  minimarket: "market",
  other: "tjeter",
  tjetër: "tjeter",
  tjeter: "tjeter",
};

const TIPI_LABELS = {
  kafene: "Kafene",
  restorant: "Restorant",
  bar: "Bar",
  pub_lounge: "Pub/Lounge",
  piceri: "Piceri",
  fast_food: "Fast Food",
  kebab: "Kebab",
  pasticeri: "Pastiçeri/Ëmbëltore",
  akullore: "Akullore",
  gjeltore: "Gjeltore",
  market: "Market",
  dyqan: "Dyqan",
  tjeter: "Tjetër",
};

function normalizeClientTipi(raw) {
  let t = String(raw || "restorant")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ë/g, "e")
    .replace(/\s+/g, "_")
    .replace(/\//g, "_");
  if (TIPI_ALIASES[t]) t = TIPI_ALIASES[t];
  // pub_lounge / fast_food already normalized via spaces→_
  if (t === "pub_lounge" || t === "fast_food") return t;
  return t;
}

function assertClientTipi(raw) {
  const tipi = normalizeClientTipi(raw);
  if (!ALLOWED_CLIENT_TIPI.includes(tipi)) {
    throw new Error(
      "Tipi i biznesit duhet të jetë: Kafene, Restorant, Bar, Pub/Lounge, Piceri, Fast Food, Kebab, Pastiçeri/Ëmbëltore, Akullore ose Gjeltore.",
    );
  }
  return tipi;
}

/** Licenca cloud: vetëm kafene | restorant — hospitality tjetër → restorant (e njëjta app). */
function appTypeFromClientTipi(tipi) {
  return normalizeClientTipi(tipi) === "kafene" ? "kafene" : "restorant";
}

function labelForTipi(tipi) {
  const t = normalizeClientTipi(tipi);
  return TIPI_LABELS[t] || TIPI_LABELS.restorant;
}

module.exports = {
  ADMIN_CLIENT_TIPI,
  ALLOWED_CLIENT_TIPI,
  TIPI_LABELS,
  normalizeClientTipi,
  assertClientTipi,
  appTypeFromClientTipi,
  labelForTipi,
};
