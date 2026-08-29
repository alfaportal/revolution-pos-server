/**
 * Slug i pastër për URL: a-z, 0-9, vizë — pa hex random.
 */
const KITCHEN_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_KITCHEN_SLUG_LEN = 3;
const MAX_KITCHEN_SLUG_LEN = 48;

function slugifyFromEmri(emri) {
  const base = String(emri || "lokal")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_KITCHEN_SLUG_LEN);
  if (base.length >= MIN_KITCHEN_SLUG_LEN) return base;
  return "lokal";
}

function normalizeKitchenSlugInput(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_KITCHEN_SLUG_LEN);
}

function validateKitchenSlug(raw) {
  const slug = normalizeKitchenSlugInput(raw);
  if (slug.length < MIN_KITCHEN_SLUG_LEN || slug.length > MAX_KITCHEN_SLUG_LEN) {
    throw new Error(`Slug duhet ${MIN_KITCHEN_SLUG_LEN}–${MAX_KITCHEN_SLUG_LEN} karaktere.`);
  }
  if (!KITCHEN_SLUG_RE.test(slug)) {
    throw new Error("Slug lejon vetëm shkronja a-z, numra 0-9 dhe vizë (-).");
  }
  return slug;
}

async function isKitchenSlugTaken(db, slug, excludeClientId) {
  if (!db || !slug) return false;
  const { data, error } = await db
    .from("clients")
    .select("id")
    .eq("kitchen_slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  if (excludeClientId && String(data.id) === String(excludeClientId)) return false;
  return true;
}

async function resolveUniqueKitchenSlug(db, { emri, preferred, excludeClientId } = {}) {
  let base;
  if (preferred) {
    base = validateKitchenSlug(preferred);
  } else {
    base = slugifyFromEmri(emri);
    if (base.length < MIN_KITCHEN_SLUG_LEN) base = "lokal";
    if (!KITCHEN_SLUG_RE.test(base)) base = "lokal";
  }

  if (!(await isKitchenSlugTaken(db, base, excludeClientId))) return base;

  for (let n = 2; n <= 99; n += 1) {
    const candidate = `${base}-${n}`.slice(0, MAX_KITCHEN_SLUG_LEN);
    if (!(await isKitchenSlugTaken(db, candidate, excludeClientId))) return candidate;
  }

  throw new Error("Nuk u gjet slug i lirë. Provoni emër tjetër.");
}

/** Gjenerim sync (fallback) — pa DB; prefer resolveUniqueKitchenSlug */
function generateKitchenSlug(emri) {
  return slugifyFromEmri(emri);
}

async function updateClientKitchenSlug(db, clientId, rawSlug) {
  const slug = validateKitchenSlug(rawSlug);
  const id = String(clientId || "").trim();
  if (!id) throw new Error("Mungon client_id");

  const { data: current, error: currentErr } = await db
    .from("clients")
    .select("id, kitchen_slug")
    .eq("id", id)
    .maybeSingle();
  if (currentErr) throw currentErr;
  if (!current) throw new Error("Klienti nuk u gjet.");
  if (current.kitchen_slug === slug) return current;

  if (await isKitchenSlugTaken(db, slug, id)) {
    throw new Error("Ky slug është i zënë. Zgjidhni një tjetër.");
  }

  const { data, error } = await db
    .from("clients")
    .update({ kitchen_slug: slug })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ky slug është i zënë. Zgjidhni një tjetër.");
    }
    throw error;
  }

  return data;
}

module.exports = {
  KITCHEN_SLUG_RE,
  MIN_KITCHEN_SLUG_LEN,
  MAX_KITCHEN_SLUG_LEN,
  slugifyFromEmri,
  normalizeKitchenSlugInput,
  validateKitchenSlug,
  isKitchenSlugTaken,
  resolveUniqueKitchenSlug,
  generateKitchenSlug,
  updateClientKitchenSlug,
  // alias për publicPageService
  validateOwnerSlug: validateKitchenSlug,
};
