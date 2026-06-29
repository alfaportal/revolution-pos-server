/** Fallback kur migrimi 021 (accepted_by_*) nuk është ekzekutuar ende në Supabase. */

function isMissingAcceptanceColumnError(error) {
  return /accepted_by|accepted_at/i.test(String(error?.message || error || ""));
}

function normalizeAcceptanceFields(row = {}) {
  return {
    ...row,
    accepted_by_waiter_id: row.accepted_by_waiter_id ?? null,
    accepted_by_waiter_name: String(row.accepted_by_waiter_name || "").trim(),
    accepted_at: row.accepted_at ?? null,
  };
}

/**
 * Ekzekuton query me select të plotë; nëse kolonat accepted_by mungojnë, provon pa to.
 * buildQuery(withAcceptance) → supabase query builder (para .then / await).
 */
async function selectWithAcceptanceFallback(buildQuery) {
  let result = await buildQuery(true);
  if (result.error && isMissingAcceptanceColumnError(result.error)) {
    result = await buildQuery(false);
  }
  if (result.error) throw result.error;
  return (result.data || []).map(normalizeAcceptanceFields);
}

module.exports = {
  isMissingAcceptanceColumnError,
  normalizeAcceptanceFields,
  selectWithAcceptanceFallback,
};
