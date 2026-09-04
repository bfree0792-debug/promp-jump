const path = require("path");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config({ path: path.join(__dirname, "../config/config.env"), quiet: true });

const [,, fullName, email, password] = process.argv;

async function createAdmin() {
  if (!fullName || !email || !password) {
    console.error("Usage: node scripts/createAdmin.js \"Full Name\" admin@email.com password123");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    user.fullName = fullName;
    user.role = "admin";
    user.setPassword(password);
    await user.save();
    console.log(`Updated existing user as admin in Supabase: ${normalizedEmail}`);
  } else {
    user = new User({
      fullName,
      email: normalizedEmail,
      username: normalizedEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      role: "admin",
    });
    user.setPassword(password);
    await user.save();
    console.log(`Created admin user in Supabase: ${normalizedEmail}`);
  }
}

createAdmin().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

