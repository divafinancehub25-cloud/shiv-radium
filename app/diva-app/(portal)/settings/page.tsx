import { GlassCard } from "@/components/diva/ui/glass-card";

export const metadata = { title: "Settings — DIVA Growth Capital" };

export default function DivaSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <GlassCard className="p-6">
        <h2 className="text-white font-medium mb-4">Security</h2>
        <div className="space-y-3 text-white/50 text-sm">
          <p>Two-factor authentication, password change, and device management coming soon.</p>
        </div>
      </GlassCard>
    </div>
  );
}
