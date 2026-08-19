/**
 * Bridge te serveri i Revolution HOTEL (projekt i ndarë).
 * POS Master Admin lexon/shkruan klientët HOTEL përmes këtij moduli —
 * zero përzierje me Supabase të restorantit.
 */
const https = require("https");
const { HOTEL_SECTORS, normalizeClientTipi, labelForTipi, sectorForTipi } = require("../utils/businessTipi");

const HOTEL_UPSTREAM =
  process.env.HOTEL_UPSTREAM || "revolution-hotel-server-production.up.railway.app";
const HOTEL_ADMIN_SECRET =
  process.env.HOTEL_ADMIN_SECRET ||
  process.env.SUPER_ADMIN_SECRET ||
  process.env.ADMIN_SECRET ||
  "naser-hotel-2026";

const HOTEL_SECTOR_DEFS = HOTEL_SECTORS.map((s) => ({
  num: s.num,
  id: s.id,
  label: s.label,
  keywords: s.keywords || [],
}));

function hotelRequest(path, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: HOTEL_UPSTREAM.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        port: 443,
        path: `/hotel/api/admin${path}`,
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": HOTEL_ADMIN_SECRET,
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
            const err = new Error(parsed.gabim || parsed.message || `Hotel upstream ${res.statusCode}`);
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

function emptyHotelSectors(bridgeError) {
  const sectors = HOTEL_SECTOR_DEFS.map((s) => ({
    ...s,
    clients: [],
    count: 0,
  }));
  return {
    sectors,
    groups: sectors,
    total: 0,
    product_line: "hotel",
    ...(bridgeError ? { bridge_error: bridgeError } : {}),
  };
}

function mapHotelClientRow(c) {
  const tipi = normalizeClientTipi(c.tipi || "hotel");
  const sector = sectorForTipi(tipi) || HOTEL_SECTOR_DEFS[0];
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
    icon: "🏨",
    sector_num: sector.num,
    sector_id: sector.id,
    product_line: "hotel",
  };
}

function groupClientsLocally(clients) {
  const sectors = HOTEL_SECTOR_DEFS.map((s) => ({
    ...s,
    clients: [],
    count: 0,
  }));
  const byId = new Map(sectors.map((s) => [s.id, s]));
  for (const c of clients) {
    const row = mapHotelClientRow(c);
    const bucket = byId.get(row.sector_id) || sectors[0];
    bucket.clients.push(row);
    bucket.count = bucket.clients.length;
  }
  return {
    sectors,
    groups: sectors,
    total: clients.length,
    product_line: "hotel",
  };
}

async function getHotelClientsGrouped() {
  try {
    const data = await hotelRequest("/dashboard/clients?product=hotel");
    if (Array.isArray(data.sectors) && data.sectors.length) {
      return {
        sectors: data.sectors,
        groups: data.groups || data.sectors,
        total: data.total ?? data.sectors.reduce((n, s) => n + (s.clients?.length || 0), 0),
        product_line: "hotel",
        bridge_error: data.bridge_error || "",
      };
    }
    const clients = Array.isArray(data.clients) ? data.clients : [];
    return groupClientsLocally(clients);
  } catch (e) {
    console.warn("[hotelAdminBridge] clients:", e.message || e);
    return emptyHotelSectors(e.message || "Hotel serveri nuk përgjigjet");
  }
}

async function getHotelLicensesView() {
  try {
    const data = await hotelRequest("/dashboard/licenses?product=hotel");
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
        product_line: "hotel",
      })),
      product_line: "hotel",
    };
  } catch (e) {
    console.warn("[hotelAdminBridge] licenses:", e.message || e);
    return {
      licenses: [],
      product_line: "hotel",
      bridge_error: e.message || "Hotel serveri nuk përgjigjet",
    };
  }
}

