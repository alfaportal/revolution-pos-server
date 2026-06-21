const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");

async function listOwners() {
  const db = getSupabase();
  let { data, error } = await db
    .from("users")
    .select("id, emri, email, roli, aktiv, client_id, created_at, clients(id, emri, tipi)")
    .eq("roli", "client_admin")
    .order("created_at", { ascending: false });

  if (error?.code === "PGRST204" || (error?.message && /aktiv/i.test(error.message))) {
    ({ data, error } = await db
      .from("users")
      .select("id, emri, email, roli, client_id, created_at, clients(id, emri, tipi)")
      .eq("roli", "client_admin")
      .order("created_at", { ascending: false }));
    data = (data || []).map(u => ({ ...u, aktiv: true }));
  }

  if (error) throw error;
  return data;
}

async function createOwner({ client_id, emri, email, password }) {
  if (!client_id) throw new Error("Zgjidhni klientin (restorantin/kafenen).");
  if (!emri?.trim()) throw new Error("Emri i pronarit është i detyrueshëm.");
  if (!email?.trim()) throw new Error("Email është i detyrueshëm.");
  if (!password || password.length < 6) throw new Error("Fjalëkalimi min. 6 karaktere.");

  const db = getSupabase();
  const hash = await bcrypt.hash(password, 12);
  const row = {
    client_id,
    emri: emri.trim(),
    email: email.trim().toLowerCase(),
    passwordi: hash,
    roli: "client_admin",
    aktiv: true,
  };

  let { data, error } = await db
    .from("users")
    .insert(row)
    .select("id, emri, email, roli, aktiv, client_id, created_at, clients(id, emri, tipi)")
    .single();

  if (error?.code === "PGRST204" || (error?.message && /aktiv/i.test(error.message))) {
    const { aktiv, ...rowWithoutAktiv } = row;
    ({ data, error } = await db
      .from("users")
      .insert(rowWithoutAktiv)
      .select("id, emri, email, roli, client_id, created_at, clients(id, emri, tipi)")
      .single());
  }

  if (error) {
    if (error.code === "23505") throw new Error("Ky email ekziston tashmë.");
    throw error;
  }
  return data;
}

async function updateOwner(id, { emri, email, password, aktiv }) {
  const db = getSupabase();
  const patch = {};
  if (emri != null) {
    patch.emri = String(emri).trim();
    if (!patch.emri) throw new Error("Emri i pronarit është i detyrueshëm.");
  }
  if (email != null) {
    patch.email = String(email).trim().toLowerCase();
    if (!patch.email) throw new Error("Email është i detyrueshëm.");
  }
  if (password != null && String(password).trim()) {
    if (String(password).length < 6) throw new Error("Fjalëkalimi min. 6 karaktere.");
    patch.passwordi = await bcrypt.hash(String(password), 12);
  }
  if (typeof aktiv === "boolean") patch.aktiv = aktiv;

  if (!Object.keys(patch).length) throw new Error("Nuk ka fusha për përditësim.");

  let { data, error } = await db
    .from("users")
    .update(patch)
    .eq("id", id)
    .eq("roli", "client_admin")
    .select("id, emri, email, roli, aktiv, client_id, created_at, clients(id, emri, tipi)")
    .single();

  if (error?.code === "PGRST204" || (error?.message && /aktiv/i.test(error.message))) {
    const { aktiv: _a, ...patchWithoutAktiv } = patch;
    if (!Object.keys(patchWithoutAktiv).length && typeof aktiv !== "boolean") {
      throw new Error("Nuk ka fusha për përditësim.");
    }
    ({ data, error } = await db
      .from("users")
      .update(patchWithoutAktiv)
      .eq("id", id)
      .eq("roli", "client_admin")
      .select("id, emri, email, roli, client_id, created_at, clients(id, emri, tipi)")
      .single());
    if (data && typeof aktiv === "boolean") data.aktiv = aktiv;
  }

  if (error) {
    if (error.code === "23505") throw new Error("Ky email ekziston tashmë.");
    throw error;
  }
  if (!data) throw new Error("Pronari nuk u gjet.");
  return data;
}

async function deleteOwner(id) {
  const db = getSupabase();
  const { error } = await db.from("users").delete().eq("id", id).eq("roli", "client_admin");
  if (error) throw error;
  return { ok: true };
}

async function setOwnerActive(id, aktiv) {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .update({ aktiv: !!aktiv })
    .eq("id", id)
    .eq("roli", "client_admin")
    .select("id, emri, email, aktiv, client_id")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Pronari nuk u gjet.");
  return data;
}

module.exports = {
  listOwners,
  createOwner,
  updateOwner,
  deleteOwner,
  setOwnerActive,
};
