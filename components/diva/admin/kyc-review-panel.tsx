"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, FileText, Camera, Clock, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { StatusBadge } from "@/components/diva/ui/status-badge";
import { adminApproveKYC, adminRejectKYC } from "@/actions/diva/kyc";
import { useSession } from "next-auth/react";

type Document = { id: string; type: string; url: string; fileName: string | null; uploadedAt: Date };
type KYCData = {
  id: string;
  status: string;
  fullName: string | null;
  dateOfBirth: Date | null;
  nationality: string | null;
  address: string | null;
  adminNotes: string | null;
  submittedAt: Date | null;
  documents: Document[];
  user: { id: string; name: string; email: string; phone: string | null };
};

export function KYCReviewPanel({ kyc }: { kyc: KYCData }) {
  const { data: session } = useSession();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);

  async function handleApprove() {
    setApproving(true);
    await adminApproveKYC(kyc.id, session!.user!.id!);
    setApproving(false);
    setResult("approved");
    setDone(true);
  }

  async function handleReject() {
    if (!rejectNotes.trim()) return;
    setRejecting(true);
    await adminRejectKYC(kyc.id, session!.user!.id!, rejectNotes);
    setRejecting(false);
    setResult("rejected");
    setDone(true);
  }

  if (done) {
    return (
      <GlassCard className="p-10 text-center space-y-4">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${result === "approved" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
          {result === "approved"
            ? <CheckCircle className="h-8 w-8 text-emerald-400" />
            : <XCircle className="h-8 w-8 text-red-400" />}
        </div>
        <h3 className="text-lg font-semibold text-white">
          KYC {result === "approved" ? "Approved" : "Rejected"}
        </h3>
        <p className="text-sm text-zinc-400">User has been notified by email.</p>
      </GlassCard>
    );
  }

  const idDocs = kyc.documents.filter((d) => d.type !== "SELFIE");
  const selfie = kyc.documents.find((d) => d.type === "SELFIE");

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white">{kyc.user.name}</h3>
            <p className="text-sm text-zinc-500">{kyc.user.email}</p>
          </div>
          <StatusBadge status={kyc.status} />
        </div>
        {kyc.submittedAt && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
            <Clock size={12} /> Submitted {new Date(kyc.submittedAt).toLocaleString()}
          </p>
        )}
      </GlassCard>

      {/* Personal Info */}
      <GlassCard className="p-5 space-y-3">
        <h4 className="text-sm font-medium text-zinc-300">Personal Information</h4>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          {[
            ["Full Name", kyc.fullName],
            ["Date of Birth", kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toLocaleDateString() : null],
            ["Nationality", kyc.nationality],
            ["Address", kyc.address],
          ].map(([k, v]) => (
            <div key={k as string}>
              <p className="text-xs text-zinc-600">{k}</p>
              <p className="text-zinc-300">{v ?? "—"}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Documents */}
      <GlassCard className="p-5 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <FileText size={14} className="text-[#D4AF37]" /> Identity Documents
        </h4>
        <div className="space-y-2">
          {idDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">{doc.type.replace("_", " ")}</p>
                <p className="text-xs text-zinc-600">{doc.fileName}</p>
              </div>
              <a href={doc.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline">
                View <ExternalLink size={10} />
              </a>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Selfie */}
      {selfie && (
        <GlassCard className="p-5 space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Camera size={14} className="text-[#D4AF37]" /> Selfie
          </h4>
          <a href={selfie.url} target="_blank" rel="noreferrer">
            <img src={selfie.url} alt="Selfie" className="h-48 w-full rounded-xl object-cover border border-white/10 hover:opacity-90 transition-opacity" />
          </a>
        </GlassCard>
      )}

      {/* Actions */}
      {kyc.status !== "APPROVED" && kyc.status !== "REJECTED" && (
        <GlassCard className="p-5 space-y-4">
          {showRejectForm ? (
            <>
              <h4 className="text-sm font-medium text-red-400">Rejection Reason</h4>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Explain why this KYC submission is being rejected…"
                rows={3}
                className="w-full resize-none rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:outline-none"
              />
              <div className="flex gap-3">
                <GoldButton variant="outline" onClick={() => setShowRejectForm(false)} className="flex-1">Cancel</GoldButton>
                <GoldButton loading={rejecting} onClick={handleReject}
                  className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 from-transparent to-transparent border border-red-500/30">
                  Confirm Reject
                </GoldButton>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setShowRejectForm(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all">
                <XCircle size={16} /> Reject
              </button>
              <GoldButton loading={approving} onClick={handleApprove} className="flex-1">
                <CheckCircle size={16} /> Approve
              </GoldButton>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
