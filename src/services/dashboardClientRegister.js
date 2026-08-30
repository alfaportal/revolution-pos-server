/**
 * Regjistrim i plotë klienti nga Master Admin form (1 API thirrje).
 * clients + licenses + users (pronari).
 */
const { getPublicAppOrigin } = require("../lib/publicOrigin");
const { buildRoleUrl, urlTipiSegment } = require("../lib/productUrls");
const { normalizeProductLine, appTypeForProductLine } = require("../utils/productLine");
const { normalizeClientTipi } = require("../utils/businessTipi");
const { createClient, createLicense, deleteClient, deleteLicense } = require("./licenseService");
const { createOwner } = require("./userService");
const { sendOwnerWelcomeCredentialsEmail, isEmailConfigured } = require("./emailService");

function parseProgram(body) {
  const raw = String(
    body.program || body.product_line || body.industry_type || "pos",
  )
    .trim()
    .toLowerCase();
  const map = {
    pos: "kafene",
    kafene: "kafene",
    restaurant: "kafene",
    restorant: "kafene",
    hotel: "hotel",
    furra: "furra",
    market: "market",
    security: "security",
    kontabilisti: "kontabilisti",
    fiskale: "fiskale",
  };
  return map[raw] || normalizeProductLine(raw);
}

function parseDurationMonths(body) {
  const m = Number(body.muaj ?? body.duration_months ?? body.kohëzgjatja);
  if ([1, 3, 6, 12, 24].includes(m)) return m;
  const label = String(body.duration || body.kohëzgjatja || "12").trim();
  const map = { "1": 1, "3": 3, "6": 6, "12": 12, "24": 24 };
  return map[label] || 12;
}

function mapPackageTier(program, pkg) {
  const p = String(pkg || "").trim().toLowerCase();
  if (program === "kafene" || program === "furra") {
    const posMap = {
      pako_1: "pako_3",
      pako_2: "pako_4",
      pako_3: "pako_2",
      pako_4: "pako_5",
      pako_3: "pako_3",
      pako_4: "pako_4",
      pako_2: "pako_2",
      pako_5: "pako_5",
      standard: "pako_3",
      premium: "pako_5",
      pako: "pako_2",
      pako_ai: "pako_5",
      ai: "pako_5",
    };
    return posMap[p] || p || "pako_5";
  }
  if (program === "hotel" || program === "market") {
    if (p === "pako_ai" || p === "ai" || p === "premium" || p === "pako_5") return "pako_5";
    return "pako_2";
  }
  if (program === "security" || program === "kontabilisti") {
    return p === "premium" || p === "pako_4" || p === "pako_5" ? "pako_5" : "pako_3";
  }
  if (program === "fiskale") return "pako_3";
  return "pako_3";
}

function resolveTipi(program, body) {
  if (program === "security") {
    return String(body.veprimtari || body.tipi || "kompani_sigurie").trim();
  }
  if (program === "hotel") {
    return normalizeClientTipi(body.tipi || "hotel");
  }
  if (program === "market") {
    return normalizeClientTipi(body.tipi || "minimarket");
  }
  if (program === "furra") {
    const t = normalizeClientTipi(body.tipi || "furre_buke");
    return t === "pasticeri" ? "pasticeri" : "furre_buke";
  }
  if (program === "kontabilisti" || program === "fiskale") {
    return "tjeter";
  }
  return normalizeClientTipi(body.tipi || "kafene");
}

function buildFullAddress(adresa, qyteti) {
  const a = String(adresa || "").trim();
  const q = String(qyteti || "").trim();
  if (a && q) return `${a}, ${q}`;
  return a || q || "";
}

function ownerRoleForProgram(program) {
  return program === "security" ? "pronari" : "owner";
}

function buildOwnerLoginUrl(client, program) {
  const base = getPublicAppOrigin();
  const slug = client?.kitchen_slug || client?.id;
  if (!slug) return `${base}/owner/login`;
  const pseudo = { tipi: client.tipi, product_line: program === "security" ? "security" : "kafene" };
  const urlTipi = urlTipiSegment(pseudo);
  const role = ownerRoleForProgram(program);
  return buildRoleUrl(base, urlTipi, slug, role);
}

async function seedBusinessMeta(clientId, { nui, adresa, qyteti, telefoni, emri }) {
  if (!clientId) return;
  const { getSupabase } = require("../db");
  const db = getSupabase();
  const now = new Date().toISOString();
  const patch = {
    client_id: clientId,
    restaurant_name: emri || "",
    address: buildFullAddress(adresa, qyteti),
    phone: telefoni || "",
    synced_at: now,
  };
  if (nui) patch.nui = String(nui).trim();
  await db.from("pos_settings").upsert(patch);
}

async function registerViaBridge(program, body, licenseOpts) {
  const payload = {
    ...body,
    emri: body.emri,
    tipi: resolveTipi(program, body),
    telefoni: body.telefoni || body.telefon,
    email: body.email,
    adresa: buildFullAddress(body.adresa, body.qyteti),
    kitchen_slug: body.kitchen_slug || body.slug,
    slug: body.kitchen_slug || body.slug,
    package_tier: mapPackageTier(program, body.package_tier || body.package),
    issue_license: body.issue_license !== false,
    license_type: "annual",
    muaj: licenseOpts.muaj,
    celesi: licenseOpts.celesi || undefined,
    license_key: licenseOpts.celesi || undefined,
    hardware_id: licenseOpts.hardwareId || undefined,
    owner_emri: body.owner_emri,
    owner_email: body.owner_email,
    owner_password: body.owner_password,
  };

  if (program === "security") {
    const { registerSecurityClient } = require("../lib/securityAdminBridge");
    return registerSecurityClient(payload);
  }
  if (program === "hotel") {
    const { registerHotelClient } = require("../lib/hotelAdminBridge");
    return registerHotelClient(payload);
  }
  if (program === "market") {
    const { registerMarketClient } = require("../lib/marketAdminBridge");
    return registerMarketClient(payload);
  }
  return null;
}

