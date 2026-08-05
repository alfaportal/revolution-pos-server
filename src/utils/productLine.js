/** Produktet e Master Admin — shkallëzueshme (kafene, security, …) */
const PRODUCT_LINES = [
  {
    id: "kafene",
    label: "Kafene & Restorante",
    short: "Kafene",
    description: "POS · kafene, restorant, bar, market, …",
  },
  {
    id: "security",
    label: "Security",
    short: "Security",
    description: "Revolution Security · staf, GPS, licenca sekurim",
  },
];

function normalizeProductLine(v) {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  if (s === "security" || s === "sekurim" || s === "securetrack") return "security";
  if (s === "kafene" || s === "cafe" || s === "pos" || s === "hospitality") return "kafene";
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
