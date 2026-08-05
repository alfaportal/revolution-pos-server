/**
 * Veprimtaritë Security — lista e plotë që zgjedh pronari / Master Admin.
 * Nuk përzihen me Kafene/POS (product_line = security).
 */

const SECURITY_VEPRIMTARI = [
  { id: "kompani_sigurie", label: "Kompani Sigurie" },
  { id: "ndertimtari", label: "Ndërtimtari" },
  { id: "pastrim", label: "Pastrim" },
  { id: "transport_logjistike", label: "Transport / Logjistikë" },
  { id: "retail", label: "Retail" },
  { id: "hotel_restorant", label: "Hotel / Restorant" },
  { id: "sherbime_teknike", label: "Shërbime Teknike" },
  { id: "sherbime_mjekesore", label: "Shërbime Mjekësore" },
  { id: "agjenci_punesimi", label: "Agjenci Punësimi" },
  { id: "bujqesi", label: "Bujqësi" },
  { id: "objekt", label: "Objekt / Ndërtesë" },
  { id: "event_sigurie", label: "Evente / Siguri eventesh" },
  { id: "parking", label: "Parking / Zona parkimi" },
  { id: "fabrika", label: "Fabrikë / Industri" },
  { id: "shkolla", label: "Shkollë / Institucion" },
  { id: "spitale", label: "Spital / Klinikë" },
  { id: "banka", label: "Bankë / Finance" },
  { id: "tjeter", label: "Tjetër" },
];

/** Sektoret e listës Klientët (Security) — gjithmonë të dukshme, të ndara nga Kafene. */
const SECURITY_SECTORS = [
  {
    num: 1,
    id: "sec_kompani",
    label: "Kompani Sigurie",
    tipet: ["kompani_sigurie"],
    keywords: ["kompani", "sigurie", "security", "guard"],
  },
  {
    num: 2,
    id: "sec_ndertim",
    label: "Ndërtimtari",
    tipet: ["ndertimtari"],
    keywords: ["ndertim", "ndertimtari", "construction"],
  },
  {
    num: 3,
    id: "sec_pastrim",
    label: "Pastrim",
    tipet: ["pastrim"],
    keywords: ["pastrim", "cleaning"],
  },
  {
    num: 4,
    id: "sec_transport",
    label: "Transport / Logjistikë",
    tipet: ["transport_logjistike", "transport_sigurie"],
    keywords: ["transport", "logjistike"],
  },
  {
    num: 5,
    id: "sec_retail",
    label: "Retail",
    tipet: ["retail", "retail_sigurie"],
    keywords: ["retail", "dyqan"],
  },
  {
    num: 6,
    id: "sec_hotel",
    label: "Hotel / Restorant",
    tipet: ["hotel_restorant", "hotel"],
    keywords: ["hotel", "restorant"],
  },
  {
    num: 7,
    id: "sec_teknike",
    label: "Shërbime Teknike",
    tipet: ["sherbime_teknike"],
    keywords: ["teknike", "teknik"],
  },
  {
    num: 8,
    id: "sec_mjekesore",
    label: "Shërbime Mjekësore",
    tipet: ["sherbime_mjekesore", "spitale"],
    keywords: ["mjekesore", "spital", "klinike"],
  },
  {
    num: 9,
    id: "sec_punesim",
    label: "Agjenci Punësimi",
    tipet: ["agjenci_punesimi"],
    keywords: ["punesim", "agjenci"],
  },
  {
    num: 10,
    id: "sec_bujqesi",
    label: "Bujqësi",
    tipet: ["bujqesi"],
    keywords: ["bujqesi", "ferme"],
  },
  {
    num: 11,
    id: "sec_objekt",
    label: "Objekt / Evente / Parking / Industri",
    tipet: ["objekt", "ndertesa", "event_sigurie", "parking", "fabrika", "shkolla", "banka"],
    keywords: ["objekt", "event", "parking", "fabrika", "shkolla", "banka"],
  },
  {
    num: 12,
    id: "sec_tjeter",
    label: "Tjetër (Security)",
    tipet: ["tjeter"],
    keywords: ["tjeter", "other"],
  },
];

const VEPRIMTARI_ALIASES = {
  hotel: "hotel_restorant",
  restorant: "hotel_restorant",
  transport: "transport_logjistike",
  transport_sigurie: "transport_logjistike",
  logjistike: "transport_logjistike",
  retail_sigurie: "retail",
  ndertesa: "objekt",
  building: "objekt",
  spitale: "sherbime_mjekesore",
  mjekesi: "sherbime_mjekesore",
};

function normalizeVeprimtari(raw) {
  let s = String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ë/g, "e")
    .replace(/\s+/g, "_")
    .replace(/\//g, "_");
  if (!s) return "kompani_sigurie";
  if (VEPRIMTARI_ALIASES[s]) s = VEPRIMTARI_ALIASES[s];
  if (SECURITY_VEPRIMTARI.some((v) => v.id === s)) return s;
  return "tjeter";
}

function labelForVeprimtari(id) {
  const n = normalizeVeprimtari(id);
  return SECURITY_VEPRIMTARI.find((v) => v.id === n)?.label || id || "Security";
}

function sectorForVeprimtari(veprimtari) {
  const t = normalizeVeprimtari(veprimtari);
  for (const s of SECURITY_SECTORS) {
    if (s.tipet.includes(t)) return s;
  }
  return SECURITY_SECTORS[SECURITY_SECTORS.length - 1];
}

module.exports = {
  SECURITY_VEPRIMTARI,
  SECURITY_SECTORS,
  normalizeVeprimtari,
  labelForVeprimtari,
  sectorForVeprimtari,
};
