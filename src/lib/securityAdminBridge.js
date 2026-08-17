/**
 * Bridge te serveri i Revolution Security (projekt i ndarë).
 * POS admin panel lexon/shkruan firmat Security përmes këtij moduli —
 * zero përzierje me Supabase të restorantit.
 */
const https = require("https");

const SECURITY_UPSTREAM =
  process.env.SECURITY_UPSTREAM || "revolution-security-production.up.railway.app";
const SECURITY_ADMIN_SECRET =
  process.env.SECURITY_ADMIN_SECRET ||
  process.env.SUPER_ADMIN_SECRET ||
  process.env.ADMIN_SECRET ||
  "naser-security-2026";

const SECURITY_SECTORS = [
  { num: 1, id: "kompani_sigurie", label: "Kompani sigurie (rojë, patrulla)", keywords: ["siguri", "roje"] },
  {
    num: 2,
    id: "transport_logjistike",
    label: "Kompani transporti (shoferë, autobusë, kamionë)",
    keywords: ["transport"],
  },
  { num: 3, id: "ndertimtari", label: "Kompani ndërtimi (punëtorë kantieri)", keywords: ["ndertim"] },
  { num: 4, id: "pastrim", label: "Kompani pastrimi (pastrues, sanitizim)", keywords: ["pastrim"] },
  {
    num: 5,
    id: "kuriere_dergesa",
    label: "Posta / shërbime dërgese (postierë, korrierë)",
    keywords: ["poste", "dergese"],
  },
  {
    num: 6,
    id: "mirembajtje_nderte",
    label: "Kompani mirëmbajtje (teknikanë, instalues)",
    keywords: ["mirembajtje"],
  },
  { num: 7, id: "magazinim", label: "Kompani magazinimi (depo, punëtorë magazine)", keywords: ["magazin"] },
  {
    num: 8,
    id: "agjenci_marketingu",
    label: "Agjenci marketingu në terren (promotorë)",
    keywords: ["marketing"],
  },
];

function sectorForVeprimtari(id) {
  return SECURITY_SECTORS.find((s) => s.id === id) || SECURITY_SECTORS[0];
}

function securityRequest(path, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: SECURITY_UPSTREAM,
        port: 443,
        path: `/security/api/admin${path}`,
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": SECURITY_ADMIN_SECRET,
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
            const err = new Error(parsed.gabim || parsed.message || `Security upstream ${res.statusCode}`);
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

function emptySecuritySectors(bridgeError) {
  const sectors = SECURITY_SECTORS.map((s) => ({
    num: s.num,
    id: s.id,
    label: s.label,
    keywords: s.keywords || [],
    clients: [],
    count: 0,
  }));
  return {
    sectors,
    groups: sectors,
    total: 0,
    product_line: "security",
    ...(bridgeError ? { bridge_error: bridgeError } : {}),
  };
}

async function getSecurityClientsGrouped() {
  try {
    const data = await securityRequest("/clients");
    const clients = Array.isArray(data.clients) ? data.clients : Array.isArray(data) ? data : [];
    const sectors = SECURITY_SECTORS.map((s) => ({
      num: s.num,
      id: s.id,
      label: s.label,
      keywords: s.keywords || [],
      clients: [],
      count: 0,
    }));
    const byId = new Map(sectors.map((s) => [s.id, s]));

    for (const c of clients) {
      const sector = sectorForVeprimtari(c.veprimtari || "kompani_sigurie");
      const bucket = byId.get(sector.id) || sectors[0];
      bucket.clients.push({
        id: c.id,
        emri: c.emri,
        tipi: sector.id,
        tipi_label: sector.label,
        email: c.email || "",
        telefoni: c.telefon || c.telefoni || "",
        status: "aktiv",
        sales_today: 0,
        icon: "🛡️",
        sector_num: bucket.num,
        sector_id: bucket.id,
        product_line: "security",
      });
      bucket.count = bucket.clients.length;
    }

    return {
      sectors,
      groups: sectors,
      total: clients.length,
      product_line: "security",
    };
  } catch (e) {
    console.warn("[securityAdminBridge] clients:", e.message || e);
    return emptySecuritySectors(e.message || "Security serveri nuk përgjigjet");
  }
}

async function getSecurityLicensesView() {
  try {
    const data = await securityRequest("/licenses");
    const licenses = Array.isArray(data.licenses) ? data.licenses : Array.isArray(data) ? data : [];
    return {
      licenses: licenses.map((l) => ({
        id: l.id,
        client_id: l.client_id,
        client_name: l.clients?.emri || l.client_name || "—",
        device_id: l.device_id || "",
        hardware_id: l.hardware_id || "",
        license_key: l.license_key || l.celesi || "",
        statusi: l.status || l.statusi || "aktive",
        activated_at: l.created_at || l.activated_at || null,
        last_seen_at: l.last_seen_at || null,
        product_line: "security",
      })),
      product_line: "security",
    };
  } catch (e) {
    console.warn("[securityAdminBridge] licenses:", e.message || e);
    return {
      licenses: [],
      product_line: "security",
      bridge_error: e.message || "Security serveri nuk përgjigjet",
    };
  }
}

async function getSecurityOverview() {
  try {
    const grouped = await getSecurityClientsGrouped();
    const licView = await getSecurityLicensesView();
    const active = (grouped.sectors || []).reduce(
      (n, s) => n + (s.clients || []).filter((c) => c.status === "aktiv").length,
      0,
    );
    const licActive = (licView.licenses || []).filter((l) =>
      ["aktive", "active", "aktiv"].includes(String(l.statusi || "").toLowerCase()),
    ).length;
    return {
      active_clients: active,
      licenses_active: licActive,
      licenses_total: (licView.licenses || []).length,
      trial_accounts: 0,
      problems_count: 0,
      product_line: "security",
      bridge_error: grouped.bridge_error || licView.bridge_error || "",
    };
  } catch (e) {
    return {
      active_clients: 0,
      licenses_active: 0,
      licenses_total: 0,
      trial_accounts: 0,
      problems_count: 0,
      product_line: "security",
      bridge_error: e.message || "Security serveri nuk përgjigjet",
    };
  }
}

async function registerSecurityClient(body = {}) {
  const hw = String(body.hardware_id || body.hardwareId || "").trim();
  if (!hw) {
    const err = new Error("ID e pajisjes (16 shenja) është e detyrueshme për Security.");
    err.status = 400;
    throw err;
  }
  const result = await securityRequest("/clients/register-license", {
    method: "POST",
    body: {
      emri: body.emri,
      email: body.email,
      telefon: body.telefoni || body.telefon,
      adresa: body.adresa,
      veprimtari: body.veprimtari || body.tipi || "kompani_sigurie",
      hardware_id: hw,
      license_key: body.celesi || body.license_key || undefined,
    },
  });
  return {
    client: result.client || null,
    license: result.license || null,
    license_key: result.license_key || result.license?.license_key || body.celesi || "",
    hardware_id: hw,
    product_line: "security",
    already_exists: !!result.already_exists,
  };
}

module.exports = {
  SECURITY_SECTORS,
  getSecurityClientsGrouped,
  getSecurityLicensesView,
  getSecurityOverview,
  registerSecurityClient,
};
