import { cn } from "@/lib/utils";

type Status = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

const config: Record<Status, { label: string; classes: string; dot: string }> = {
  PENDING:      { label: "Pending",      classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",   dot: "bg-amber-400" },
  UNDER_REVIEW: { label: "Under Review", classes: "bg-blue-500/10  text-blue-400  border-blue-500/20",    dot: "bg-blue-400" },
  APPROVED:     { label: "Approved",     classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  REJECTED:     { label: "Rejected",     classes: "bg-red-500/10   text-red-400   border-red-500/20",     dot: "bg-red-400" },
};

export function DepositStatusBadge({ status }: { status: Status }) {
  const c = config[status] ?? config.PENDING;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", c.classes)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
