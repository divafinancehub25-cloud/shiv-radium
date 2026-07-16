"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKYCStore } from "@/lib/diva/store/kyc-store";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { submitKYC } from "@/actions/diva/kyc";
import { CheckCircle, Clock, FileText, Camera, User } from "lucide-react";

export function StepReview() {
  const { step1, step2Docs, step3Selfie, setStep, reset } = useKYCStore();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    const result = await submitKYC();
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setSubmitted(true);
    reset();
    setTimeout(() => router.push("/diva-app/dashboard"), 3000);
  }

  if (submitted) {
    return (
      <GlassCard className="p-10 text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/20">
          <CheckCircle className="h-10 w-10 text-[#D4AF37]" />
        </div>
        <h2 className="text-xl font-bold text-white">Submission Complete!</h2>
        <p className="text-sm text-zinc-400">Your KYC verification is under review. We&apos;ll notify you within 24–48 hours.</p>
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Clock size={14} /> <span>Estimated review time: 24–48 hours</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Review Your Submission</h2>
        <p className="mt-1 text-sm text-zinc-500">Please verify all information before submitting.</p>
      </div>

      {/* Personal Info summary */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <User size={14} className="text-[#D4AF37]" /> Personal Information
        </div>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {[
            ["Full Name", step1.fullName],
            ["Date of Birth", step1.dateOfBirth],
            ["Nationality", step1.nationality],
            ["Address", step1.address],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-zinc-600">{k}</p>
              <p className="text-zinc-300">{v || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documents summary */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <FileText size={14} className="text-[#D4AF37]" /> Documents
        </div>
        {step2Docs.filter((d) => d.url).map((doc) => (
          <div key={doc.type} className="flex items-center gap-2 text-sm">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-zinc-300">{doc.type.replace("_", " ")}: {doc.fileName}</span>
          </div>
        ))}
      </div>

      {/* Selfie summary */}
      {step3Selfie?.url && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center gap-3">
          <Camera size={14} className="text-[#D4AF37]" />
          <div className="text-sm">
            <p className="text-zinc-400 text-xs">Selfie</p>
            <p className="text-zinc-300">{step3Selfie.fileName}</p>
          </div>
          <CheckCircle size={14} className="ml-auto text-emerald-400" />
        </div>
      )}

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      <div className="flex justify-between">
        <GoldButton variant="outline" onClick={() => setStep(3)}>Back</GoldButton>
        <GoldButton loading={submitting} onClick={handleSubmit}>Submit KYC</GoldButton>
      </div>
    </GlassCard>
  );
}
