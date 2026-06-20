"use client";

import { useState } from "react";
import { useKYCStore } from "@/lib/diva/store/kyc-store";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldInput } from "@/components/diva/ui/gold-input";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { saveKYCStep1 } from "@/actions/diva/kyc";
import { kycStep1Schema } from "@/lib/diva/validators/kyc";

export function StepPersonal() {
  const { step1, setStep1, setStep } = useKYCStore();
  const [form, setForm] = useState(step1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleNext() {
    const parsed = kycStep1Schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed.error.issues.forEach((e: any) => { if (e.path[0] != null) errs[String(e.path[0])] = e.message; });
      setErrors(errs);
      return;
    }
    setLoading(true);
    const result = await saveKYCStep1(form);
    setLoading(false);
    if (result.error) { setServerError(result.error); return; }
    setStep1(form);
    setStep(2);
  }

  return (
    <GlassCard className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Personal Information</h2>
        <p className="mt-1 text-sm text-zinc-500">This information must match your government-issued ID.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GoldInput label="Full Legal Name" placeholder="As on your ID" value={form.fullName}
          onChange={set("fullName")} error={errors.fullName} />
        <GoldInput label="Date of Birth" type="date" value={form.dateOfBirth}
          onChange={set("dateOfBirth")} error={errors.dateOfBirth} />
        <GoldInput label="Nationality" placeholder="e.g. American" value={form.nationality}
          onChange={set("nationality")} error={errors.nationality} />
        <div className="sm:col-span-2">
          <GoldInput label="Full Address" placeholder="Street, City, State, Country" value={form.address}
            onChange={set("address")} error={errors.address} />
        </div>
      </div>

      {serverError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{serverError}</div>
      )}

      <div className="flex justify-end">
        <GoldButton loading={loading} onClick={handleNext}>Continue</GoldButton>
      </div>
    </GlassCard>
  );
}
