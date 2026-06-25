const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");
const { touchMenuSync } = require("./menuService");

const PIN_RE = /^\d{4}$/;

function assertPin(pin) {
  const p = String(pin || "").trim();
  if (!PIN_RE.test(p)) throw new Error("PIN duhet të jetë 4 shifra.");
  return p;
}

async function hashPin(pin) {
  return bcrypt.hash(assertPin(pin), 10);
}

async function pinMatches(pin, hash) {
  if (!hash) return false;
  try {
    return bcrypt.compare(assertPin(pin), hash);
  } catch {
    return false;
  }
}

async function loadPinWaiters(clientId, { activeOnly = false } = {}) {
  const db = getSupabase();
  let q = db
    .from("pos_staff")
    .select("id, name, role, active, pin_hash, sort_order")
    .eq("client_id", clientId)
    .eq("role", "waiter")
    .not("pin_hash", "is", null);
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q.order("sort_order").order("name");
  if (error) throw error;
  return data || [];
}

async function assertPinUnique(clientId, pin, excludeId = null) {
  const waiters = await loadPinWaiters(clientId);
  for (const w of waiters) {
    if (excludeId && w.id === excludeId) continue;
    if (await pinMatches(pin, w.pin_hash)) {
      throw new Error("Ky PIN përdoret tashmë nga një kamarier tjetër.");
    }
  }
}

function mapWaiterPublic(row) {
  return {
    id: row.id,
    name: row.name,
    active: row.active !== false,
    has_pin: Boolean(row.pin_hash),
  };
}

async function listWaitersForOwner(clientId) {
  const rows = await loadPinWaiters(clientId);
  return rows.map(mapWaiterPublic);
}

async function verifyWaiterPin(clientId, pin) {
  const normalized = assertPin(pin);
  const waiters = await loadPinWaiters(clientId, { activeOnly: true });
  if (!waiters.length) {
    throw new Error("Nuk ka kamarierë me PIN. Pronari i shton te Kamarierët.");
  }
  for (const w of waiters) {
    if (await pinMatches(normalized, w.pin_hash)) {
      return { id: w.id, name: w.name };
    }
  }
  throw new Error("PIN i gabuar.");
}

async function getWaiterById(clientId, waiterId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_staff")
    .select("id, name, role, active, pin_hash")
    .eq("client_id", clientId)
    .eq("id", waiterId)
    .eq("role", "waiter")
    .maybeSingle();
  if (error) throw error;
  if (!data?.id || !data.pin_hash) return null;
  if (data.active === false) return null;
  return { id: data.id, name: data.name };
}

async function resolveWaiterForOrder(clientId, waiterId, waiterName) {
  const id = String(waiterId || "").trim();
  const name = String(waiterName || "").trim();
  if (!id) throw new Error("Mungon ID e kamarierit.");
  if (!name) throw new Error("Mungon emri i kamarierit.");
  const waiter = await getWaiterById(clientId, id);
  if (!waiter) throw new Error("Kamarieri nuk u gjet ose është joaktiv.");
  if (waiter.name.toLowerCase() !== name.toLowerCase()) {
    throw new Error("Të dhënat e kamarierit nuk përputhen.");
  }
  return waiter;
}

async function addWaiterWithPin(clientId, body) {
  const name = String(body.name || "").trim();
  if (!name) throw new Error("Shkruani emrin e kamarierit.");
  const pin = assertPin(body.pin);
  await assertPinUnique(clientId, pin);

  const db = getSupabase();
  const { data: last } = await db
    .from("pos_staff")
    .select("sort_order")
    .eq("client_id", clientId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pin_hash = await hashPin(pin);
  const { data, error } = await db
    .from("pos_staff")
    .insert({
      client_id: clientId,
      name,
      role: "waiter",
      source: "owner",
      pin_hash,
      sort_order: (Number(last?.sort_order) || 0) + 1,
      active: true,
    })
    .select("id, name, active, pin_hash")
    .single();
  if (error) {
    if (String(error.message || "").includes("unique")) {
      throw new Error("Ky emër ekziston tashmë.");
    }
    throw error;
  }

  const synced_at = await touchMenuSync(clientId);
  return { waiter: mapWaiterPublic(data), synced_at };
}

async function updateWaiterWithPin(clientId, waiterId, body) {
  const db = getSupabase();
  const { data: existing, error: findErr } = await db
    .from("pos_staff")
    .select("id, pin_hash")
    .eq("id", waiterId)
    .eq("client_id", clientId)
    .eq("role", "waiter")
    .maybeSingle();
  if (findErr) throw findErr;
  if (!existing) throw new Error("Kamarieri nuk u gjet.");

  const patch = {};
  if (body.name != null) {
    const name = String(body.name).trim();
    if (!name) throw new Error("Emri nuk mund të jetë bosh.");
    patch.name = name;
  }
  if (body.active != null) patch.active = Boolean(body.active);
  if (body.pin != null) {
    const pin = assertPin(body.pin);
    await assertPinUnique(clientId, pin, waiterId);
    patch.pin_hash = await hashPin(pin);
  }
  if (!Object.keys(patch).length) throw new Error("Nuk ka fusha për përditësim.");

  const { data, error } = await db
    .from("pos_staff")
    .update(patch)
    .eq("id", waiterId)
    .eq("client_id", clientId)
    .select("id, name, active, pin_hash")
    .single();
  if (error) throw error;

  const synced_at = await touchMenuSync(clientId);
  return { waiter: mapWaiterPublic(data), synced_at };
}

async function deleteWaiterWithPin(clientId, waiterId) {
  const db = getSupabase();
  const { error } = await db
    .from("pos_staff")
    .delete()
    .eq("id", waiterId)
    .eq("client_id", clientId)
    .eq("role", "waiter");
  if (error) throw error;
  const synced_at = await touchMenuSync(clientId);
  return { ok: true, synced_at };
}

module.exports = {
  listWaitersForOwner,
  verifyWaiterPin,
  resolveWaiterForOrder,
  addWaiterWithPin,
  updateWaiterWithPin,
  deleteWaiterWithPin,
};
