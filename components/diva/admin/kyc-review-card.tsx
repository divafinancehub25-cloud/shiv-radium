"use client";

import { useState } from "react";
import { reviewApproveKYC, reviewRejectKYC } from "@/actions/diva/kyc";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { CheckCircle, XCircle, FileText, User, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

function fmtDate(d: any) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export function KycReviewCard({ kyc }: { kyc: any }) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");
  const [viewDoc, setViewDoc] = useState<string | null>(null);

  const approve = async () => {
    setLoading(true);
    const res = await reviewApproveKYC(kyc.id);
    if (res.success) toast.success(`${kyc.user.name}'s KYC approved ✅`);
    else toast.error(res.error ?? "Failed");
    setLoading(false);
  };

  const reject = async () => {
    if (!notes.trim()) return toast.error("Please add a reason for rejection");
    setLoading(true);
    const res = await reviewRejectKYC(kyc.id, notes.trim());
    if (res.success) toast.success("KYC rejected");
    else toast.error(res.error ?? "Failed");
    setLoading(false);
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center text-black font-bold shrink-0">
            {kyc.user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{kyc.fullName || kyc.user.name}</p>
            <p className="text-white/40 text-xs">{kyc.user.email}</p>
          </div>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${kyc.status === "UNDER_REVIEW" ? "bg-blue-500/10 text-blue-400" : "bg-yellow-500/10 text-yellow-400"}`}>
          {kyc.status === "UNDER_REVIEW" ? "In Review" : "Pending"}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
        {[
          ["Nationality", kyc.nationality],
          ["Date of Birth", kyc.dateOfBirth],
          ["Phone", kyc.user.phone],
          ["Submitted", fmtDate(kyc.submittedAt)],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-white/30">{k}</p>
            <p className="text-white/70">{v || "—"}</p>
          </div>
        ))}
      </div>
      {kyc.address && <p className="text-xs text-white/50 mt-2"><span className="text-white/30">Address:</span> {kyc.address}</p>}

      {/* Documents */}
      <div className="mt-4">
        <p className="text-xs text-white/30 mb-2 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Documents ({kyc.documents.length})</p>
        <div className="flex flex-wrap gap-2">
          {kyc.documents.map((doc: any) => (
            <button
              key={doc.id}
              onClick={() => setViewDoc(viewDoc === doc.url ? null : doc.url)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-white/[0.08] transition-colors"
            >
              <Eye className="w-3 h-3" /> {doc.type.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        {viewDoc && (
          <div className="mt-3 rounded-xl overflow-hidden border border-white/[0.08] bg-black/40">
            {viewDoc.startsWith("data:application/pdf") || viewDoc.endsWith(".pdf") ? (
              <a href={viewDoc} target="_blank" rel="noreferrer" className="block p-4 text-center text-[#D4AF37] text-xs hover:underline">Open PDF document ↗</a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={viewDoc} alt="KYC document" className="max-h-72 mx-auto object-contain" />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!rejecting ? (
        <div className="flex gap-2 mt-5">
          <button onClick={approve} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
          </button>
          <button onClick={() => setRejecting(true)} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for rejection (shown to user)..." rows={2} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50 resize-none placeholder:text-white/20" />
          <div className="flex gap-2">
            <button onClick={reject} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reject"}
            </button>
            <button onClick={() => { setRejecting(false); setNotes(""); }} className="px-4 py-2 rounded-xl bg-white/[0.04] text-white/50 text-sm hover:bg-white/[0.08]">Cancel</button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
