"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldInput } from "@/components/diva/ui/gold-input";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { changePassword } from "@/actions/diva/profile";
import { Lock, Shield, Key } from "lucide-react";

export default function SettingsPage() {
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const setField = (k: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwForm((f) => ({ ...f, [k]: e.target.value }));

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError(""); setPwSuccess(false); setPwLoading(true);
    const result = await changePassword(pwForm);
    setPwLoading(false);
    if (result.error) { setPwError(result.error); return; }
    setPwSuccess(true);
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Security Settings</h1>
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-[#D4AF37]/10 p-2.5"><Lock className="h-5 w-5 text-[#D4AF37]" /></div>
          <div>
            <h2 className="text-base font-semibold text-white">Change Password</h2>
            <p className="text-xs text-zinc-500">Use a strong, unique password</p>
          </div>
        </div>
        <motion.form onSubmit={handlePasswordChange} className="space-y-4">
          <GoldInput label="Current Password" type="password" icon={<Key size={16} />} value={pwForm.currentPassword} onChange={setField("currentPassword")} required />
          <GoldInput label="New Password" type="password" icon={<Lock size={16} />} value={pwForm.newPassword} onChange={setField("newPassword")} required />
          <GoldInput label="Confirm New Password" type="password" icon={<Lock size={16} />} value={pwForm.confirmPassword} onChange={setField("confirmPassword")} required />
          {pwError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{pwError}</div>}
          {pwSuccess && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">Password updated!</div>}
          <GoldButton type="submit" loading={pwLoading} className="w-full">Update Password</GoldButton>
        </motion.form>
      </GlassCard>
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-[#D4AF37]/10 p-2.5"><Shield className="h-5 w-5 text-[#D4AF37]" /></div>
          <div>
            <h2 className="text-base font-semibold text-white">Two-Factor Authentication</h2>
            <p className="text-xs text-zinc-500">Extra security layer</p>
          </div>
        </div>
        <GoldButton variant="outline" disabled>Enable 2FA (Coming Soon)</GoldButton>
      </GlassCard>
    </div>
  );
}
