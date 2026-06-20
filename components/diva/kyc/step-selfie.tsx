"use client";

import { useState } from "react";
import { useKYCStore } from "@/lib/diva/store/kyc-store";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { DocumentUploader } from "./document-uploader";
import { saveKYCDocument } from "@/actions/diva/kyc";
import { Camera, Info } from "lucide-react";

export function StepSelfie() {
  const { step3Selfie, setSelfie, setStep } = useKYCStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleUploaded(url: string, fileName: string) {
    if (!url) { setSelfie({ url: "", fileName: "" }); return; }
    setSaving(true);
    const result = await saveKYCDocument("SELFIE", url, fileName) as { success?: boolean; error?: string };
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSelfie({ url, fileName });
  }

  return (
    <GlassCard className="p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#D4AF37]/10 p-2.5">
          <Camera className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Selfie Verification</h2>
          <p className="mt-1 text-sm text-zinc-500">Take a clear selfie or upload a recent photo.</p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
        <div className="space-y-1 text-xs text-blue-300">
          <p>• Face must be clearly visible and well-lit</p>
          <p>• No sunglasses, hats, or heavy filters</p>
          <p>• Must match your uploaded ID document</p>
        </div>
      </div>

      <DocumentUploader
        label="Upload Selfie"
        accept={["image/*"]}
        onUploaded={handleUploaded}
        value={step3Selfie?.url ? step3Selfie : null}
      />

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      <div className="flex justify-between">
        <GoldButton variant="outline" onClick={() => setStep(2)}>Back</GoldButton>
        <GoldButton loading={saving} disabled={!step3Selfie?.url} onClick={() => setStep(4)}>Review & Submit</GoldButton>
      </div>
    </GlassCard>
  );
}
