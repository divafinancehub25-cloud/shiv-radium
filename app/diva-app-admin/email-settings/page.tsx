import { getSmtpStatus } from "@/lib/diva/email";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { CheckCircle, XCircle, Mail, AlertTriangle } from "lucide-react";
import { TestEmailBtn } from "@/components/diva/admin/test-email-btn";

export default async function EmailSettingsPage() {
  const smtp = getSmtpStatus();

  const configRows = [
    { label: "SMTP Host", value: smtp.host, key: "SMTP_HOST" },
    { label: "SMTP Port", value: smtp.port, key: "SMTP_PORT" },
    { label: "SMTP User", value: smtp.user, key: "SMTP_USER" },
    { label: "From Address", value: smtp.from, key: "EMAIL_FROM" },
    { label: "App URL", value: smtp.appUrl, key: "NEXT_PUBLIC_APP_URL" },
  ];

  const emailTypes = [
    { name: "Welcome Email", trigger: "After email verification", icon: "👋", status: "auto" },
    { name: "Email Verification", trigger: "On registration", icon: "📧", status: "auto" },
    { name: "Password Reset", trigger: "On forgot password request", icon: "🔐", status: "auto" },
    { name: "KYC Approved", trigger: "Admin approves KYC", icon: "🪪", status: "auto" },
    { name: "KYC Rejected", trigger: "Admin rejects KYC", icon: "⚠️", status: "auto" },
    { name: "Deposit Approved", trigger: "Admin approves deposit", icon: "💰", status: "auto" },
    { name: "Deposit Rejected", trigger: "Admin rejects deposit", icon: "❌", status: "auto" },
    { name: "Withdrawal Processed", trigger: "Admin approves withdrawal", icon: "💸", status: "auto" },
    { name: "Withdrawal Rejected", trigger: "Admin rejects withdrawal", icon: "❌", status: "auto" },
    { name: "Reward Granted", trigger: "Admin grants a reward", icon: "🎁", status: "auto" },
    { name: "Achievement Unlocked", trigger: "Achievement trigger fires", icon: "🏆", status: "auto" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Email Settings</h1>
        <p className="text-sm text-white/40 mt-1">SMTP configuration, transactional email status and test tools</p>
      </div>

      {/* SMTP Status */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          {smtp.configured ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">
              SMTP {smtp.configured ? "Configured" : "Not Configured"}
            </p>
            <p className="text-xs text-white/30 mt-0.5">
              {smtp.configured
                ? "Transactional emails are active and will be delivered."
                : "Set SMTP environment variables to enable email delivery."}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {configRows.map((r) => (
            <div key={r.key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <div>
                <p className="text-xs text-white/50">{r.label}</p>
                <p className="text-[10px] text-white/20 font-mono mt-0.5">{r.key}</p>
              </div>
              <p className={`text-xs font-mono ${r.value ? "text-white" : "text-red-400/70"}`}>
                {r.value ?? "Not set"}
              </p>
            </div>
          ))}
        </div>

        {!smtp.configured && (
          <div className="mt-5 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-400 font-medium">Add these to your .env.local file:</p>
            </div>
            <pre className="text-[10px] text-white/40 font-mono leading-relaxed overflow-x-auto">{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=STICKO Growth Capital <noreply@sticko.app>
NEXT_PUBLIC_APP_URL=https://your-domain.com`}</pre>
          </div>
        )}
      </GlassCard>

      {/* Test Email */}
      <GlassCard className="p-6">
        <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#D4AF37]" /> Send Test Email
        </p>
        <p className="text-xs text-white/30 mb-5">Verify SMTP is working by sending a test email to any address.</p>
        <TestEmailBtn />
      </GlassCard>

      {/* Transactional Email List */}
      <GlassCard className="p-6">
        <p className="text-sm font-semibold text-white mb-5">Transactional Emails ({emailTypes.length} configured)</p>
        <div className="space-y-2">
          {emailTypes.map((e) => (
            <div key={e.name} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
              <span className="text-base w-7 shrink-0">{e.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{e.name}</p>
                <p className="text-white/30 text-xs">{e.trigger}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${smtp.configured ? "text-emerald-400 bg-emerald-400/10" : "text-white/20 bg-white/[0.04]"}`}>
                {smtp.configured ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
