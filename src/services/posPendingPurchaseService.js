/**
 * Blerje nga telefon/owner AI → radhë për POS desktop.
 * POS i tërheq dhe i shkruan në purchase_invoices lokale (Stok + Blerjet + Kontabilisti).
 */
const { getSupabase } = require("../db");
const { findLicenseByKey, normalizeKey } = require("./licenseService");
const { assertLicenseUsable } = require("../lib/licenseEnforcement");

function roundQty(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

function normalizeItems(rawItems) {
  const list = Array.isArray(rawItems) ? rawItems : [];
  const out = [];
  for (const raw of list) {
    const name = String(raw?.name || raw?.emri || "").trim();
    const quantity = roundQty(Math.max(0, Number(raw?.quantity ?? raw?.sasia) || 0));
    const unit_price = roundQty(
      Math.max(0, Number(raw?.unit_price ?? raw?.price ?? raw?.cmimi) || 0),
    );
    const unit = String(raw?.unit || "copë").trim() || "copë";
    if (!name || quantity <= 0) continue;
    out.push({ name, quantity, unit, unit_price });
  }
  return out;
}

function mapPendingRow(row) {
  return {
    id: row.id,
    client_id: row.client_id,
    supplier: String(row.supplier || "").trim(),
    invoice_number: String(row.invoice_number || "").trim(),
    invoice_date: row.invoice_date || null,
    items: Array.isArray(row.items_json) ? row.items_json : [],
    source: row.source || "ai_invoice_scan",
    status: row.status,
    created_at: row.created_at,
  };
}

async function enqueuePendingPurchase(clientId, body = {}) {
  const items = normalizeItems(body.items);
  if (!items.length) throw new Error("Nuk ka artikuj për regjistrim te POS.");

  const supplier = String(body.supplier || "").trim() || "Furnizues AI";
  const invoice_number = String(body.invoice_number || "").trim();
  let invoice_date = body.invoice_date ? String(body.invoice_date).slice(0, 10) : null;
  if (invoice_date && !/^\d{4}-\d{2}-\d{2}$/.test(invoice_date)) invoice_date = null;

  const db = getSupabase();

  if (invoice_number) {
    const { data: dup } = await db
      .from("pos_pending_purchases")
      .select("id")
      .eq("client_id", clientId)
      .eq("status", "pending")
      .eq("invoice_number", invoice_number)
      .ilike("supplier", supplier)
      .maybeSingle();
    if (dup?.id) {
      return {
        id: dup.id,
        already_queued: true,
        supplier,
        invoice_number,
        invoice_date,
        item_count: items.length,
      };
    }
  }

  const { data, error } = await db
    .from("pos_pending_purchases")
    .insert({
      client_id: clientId,
      supplier,
      invoice_number: invoice_number || `AI-${Date.now()}`,
      invoice_date,
      items_json: items,
      source: String(body.source || "ai_invoice_scan").slice(0, 64),
      status: "pending",
    })
    .select("id, supplier, invoice_number, invoice_date, items_json, created_at")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    already_queued: false,
    supplier: data.supplier,
    invoice_number: data.invoice_number,
    invoice_date: data.invoice_date,
    item_count: Array.isArray(data.items_json) ? data.items_json.length : items.length,
    created_at: data.created_at,
  };
}

async function listPendingPurchasesForLicense(body = {}) {
  const celesi = normalizeKey(body.celesi || body.license_key);
  if (!celesi) throw new Error("Mungon çelësi i licencës.");
  const license = await findLicenseByKey(celesi);
  assertLicenseUsable(license);
  const clientId = license.client_id;
  if (!clientId) throw new Error("Licenca nuk është e lidhur me klient.");

  const db = getSupabase();
  const { data, error } = await db
    .from("pos_pending_purchases")
    .select(
      "id, client_id, supplier, invoice_number, invoice_date, items_json, source, status, created_at",
    )
    .eq("client_id", clientId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) throw error;
  return {
    client_id: clientId,
    purchases: (data || []).map(mapPendingRow),
  };
}

async function markPendingPurchaseApplied(body = {}) {
  const celesi = normalizeKey(body.celesi || body.license_key);
  if (!celesi) throw new Error("Mungon çelësi i licencës.");
  const license = await findLicenseByKey(celesi);
  assertLicenseUsable(license);
  const clientId = license.client_id;
  const id = String(body.id || body.purchase_id || "").trim();
  if (!id) throw new Error("Mungon ID e faturës në radhë.");

  const db = getSupabase();
  const note = String(body.applied_note || body.note || "").trim().slice(0, 300);
  const { data, error } = await db
    .from("pos_pending_purchases")
    .update({
      status: "applied",
      applied_at: new Date().toISOString(),
      applied_note: note,
    })
    .eq("id", id)
    .eq("client_id", clientId)
    .eq("status", "pending")
    .select("id, status")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Fatura në radhë nuk u gjet ose është aplikuar tashmë.");
  return { ok: true, id: data.id, status: data.status };
}

module.exports = {
  enqueuePendingPurchase,
  listPendingPurchasesForLicense,
  markPendingPurchaseApplied,
  normalizeItems,
};
