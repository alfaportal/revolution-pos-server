/**
 * Llojet e biznesit për clients.tipi — kafene, restorant, bar, market, dyqan, tjeter.
 * Aliasë (p.sh. "restaurante") normalizohen që regjistrimi të mos dështojë.
 */

const ALLOWED_CLIENT_TIPI = ["kafene", "restorant", "bar", "market", "dyqan", "tjeter"];

const TIPI_ALIASES = {
  restaurante: "restorant",
  restaurant: "restorant",
  resto: "restorant",
  cafe: "kafene",
  coffee: "kafene",
  cafeteria: "kafene",
  kafe: "kafene",
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
    .replace(/ë/g, "e");
  if (TIPI_ALIASES[t]) t = TIPI_ALIASES[t];
  return t;
}

function assertClientTipi(raw) {
  const tipi = normalizeClientTipi(raw);
  if (!ALLOWED_CLIENT_TIPI.includes(tipi)) {
    throw new Error(
      "Tipi i biznesit duhet të jetë: Kafene, Restorant, Bar, Market, Dyqan ose Tjetër.",
    );
  }
  return tipi;
}

/** Licenca cloud: vetëm kafene | restorant — të tjerat → restorant (e njëjta app). */
function appTypeFromClientTipi(tipi) {
  return normalizeClientTipi(tipi) === "kafene" ? "kafene" : "restorant";
}

function labelForTipi(tipi) {
  const t = normalizeClientTipi(tipi);
  return TIPI_LABELS[t] || TIPI_LABELS.restorant;
}

module.exports = {
  ALLOWED_CLIENT_TIPI,
  TIPI_LABELS,
  normalizeClientTipi,
  assertClientTipi,
  appTypeFromClientTipi,
  labelForTipi,
};
