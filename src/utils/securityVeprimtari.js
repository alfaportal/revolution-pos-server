/**
 * Veprimtaritë Security — vetëm produkti "security" (nuk përzihen me Kafene/POS).
 * Master Admin i kontrollon të gjitha nga një vend; sektoret janë kategori, jo adminë të veçantë.
 */

const SECURITY_VEPRIMTARI = [
  { id: "kompani_sigurie", label: "Kompani sigurie" },
  { id: "objekt", label: "Objekt / Ndërtesë" },
  { id: "hotel", label: "Hotel / Akomodim" },
  { id: "event_sigurie", label: "Evente / Siguri eventesh" },
  { id: "parking", label: "Parking / Zona parkimi" },
  { id: "fabrika", label: "Fabrikë / Industri" },
  { id: "shkolla", label: "Shkollë / Institucion" },
  { id: "spitale", label: "Spital / Klinikë" },
  { id: "banka", label: "Bankë / Finance" },
  { id: "retail_sigurie", label: "Retail / Dyqan (siguri)" },
  { id: "transport_sigurie", label: "Transport / Logjistikë" },
  { id: "ndertimtari", label: "Ndërtimtari" },
  { id: "pastrim", label: "Pastrim" },
  { id: "sherbime_teknike", label: "Shërbime teknike" },
  { id: "tjeter", label: "Tjetër (Security)" },
];

/** Sektoret e listës Klientët (Security) — gjithmonë të dukshme, të ndara nga Kafene. */
const SECURITY_SECTORS = [
  {
    num: 1,
    id: "sec_kompani",
    label: "Kompani sigurie",
    tipet: ["kompani_sigurie"],
    keywords: ["kompani", "sigurie", "security", "guard"],
  },
  {
    num: 2,
    id: "sec_objekt",
    label: "Objekt / Ndërtesë",
    tipet: ["objekt", "ndertesa"],
    keywords: ["objekt", "nderte", "building"],
  },
  {
    num: 3,
    id: "sec_hotel",
    label: "Hotel / Akomodim",
    tipet: ["hotel", "hotel_restorant"],
    keywords: ["hotel", "akomodim"],
  },
  {
    num: 4,
    id: "sec_event",
    label: "Evente / Siguri eventesh",
    tipet: ["event_sigurie"],
    keywords: ["event", "evente"],
  },
  {
    num: 5,
    id: "sec_parking",
    label: "Parking",
    tipet: ["parking"],
    keywords: ["parking", "parkim"],
  },
  {
    num: 6,
    id: "sec_industri",
    label: "Fabrikë / Industri",
    tipet: ["fabrika"],
    keywords: ["fabrika", "industri"],
  },
  {
    num: 7,
    id: "sec_institucione",
    label: "Shkollë / Spital / Bankë",
    tipet: ["shkolla", "spitale", "banka"],
    keywords: ["shkolla", "spital", "banka", "klinike"],
  },
  {
    num: 8,
    id: "sec_retail",
    label: "Retail / Dyqan (siguri)",
    tipet: ["retail_sigurie", "retail"],
    keywords: ["retail", "dyqan"],
  },
  {
    num: 9,
    id: "sec_sherbime",
    label: "Transport / Ndërtim / Pastrim / Teknikë",
    tipet: ["transport_sigurie", "transport_logjistike", "ndertimtari", "pastrim", "sherbime_teknike", "sherbime_mjekesore", "agjenci_punesimi", "bujqesi"],
    keywords: ["transport", "ndertim", "pastrim", "teknike"],
  },
  {
    num: 10,
    id: "sec_tjeter",
    label: "Tjetër (Security)",
    tipet: ["tjeter"],
    keywords: ["tjeter", "other"],
  },
];

function normalizeVeprimtari(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ë/g, "e")
    .replace(/\s+/g, "_");
  if (!s) return "kompani_sigurie";
  if (SECURITY_VEPRIMTARI.some((v) => v.id === s)) return s;
  // alias të vjetra / të ngjashme
  const aliases = {
    ndertesa: "objekt",
    building: "objekt",
    hotel_restorant: "hotel",
    retail: "retail_sigurie",
    transport_logjistike: "transport_sigurie",
    transport: "transport_sigurie",
  };
  return aliases[s] || (SECURITY_VEPRIMTARI.some((v) => v.id === s) ? s : "tjeter");
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
