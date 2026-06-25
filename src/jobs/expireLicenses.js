const { getSupabase } = require("../db");
const { todayISO } = require("../lib/licenseDates");

async function expireLicensesDaily() {
  const db = getSupabase();
  const today = todayISO();
  const nowIso = new Date().toISOString();

  const { data, error } = await db
    .from("licenses")
    .update({ statusi: "skaduar", updated_at: nowIso })
    .eq("statusi", "aktive")
    .lt("data_skadimit", today)
    .select("id");

  if (error) throw error;

  const expiredIds = (data || []).map(r => r.id);
  if (expiredIds.length) {
    console.log(`[cron] ${expiredIds.length} licenca u shënuan skaduar (data_skadimit < ${today})`);
  }
  return { expired: expiredIds.length };
}

function startLicenseExpiryCron() {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const run = () => {
    expireLicensesDaily().catch(err => {
      console.error("[cron] expireLicensesDaily:", err.message || err);
    });
  };
  run();
  setInterval(run, DAY_MS);
}

module.exports = {
  expireLicensesDaily,
  startLicenseExpiryCron,
};
