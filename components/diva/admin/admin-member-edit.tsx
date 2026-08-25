"use client";
import { useState, useTransition } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { adminUpdateUser, adminResetUserPassword } from "@/actions/diva/admin";
import { Save, KeyRound, Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";

type Member = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
  profile?: {
    walletAddress?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    nationality?: string | null;
  } | null;
};

const inputCls =
  "w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40";

export function AdminMemberEdit({ member, onSuccess }: { member: Member; onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"details" | "password">("details");
  const [form, setForm] = useState({
    name: member.name ?? "",
    email: member.email ?? "",
    phone: member.phone ?? "",
    isActive: member.isActive ?? true,
    walletAddress: member.profile?.walletAddress ?? "",
    address: member.profile?.address ?? "",
    city: member.profile?.city ?? "",
    state: member.profile?.state ?? "",
    country: member.profile?.country ?? "",
    postalCode: member.profile?.postalCode ?? "",
    nationality: member.profile?.nationality ?? "",
  });
  const [newPassword, setNewPassword] = useState("");

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  function saveDetails() {
    startTransition(async () => {
      const res = await adminUpdateUser(member.id, form);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Member details updated");
      onSuccess?.();
    });
  }

  function resetPassword() {
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    startTransition(async () => {
      const res = await adminResetUserPassword(member.id, newPassword);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Password reset — share it with the member");
      setNewPassword("");
    });
  }

  const fields: { key: keyof typeof form; label: string; half?: boolean }[] = [
    { key: "name", label: "Full Name", half: true },
    { key: "phone", label: "Phone", half: true },
    { key: "email", label: "Email" },
    { key: "walletAddress", label: "Wallet Address (USDT)" },
    { key: "nationality", label: "Nationality", half: true },
    { key: "country", label: "Country", half: true },
    { key: "address", label: "Address" },
    { key: "city", label: "City", half: true },
    { key: "state", label: "State", half: true },
    { key: "postalCode", label: "Postal Code", half: true },
  ];

  return (
    <GlassCard className="p-6">
      <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <UserCog className="w-4 h-4 text-[#D4AF37]" /> Edit Member
      </h3>
      <p className="text-xs text-white/30 mb-4">{member.email}</p>

      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] mb-5">
        {(["details", "password"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              tab === t ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"
            }`}
          >
            {t === "details" ? "Details" : "Reset Password"}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                <label className="text-xs text-white/40 mb-1 block">{f.label}</label>
                <input value={form[f.key] as string} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-white/70 pt-1">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="accent-[#D4AF37] w-4 h-4" />
            Account active (login allowed)
          </label>

          <button
            onClick={saveDetails}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Details
          </button>
        </div>
      )}

      {tab === "password" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">New Password (min 8 chars)</label>
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className={inputCls} />
          </div>
          <p className="text-xs text-white/30">Member ko naya password khud share karna hoga.</p>
          <button
            onClick={resetPassword}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Reset Password
          </button>
        </div>
      )}
    </GlassCard>
  );
}
