const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");

async function listOwners() {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("id, emri, email, roli, aktiv, client_id, created_at, clients(id, emri, tipi)")
    .eq("roli", "client_admin")
    .order("created_at", { ascending: false });
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
  const { data, error } = await db
    .from("users")
    .insert({
      client_id,
      emri: emri.trim(),
      email: email.trim().toLowerCase(),
      passwordi: hash,
      roli: "client_admin",
      aktiv: true,
    })
    .select("id, emri, email, roli, aktiv, client_id, created_at, clients(id, emri, tipi)")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Ky email ekziston tashmë.");
    throw error;
  }
  return data;
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
  setOwnerActive,
};
