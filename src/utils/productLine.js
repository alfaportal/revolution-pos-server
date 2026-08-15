/**
 * Produktet e Master Admin — Revolution POS.
 */
const PRODUCT_LINES = [
  {
    id: "kafene",
    label: "REVOLUTION POS",
    short: "POS",
    description: "Biznese që SHESIN — kafene, restorant, bar/pub, klub nate, piceri, fast food, dyqan pijesh",
  },
];

const HOTEL_TIPI = ["hotel_restorant"];
const FURRA_TIPI = ["furre_buke", "pasticeri"];

function normalizeProductLine(v) {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  if (s === "security" || s === "sekurim" || s === "securetrack") return "security";
  if (s === "hotel" || s === "hotel_restorant") return "hotel";
  if (s === "furra" || s === "furre" || s === "furre_buke" || s === "bakery") return "furra";
  if (s === "kafene" || s === "cafe" || s === "pos" || s === "hospitality") return "kafene";
  if (PRODUCT_LINES.some((p) => p.id === s && p.enabled !== false)) return s;
  return "kafene";
}

/** Vetëm vlera që lejon DB POS: kafene. Hotel/Furra ruhen si tipi. */
function toDbProductLine(v) {
  return normalizeProductLine(v) === "security" ? "security" : "kafene";
}

function productLineLabel(id) {
  return PRODUCT_LINES.find((p) => p.id === normalizeProductLine(id))?.label || id || "—";
}

function appTypeForProductLine(productLine, tipi) {
  if (normalizeProductLine(productLine) === "security") return "sekurim";
  const t = String(tipi || "").toLowerCase();
  return t === "kafene" ? "kafene" : "restorant";
}

function adminProductOfClient(c) {
  const rawPl = String(c?.product_line || "").trim().toLowerCase();
  if (rawPl === "security" || rawPl === "sekurim" || rawPl === "securetrack") return "security";
  const tipi = String(c?.tipi || "").trim().toLowerCase();
  if (HOTEL_TIPI.includes(tipi)) return "hotel";
  if (FURRA_TIPI.includes(tipi)) return "furra";
  return "kafene";
}

function adminProductOfLicense(l) {
  if (String(l?.app_type || "").toLowerCase() === "sekurim") return "security";
  const pl = String(l?.product_line || l?.clients?.product_line || "").toLowerCase();
  if (pl === "security" || pl === "sekurim" || pl === "securetrack") return "security";
  return adminProductOfClient(l?.clients || { tipi: l?.clients?.tipi, product_line: l?.product_line });
}

module.exports = {
  PRODUCT_LINES,
  HOTEL_TIPI,
  FURRA_TIPI,
  normalizeProductLine,
  toDbProductLine,
  productLineLabel,
  appTypeForProductLine,
  adminProductOfClient,
  adminProductOfLicense,
};
