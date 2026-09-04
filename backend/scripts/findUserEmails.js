const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/config.env"), quiet: true });
const { supabase } = require("../lib/supabase");

(async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .limit(10);

  if (error) throw error;
  console.log("USER_EMAILS:", JSON.stringify(data, null, 2));
  process.exit(0);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
