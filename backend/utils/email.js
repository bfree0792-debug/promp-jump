const nodemailer = require("nodemailer");

let transporter = null;

/**
 * Lazily create the transporter the first time it's needed.
 *
 * The transporter MUST be created lazily (not at module load) because
 * backend/config/server.js requires ./app (which loads this module) BEFORE
 * dotenv has populated the environment variables. If we read
 * process.env.EMAIL_USER / EMAIL_PASS at require-time they are undefined,
 * which causes "Missing credentials for PLAIN" at send time.
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    auth: {
      user: String(process.env.EMAIL_USER || "").trim(),
      pass: String(process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  return transporter;
}

/**
 * Verify the transporter credentials once at startup so SMTP auth errors
 * surface immediately instead of failing silently on the first reset attempt.
 */
async function verifyEmailConfig() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "[email] EMAIL_USER / EMAIL_PASS not set. Password reset emails will not be sent."
    );
    return false;
  }

  try {
    await getTransporter().verify();
    console.log("[email] SMTP transporter verified successfully.");
    return true;
  } catch (error) {
    console.error("[email] SMTP verification failed:", error.message);
    console.error(
      "[email] If using Gmail, EMAIL_PASS must be a 16-character App Password " +
        "(not your normal Gmail password). Generate one at " +
        "https://myaccount.google.com/apppasswords after enabling 2-Step Verification."
    );
    return false;
  }
}

/**
 * Send a password reset email to the user
 * @param {string} to - Recipient email address
 * @param {string} resetLink - The password reset link
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail(to, resetLink) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Reset Your Password - PromptJump",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">PromptJump</h2>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="color: #333; margin-top: 0;">Reset Your Password</h3>
          <p style="color: #555; line-height: 1.6;">Hello,</p>
          <p style="color: #555; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
            This link will expire in <strong>1 hour</strong>.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4F46E5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #555; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #4F46E5; word-break: break-all; font-size: 14px;">${resetLink}</p>
          <p style="color: #888; font-size: 13px; line-height: 1.6; margin-top: 30px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} PromptJump. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await getTransporter().sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail, verifyEmailConfig };