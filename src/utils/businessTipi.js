/**
 * Llojet e biznesit për clients.tipi — Super Admin (telefon + desktop).
 * Sektoret e numëruara (1–12) për /admin/dashboard.
 */

/** Tipi individualë që ruhen në DB (për regjistrim). */
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
  "furre_buke",
  "hotel_restorant",
  "bar_nate",
  "klub",
  "market",
  "minimarket",
  "dyqan_rroba",
  "dyqan_kepuce",
  "farmaci",
  "optike",
  "berber",
  "sallon_bukurie",
  "dyqan",
  "tjeter",
];

const ALLOWED_CLIENT_TIPI = [...ADMIN_CLIENT_TIPI];

/**
 * Sektoret e numëruara për Klientët në dashboard.
 * Çdo sektor përmban një ose më shumë tipi.
 */
const CLIENT_SECTORS = [
  {
    num: 1,
    id: "hospitality_core",
    label: "Kafene/Restorant/Bar",
    tipet: ["kafene", "restorant", "bar"],
    keywords: ["kafene", "restorant", "bar", "kafe", "restaurant", "cafe"],
  },
  {
    num: 2,
    id: "quick_food",
    label: "Piceri/Fast Food/Kebab",
    tipet: ["piceri", "fast_food", "kebab"],
    keywords: ["piceri", "pizza", "fast", "food", "kebab", "fastfood"],
  },
  {
    num: 3,
    id: "sweets",
    label: "Pastiçeri/Ëmbëltore/Akullore",
    tipet: ["pasticeri", "akullore"],
    keywords: ["pasticeri", "embeltore", "akullore", "pastry", "gelato", "embeltore"],
  },
  {
    num: 4,
    id: "poultry",
    label: "Gjeltore",
    tipet: ["gjeltore"],
    keywords: ["gjeltore", "poultry"],
  },
  {
    num: 5,
    id: "bakery",
    label: "Furrë Buke",
    tipet: ["furre_buke"],
    keywords: ["furre", "buke", "bakery", "furra"],
  },
  {
    num: 6,
    id: "hotel",
    label: "Hotel Restorant",
    tipet: ["hotel_restorant"],
    keywords: ["hotel", "hotel restorant"],
  },
  {
    num: 7,
    id: "nightlife",
    label: "Bar Nate/Klub",
    tipet: ["bar_nate", "klub", "pub_lounge"],
    keywords: ["nate", "klub", "club", "pub", "lounge", "nightlife"],
  },
  {
    num: 8,
    id: "grocery",
    label: "Market/Minimarket",
    tipet: ["market", "minimarket"],
    keywords: ["market", "minimarket", "supermarket"],
  },
  {
    num: 9,
    id: "fashion",
    label: "Dyqan Rrobash/Këpucësh",
    tipet: ["dyqan_rroba", "dyqan_kepuce", "dyqan"],
    keywords: ["rroba", "kepuce", "dyqan", "fashion", "shoe", "clothing"],
  },
  {
    num: 10,
    id: "health",
    label: "Farmaci/Optikë",
    tipet: ["farmaci", "optike"],
    keywords: ["farmaci", "optike", "pharmacy", "optic"],
  },
  {
    num: 11,
    id: "beauty",
    label: "Berber/Sallon Bukurie",
    tipet: ["berber", "sallon_bukurie"],
    keywords: ["berber", "sallon", "bukurie", "barber", "salon", "beauty"],
  },
  {
    num: 12,
    id: "other",
    label: "Shërbime të tjera",
    tipet: ["tjeter"],
    keywords: ["tjeter", "sherbime", "other", "shërbime"],
  },
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
  furre: "furre_buke",
  furra: "furre_buke",
  bakery: "furre_buke",
  "furre buke": "furre_buke",
  hotel: "hotel_restorant",
  "hotel restorant": "hotel_restorant",
  nightclub: "klub",
  club: "klub",
  "bar nate": "bar_nate",
  nightlife: "bar_nate",
  shop: "dyqan",
  store: "dyqan",
  supermarket: "market",
  minimarket: "minimarket",
  pharmacy: "farmaci",
  optic: "optike",
  optics: "optike",
  barber: "berber",
  salon: "sallon_bukurie",
  beauty: "sallon_bukurie",
  "sallon bukurie": "sallon_bukurie",
  clothing: "dyqan_rroba",
  shoes: "dyqan_kepuce",
  kepuce: "dyqan_kepuce",
  rroba: "dyqan_rroba",
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
  furre_buke: "Furrë Buke",
  hotel_restorant: "Hotel Restorant",
  bar_nate: "Bar Nate",
  klub: "Klub",
  market: "Market",
  minimarket: "Minimarket",
  dyqan_rroba: "Dyqan Rrobash",
  dyqan_kepuce: "Dyqan Këpucësh",
  dyqan: "Dyqan",
  farmaci: "Farmaci",
  optike: "Optikë",
  berber: "Berber",
  sallon_bukurie: "Sallon Bukurie",
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
  // aliases with spaces already collapsed to _
  const spaced = String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ë/g, "e");
  if (TIPI_ALIASES[spaced]) t = TIPI_ALIASES[spaced];
  return t;
}

function assertClientTipi(raw) {
  const tipi = normalizeClientTipi(raw);
  if (!ALLOWED_CLIENT_TIPI.includes(tipi)) {
    throw new Error(
      "Tipi i biznesit nuk njihet. Zgjidhni një nga sektoret e lejuara (Kafene, Piceri, Furrë, Market, Berber, etj.).",
    );
  }
  return tipi;
}

/** Licenca cloud: vetëm kafene | restorant — hospitality tjetër → restorant. */
function appTypeFromClientTipi(tipi) {
  return normalizeClientTipi(tipi) === "kafene" ? "kafene" : "restorant";
}

function labelForTipi(tipi) {
  const t = normalizeClientTipi(tipi);
  return TIPI_LABELS[t] || TIPI_LABELS.tjeter;
}

function sectorForTipi(tipi) {
  const t = normalizeClientTipi(tipi);
  for (const s of CLIENT_SECTORS) {
    if (s.tipet.includes(t)) return s;
  }
  return CLIENT_SECTORS[CLIENT_SECTORS.length - 1];
}

module.exports = {
  ADMIN_CLIENT_TIPI,
  ALLOWED_CLIENT_TIPI,
  CLIENT_SECTORS,
  TIPI_LABELS,
  TIPI_ALIASES,
  normalizeClientTipi,
  assertClientTipi,
  appTypeFromClientTipi,
  labelForTipi,
  sectorForTipi,
};
