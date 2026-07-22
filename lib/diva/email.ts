import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Fail fast if SMTP is unreachable / misconfigured, so it never blocks an action.
  connectionTimeout: 6000,
  greetingTimeout: 5000,
  socketTimeout: 6000,
});

const FROM = process.env.EMAIL_FROM ?? "STICKO Growth Capital <noreply@sticko.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003";
const BRAND = "STICKO Growth Capital";

// ─── Core send helper ─────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[STICKO Email] SMTP not configured — skipping:", subject, "→", to);
    return;
  }
  // Never let a slow/broken SMTP block the caller: cap the whole attempt and
  // swallow any failure (email delivery is best-effort, not critical).
  try {
    await Promise.race([
      transporter.sendMail({ from: FROM, to, subject, html }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("email timeout")), 7000)),
    ]);
  } catch (err) {
    console.warn("[STICKO Email] send failed (ignored):", subject, "→", to, String(err));
  }
}

// ─── Base template ────────────────────────────────────────────────────────────

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${BRAND}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#111111 0%,#1a1708 100%);border:1px solid rgba(212,175,55,0.25);border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:3px;color:#D4AF37;text-transform:uppercase;font-weight:600;">STICKO</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#ffffff;">Growth Capital</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#111111;border-left:1px solid rgba(212,175,55,0.1);border-right:1px solid rgba(212,175,55,0.1);padding:36px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d0d0d;border:1px solid rgba(212,175,55,0.1);border-top:none;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
            <p style="margin:0 0 6px;color:#444;font-size:11px;">© ${new Date().getFullYear()} ${BRAND}. All rights reserved.</p>
            <p style="margin:0;color:#333;font-size:10px;">If you didn't perform this action, please ignore this email or contact support.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── CTA button ───────────────────────────────────────────────────────────────

function cta(url: string, label: string): string {
  return `<div style="margin:28px 0;text-align:center;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8962E);color:#000000;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.5px;">${label}</a>
  </div>`;
}

// ─── Section heading ──────────────────────────────────────────────────────────

function h(text: string, emoji = ""): string {
  return `<h2 style="margin:0 0 16px;font-size:22px;color:#D4AF37;font-weight:700;">${emoji ? emoji + " " : ""}${text}</h2>`;
}

// ─── Body text ────────────────────────────────────────────────────────────────

function p(text: string): string {
  return `<p style="margin:0 0 14px;color:#aaaaaa;font-size:14px;line-height:1.7;">${text}</p>`;
}

// ─── Stat box ─────────────────────────────────────────────────────────────────

function statBox(items: { label: string; value: string }[]): string {
  const cells = items.map(({ label, value }) => `
    <td style="padding:16px 20px;text-align:center;border-right:1px solid rgba(255,255,255,0.05);">
      <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#D4AF37;">${value}</p>
      <p style="margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;">${label}</p>
    </td>`).join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:10px;margin:24px 0;overflow:hidden;">
    <tr>${cells}</tr>
  </table>`;
}

// ─── Divider ─────────────────────────────────────────────────────────────────

const divider = `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;"/>`;

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Welcome email ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, name: string) {
  await send(
    email,
    `Welcome to ${BRAND}, ${name}! 🎉`,
    base(`
      ${h("Welcome to STICKO!", "🎉")}
      ${p(`Hi <strong style="color:#fff">${name}</strong>, welcome aboard! Your STICKO Growth Capital account has been created successfully.`)}
      ${p("You're now part of an exclusive community of forward-thinking investors. Here's what to do next:")}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        ${["✅ Complete your KYC verification", "💰 Make your first deposit", "📊 Explore your portfolio dashboard", "🔗 Share your referral link and earn rewards"].map((step, i) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;color:#aaa;font-size:13px;">${step}</p>
            </td>
          </tr>`).join("")}
      </table>
      ${cta(`${APP_URL}/diva-app/dashboard`, "Go to Dashboard")}
      ${divider}
      ${p(`<span style="color:#555;font-size:12px;">Need help? Reply to this email or visit our support section.</span>`)}
    `)
  );
}

// ─── 2. Email verification ────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/diva-app/verify-email/${token}`;
  await send(
    email,
    `Verify your ${BRAND} email address`,
    base(`
      ${h("Verify Your Email", "📧")}
      ${p(`Hi <strong style="color:#fff">${name}</strong>, please verify your email to activate your account. This link expires in <strong style="color:#D4AF37">24 hours</strong>.`)}
      ${cta(url, "Verify Email Address")}
      ${divider}
      ${p(`Or copy this link into your browser:<br/><span style="color:#D4AF37;font-size:12px;word-break:break-all;">${url}</span>`)}
    `)
  );
}

