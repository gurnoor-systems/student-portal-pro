import { Resend } from "resend";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Student Portal <onboarding@resend.dev>";

/**
 * Dispatch Password Reset Recovery Email via Resend
 */
export async function sendPasswordResetEmailViaResend(
  toEmail: string,
  resetCode: string,
  studentName: string = "Student"
): Promise<{ success: boolean; delivered: boolean; error?: string }> {
  const resend = getResendClient();

  // If no Resend API key configured, graceful fallback
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY not configured. Simulated recovery code:", resetCode);
    return { success: true, delivered: false };
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070b10; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 520px; margin: 0 auto; background: #0f1622; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .logo-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(28, 105, 212, 0.15); border: 1px solid rgba(28, 105, 212, 0.4); color: #60a5fa; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; border-radius: 8px; margin-bottom: 20px; }
    h1 { font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0; letter-spacing: -0.5px; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px 0; }
    .code-box { background: #070b10; border: 1px solid rgba(28, 105, 212, 0.5); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .code-title { font-size: 10px; font-family: monospace; text-transform: uppercase; color: #60a5fa; letter-spacing: 1.5px; margin-bottom: 8px; font-weight: 700; }
    .pin-display { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace; }
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

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `Your Student Portal Recovery PIN: ${resetCode}`,
      html: htmlContent
    });

    if (error) {
      console.error("Resend delivery error:", error);
      return { success: true, delivered: false, error: error.message };
    }

    console.log("✅ Resend password reset email dispatched successfully to:", toEmail, "ID:", data?.id);
    return { success: true, delivered: true };
  } catch (err: any) {
    console.error("Resend API exception:", err);
    return { success: true, delivered: false, error: err.message };
  }
}
