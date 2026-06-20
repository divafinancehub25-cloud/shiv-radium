import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM ?? "DIVA Growth Capital <noreply@divagrowthcapital.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/diva-app/verify-email/${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verify your DIVA Growth Capital account",
    html: emailTemplate(
      "Verify Your Email",
      `Hello ${name},<br><br>Please verify your email address to activate your DIVA Growth Capital account.`,
      url,
      "Verify Email"
    ),
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/diva-app/reset-password/${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your DIVA Growth Capital password",
    html: emailTemplate(
      "Reset Your Password",
      `Hello ${name},<br><br>You requested a password reset. This link expires in 1 hour.`,
      url,
      "Reset Password"
    ),
  });
}

export async function sendKYCStatusEmail(
  email: string,
  name: string,
  status: "APPROVED" | "REJECTED",
  notes?: string
) {
  const approved = status === "APPROVED";
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `KYC Verification ${approved ? "Approved" : "Requires Attention"}`,
    html: emailTemplate(
      approved ? "KYC Approved!" : "KYC Review Update",
      approved
        ? `Hello ${name},<br><br>Congratulations! Your identity verification has been approved. You now have full access to DIVA Growth Capital.`
        : `Hello ${name},<br><br>Your KYC submission requires attention. ${notes ? `<br><br>Reason: ${notes}` : ""}<br><br>Please re-submit your documents.`,
      `${APP_URL}/diva-app/kyc`,
      approved ? "Go to Dashboard" : "Re-submit KYC"
    ),
  });
}

export async function sendWithdrawalStatusEmail(
  email: string,
  name: string,
  status: "APPROVED" | "REJECTED",
  amount: string,
  notes?: string
) {
  const approved = status === "APPROVED";
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Withdrawal ${approved ? "Approved" : "Rejected"} — DIVA Growth Capital`,
    html: emailTemplate(
      approved ? "Withdrawal Approved" : "Withdrawal Rejected",
      approved
        ? `Hello ${name},<br><br>Your withdrawal request of <strong>${amount} USDT</strong> has been approved and settled. Funds are being sent to your wallet.`
        : `Hello ${name},<br><br>Your withdrawal request of <strong>${amount} USDT</strong> was rejected and the locked funds have been released back to your available balance.${notes ? `<br><br>Reason: ${notes}` : ""}`,
      `${APP_URL}/diva-app/withdraw/history`,
      "View History"
    ),
  });
}

function emailTemplate(title: string, body: string, ctaUrl: string, ctaText: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid rgba(212,175,55,0.2);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:32px;background:linear-gradient(135deg,#111111,#1a1a0e);border-bottom:1px solid rgba(212,175,55,0.2);">
            <h1 style="margin:0;font-size:24px;background:linear-gradient(135deg,#D4AF37,#F5D76E);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
              DIVA Growth Capital
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="color:#D4AF37;margin:0 0 16px;">${title}</h2>
            <p style="color:#aaaaaa;line-height:1.6;">${body}</p>
            <div style="margin:32px 0;text-align:center;">
              <a href="${ctaUrl}" style="background:linear-gradient(135deg,#D4AF37,#B8962E);color:#000000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:14px;">
                ${ctaText}
              </a>
            </div>
            <p style="color:#555;font-size:12px;">If you didn't request this, please ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:#444;font-size:11px;margin:0;">© ${new Date().getFullYear()} DIVA Growth Capital. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
