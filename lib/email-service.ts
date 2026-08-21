import nodemailer from "nodemailer";
import { Resend } from "resend";

/**
 * HTML Email Generator for Student Portal Security Notifications
 */
function generateResetHtml(studentName: string, toEmail: string, resetCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Student Portal Recovery PIN</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070b10; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 520px; margin: 0 auto; background: #0f1622; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .logo-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(28, 105, 212, 0.15); border: 1px solid rgba(28, 105, 212, 0.4); color: #60a5fa; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; border-radius: 8px; margin-bottom: 20px; }
    h1 { font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0; letter-spacing: -0.5px; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px 0; }
    .code-box { background: #070b10; border: 1px solid rgba(28, 105, 212, 0.5); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .code-title { font-size: 10px; font-family: monospace; text-transform: uppercase; color: #60a5fa; letter-spacing: 1.5px; margin-bottom: 8px; font-weight: 700; }
    .pin-display { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace; }
    .expiry { font-size: 11px; color: #64748b; margin-top: 8px; }
    .footer { font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; margin-top: 24px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-badge">STUDENT PORTAL PRO • SECURITY</div>
    <h1>Password Reset Request</h1>
    <p>Hello <strong>${studentName}</strong>,</p>
    <p>We received a request to reset the password for your student portal account attached to <strong>${toEmail}</strong>.</p>
    
    <div class="code-box">
      <div class="code-title">YOUR 6-DIGIT RECOVERY PIN</div>
      <div class="pin-display">${resetCode}</div>
      <div class="expiry">Expires in 15 minutes • Do not share this code with anyone</div>
    </div>

    <p>Enter this verification PIN in your Student Portal to set a new password. If you did not initiate this request, your account remains secure and you can safely disregard this message.</p>

    <div class="footer">
      Personal & Academic Management System • Multi-Tenant Secured
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatch Password Reset Recovery Email
 * Priority 1: Gmail SMTP via Nodemailer (Primary Inbox delivery to ANY student, 100% Free)
 * Priority 2: Resend API (Fallback if configured)
 * Priority 3: Graceful Server Simulation
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetCode: string,
  studentName: string = "Student"
): Promise<{ success: boolean; delivered: boolean; provider?: string; error?: string }> {
  const smtpEmail = process.env.SMTP_EMAIL || process.env.GMAIL_USER;
  const smtpPass = (process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

  const html = generateResetHtml(studentName, toEmail, resetCode);
  const text = `Your Student Portal Recovery PIN is: ${resetCode}\n\nThis PIN expires in 15 minutes. Enter it in your portal to reset your password.`;

  // 1. PRIMARY DISPATCH: Gmail SMTP via Nodemailer
  if (smtpEmail && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpEmail.trim(),
          pass: smtpPass.trim()
        }
      });

      const info = await transporter.sendMail({
        from: `"Student Portal Security" <${smtpEmail.trim()}>`,
        to: toEmail.trim(),
        subject: `Your Student Portal Recovery PIN: ${resetCode}`,
        text,
        html,
        headers: {
          "X-Priority": "1 (Highest)",
          "X-MSMail-Priority": "High",
          "Importance": "High"
        }
      });

      console.log("✅ Gmail SMTP email dispatched successfully to:", toEmail, "MessageID:", info.messageId);
      return { success: true, delivered: true, provider: "gmail-smtp" };
    } catch (smtpErr: any) {
      console.error("Gmail SMTP dispatch error:", smtpErr);
      // Fall through to Resend or fallback
    }
  }

  // 2. SECONDARY DISPATCH: Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "Student Portal <onboarding@resend.dev>";
      
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail.trim()],
        subject: `Your Student Portal Recovery PIN: ${resetCode}`,
        html
      });

      if (!error) {
        console.log("✅ Resend email dispatched successfully to:", toEmail, "ID:", data?.id);
        return { success: true, delivered: true, provider: "resend" };
      }
      console.warn("Resend email delivery notice:", error.message);
    } catch (resendErr: any) {
      console.error("Resend API error:", resendErr);
    }
  }

  // 3. GRACEFUL FALLBACK (Simulated Pin for Local Dev)
  console.warn("⚠️ No SMTP or Resend credentials configured. Simulated Recovery PIN:", resetCode);
  return { success: true, delivered: false, provider: "simulated" };
}

// Alias for backward compatibility
export const sendPasswordResetEmailViaResend = sendPasswordResetEmail;
