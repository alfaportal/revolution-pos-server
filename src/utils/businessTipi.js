/**
 * REVOLUTION POS — biznese që SHESIN produkte/ushqim/pije.
 * Nuk përzihen kurrë me REVOLUTION SECURITY (menaxhim punëtorësh).
 */

/** Tipet e reja për regjistrim nga Master Admin (POS). */
const POS_REGISTER_TIPI = [
  "kafene",
  "restorant",
  "bar",
  "klub_nate",
  "piceri",
  "fast_food",
  "dyqan_pijesh",
];

/**
 * Tipet e lejuara në DB — përfshin edhe tipet e vjetra (klientë ekzistues).
 * Regjistrimi i ri përdor vetëm POS_REGISTER_TIPI.
 */
const ADMIN_CLIENT_TIPI = [
  ...POS_REGISTER_TIPI,
  "pub_lounge",
  "bar_nate",
  "klub",
  "diskoteke",
  "kebab",
  "pasticeri",
  "akullore",
  "gjeltore",
  "furre_buke",
  "hotel_restorant",
  "market",
  "minimarket",
  "dyqan_rroba",
  "dyqan_kepuce",
  "dyqan",
  "farmaci",
  "optike",
  "berber",
  "sallon_bukurie",
  "tjeter",
];

const ALLOWED_CLIENT_TIPI = [...ADMIN_CLIENT_TIPI];

/** Grupet e listës Klientët — vetëm shitje POS. */
const CLIENT_SECTORS = [
  {
    num: 1,
    id: "kafene",
    label: "Kafene",
    tipet: ["kafene"],
    keywords: ["kafene", "cafe", "kafe"],
  },
  {
    num: 2,
    id: "restorant",
    label: "Restorant",
    tipet: ["restorant", "hotel_restorant"],
    keywords: ["restorant", "restaurant"],
  },
  {
    num: 3,
    id: "bar_pub",
    label: "Bar / Pub",
    tipet: ["bar", "pub_lounge"],
    keywords: ["bar", "pub", "lounge"],
  },
  {
    num: 4,
    id: "nightlife",
    label: "Klub nate / Diskotekë",
    tipet: ["klub_nate", "klub", "diskoteke", "bar_nate"],
    keywords: ["klub", "nate", "diskotek", "disco", "night"],
  },
  {
    num: 5,
    id: "piceri",
    label: "Piceri",
    tipet: ["piceri"],
    keywords: ["piceri", "pizza"],
  },
  {
    num: 6,
    id: "fast_food",
    label: "Fast Food Kiosk",
    tipet: ["fast_food", "kebab"],
    keywords: ["fast", "food", "kiosk", "kebab"],
  },
  {
    num: 7,
    id: "dyqan_pijesh",
    label: "Dyqan pijesh",
    tipet: ["dyqan_pijesh"],
    keywords: ["pijesh", "pije", "drinks"],
  },
  {
    num: 8,
    id: "other",
    label: "Të tjera (klientë të vjetër)",
    tipet: [
      "pasticeri", "akullore", "gjeltore", "furre_buke", "market", "minimarket",
      "dyqan_rroba", "dyqan_kepuce", "dyqan", "farmaci", "optike", "berber",
      "sallon_bukurie", "tjeter",
    ],
    keywords: ["tjeter", "other"],
  },
];

const HOSPITALITY_TIPET = POS_REGISTER_TIPI;

const TIPI_ALIASES = {
  restaurante: "restorant",
  restaurant: "restorant",
  resto: "restorant",
  cafe: "kafene",
  coffee: "kafene",
  cafeteria: "kafene",
  kafe: "kafene",
  pub: "bar",
  lounge: "bar",
  "pub/lounge": "bar",
  publounge: "bar",
  pub_lounge: "bar",
  pizza: "piceri",
  pizzeria: "piceri",
  "fast food": "fast_food",
  fastfood: "fast_food",
  "fast-food": "fast_food",
  kiosk: "fast_food",
  nightclub: "klub_nate",
  club: "klub_nate",
  klub: "klub_nate",
  diskoteke: "klub_nate",
  diskoteka: "klub_nate",
  disco: "klub_nate",
  discotheque: "klub_nate",
  "bar nate": "klub_nate",
  bar_nate: "klub_nate",
  nightbar: "klub_nate",
  night_bar: "klub_nate",
  nightlife: "klub_nate",
  "klub nate": "klub_nate",
  klub_nate_diskoteke: "klub_nate",
  dyqan_pijesh: "dyqan_pijesh",
  "dyqan pijesh": "dyqan_pijesh",
  pije: "dyqan_pijesh",
  drinks: "dyqan_pijesh",
  other: "tjeter",
  tjetër: "tjeter",
  tjeter: "tjeter",
};

const TIPI_LABELS = {
  kafene: "Kafene",
  restorant: "Restorant",
  bar: "Bar / Pub",
  klub_nate: "Klub nate / Diskotekë",
  piceri: "Piceri",
  fast_food: "Fast Food Kiosk",
  dyqan_pijesh: "Dyqan pijesh",
  // legacy labels (lexim)
  pub_lounge: "Bar / Pub",
  bar_nate: "Klub nate / Diskotekë",
  klub: "Klub nate / Diskotekë",
  diskoteke: "Klub nate / Diskotekë",
  kebab: "Fast Food Kiosk",
  pasticeri: "Pastiçeri/Ëmbëltore",
  akullore: "Akullore",
  gjeltore: "Gjeltore",
  furre_buke: "Furrë Buke",
  hotel_restorant: "Hotel Restorant",
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
      "Tipi i biznesit nuk njihet. Zgjidhni një veprimtari REVOLUTION POS (Kafene, Restorant, Bar/Pub, …).",
    );
  }
  return tipi;
}

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
  POS_REGISTER_TIPI,
  ADMIN_CLIENT_TIPI,
  ALLOWED_CLIENT_TIPI,
  HOSPITALITY_TIPET,
  CLIENT_SECTORS,
  TIPI_LABELS,
  TIPI_ALIASES,
  normalizeClientTipi,
  assertClientTipi,
  appTypeFromClientTipi,
  labelForTipi,
  sectorForTipi,
};
