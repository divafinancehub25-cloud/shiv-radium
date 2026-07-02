import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/actions/diva/profile";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { StatusBadge } from "@/components/diva/ui/status-badge";
import { User, Mail, Phone, Globe, Wallet, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile | DIVA Growth Capital" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva/login");
  const user = await getMyProfile();
  if (!user) redirect("/diva/login");
  const profile = user.divaProfile;
  const initial = user.name[0]?.toUpperCase() ?? "U";

  const fields = [
    { icon: User, label: "Full Name", value: user.name },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone ?? "—" },
    { icon: Globe, label: "Country", value: profile?.country ?? "—" },
    { icon: Wallet, label: "Wallet Address", value: profile?.walletAddress ?? "Not set" },
    { icon: Calendar, label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">My Profile</h1>
      <GlassCard className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#B8962E]" />
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] text-2xl font-bold text-black">{initial}</div>
            <div>
              <h2 className="text-xl font-semibold text-white">{user.name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={profile?.accountStatus ?? "PENDING_VERIFICATION"} />
                <StatusBadge status={user.divaKYC?.status ?? "PENDING"} />
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label} className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">{f.label}</p>
                  <p className="mt-0.5 truncate text-sm text-white">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
          {profile?.referralCode && (
            <div className="mt-4 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.03] p-4">
              <p className="text-xs text-zinc-500">Your Referral Code</p>
              <p className="mt-1 font-mono text-lg font-bold text-[#D4AF37]">{profile.referralCode}</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