// ─── 3. Password reset ────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/diva-app/reset-password/${token}`;
  await send(
    email,
    `Reset your ${BRAND} password`,
    base(`
      ${h("Password Reset", "🔐")}
      ${p(`Hi <strong style="color:#fff">${name}</strong>, you requested a password reset. Click the button below — this link expires in <strong style="color:#D4AF37">1 hour</strong>.`)}
      ${cta(url, "Reset Password")}
      ${divider}
      ${p(`<strong style="color:#ff6b6b">Security notice:</strong> If you didn't request this, your password is safe. No action needed.`)}
    `)
  );
}

// ─── 4. KYC status ───────────────────────────────────────────────────────────

export async function sendKYCStatusEmail(
  email: string,
  name: string,
  status: "APPROVED" | "REJECTED",
  notes?: string
) {
  const approved = status === "APPROVED";
  await send(
    email,
    `KYC Verification ${approved ? "Approved ✅" : "Requires Attention"} — ${BRAND}`,
    base(
      approved
        ? `
          ${h("KYC Approved!", "🪪")}
          ${p(`Congratulations <strong style="color:#fff">${name}</strong>! Your identity verification has been <strong style="color:#22c55e">approved</strong>.`)}
          ${p("You now have full access to all STICKO Growth Capital features including deposits, withdrawals and portfolio management.")}
          ${cta(`${APP_URL}/diva-app/dashboard`, "Go to Dashboard")}
        `
        : `
          ${h("KYC Requires Attention", "⚠️")}
          ${p(`Hi <strong style="color:#fff">${name}</strong>, your KYC submission needs attention.`)}
          ${notes ? `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:16px;margin:16px 0;"><p style="margin:0;color:#fca5a5;font-size:13px;"><strong>Reason:</strong> ${notes}</p></div>` : ""}
          ${p("Please resubmit your documents with the correct information.")}
          ${cta(`${APP_URL}/diva-app/kyc`, "Resubmit KYC")}
        `
    )
  );
}

// ─── 5. Deposit status ────────────────────────────────────────────────────────

export async function sendDepositStatusEmail(
  email: string,
  name: string,
  status: "APPROVED" | "REJECTED",
  amount: string,
  notes?: string
) {
  const approved = status === "APPROVED";
  await send(
    email,
    `Deposit ${approved ? "Approved ✅" : "Rejected"} — ${BRAND}`,
    base(
      approved
        ? `
          ${h("Deposit Approved!", "💰")}
          ${p(`Great news <strong style="color:#fff">${name}</strong>! Your deposit has been approved.`)}
          ${statBox([{ label: "Amount", value: `$${amount} USDT` }, { label: "Status", value: "Approved" }])}
          ${p("Your funds have been credited to your portfolio balance.")}
          ${cta(`${APP_URL}/diva-app/portfolio`, "View Portfolio")}
        `
        : `
          ${h("Deposit Rejected", "❌")}
          ${p(`Hi <strong style="color:#fff">${name}</strong>, your deposit of <strong style="color:#D4AF37">$${amount} USDT</strong> was not approved.`)}
          ${notes ? `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:16px;margin:16px 0;"><p style="margin:0;color:#fca5a5;font-size:13px;"><strong>Reason:</strong> ${notes}</p></div>` : ""}
          ${p("Please contact support or try resubmitting with the correct details.")}
          ${cta(`${APP_URL}/diva-app/deposit`, "Try Again")}
        `
    )
  );
}

// ─── 6. Withdrawal status ─────────────────────────────────────────────────────

export async function sendWithdrawalStatusEmail(
  email: string,
  name: string,
  status: "APPROVED" | "REJECTED",
  amount: string,
  notes?: string
) {
  const approved = status === "APPROVED";
  await send(
    email,
    `Withdrawal ${approved ? "Processed ✅" : "Rejected"} — ${BRAND}`,
    base(
      approved
        ? `
          ${h("Withdrawal Processed!", "💸")}
          ${p(`Hi <strong style="color:#fff">${name}</strong>, your withdrawal has been approved and settled.`)}
          ${statBox([{ label: "Amount", value: `${amount} USDT` }, { label: "Status", value: "Completed" }])}
          ${p("Funds are being sent to your registered wallet address. Please allow network confirmation time.")}
          ${cta(`${APP_URL}/diva-app/withdraw/history`, "View History")}
        `
        : `
          ${h("Withdrawal Rejected", "❌")}
          ${p(`Hi <strong style="color:#fff">${name}</strong>, your withdrawal of <strong style="color:#D4AF37">${amount} USDT</strong> was rejected. The locked funds have been released back to your balance.`)}
          ${notes ? `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:16px;margin:16px 0;"><p style="margin:0;color:#fca5a5;font-size:13px;"><strong>Reason:</strong> ${notes}</p></div>` : ""}
          ${cta(`${APP_URL}/diva-app/withdraw`, "Try Again")}
        `
    )
  );
}

// ─── 7. Referral activated ────────────────────────────────────────────────────

export async function sendReferralActivatedEmail(
  email: string,
  name: string,
  referredName: string,
  rewardPoints: number
) {
  await send(
    email,
    `Your referral earned you ${rewardPoints} points! 🎉 — ${BRAND}`,
    base(`
      ${h("Referral Activated!", "🔗")}
      ${p(`Great news <strong style="color:#fff">${name}</strong>! Your referral <strong style="color:#D4AF37">${referredName}</strong> has completed verification and is now an active member.`)}
      ${statBox([{ label: "Reward", value: `+${rewardPoints} pts` }, { label: "Referred Member", value: referredName }])}
      ${p("Keep sharing your referral link to earn more rewards and climb the leaderboard!")}
      ${cta(`${APP_URL}/diva-app/referrals`, "View Referrals")}
    `)
  );
}

// ─── 8. Reward granted ────────────────────────────────────────────────────────

export async function sendRewardGrantedEmail(
  email: string,
  name: string,
  rewardTitle: string,
  rewardValue: number,
  rewardType: string
) {
  await send(
    email,
    `You earned a reward: ${rewardTitle} 🎁 — ${BRAND}`,
    base(`
      ${h("Reward Granted!", "🎁")}
      ${p(`Congratulations <strong style="color:#fff">${name}</strong>! You've earned a new reward.`)}
      ${statBox([{ label: "Reward", value: rewardTitle }, { label: rewardType === "POINTS" ? "Points" : "Value", value: String(rewardValue) }])}
      ${p("Your reward has been added to your account. Keep engaging to earn more!")}
      ${cta(`${APP_URL}/diva-app/achievements`, "View Rewards")}
    `)
  );
}

// ─── 9. Achievement unlocked ─────────────────────────────────────────────────

export async function sendAchievementEmail(
  email: string,
  name: string,
  achievementName: string,
  achievementEmoji: string,
  achievementDesc: string
) {
  await send(
    email,
    `Achievement Unlocked: ${achievementName} ${achievementEmoji} — ${BRAND}`,
    base(`
      ${h("Achievement Unlocked!", "🏆")}
      ${p(`You did it, <strong style="color:#fff">${name}</strong>!`)}
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background:rgba(212,175,55,0.08);border:2px solid rgba(212,175,55,0.3);border-radius:16px;padding:24px 32px;">
          <p style="margin:0;font-size:42px;">${achievementEmoji}</p>
          <p style="margin:8px 0 4px;font-size:18px;font-weight:700;color:#D4AF37;">${achievementName}</p>
          <p style="margin:0;font-size:12px;color:#666;">${achievementDesc}</p>
        </div>
      </div>
      ${cta(`${APP_URL}/diva-app/achievements`, "View All Achievements")}
    `)
  );
}

// ─── 10. Admin test email ─────────────────────────────────────────────────────

export async function sendTestEmail(email: string) {
  await send(
    email,
    `Test Email — ${BRAND} SMTP Check`,
    base(`
      ${h("SMTP Test Successful!", "✅")}
      ${p("This is a test email from STICKO Growth Capital to verify your SMTP configuration is working correctly.")}
      ${statBox([{ label: "Status", value: "Connected" }, { label: "Time", value: new Date().toLocaleTimeString() }])}
      ${p("Your email system is ready. All transactional emails will be delivered successfully.")}
    `)
  );
}

// ─── SMTP config check (safe, no secrets) ─────────────────────────────────────

export function getSmtpStatus() {
  return {
    configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    host: process.env.SMTP_HOST ?? null,
    port: process.env.SMTP_PORT ?? "587",
    user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(?<=.{3}).(?=.*@)/g, "*") : null,
    from: process.env.EMAIL_FROM ?? FROM,
    appUrl: APP_URL,
  };
}
