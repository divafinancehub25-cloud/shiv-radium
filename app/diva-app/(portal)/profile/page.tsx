"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { getMyProfile, updateProfile } from "@/actions/diva/profile";
import { toast } from "sonner";
import { User, Save, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";

const FIELDS: { key: string; label: string; placeholder: string; type?: string; half?: boolean }[] = [
  { key: "name", label: "Full Name", placeholder: "Your full name", half: true },
  { key: "phone", label: "Phone Number", placeholder: "10-digit mobile", half: true },
  { key: "dateOfBirth", label: "Date of Birth", placeholder: "", type: "date", half: true },
  { key: "nationality", label: "Nationality", placeholder: "e.g. Indian", half: true },
  { key: "address", label: "Address", placeholder: "Street address" },
  { key: "city", label: "City", placeholder: "City", half: true },
  { key: "state", label: "State", placeholder: "State", half: true },
  { key: "country", label: "Country", placeholder: "e.g. India", half: true },
  { key: "postalCode", label: "Postal Code", placeholder: "PIN code", half: true },
  { key: "walletAddress", label: "Wallet Address (USDT)", placeholder: "Your crypto wallet address" },
];

export default function DivaProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    getMyProfile().then((u: any) => {
      if (u) {
        const p = u.divaProfile ?? {};
        setForm({
          name: u.name ?? "",
          phone: u.phone ?? "",
          dateOfBirth: p.dateOfBirth ?? "",
          nationality: p.nationality ?? "",
          address: p.address ?? "",
          city: p.city ?? "",
          state: p.state ?? "",
          country: p.country ?? "",
          postalCode: p.postalCode ?? "",
          walletAddress: p.walletAddress ?? "",
        });
        setKycStatus(u.divaKYC?.status ?? null);
      }
      setLoading(false);
    });
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // send only non-empty fields
    const payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) if (v && v.trim()) payload[k] = v.trim();
    const res = await updateProfile(payload);
    if (res.success) toast.success("Profile saved!");
    else toast.error(res.error ?? "Failed to save");
    setSaving(false);
  };

  const initial = session?.user?.name?.[0]?.toUpperCase() ?? form.name?.[0]?.toUpperCase() ?? "M";
  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50 transition-colors placeholder:text-white/20";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-sm text-white/40 mt-1">Manage your personal details and account information</p>
      </div>

      {/* Header card */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center text-black font-bold text-2xl shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-lg">{form.name || session?.user?.name || "Member"}</p>
            <p className="text-white/40 text-sm truncate">{session?.user?.email}</p>
          </div>
          {/* KYC badge */}
          {kycStatus === "APPROVED" ? (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0">
              <ShieldAlert className="w-3.5 h-3.5" /> {kycStatus === "UNDER_REVIEW" ? "In Review" : "KYC Pending"}
            </span>
          )}
        </div>
      </GlassCard>

      {/* Edit form */}
      <GlassCard className="p-6">
        <p className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-[#D4AF37]" /> Personal Details
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              {FIELDS.map((f) => (
                <div key={f.key} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                  <label className="text-xs text-white/40 block mb-1.5">{f.label}</label>
                  <input
                    type={f.type ?? "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4AF37] text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </GlassCard>

      <p className="text-xs text-white/20 text-center">
        Need to update your KYC documents? Visit the{" "}
        <a href="/diva-app/kyc" className="text-[#D4AF37] hover:underline">KYC Verification</a> page.
      </p>
    </div>
  );
}
