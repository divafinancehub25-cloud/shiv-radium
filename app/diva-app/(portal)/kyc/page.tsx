import { KYCWizard } from "@/components/diva/kyc/kyc-wizard";

export const metadata = { title: "KYC Verification — DIVA Growth Capital" };

export default function DivaKYCPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Identity Verification</h1>
        <p className="text-white/40 text-sm mt-1">Complete KYC to unlock full platform access</p>
      </div>
      <KYCWizard />
    </div>
  );
}
