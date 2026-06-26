const { getSupabase } = require("../db");
const { buildMenuCategories } = require("./menuCatalogService");
const { validateImageDataUrl } = require("../lib/imageDataUrl");

const MAX_MENU_PHOTO_BYTES = 512_000;
const MAX_MENU_PHOTO_CHARS = 700_000;

function validateMenuPhotoInput(photo) {
  return validateImageDataUrl(photo, {
    maxBytes: MAX_MENU_PHOTO_BYTES,
    maxChars: MAX_MENU_PHOTO_CHARS,
    label: "Fotoja e artikullit",
  });
}

function mapOwnerMenuItem(row) {
  return {
    id: row.id,
    local_id: row.local_id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    active: row.active !== false,
    has_photo: Boolean(String(row.photo || "").trim()),
  };
}

async function touchMenuSync(clientId) {
  const db = getSupabase();
  const now = new Date().toISOString();
  const { data: existing } = await db
    .from("pos_settings")
    .select("client_id")
    .eq("client_id", clientId)
    .maybeSingle();
  if (existing) {
    await db.from("pos_settings").update({ synced_at: now }).eq("client_id", clientId);
  } else {
    await db.from("pos_settings").insert({
      client_id: clientId,
      table_count: 10,
      receipt_width_mm: 80,
      synced_at: now,
    });
  }
  return now;
}

async function ensureCategory(clientId, categoryName) {
  const name = String(categoryName || "").trim();
  if (!name) throw new Error("Zgjidhni kategorinë.");
  const db = getSupabase();
  const { data: existing } = await db
    .from("pos_categories")
    .select("id")
    .eq("client_id", clientId)
    .eq("name", name)
    .maybeSingle();
  if (existing) return name;

  const { data: last } = await db
    .from("pos_categories")
    .select("sort_order")
    .eq("client_id", clientId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (Number(last?.sort_order) || 0) + 1;
  const { error } = await db.from("pos_categories").insert({
    client_id: clientId,
    name,
    sort_order: sortOrder,
  });
  if (error) throw error;
  return name;
}

async function nextLocalId(clientId) {
  const db = getSupabase();
  const { data } = await db
    .from("pos_menu_items")
    .select("local_id")
    .eq("client_id", clientId)
    .order("local_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (Number(data?.local_id) || 0) + 1;
}

async function listOwnerMenu(clientId) {
  const db = getSupabase();
  const [{ data: items }, { data: categories }, { data: settings }] = await Promise.all([
    db
      .from("pos_menu_items")
      .select("id, local_id, name, category, price, active, photo")
      .eq("client_id", clientId)
      .order("category")
      .order("name"),
    db
      .from("pos_categories")
      .select("name, sort_order")
      .eq("client_id", clientId)
      .order("sort_order"),
    db.from("pos_settings").select("synced_at").eq("client_id", clientId).maybeSingle(),
  ]);

  const catNames = buildMenuCategories(
    (categories || []).map(c => ({ name: c.name })),
    items || [],
  );

  return {
    items: (items || []).map(mapOwnerMenuItem),
    categories: catNames,
    synced_at: settings?.synced_at || null,
  };
}

async function addMenuItem(clientId, body) {
  const name = String(body.name || "").trim();
  if (!name) throw new Error("Shkruani emrin e artikullit.");
  const category = await ensureCategory(clientId, body.category);
  const price = Math.max(0, Number(body.price) || 0);
  const localId = await nextLocalId(clientId);
  const db = getSupabase();

  const row = {
    client_id: clientId,
    local_id: localId,
    name,
    category,
    price,
    active: true,
  };
  if (Object.prototype.hasOwnProperty.call(body, "photo") && body.photo) {
    row.photo = validateMenuPhotoInput(body.photo);
  }

  const { data, error } = await db
    .from("pos_menu_items")
    .insert(row)
    .select("id, local_id, name, category, price, active, photo")
    .single();
  if (error) throw error;

  const synced_at = await touchMenuSync(clientId);
  return {
    item: mapOwnerMenuItem(data),
    synced_at,
  };
}

async function getKitchenMenuItemPhoto(clientId, localId) {
  const db = getSupabase();
  const idNum = Number(localId);
  if (!idNum) return null;
  const { data, error } = await db
    .from("pos_menu_items")
    .select("photo")
    .eq("client_id", clientId)
    .eq("local_id", idNum)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data?.photo) return null;
  const { imageBufferFromDataUrl, imageMimeFromDataUrl } = require("../lib/imageDataUrl");
  const buffer = imageBufferFromDataUrl(data.photo, MAX_MENU_PHOTO_BYTES);
  const mime = imageMimeFromDataUrl(data.photo, MAX_MENU_PHOTO_BYTES);
  if (!buffer || !mime) return null;
  return { buffer, mime };
}

async function getOwnerMenuItemPhoto(clientId, itemId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_menu_items")
    .select("photo")
    .eq("id", itemId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.photo) return null;
  const { imageBufferFromDataUrl, imageMimeFromDataUrl } = require("../lib/imageDataUrl");
  const buffer = imageBufferFromDataUrl(data.photo, MAX_MENU_PHOTO_BYTES);
  const mime = imageMimeFromDataUrl(data.photo, MAX_MENU_PHOTO_BYTES);
  if (!buffer || !mime) return null;
  return { buffer, mime };
}

async function updateMenuItem(clientId, itemId, body) {
  const db = getSupabase();
  const { data: existing, error: findErr } = await db
    .from("pos_menu_items")
    .select("id")
    .eq("id", itemId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!existing) throw new Error("Artikulli nuk u gjet.");

  const patch = {};
  if (body.name != null) {
    const name = String(body.name).trim();
    if (!name) throw new Error("Emri nuk mund të jetë bosh.");
    patch.name = name;
  }
  if (body.category != null) {
    patch.category = await ensureCategory(clientId, body.category);
  }
  if (body.price != null) {
    patch.price = Math.max(0, Number(body.price) || 0);
  }
  if (body.active != null) {
    patch.active = Boolean(body.active);
  }
  if (Object.prototype.hasOwnProperty.call(body, "photo")) {
    if (body.photo === null || body.photo === "") {
      patch.photo = "";
    } else {
      patch.photo = validateMenuPhotoInput(body.photo);
    }
  }
  if (!Object.keys(patch).length) throw new Error("Nuk ka fusha për përditësim.");

  const { data, error } = await db
    .from("pos_menu_items")
    .update(patch)
    .eq("id", itemId)
    .eq("client_id", clientId)
    .select("id, local_id, name, category, price, active, photo")
    .single();
  if (error) throw error;

  const synced_at = await touchMenuSync(clientId);
  return {
    item: mapOwnerMenuItem(data),
    synced_at,
  };
}

async function deleteMenuItem(clientId, itemId) {
  const db = getSupabase();
  const { error } = await db
    .from("pos_menu_items")
    .delete()
    .eq("id", itemId)
    .eq("client_id", clientId);
  if (error) throw error;
  const synced_at = await touchMenuSync(clientId);
  return { ok: true, synced_at };
}

module.exports = {
  listOwnerMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getOwnerMenuItemPhoto,
  getKitchenMenuItemPhoto,
  touchMenuSync,
};
