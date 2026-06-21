const { getSupabase } = require("../db");
const { normalizeItems } = require("./salesService");
const { slugify, randomKitchenKey } = require("../lib/kitchen");

async function ensureClientKitchenFields(client) {
  if (!client) return null;
  if (client.kitchen_slug && client.kitchen_key) return client;

  const db = getSupabase();
  let slug = slugify(client.emri);
  const { data: taken } = await db.from("clients").select("id").eq("kitchen_slug", slug);
  if (taken?.length && taken[0].id !== client.id) {
    slug = `${slug}-${String(client.id).slice(0, 6)}`;
  }

  const patch = {
    kitchen_slug: client.kitchen_slug || slug,
    kitchen_key: client.kitchen_key || randomKitchenKey(),
  };

  const { data, error } = await db
    .from("clients")
    .update(patch)
    .eq("id", client.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getClientForKitchen(slug, key) {
  const s = String(slug || "").trim().toLowerCase();
  const k = String(key || "").trim();
  if (!s || !k) throw new Error("Mungon slug ose çelësi i kuzhinës.");

  const db = getSupabase();
  let { data, error } = await db.from("clients").select("*").eq("kitchen_slug", s).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Kuzhina nuk u gjet.");
  if (!data.kitchen_key || !data.kitchen_slug) {
    data = await ensureClientKitchenFields(data);
  }
  if (data.kitchen_key !== k) throw new Error("Çelësi i kuzhinës është i gabuar.");

  return data;
}

async function listKitchenOrders(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("sales_orders")
    .select(
      "id, table_number, waiter_name, items_json, total, ordered_at, created_at, local_order_id",
    )
    .eq("client_id", clientId)
    .eq("status", "ordered")
    .order("ordered_at", { ascending: true, nullsFirst: false })
    .limit(80);

  if (error) throw error;
  return (data || []).map(o => ({
    ...o,
    items_json: normalizeItems(o.items_json),
  }));
}

async function markKitchenOrderReady(clientId, orderId) {
  const db = getSupabase();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("sales_orders")
    .update({ status: "ready", ready_at: now })
    .eq("id", orderId)
    .eq("client_id", clientId)
    .eq("status", "ordered")
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Porosia nuk u gjet ose është përfunduar.");
  return data;
}

module.exports = {
  ensureClientKitchenFields,
  getClientForKitchen,
  listKitchenOrders,
  markKitchenOrderReady,
};
