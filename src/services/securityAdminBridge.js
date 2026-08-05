/**
 * Bridge Master Admin → SecureTrack Super Admin API
 * (klientë/licenca Security në Supabase të veçantë).
 *
 * Auth: Master Admin tashmë është i autentikuar me JWT (super_admin) te /api/super/*.
 * Bridge-i server→server përdor të njëjtin secret të përbashkët me SecureTrack
 * (jo secret të veçantë / të ndryshëm nga paneli).
 */
const {
  normalizeProductLine,
} = require("../utils/productLine");

/** I njëjti default si SecureTrack server/routes/admin.js */
const SHARED_MASTER_ADMIN_SECRET = "naser-security-2026";

function securityUpstream() {
  return String(
    process.env.SECURITY_UPSTREAM_URL
      || process.env.SECURITY_CLOUD_URL
      || "https://revolution-security-production.up.railway.app",
  )
    .trim()
    .replace(/\/$/, "");
}

/**
 * Secret i përbashkët Master Admin ↔ SecureTrack.
 * Mos përdor SUPER_ADMIN_SECRET të POS (shpesh bosh ose i ndryshëm) — shkakton 401.
 */
function securityAdminSecret() {
  return String(
    process.env.SECURITY_ADMIN_SECRET
      || process.env.MASTER_ADMIN_BRIDGE_SECRET
      || process.env.SECURITY_SUPER_ADMIN_SECRET
      || SHARED_MASTER_ADMIN_SECRET,
  ).trim();
}

async function securityAdminFetch(path, { method = "GET", body } = {}) {
  const secret = securityAdminSecret();
  const url = `${securityUpstream()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret,
      "x-master-admin-bridge": "1",
      "x-revolution-master-admin": "1",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = data.gabim || `Security Admin HTTP ${res.status}`;
    const err = new Error(
      /unauthorized|secret/i.test(raw)
        ? "Security bridge: secret i panjohur. Vendos SECURITY_ADMIN_SECRET të njëjtë në POS dhe SecureTrack (default i përbashkët: naser-security-2026)."
        : raw,
    );
    err.status = res.status;
    err.code = data.code || "SECURITY_BRIDGE";
    throw err;
  }
  return data;
}

function mapSecurityClient(c) {
  return {
    id: c.id,
    emri: c.emri,
    tipi: "tjeter",
    tipi_label: c.veprimtari || "Security",
    package_tier: null,
    package_label: "Security",
    package_contents: "",
    status: "aktiv",
    sales_today: 0,
    email: c.email || "",
    telefoni: c.telefon || c.telefoni || "",
    icon: "🛡️",
    sector_num: 1,
    sector_id: "security",
    product_line: "security",
    veprimtari: c.veprimtari || "",
    source: "securetrack",
  };
}

async function getSecurityClientsGrouped() {
  try {
    const data = await securityAdminFetch("/api/admin/clients");
    const clients = (data.clients || []).map(mapSecurityClient);
    return {
      sectors: [
        {
          num: 1,
          id: "security",
          label: "Klientë Security",
          tipet: ["security"],
          keywords: ["security", "sekurim", "siguri"],
          clients,
          count: clients.length,
        },
      ],
      groups: undefined,
      total: clients.length,
      product_line: "security",
      source: "securetrack",
    };
  } catch (e) {
    return {
      sectors: [
        {
          num: 1,
          id: "security",
          label: "Klientë Security",
          tipet: ["security"],
          keywords: ["security"],
          clients: [],
          count: 0,
        },
      ],
      total: 0,
      product_line: "security",
      source: "securetrack",
      bridge_error: e.message,
    };
  }
}

async function getSecurityLicensesView() {
  try {
    const data = await securityAdminFetch("/api/admin/licenses");
    const licenses = (data.licenses || []).map((l) => ({
      id: l.id,
      client_id: l.client_id || l.clients?.id,
      client_name: l.clients?.emri || "—",
      device_id: l.hardware_id || "",
      hardware_id: l.hardware_id || "",
      license_key: l.license_key || l.celesi || "",
      statusi: l.status === "active" ? "aktive"
        : l.status === "revoked" ? "revokuar"
          : l.status === "suspended" ? "pezulluar"
            : l.status || "—",
      activated_at: l.created_at,
      last_seen_at: null,
      product_line: "security",
      source: "securetrack",
      raw_status: l.status,
    }));
    return { licenses, product_line: "security", source: "securetrack" };
  } catch (e) {
    return { licenses: [], product_line: "security", bridge_error: e.message };
  }
}

async function getSecurityOverview() {
  const [clientsWrap, licWrap] = await Promise.all([
    getSecurityClientsGrouped(),
    getSecurityLicensesView(),
  ]);
  const licenses = licWrap.licenses || [];
  const activeLic = licenses.filter((l) => l.statusi === "aktive").length;
  const trial = 0;
  return {
    active_clients: clientsWrap.total || 0,
    clients_total: clientsWrap.total || 0,
    licenses_total: licenses.length,
    licenses_active: activeLic,
    trial_accounts: trial,
    sales_today_total: 0,
    problem_clients: [],
    weekly_sales: [],
    product_line: "security",
    source: "securetrack",
    bridge_error: clientsWrap.bridge_error || licWrap.bridge_error || null,
  };
}

async function createSecurityClient(body) {
  return securityAdminFetch("/api/admin/clients", {
    method: "POST",
    body: {
      emri: body.emri || body.name,
      email: body.email,
      telefon: body.telefon || body.telefoni,
      adresa: body.adresa,
      veprimtari: body.veprimtari || body.tipi || "kompani_sigurie",
    },
  });
}

async function updateSecurityClient(id, body) {
  return securityAdminFetch(`/api/admin/clients/${id}`, {
    method: "PATCH",
    body: {
      emri: body.emri || body.name,
      email: body.email,
      telefon: body.telefon || body.telefoni,
      adresa: body.adresa,
      veprimtari: body.veprimtari || body.tipi,
    },
  });
}

async function issueSecurityLicense(body) {
  return securityAdminFetch("/api/admin/licenses", {
    method: "POST",
    body: {
      client_id: body.client_id,
      max_terminals: body.max_terminals || 1,
      expires_at: body.expires_at || null,
      license_key: body.license_key || body.celesi,
      app_type: "sekurim",
      status: "active",
    },
  });
}

async function setSecurityLicenseStatus(id, statusi) {
  const map = {
    aktive: "active",
    revokuar: "revoked",
    pezulluar: "suspended",
    skaduar: "expired",
    active: "active",
    revoked: "revoked",
    suspended: "suspended",
  };
  const status = map[String(statusi || "").toLowerCase()] || statusi;
  return securityAdminFetch(`/api/admin/licenses/${id}/status`, {
    method: "POST",
    body: { status },
  });
}

module.exports = {
  normalizeProductLine,
  securityUpstream,
  getSecurityClientsGrouped,
  getSecurityLicensesView,
  getSecurityOverview,
  createSecurityClient,
  updateSecurityClient,
  issueSecurityLicense,
  setSecurityLicenseStatus,
};
