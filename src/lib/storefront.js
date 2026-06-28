function isShopStorefront(client) {
  const tipi = String(client?.tipi || "").toLowerCase();
  return tipi === "dyqan" || tipi === "tjeter";
}

function storefrontPrefix(client) {
  return isShopStorefront(client) ? "s" : "r";
}

function buildStorefrontUrl(baseUrl, client, suffix = "") {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  const slug = client?.kitchen_slug || client?.id;
  if (!slug) return null;
  const prefix = storefrontPrefix(client);
  const path = `/${prefix}/${encodeURIComponent(slug)}${suffix}`;
  return `${base}${path}`;
}

module.exports = {
  isShopStorefront,
  storefrontPrefix,
  buildStorefrontUrl,
};
