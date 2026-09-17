const nodemailer = require("nodemailer");
const dns = require("dns");

// Prefer IPv4 resolution in environments (like Render or cloud containers) where IPv6 is not routed
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

let transporter = null;

function getResendApiKey() {
  return String(process.env.RESEND_API_KEY || "").trim();
}

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

  const port = Number(process.env.EMAIL_SMTP_PORT || 587);
  const secure = process.env.EMAIL_SMTP_SECURE !== undefined
    ? String(process.env.EMAIL_SMTP_SECURE).toLowerCase() === "true"
    : port === 465;

  // Auto-detect Render Free tier blocking standard ports 25, 465, 587 when using Brevo SMTP.
  // Port 2525 is supported by Brevo and is unblocked on Render.
  let targetPort = port;
  const host = String(process.env.EMAIL_SMTP_HOST || "smtp.gmail.com").trim();
  if (
    (targetPort === 587 || targetPort === 25 || targetPort === 465) &&
    host.includes("brevo.com") &&
    (process.env.RENDER || !process.env.EMAIL_SMTP_PORT || process.env.EMAIL_SMTP_PORT === "587")
  ) {
    targetPort = 2525;
  }

  transporter = nodemailer.createTransport({
    host,
    port: targetPort,
    secure: targetPort === 465 ? true : secure,
    auth: {
      user: String(process.env.EMAIL_USER || "").trim(),
      pass: String(process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
    },
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  return transporter;
}

function getBrevoApiKey() {
  return String(process.env.BREVO_API_KEY || "").trim();
}

/**
 * Send an email via Brevo's HTTPS REST API (api.brevo.com/v3/smtp/email).
 * Uses standard port 443 HTTPS which is never blocked by cloud platforms like Render.
 * Requires a Brevo API key (starts with "xkeysib-").
 */
async function sendViaBrevo({ to, subject, html }) {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  const rawFrom = String(process.env.EMAIL_FROM || "PromptJump <bfree0792@gmail.com>").trim();
  let senderName = "PromptJump";
  let senderEmail = "bfree0792@gmail.com";

  const match = rawFrom.match(/^(?:([^<]+)<)?([^>]+)>?$/);
  if (match) {
    if (match[1]) senderName = match[1].trim();
    if (match[2]) senderEmail = match[2].trim();
  } else if (rawFrom) {
    senderEmail = rawFrom;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      responseData?.message ||
      responseData?.error ||
      `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Brevo API error: ${errorMsg}`);
  }

  return responseData;
}

/**
 * Send an email via Resend's HTTPS REST API.
 * Uses standard Node.js global fetch (port 443 HTTPS), which is NEVER blocked
 * by cloud providers like Render Free tier.
 */
async function sendViaResend({ to, subject, html }) {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const rawFrom = String(process.env.EMAIL_FROM || "").trim();
  // Resend requires a verified custom domain. If the configured EMAIL_FROM uses an unverified
  // public webmail domain (like @gmail.com, @yahoo.com, etc.), fall back to Resend's default onboarding sender.
  const isPublicWebmail = /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com)>/i.test(rawFrom) ||
    /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com)$/i.test(rawFrom);

  const from = (!rawFrom || isPublicWebmail)
    ? "PromptJump <onboarding@resend.dev>"
    : rawFrom;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      responseData?.message ||
      responseData?.error ||
      `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Resend API error: ${errorMsg}`);
  }

  return responseData;
}

/**
 * Verify the transporter credentials once at startup so SMTP auth errors
 * surface immediately instead of failing silently on the first reset attempt.
 */
async function verifyEmailConfig() {
  if (getBrevoApiKey()) {
    console.log("[email] BREVO_API_KEY detected. Using Brevo HTTPS API (Render Free tier compatible).");
    return true;
  }

  if (getResendApiKey()) {
    console.log("[email] RESEND_API_KEY detected. Using Resend HTTPS API (Render Free tier compatible).");
    return true;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "[email] Neither BREVO_API_KEY, RESEND_API_KEY nor EMAIL_USER/EMAIL_PASS is set. Password reset emails will not be sent."
    );
    return false;
  }

  try {
    await getTransporter().verify();
    console.log("[email] SMTP transporter verified successfully.");
    return true;
  } catch (error) {
    console.error("[email] SMTP verification failed:", error.message);
    if (error.code === "ENETUNREACH" || error.code === "ETIMEDOUT") {
      console.error(
        "[email] NOTICE: Render Free tier blocks outbound SMTP ports 25, 465, and 587.\n" +
        "[email] To send emails on Render Free tier, sign up for a free account at https://resend.com and set RESEND_API_KEY in your Render environment variables.\n" +
        "[email] Alternatively, upgrade your Render service to Starter (paid) to unblock SMTP ports."
      );
    } else {
      console.error(
        "[email] If using Gmail, EMAIL_PASS must be a 16-character App Password " +
          "(not your normal Gmail password). Generate one at " +
          "https://myaccount.google.com/apppasswords after enabling 2-Step Verification."
      );
    }
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

  if (getBrevoApiKey()) {
    try {
      await sendViaBrevo({
        to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      return;
    } catch (brevoErr) {
      console.warn(`[email] Brevo API delivery failed: ${brevoErr.message}`);
      if (getResendApiKey()) {
        try {
          await sendViaResend({ to, subject: mailOptions.subject, html: mailOptions.html });
          return;
        } catch (resendErr) {
          console.warn(`[email] Resend delivery also failed: ${resendErr.message}`);
        }
      }
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log(`[email] Falling back to SMTP for ${to}...`);
        await getTransporter().sendMail(mailOptions);
        return;
      }
      throw brevoErr;
    }
  }

  if (getResendApiKey()) {
    try {
      await sendViaResend({
        to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      return;
    } catch (resendErr) {
      console.warn(`[email] Resend delivery failed: ${resendErr.message}`);
      // If SMTP credentials exist, seamlessly fall back to SMTP
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log(`[email] Falling back to SMTP for ${to}...`);
        await getTransporter().sendMail(mailOptions);
        console.log(`[email] Email sent successfully via SMTP to ${to}`);
        return;
      }
      throw resendErr;
    }
  }

  await getTransporter().sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail, verifyEmailConfig };