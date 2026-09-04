const { supabase } = require("../lib/supabase");

const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("users").select("count", { count: "exact", head: true });
    if (error && error.code !== "PGRST116" && !error.message.includes("relation")) {
      console.error("Supabase connection error:", error.message);
      return false;
    }
    console.log("Connected to Supabase successfully");
    return true;
  } catch (err) {
    console.error("Supabase connection failed:", err.message);
    return false;
  }
};

module.exports = testConnection;