async function getHotelOverview() {
  try {
    const data = await hotelRequest("/dashboard/overview?product=hotel");
    if (data && (data.active_clients != null || data.licenses_total != null)) {
      return {
        active_clients: data.active_clients ?? 0,
        licenses_active: data.licenses_active ?? data.licenses_total ?? 0,
        licenses_total: data.licenses_total ?? 0,
        trial_accounts: data.trial_accounts ?? 0,
        problems_count: data.problems_count ?? (data.problem_clients || []).length,
        problem_clients: data.problem_clients || [],
        weekly_sales: data.weekly_sales || [],
        product_line: "hotel",
        bridge_error: data.bridge_error || "",
      };
    }
    const grouped = await getHotelClientsGrouped();
    const licView = await getHotelLicensesView();
    const active = (grouped.sectors || []).reduce((n, s) => n + (s.clients || []).length, 0);
    const licActive = (licView.licenses || []).filter((l) =>
      ["aktive", "active", "aktiv"].includes(String(l.statusi || "").toLowerCase()),
    ).length;
    return {
      active_clients: active,
      licenses_active: licActive,
      licenses_total: (licView.licenses || []).length,
      trial_accounts: 0,
      problems_count: 0,
      problem_clients: [],
      weekly_sales: [],
      product_line: "hotel",
      bridge_error: grouped.bridge_error || licView.bridge_error || "",
    };
  } catch (e) {
    return {
      active_clients: 0,
      licenses_active: 0,
      licenses_total: 0,
      trial_accounts: 0,
      problems_count: 0,
      problem_clients: [],
      weekly_sales: [],
      product_line: "hotel",
      bridge_error: e.message || "Hotel serveri nuk përgjigjet",
    };
  }
}

async function getHotelClientDetail(id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit HOTEL.");
  const data = await hotelRequest(`/dashboard/clients/${encodeURIComponent(cid)}?product=hotel`);
  return {
    client: data.client || null,
    licenses: data.licenses || [],
    owners: data.owners || [],
    product_line: "hotel",
  };
}

async function registerHotelClient(body = {}) {
  const tipi = normalizeClientTipi(body.tipi || "hotel");
  const payload = {
    ...(body || {}),
    product_line: "hotel",
    tipi,
    issue_license: body.issue_license !== false && body.issue_license !== "false",
  };
  const result = await hotelRequest("/dashboard/clients", {
    method: "POST",
    body: payload,
  });
  return {
    client: result.client || null,
    license: result.license || null,
    license_key: result.license?.celesi || result.license?.license_key || result.celesi || body.celesi || "",
    hardware_id: result.hardware_id || body.hardware_id || body.hardwareId || null,
    product_line: "hotel",
    already_exists: !!result.already_exists,
  };
}

async function updateHotelClient(id, body = {}) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit HOTEL.");
  const payload = { ...(body || {}), product_line: "hotel" };
  const result = await hotelRequest(`/dashboard/clients/${encodeURIComponent(cid)}`, {
    method: "PATCH",
    body: payload,
  });
  return {
    client: result.client || null,
    licenses: result.licenses || [],
    license_errors: result.license_errors || [],
    product_line: "hotel",
  };
}

async function deleteHotelClient(id) {
  const cid = String(id || "").trim();
  if (!cid) throw new Error("Mungon ID e klientit HOTEL.");
  return hotelRequest(`/dashboard/clients/${encodeURIComponent(cid)}?product=hotel`, { method: "DELETE" });
}

async function deleteHotelLicense(id) {
  const lid = String(id || "").trim();
  if (!lid) throw new Error("Mungon ID e licencës HOTEL.");
  return hotelRequest(`/dashboard/licenses/${encodeURIComponent(lid)}?product=hotel`, { method: "DELETE" });
}

async function revokeHotelLicense(id, { reason, hardware_id, hardwareId } = {}) {
  const lid = String(id || "").trim();
  if (!lid) throw new Error("Mungon ID e licencës HOTEL.");
  return hotelRequest(`/dashboard/licenses/${encodeURIComponent(lid)}/revoke`, {
    method: "POST",
    body: {
      reason: reason || "Revokuar nga Super Admin (POS bridge)",
      hardware_id: hardware_id || hardwareId || undefined,
    },
  });
}

module.exports = {
  HOTEL_SECTOR_DEFS,
  getHotelClientsGrouped,
  getHotelLicensesView,
  getHotelOverview,
  getHotelClientDetail,
  registerHotelClient,
  updateHotelClient,
  deleteHotelClient,
  deleteHotelLicense,
  revokeHotelLicense,
};
