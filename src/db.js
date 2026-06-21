const { createClient } = require("@supabase/supabase-js");

let supabase = null;

function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Mungojnë SUPABASE_URL ose SUPABASE_SERVICE_ROLE_KEY");
  }

  supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabase;
}

module.exports = { getSupabase };
