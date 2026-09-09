const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "config.env"), override: true });

const app = require("./app");
const { seedDefaults } = require("../lib/seedDefaults");
const { verifyEmailConfig } = require("../utils/email");

const port = Number(process.env.PORT || 4000);

// Start the Express server directly and seed initial data if empty
app.listen(port, async () => {
  console.log(`Backend running at http://localhost:${port}`);
  try {
    await verifyEmailConfig();
  } catch (err) {
    console.warn("Email configuration check notice:", err.message);
  }
  try {
    await seedDefaults();
  } catch (err) {
    console.warn("Seed defaults check notice:", err.message);
  }
});