function posDbProductLine(program) {
  if (program === "furra") return "furra";
  if (program === "kontabilisti") return "kontabilisti";
  if (program === "fiskale") return "fiskale";
  return "kafene";
}

async function registerPosFamilyClient(body, program, licenseOpts) {
  const tipi = resolveTipi(program, body);
  const dbProductLine = posDbProductLine(program);
  const client = await createClient({
    emri: body.emri,
    tipi,
    adresa: buildFullAddress(body.adresa, body.qyteti),
    telefoni: body.telefoni || body.telefon,
    email: body.email,
    kitchen_slug: body.kitchen_slug || body.slug,
    slug: body.kitchen_slug || body.slug,
    package_tier: mapPackageTier(program, body.package_tier || body.package),
    product_line: dbProductLine,
  });

  let license = null;
  if (body.issue_license !== false) {
    license = await createLicense({
      client_id: client.id,
      app_type: appTypeForProductLine("kafene", tipi),
      product_line: dbProductLine,
      license_type: "annual",
      muaj: licenseOpts.muaj,
      max_terminals: 1,
      celesi: licenseOpts.celesi || undefined,
      hardware_id: licenseOpts.hardwareId || undefined,
    });
  }

  await seedBusinessMeta(client.id, {
    nui: body.nui,
    adresa: body.adresa,
    qyteti: body.qyteti,
    telefoni: body.telefoni || body.telefon,
    emri: body.emri,
  }).catch(() => {});

  return { client, license, product_line: dbProductLine };
}

async function registerFullDashboardClient(body, baseUrl) {
  const program = parseProgram(body);
  const ownerEmri = String(body.owner_emri || body.emri || "").trim();
  const ownerEmail = String(body.owner_email || "").trim().toLowerCase();
  const ownerPassword = String(body.owner_password || "").trim();

  if (!String(body.emri || "").trim()) throw new Error("Emri i biznesit është i detyrueshëm.");
  if (!ownerEmail) throw new Error("Email i pronarit është i detyrueshëm.");
  if (!ownerPassword || ownerPassword.length < 6) {
    throw new Error("Fjalëkalimi i pronarit min. 6 karaktere.");
  }

  const muaj = parseDurationMonths(body);
  const {
    normalizeHardwareId,
    formatGrouped16,
    generateHardwareLicenseKey,
  } = require("../lib/hardwareLicense");

  let hardwareId = String(body.hardware_id || body.hardwareId || "").trim();
  let celesi = String(body.celesi || body.license_key || "").trim();
  const hwHex = normalizeHardwareId(hardwareId);
  if (hwHex.length === 16) {
    hardwareId = formatGrouped16(hwHex);
    if (!celesi) {
      const gen = generateHardwareLicenseKey(hwHex, { licenseType: "annual" });
      celesi = gen.licenseKey;
    }
  }

  const licenseOpts = { muaj, celesi, hardwareId: hwHex.length === 16 ? hardwareId : "" };

  let client = null;
  let license = null;
  let owner = null;
  let bridgeResult = null;

  try {
    if (program === "security" || program === "hotel" || program === "market") {
      bridgeResult = await registerViaBridge(program, body, licenseOpts);
      client = bridgeResult.client;
      license = bridgeResult.license || null;
      celesi = bridgeResult.license_key || bridgeResult.license?.celesi || celesi;
    } else {
      const posResult = await registerPosFamilyClient(body, program, licenseOpts);
      client = posResult.client;
      license = posResult.license;
      owner = await createOwner(
        {
          client_id: client.id,
          emri: ownerEmri,
          email: ownerEmail,
          password: ownerPassword,
        },
        baseUrl,
      );
      celesi = license?.celesi || celesi;
    }

    if (!client?.id) throw new Error("Klienti nuk u krijua.");

    const ownerUrl = buildOwnerLoginUrl(client, program);
    const expires = license?.data_skadimit || null;

    const result = {
      ok: true,
      client,
      license,
      owner,
      owner_url: ownerUrl,
      license_key: celesi || license?.celesi || "",
      celesi: celesi || license?.celesi || "",
      hardware_id: hardwareId || bridgeResult?.hardware_id || null,
      product_line: program,
      password_plain: ownerPassword,
      expires_at: expires,
      email_configured: isEmailConfigured(),
    };

    if (ownerEmail) {
      sendOwnerWelcomeCredentialsEmail({
        to: ownerEmail,
        ownerName: ownerEmri,
        clientName: client.emri,
        ownerUrl,
        password: ownerPassword,
        licenseKey: result.license_key,
        expiresAt: expires,
      }).catch((err) => {
        console.warn("[registerFullDashboardClient] welcome email:", err.message || err);
      });
    }

    return result;
  } catch (e) {
    if (license?.id) {
      try {
        await deleteLicense(license.id);
      } catch {
        /* ignore */
      }
    }
    if (client?.id && !bridgeResult) {
      try {
        await deleteClient(client.id);
      } catch {
        /* ignore */
      }
    }
    throw e;
  }
}

module.exports = {
  registerFullDashboardClient,
  buildOwnerLoginUrl,
  parseProgram,
  parseDurationMonths,
  mapPackageTier,
};
