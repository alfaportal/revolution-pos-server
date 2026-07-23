/**
 * Read-only listë e faqeve publike për sitemap + /restorante.
 * Nuk shkruan në DB. Nuk prek porosi / sync / licencë.
 */
const { getSupabase } = require("../db");
const { clientHasFeature } = require("../lib/packages");
const { isShopStorefront, storefrontPrefix } = require("../lib/storefront");
const { getPublicAppOrigin } = require("../lib/publicOrigin");

function normalizeSlug(raw) {
  return String(raw || "").trim();
}

/**
 * @returns {Promise<Array<{
 *   slug: string,
 *   name: string,
 *   address: string,
 *   description: string,
 *   storefront: "r"|"s",
 *   path: string,
 *   url: string,
 * }>>}
 */
async function listPublicStorefronts() {
  const db = getSupabase();
  const origin = getPublicAppOrigin();

  const { data: clients, error } = await db
    .from("clients")
    .select("id, emri, adresa, tipi, package_tier, kitchen_slug")
    .not("kitchen_slug", "is", null);

  if (error) throw error;
  if (!clients?.length) return [];

  const withSlug = clients.filter((c) => normalizeSlug(c.kitchen_slug));
  if (!withSlug.length) return [];

  const ids = withSlug.map((c) => c.id);
  const { data: settingsRows, error: settingsErr } = await db
    .from("pos_settings")
    .select("client_id, public_enabled, restaurant_name, address, public_description")
    .in("client_id", ids);

  if (settingsErr) throw settingsErr;

  const settingsByClient = new Map(
    (settingsRows || []).map((row) => [row.client_id, row]),
  );

  const out = [];
  for (const client of withSlug) {
    if (!clientHasFeature(client, "website")) continue;

    const settings = settingsByClient.get(client.id);
    if (settings?.public_enabled === false) continue;

    const slug = normalizeSlug(client.kitchen_slug);
    const prefix = storefrontPrefix(client);
    const path = `/${prefix}/${encodeURIComponent(slug)}`;
    const name = String(settings?.restaurant_name || client.emri || slug).trim();
    const address = String(settings?.address || client.adresa || "").trim();
    const description = String(settings?.public_description || "").trim();

    out.push({
      slug,
      name,
      address,
      description,
      storefront: prefix,
      path,
      url: `${origin}${path}`,
      is_shop: isShopStorefront(client),
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name, "sq"));
  return out;
}

function marketingSitemapUrls() {
  const origin = getPublicAppOrigin();
  return [
    { loc: `${origin}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${origin}/restorante`, changefreq: "daily", priority: "0.9" },
    { loc: `${origin}/privacy`, changefreq: "yearly", priority: "0.3" },
    { loc: `${origin}/terms`, changefreq: "yearly", priority: "0.3" },
  ];
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function buildSitemapXml() {
  const staticUrls = marketingSitemapUrls();
  let storefronts = [];
  try {
    storefronts = await listPublicStorefronts();
  } catch (err) {
    console.warn("[seo] listPublicStorefronts failed:", err.message || err);
  }

  const urls = [
    ...staticUrls,
    ...storefronts.map((s) => ({
      loc: s.url,
      changefreq: "daily",
      priority: "0.8",
    })),
  ];

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function buildRobotsTxt() {
  const origin = getPublicAppOrigin();
  return `User-agent: *
Allow: /
Allow: /r/
Allow: /s/
Allow: /restorante
Allow: /privacy
Allow: /terms

Disallow: /api/
Disallow: /owner/
Disallow: /admin
Disallow: /waiter/
Disallow: /kitchen/
Disallow: /bar/
Disallow: /kiosk/
Disallow: /menu/

Sitemap: ${origin}/sitemap.xml
`;
}

module.exports = {
  listPublicStorefronts,
  marketingSitemapUrls,
  buildSitemapXml,
  buildRobotsTxt,
};
