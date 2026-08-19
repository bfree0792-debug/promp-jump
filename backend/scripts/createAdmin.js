const path = require("path");
const dns = require("dns");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/User");

dotenv.config({ path: path.join(__dirname, "../config/config.env"), quiet: true });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const [,, fullName, email, password] = process.argv;

async function createAdmin() {
  if (!fullName || !email || !password) {
    console.error("Usage: node scripts/createAdmin.js \"Full Name\" admin@email.com password123");
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is missing in backend/config/config.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    user.fullName = fullName;
    user.role = "admin";
    user.setPassword(password);
    await user.save();
    console.log(`Updated existing user as admin: ${normalizedEmail}`);
  } else {
    user = new User({
      fullName,
      email: normalizedEmail,
      role: "admin",
    });
    user.setPassword(password);
    await user.save();
    console.log(`Created admin user: ${normalizedEmail}`);
  }

  await mongoose.disconnect();
}

createAdmin().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
