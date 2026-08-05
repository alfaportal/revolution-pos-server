/**
 * Produktet e Master Admin (Revolution Invest) — NJË admin për të gjitha.
 * Për projekt të ri: shto një objekt këtu (id unik) + bridge/service përkatës.
 * Klientët e çdo produkti mbeten të ndarë (product_line) — nuk përzihen.
 */
const PRODUCT_LINES = [
  {
    id: "kafene",
    label: "Kafene & Restorante",
    short: "Kafene",
    description: "POS · kafene, restorant, bar, night bar, diskotekë, market, …",
  },
  {
    id: "security",
    label: "Security",
    short: "Security",
    description: "Revolution Security · staf, GPS, licenca sekurim (sektore të veçanta)",
  },
  // Shembull për të ardhmen (mos aktivizo pa bridge):
  // { id: "hotel", label: "Hotel", short: "Hotel", description: "…", enabled: false },
];

function normalizeProductLine(v) {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  if (s === "security" || s === "sekurim" || s === "securetrack") return "security";
  if (s === "kafene" || s === "cafe" || s === "pos" || s === "hospitality") return "kafene";
  // Produkt i panjohur → kafene (default POS), jo security
  if (PRODUCT_LINES.some((p) => p.id === s && p.enabled !== false)) return s;
  return "kafene";
}

function productLineLabel(id) {
  return PRODUCT_LINES.find((p) => p.id === normalizeProductLine(id))?.label || id || "—";
}

function appTypeForProductLine(productLine, tipi) {
  if (normalizeProductLine(productLine) === "security") return "sekurim";
  const t = String(tipi || "").toLowerCase();
  return t === "kafene" ? "kafene" : "restorant";
}

module.exports = {
  PRODUCT_LINES,
  normalizeProductLine,
  productLineLabel,
  appTypeForProductLine,
};
