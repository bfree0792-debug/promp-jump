/**
 * Email diagnostic script.
 *
 * Usage:
 *   node scripts/testEmail.js                # just verify SMTP auth
 *   node scripts/testEmail.js you@email.com  # verify auth AND send a test email
 *
 * This loads the same config.env the server uses, so if this fails with
 * "Invalid login", the password in backend/config/config.env is wrong.
 */
const path = require("path");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config({ path: path.join(__dirname, "../config/config.env"), quiet: true });

function looksLikeAppPassword(pass) {
  // Gmail App Passwords are 16 lowercase letters (no spaces, no special chars)
  return typeof pass === "string" && /^[a-z]{16}$/.test(pass);
}

async function main() {
  const to = process.argv[2];
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log("=== Email Diagnostics ===");
  console.log("EMAIL_USER:", user || "NOT SET");
  console.log("EMAIL_PASS :", pass ? (looksLikeAppPassword(pass) ? pass + " (looks like a valid App Password)" : `${pass}  *** NOT a valid App Password (must be 16 lowercase letters)`) : "NOT SET");
  console.log("");

  if (!user || !pass) {
    console.error("ERROR: EMAIL_USER / EMAIL_PASS is missing in backend/config/config.env");
    process.exit(1);
  }

  if (!looksLikeAppPassword(pass)) {
    console.error("ERROR: EMAIL_PASS is NOT a Gmail App Password.");
    console.error("  Generate one at https://myaccount.google.com/apppasswords");
    console.error("  (First enable 2-Step Verification at https://myaccount.google.com/security)");
    console.error("  Then copy the 16-character password into backend/config/config.env");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  console.log("Verifying SMTP credentials...");

  try {
    await transporter.verify();
    console.log("SMTP AUTH: SUCCESS ✓");
  } catch (error) {
    console.error("SMTP AUTH: FAILED ✗");
    console.error("  Message:", error.message);
    process.exit(1);
  }

  if (to) {
    console.log(`Sending a test email to ${to}...`);
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || user,
        to,
        subject: "PromptJump test email",
        text: "If you can read this, email sending works!",
      });
      console.log("TEST EMAIL SENT: SUCCESS ✓");
      console.log("  Message ID:", info.messageId);
    } catch (error) {
      console.error("TEST EMAIL SENT: FAILED ✗");
      console.error("  Message:", error.message);
      process.exit(1);
    }
  } else {
    console.log("");
    console.log("To also send a test email, run:");
    console.log("  node scripts/testEmail.js your@email.com");
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});