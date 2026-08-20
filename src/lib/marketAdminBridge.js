/**
 * Bridge te serveri i Revolution MARKET (projekt i ndarë).
 * POS Master Admin lexon/shkruan klientët MARKET përmes këtij moduli —
 * zero përzierje me Supabase të restorantit.
 */
const https = require("https");
const { MARKET_SECTORS, normalizeClientTipi, labelForTipi, sectorForTipi } = require("../utils/businessTipi");

const MARKET_UPSTREAM = String(
  process.env.MARKET_UPSTREAM
    || process.env.MARKET_UPSTREAM_URL
    || "revolution-market-server-production.up.railway.app",
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const MARKET_ADMIN_SECRET =
  process.env.MARKET_ADMIN_SECRET
  || process.env.MASTER_ADMIN_BRIDGE_SECRET
  || process.env.SUPER_ADMIN_SECRET
  || process.env.ADMIN_SECRET
  || "naser-market-2026";

const MARKET_SECTOR_DEFS = MARKET_SECTORS.map((s) => ({
  num: s.num,
  id: s.id,
  label: s.label,
  tipet: s.tipet,
  keywords: s.keywords || [],
}));

function marketRequest(path, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const bridgePath = `/api/master-bridge/market${path.startsWith("/") ? path : `/${path}`}`;
    const req = https.request(
      {
        hostname: MARKET_UPSTREAM,
        port: 443,
        path: bridgePath,
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": MARKET_ADMIN_SECRET,
          "x-master-admin-bridge": "1",
          "x-revolution-master-admin": "1",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data || "{}");
          } catch {
            parsed = {};
          }
          if (res.statusCode >= 400) {
            const raw = parsed.gabim || parsed.message || `MARKET upstream ${res.statusCode}`;
            const err = new Error(
              /unauthorized|secret/i.test(raw)
                ? "MARKET bridge: secret i panjohur. Vendos MARKET_ADMIN_SECRET të njëjtë në Master Admin dhe MARKET cloud."
                : raw,
            );
            err.status = res.statusCode;
            return reject(err);
          }
          resolve(parsed);
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function emptyMarketSectors(bridgeError) {
  const sectors = MARKET_SECTOR_DEFS.map((s) => ({
    ...s,
    clients: [],
    count: 0,
  }));
  return {
    sectors,
    groups: sectors,
    total: 0,
    product_line: "market",
    ...(bridgeError ? { bridge_error: bridgeError } : {}),
  };
}

function mapMarketClientRow(c) {
  const tipi = normalizeClientTipi(c.tipi || "minimarket");
  const sector = sectorForTipi(tipi) || MARKET_SECTOR_DEFS[0];
  return {
    id: c.id,
    emri: c.emri,
    tipi,
    tipi_label: labelForTipi(c.tipi),
    email: c.email || "",
    telefoni: c.telefoni || c.telefon || "",
    package_tier: c.package_tier,
    status: c.aktiv === false ? "joaktiv" : "aktiv",
    sales_today: Number(c.sales_today) || 0,
    icon: "🛒",
    sector_num: sector.num,
    sector_id: sector.id,
    product_line: "market",
  };
}

function groupClientsLocally(clients) {
  const sectors = MARKET_SECTOR_DEFS.map((s) => ({
    ...s,
    clients: [],
    count: 0,
  }));
  const byId = new Map(sectors.map((s) => [s.id, s]));
  for (const c of clients) {
    const row = mapMarketClientRow(c);
    const bucket = byId.get(row.sector_id) || sectors[0];
    bucket.clients.push(row);
    bucket.count = bucket.clients.length;
  }
  return {
    sectors,
    groups: sectors,
    total: clients.length,
    product_line: "market",
  };
}

async function getMarketClientsGrouped() {
  try {
    const data = await marketRequest("/dashboard/clients");
    if (Array.isArray(data.sectors) && data.sectors.length) {
      return {
        sectors: data.sectors,
        groups: data.groups || data.sectors,
        total: data.total ?? data.sectors.reduce((n, s) => n + (s.clients?.length || 0), 0),
        product_line: "market",
        bridge_error: data.bridge_error || "",
      };
    }
    const clients = Array.isArray(data.clients) ? data.clients : [];
    return groupClientsLocally(clients);
  } catch (e) {
    console.warn("[marketAdminBridge] clients:", e.message || e);
    return emptyMarketSectors(e.message || "MARKET serveri nuk përgjigjet");
  }
}

async function getMarketLicensesView() {
  try {
    const data = await marketRequest("/dashboard/licenses");
    const licenses = Array.isArray(data.licenses) ? data.licenses : [];
    return {
      licenses: licenses.map((l) => ({
        id: l.id,
        client_id: l.client_id,
        client_name: l.clients?.emri || l.client_name || "—",
        device_id: l.device_id || l.display_device_id || "",
        hardware_id: l.hardware_id || "",
        license_key: l.license_key || l.celesi || "",
        statusi: l.status || l.statusi || "aktive",
        activated_at: l.created_at || l.last_activated_at || l.activated_at || null,
        last_seen_at: l.last_seen_at || null,
        product_line: "market",
      })),
      product_line: "market",
    };
  } catch (e) {
    console.warn("[marketAdminBridge] licenses:", e.message || e);
    return {
      licenses: [],
      product_line: "market",
      bridge_error: e.message || "MARKET serveri nuk përgjigjet",
    };
  }
}

async function getMarketOverview() {
  try {
    const data = await marketRequest("/dashboard/overview");
    if (data && (data.active_clients != null || data.licenses_total != null)) {
      return {
        active_clients: data.active_clients ?? 0,
        licenses_active: data.licenses_active ?? data.licenses_total ?? 0,
        licenses_total: data.licenses_total ?? 0,
        trial_accounts: data.trial_accounts ?? 0,
        sales_today_total: data.sales_today_total ?? 0,
        problems_count: data.problems_count ?? (data.problem_clients || []).length,
        problem_clients: data.problem_clients || [],
        weekly_sales: data.weekly_sales || [],
        product_line: "market",
        bridge_error: data.bridge_error || "",
      };
    }
    const grouped = await getMarketClientsGrouped();
    const licView = await getMarketLicensesView();
    const active = (grouped.sectors || []).reduce((n, s) => n + (s.clients || []).length, 0);
    const licActive = (licView.licenses || []).filter((l) =>
      ["aktive", "active", "aktiv"].includes(String(l.statusi || "").toLowerCase()),
    ).length;
    return {
      active_clients: active,
      licenses_active: licActive,
      licenses_total: (licView.licenses || []).length,
      trial_accounts: 0,
      sales_today_total: 0,
      problems_count: 0,
      problem_clients: [],
      weekly_sales: [],
      product_line: "market",
      bridge_error: grouped.bridge_error || licView.bridge_error || "",
    };
  } catch (e) {
    return {
      active_clients: 0,
      licenses_active: 0,
      licenses_total: 0,
      trial_accounts: 0,
      sales_today_total: 0,
      problems_count: 0,
      problem_clients: [],
      weekly_sales: [],
      product_line: "market",
      bridge_error: e.message || "MARKET serveri nuk përgjigjet",
    };
  }
}

async function getMarketClientDetail(id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit MARKET.");
  const data = await marketRequest(`/dashboard/clients/${encodeURIComponent(cid)}`);
  return {
    client: data.client || null,
    licenses: data.licenses || [],
    owners: data.owners || [],
    product_line: "market",
  };
}

async function registerMarketClient(body = {}) {
  const tipi = normalizeClientTipi(body.tipi || "minimarket");
  const payload = {
    ...(body || {}),
    product_line: "market",
    tipi,
    issue_license: body.issue_license !== false && body.issue_license !== "false",
  };
  const result = await marketRequest("/dashboard/clients", {
    method: "POST",
    body: payload,
  });
  return {
    client: result.client || null,
    license: result.license || null,
    license_key: result.license?.celesi || result.license?.license_key || result.celesi || body.celesi || "",
    hardware_id: result.hardware_id || body.hardware_id || body.hardwareId || null,
    product_line: "market",
    already_exists: !!result.already_exists,
  };
}

async function updateMarketClient(id, body = {}) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit MARKET.");
  const payload = { ...(body || {}), product_line: "market" };
  const result = await marketRequest(`/dashboard/clients/${encodeURIComponent(cid)}`, {
    method: "PATCH",
    body: payload,
  });
  return {
    client: result.client || null,
    licenses: result.licenses || [],
    license_errors: result.license_errors || [],
    product_line: "market",
  };
}

async function deleteMarketClient(id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit MARKET.");
  return marketRequest(`/dashboard/clients/${encodeURIComponent(cid)}`, { method: "DELETE" });
}

async function deleteMarketLicense(id) {
  const lid = String(id || "").trim();
  if (!lid) throw new Error("Mungon ID e licencës MARKET.");
  return marketRequest(`/dashboard/licenses/${encodeURIComponent(lid)}`, { method: "DELETE" });
}

module.exports = {
  MARKET_SECTOR_DEFS,
  getMarketClientsGrouped,
  getMarketLicensesView,
  getMarketOverview,
  getMarketClientDetail,
  registerMarketClient,
  updateMarketClient,
  deleteMarketClient,
  deleteMarketLicense,
};
