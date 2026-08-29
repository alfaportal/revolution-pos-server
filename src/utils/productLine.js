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
/** Produktet që ruhen në Supabase POS (jo hotel/market/security bridge). */
const POS_DB_PRODUCT_LINES = new Set(["kafene", "furra", "kontabilisti", "fiskale"]);

function normalizeProductLine(v) {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  if (s === "security" || s === "sekurim" || s === "securetrack") return "security";
  if (s === "hotel" || s === "hotel_restorant") return "hotel";
  if (s === "market" || s === "minimarket" || s === "supermarket") return "market";
  if (s === "furra" || s === "furre" || s === "furre_buke" || s === "bakery") return "furra";
  if (s === "kontabilisti" || s === "kontabilist" || s === "accounting") return "kontabilisti";
  if (s === "fiskale" || s === "fiscal" || s === "fiskal") return "fiskale";
  if (s === "kafene" || s === "cafe" || s === "pos" || s === "hospitality") return "kafene";
  if (s === "restaurant" || s === "restorant") return "kafene";
  if (PRODUCT_LINES.some((p) => p.id === s && p.enabled !== false)) return s;
  return "kafene";
}

/** Vlera e ruajtur në Supabase POS — secili program veç e veç. */
function toDbProductLine(v) {
  const p = normalizeProductLine(v);
  if (p === "security") return "security";
  if (POS_DB_PRODUCT_LINES.has(p)) return p;
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

function adminProductOfClient(c) {
  const rawPl = String(c?.product_line || "").trim().toLowerCase();
  if (rawPl === "security" || rawPl === "sekurim" || rawPl === "securetrack") return "security";
  if (rawPl === "hotel") return "hotel";
  if (rawPl === "market") return "market";
  if (rawPl === "furra") return "furra";
  if (rawPl === "kontabilisti" || rawPl === "kontabilist") return "kontabilisti";
  if (rawPl === "fiskale" || rawPl === "fiscal" || rawPl === "fiskal") return "fiskale";
  if (rawPl === "kafene" || rawPl === "pos" || rawPl === "restaurant" || rawPl === "restorant") {
    return "kafene";
  }

  // Legacy pa product_line — vetëm kur mungon kolona
  const tipi = String(c?.tipi || "").trim().toLowerCase();
  if (HOTEL_TIPI.includes(tipi)) return "hotel";
  if (FURRA_TIPI.includes(tipi)) return "furra";
  return "kafene";
}

function adminProductOfLicense(l) {
  if (String(l?.app_type || "").toLowerCase() === "sekurim") return "security";
  if (l?.clients?.product_line) return adminProductOfClient(l.clients);
  const pl = String(l?.product_line || "").trim().toLowerCase();
  if (pl === "security" || pl === "sekurim" || pl === "securetrack") return "security";
  if (pl === "hotel") return "hotel";
  if (pl === "market") return "market";
  if (pl === "furra") return "furra";
  if (pl === "kontabilisti" || pl === "kontabilist") return "kontabilisti";
  if (pl === "fiskale" || pl === "fiscal" || pl === "fiskal") return "fiskale";
  if (pl === "kafene" || pl === "pos") return "kafene";
  return adminProductOfClient(l?.clients || { tipi: l?.clients?.tipi, product_line: l?.product_line });
}

module.exports = {
  PRODUCT_LINES,
  HOTEL_TIPI,
  FURRA_TIPI,
  POS_DB_PRODUCT_LINES,
  normalizeProductLine,
  toDbProductLine,
  productLineLabel,
  appTypeForProductLine,
  adminProductOfClient,
  adminProductOfLicense,
};
