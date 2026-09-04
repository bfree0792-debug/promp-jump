const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config/config.env"), override: true, quiet: true });

let rawUrl = (process.env.SUPABASE_URL || "").trim();
// Strip trailing /rest/v1 or trailing slashes if present
rawUrl = rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");

const supabaseUrl = rawUrl;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project-id")) {
  console.warn(
    "⚠️ Warning: Supabase credentials not set in backend/config/config.env. Please add SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key"
);

module.exports = { supabase };
