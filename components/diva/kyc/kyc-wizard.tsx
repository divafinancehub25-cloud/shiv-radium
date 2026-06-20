"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useKYCStore } from "@/lib/diva/store/kyc-store";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { StepPersonal } from "./step-personal";
import { StepDocuments } from "./step-documents";
import { StepSelfie } from "./step-selfie";
import { StepReview } from "./step-review";
import { CheckCircle, Circle, User, FileText, Camera, ClipboardCheck } from "lucide-react";

const STEPS = [
  { num: 1, label: "Personal Info", icon: User },
  { num: 2, label: "Documents", icon: FileText },
  { num: 3, label: "Selfie", icon: Camera },
  { num: 4, label: "Review", icon: ClipboardCheck },
] as const;

export function KYCWizard() {
  const { step } = useKYCStore();

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  step > s.num
                    ? "border-[#D4AF37] bg-[#D4AF37] text-black"
                    : step === s.num
                    ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "border-white/10 bg-white/[0.03] text-zinc-600"
                }`}>
                  {step > s.num ? <CheckCircle size={18} /> : <s.icon size={18} />}
                </div>
                <span className={`hidden text-xs sm:block ${step >= s.num ? "text-zinc-300" : "text-zinc-600"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-px flex-1 transition-all duration-500 ${step > s.num ? "bg-[#D4AF37]" : "bg-white/[0.08]"}`} />
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {step === 1 && <StepPersonal />}
          {step === 2 && <StepDocuments />}
          {step === 3 && <StepSelfie />}
          {step === 4 && <StepReview />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
