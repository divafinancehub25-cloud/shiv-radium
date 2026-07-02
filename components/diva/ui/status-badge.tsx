import { cn } from "@/lib/utils";

const CONFIGS = {
  ACTIVE: { label: "Active", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  SUSPENDED: { label: "Suspended", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  LOCKED: { label: "Locked", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  PENDING_VERIFICATION: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  PENDING: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  APPROVED: { label: "Approved", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  REJECTED: { label: "Rejected", className: "bg-red-500/20 text-red-400 border-red-500/30" },
} as const;

type StatusKey = keyof typeof CONFIGS;

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = CONFIGS[status as StatusKey] ?? { label: status, className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg.className, className)}>
      {cfg.label}
    </span>
  );
}
