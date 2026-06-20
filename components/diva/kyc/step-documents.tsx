"use client";

import { useState } from "react";
import { useKYCStore } from "@/lib/diva/store/kyc-store";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { DocumentUploader } from "./document-uploader";
import { saveKYCDocument } from "@/actions/diva/kyc";
import type { DivaDocumentType } from "@prisma/client";

const DOC_TYPES: { type: DivaDocumentType; label: string }[] = [
  { type: "PASSPORT", label: "Passport" },
  { type: "NATIONAL_ID", label: "National ID" },
  { type: "DRIVING_LICENSE", label: "Driving License" },
];

export function StepDocuments() {
  const { step2Docs, addDoc, setStep } = useKYCStore();
  const [selected, setSelected] = useState<DivaDocumentType>("PASSPORT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentDoc = step2Docs.find((d) => d.type === selected) ?? null;

  async function handleUploaded(url: string, fileName: string) {
    if (!url) { addDoc({ type: selected, url: "", fileName: "" }); return; }
    setSaving(true);
    const result = await saveKYCDocument(selected, url, fileName) as { success?: boolean; error?: string };
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    addDoc({ type: selected, url, fileName });
  }

  const hasDoc = step2Docs.some((d) => d.url);

  return (
    <GlassCard className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Identity Documents</h2>
        <p className="mt-1 text-sm text-zinc-500">Upload one government-issued ID document.</p>
      </div>

      {/* Doc type selector */}
      <div className="flex gap-3">
        {DOC_TYPES.map((dt) => (
          <button
            key={dt.type}
            onClick={() => setSelected(dt.type)}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
              selected === dt.type
                ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]"
                : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
            }`}
          >
            {dt.label}
          </button>
        ))}
      </div>

      <DocumentUploader
        label={`Upload ${DOC_TYPES.find((d) => d.type === selected)?.label}`}
        onUploaded={handleUploaded}
        value={currentDoc?.url ? currentDoc : null}
      />

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      <div className="flex justify-between">
        <GoldButton variant="outline" onClick={() => setStep(1)}>Back</GoldButton>
        <GoldButton loading={saving} disabled={!hasDoc} onClick={() => setStep(3)}>Continue</GoldButton>
      </div>
    </GlassCard>
  );
}
