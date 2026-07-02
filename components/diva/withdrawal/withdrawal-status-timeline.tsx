import { WithdrawalStatusBadge } from "./withdrawal-status-badge";
import type { WithdrawalStatusHistoryRow } from "@/types/diva/withdrawal";

export function WithdrawalStatusTimeline({ history }: { history: WithdrawalStatusHistoryRow[] }) {
  if (!history.length) {
    return <p className="text-white/30 text-sm">No status history.</p>;
  }

  return (
    <ol className="relative border-l border-white/10 ml-2 space-y-5">
      {history.map((h, i) => (
        <li key={h.id} className="ml-5">
          <span className={`absolute -left-[6px] mt-1.5 h-3 w-3 rounded-full border-2 border-[#0A0A0A] ${i === history.length - 1 ? "bg-[#D4AF37]" : "bg-white/30"}`} />
          <div className="flex items-center gap-2 flex-wrap">
            <WithdrawalStatusBadge status={h.newStatus} />
            <span className="text-[11px] text-white/30">
              {new Date(h.createdAt).toLocaleString()}
            </span>
          </div>
          {h.notes && <p className="text-xs text-white/50 mt-1">{h.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
