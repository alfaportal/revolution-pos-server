const { getSupabase } = require("../db");
const { matchMenuItemForOrder } = require("./stockService");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_UNITS = new Set(["kg", "l", "copë"]);

function roundQty(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

function mapIngredient(row) {
  const quantity = roundQty(row.quantity);
  const min_quantity = roundQty(row.min_quantity);
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    name: String(row.name || "").trim(),
    unit: row.unit,
    quantity,
    min_quantity,
    cost_per_unit: roundQty(row.cost_per_unit),
    created_at: row.created_at,
    below_minimum: quantity < min_quantity,
  };
}

function validateUnit(unit) {
  const u = String(unit || "").trim();
  if (!VALID_UNITS.has(u)) {
    throw new Error("Njësia duhet të jetë kg, l ose copë.");
  }
  return u;
}

async function listIngredients(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("ingredients")
    .select("*")
    .eq("restaurant_id", clientId)
    .order("name");
  if (error) throw error;
  return (data || []).map(mapIngredient);
}

async function listInventoryAlerts(clientId) {
  const items = await listIngredients(clientId);
  return items.filter(i => i.below_minimum);
}

async function createIngredient(clientId, body) {
  const name = String(body?.name || "").trim();
  if (!name) throw new Error("Emri i përbërësit është i detyrueshëm.");
  if (name.length > 120) throw new Error("Emri është shumë i gjatë.");

  const unit = validateUnit(body?.unit || "copë");
  const quantity = roundQty(Math.max(0, Number(body?.quantity) || 0));
  const min_quantity = roundQty(Math.max(0, Number(body?.min_quantity) || 0));
  const cost_per_unit = roundQty(Math.max(0, Number(body?.cost_per_unit) || 0));

  const db = getSupabase();
  const { data, error } = await db
    .from("ingredients")
    .insert({
      restaurant_id: clientId,
      name,
      unit,
      quantity,
      min_quantity,
      cost_per_unit,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapIngredient(data);
}

async function updateIngredient(clientId, ingredientId, body) {
  const id = String(ingredientId || "").trim();
  if (!UUID_RE.test(id)) throw new Error("ID përbërësi nuk është i vlefshëm.");

  const db = getSupabase();
  const { data: existing, error: findErr } = await db
    .from("ingredients")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", clientId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!existing) throw new Error("Përbërësi nuk u gjet.");

  const patch = {};
  if (body?.name != null) {
    const name = String(body.name).trim();
    if (!name) throw new Error("Emri nuk mund të jetë bosh.");
    patch.name = name.slice(0, 120);
  }
  if (body?.unit != null) patch.unit = validateUnit(body.unit);
  if (body?.min_quantity != null) {
    patch.min_quantity = roundQty(Math.max(0, Number(body.min_quantity) || 0));
  }
  if (body?.cost_per_unit != null) {
    patch.cost_per_unit = roundQty(Math.max(0, Number(body.cost_per_unit) || 0));
  }
  if (body?.quantity != null) {
    patch.quantity = roundQty(Math.max(0, Number(body.quantity) || 0));
  }
  if (body?.add_quantity != null) {
    const add = roundQty(Number(body.add_quantity) || 0);
    if (add <= 0) throw new Error("Sasia e furnizimit duhet të jetë pozitive.");
    patch.quantity = roundQty(Math.max(0, Number(existing.quantity) + add));
  }

  if (!Object.keys(patch).length) throw new Error("Nuk ka fusha për përditësim.");

  const { data, error } = await db
    .from("ingredients")
    .update(patch)
    .eq("id", id)
    .eq("restaurant_id", clientId)
    .select("*")
    .single();
  if (error) throw error;
  return mapIngredient(data);
}

async function deductIngredientsForOrder(clientId, orderItems) {
  const items = Array.isArray(orderItems) ? orderItems : [];
  if (!items.length) return { deducted: [] };

  const db = getSupabase();
  const { data: menuRows, error: menuErr } = await db
    .from("pos_menu_items")
    .select("id, local_id, name, price")
    .eq("client_id", clientId);
  if (menuErr) throw menuErr;
  if (!menuRows?.length) return { deducted: [] };

  const menuIds = new Set();
  const orderLines = [];
  for (const orderItem of items) {
    const row = matchMenuItemForOrder(menuRows, orderItem);
    if (!row) continue;
    const qty = Math.max(1, Number(orderItem.quantity) || 1);
    menuIds.add(row.id);
    orderLines.push({ menu_item_id: row.id, menu_name: row.name, order_qty: qty });
  }
  if (!menuIds.size) return { deducted: [] };

  const { data: recipes, error: recipeErr } = await db
    .from("menu_ingredients")
    .select("menu_item_id, ingredient_id, quantity_used")
    .in("menu_item_id", [...menuIds]);
  if (recipeErr) throw recipeErr;
  if (!recipes?.length) return { deducted: [] };

  const recipeByMenu = new Map();
  for (const r of recipes) {
    if (!recipeByMenu.has(r.menu_item_id)) recipeByMenu.set(r.menu_item_id, []);
    recipeByMenu.get(r.menu_item_id).push(r);
  }

  const deductMap = new Map();
  for (const line of orderLines) {
    const rows = recipeByMenu.get(line.menu_item_id) || [];
    for (const r of rows) {
      const used = roundQty(Number(r.quantity_used) * line.order_qty);
      if (used <= 0) continue;
      deductMap.set(r.ingredient_id, roundQty((deductMap.get(r.ingredient_id) || 0) + used));
    }
  }
  if (!deductMap.size) return { deducted: [] };

  const ingredientIds = [...deductMap.keys()];
  const { data: ingredients, error: ingErr } = await db
    .from("ingredients")
    .select("id, name, quantity, unit")
    .eq("restaurant_id", clientId)
    .in("id", ingredientIds);
  if (ingErr) throw ingErr;

  const deducted = [];
  for (const ing of ingredients || []) {
    const deductQty = deductMap.get(ing.id) || 0;
    if (deductQty <= 0) continue;
    const prev = roundQty(ing.quantity);
    const next = roundQty(Math.max(0, prev - deductQty));
    const { error: updErr } = await db
      .from("ingredients")
      .update({ quantity: next })
      .eq("id", ing.id)
      .eq("restaurant_id", clientId);
    if (updErr) {
      console.warn("[inventory] update failed:", updErr.message);
      continue;
    }
    deducted.push({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      quantity: deductQty,
      remaining: next,
    });
  }

  return { deducted };
}

module.exports = {
  listIngredients,
  listInventoryAlerts,
  createIngredient,
  updateIngredient,
  deductIngredientsForOrder,
  mapIngredient,
};
