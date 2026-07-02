"use client";
import { useState } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { fmtMoney, fmtPct, calcForecast } from "@/lib/diva/forecast-engine";
import { FileText, Download, Table2, Loader2, CheckCircle2 } from "lucide-react";
import type { ScenarioRow, MilestoneRow } from "@/types/diva/forecasting";

type Props = {
  scenarios: ScenarioRow[];
  milestones: MilestoneRow[];
  currentBalance: number;
  userName: string;
};

type ExportStatus = "idle" | "loading" | "done";

export function ExportCenter({ scenarios, milestones, currentBalance, userName }: Props) {
  const [csvStatus, setCsvStatus] = useState<ExportStatus>("idle");
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>("idle");

  function downloadCSV() {
    setCsvStatus("loading");
    try {
      const lines: string[] = [];
      lines.push("DIVA Growth Capital — Portfolio Export");
      lines.push(`Exported: ${new Date().toLocaleString()}`);
      lines.push(`Account: ${userName}`);
      lines.push(`Current Balance: ${fmtMoney(currentBalance)}`);
      lines.push("");
      lines.push("SCENARIOS");
      lines.push("Name,Initial Amount,Monthly Contribution,Duration (Years),Growth Rate,Compounding,Projected Value,Est. Growth");
      for (const s of scenarios) {
        const r = calcForecast({
          initialAmount: Number(s.initialAmount),
          contributionAmount: Number(s.contributionAmount),
          contributionFreq: s.contributionFreq as any,
          durationYears: s.durationYears,
          growthRate: Number(s.growthRate),
          compoundingFreq: s.compoundingFreq as any,
        });
        lines.push([
          s.scenarioName,
          Number(s.initialAmount).toFixed(2),
          Number(s.contributionAmount).toFixed(2),
          s.durationYears,
          fmtPct(Number(s.growthRate)),
          s.compoundingFreq,
          r.projectedValue.toFixed(2),
          r.estimatedGrowth.toFixed(2),
        ].join(","));
      }
      lines.push("");
      lines.push("MILESTONES");
      lines.push("Name,Target Amount,Target Date,Status,Notes");
      for (const m of milestones) {
        lines.push([
          m.milestoneName,
          Number(m.targetAmount).toFixed(2),
          m.targetDate ? new Date(m.targetDate).toLocaleDateString() : "",
          m.status,
          m.notes ?? "",
        ].join(","));
      }

      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diva-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setCsvStatus("done");
      setTimeout(() => setCsvStatus("idle"), 3000);
    } catch {
      setCsvStatus("idle");
    }
  }

  async function downloadPDF() {
    setPdfStatus("loading");
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const gold = [212, 175, 55] as [number, number, number];
      const white = [255, 255, 255] as [number, number, number];
      const dark = [20, 20, 20] as [number, number, number];
      const gray = [120, 120, 120] as [number, number, number];

      // Background
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 297, "F");

      // Header
      doc.setFillColor(...gold);
      doc.rect(0, 0, 210, 28, "F");
      doc.setTextColor(...dark);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("DIVA Growth Capital", 15, 12);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Portfolio Forecast Report", 15, 20);
      doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 195, 20, { align: "right" });

      let y = 38;
      doc.setTextColor(...white);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Account: ${userName}`, 15, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      doc.text(`Current Portfolio Balance: ${fmtMoney(currentBalance)}`, 15, y);
      y += 10;

      if (scenarios.length > 0) {
        doc.setTextColor(...gold);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Forecast Scenarios", 15, y);
        y += 6;

        for (const s of scenarios) {
          const r = calcForecast({
            initialAmount: Number(s.initialAmount),
            contributionAmount: Number(s.contributionAmount),
            contributionFreq: s.contributionFreq as any,
            durationYears: s.durationYears,
            growthRate: Number(s.growthRate),
            compoundingFreq: s.compoundingFreq as any,
          });
          doc.setFillColor(30, 30, 30);
          doc.roundedRect(15, y, 180, 22, 2, 2, "F");
          doc.setTextColor(...white);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(s.scenarioName, 20, y + 7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...gray);
          doc.setFontSize(8);
          doc.text(`Initial: ${fmtMoney(Number(s.initialAmount))}  Monthly: ${fmtMoney(Number(s.contributionAmount))}  Duration: ${s.durationYears}y  Rate: ${fmtPct(Number(s.growthRate))}`, 20, y + 14);
          doc.setTextColor(...gold);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(fmtMoney(r.projectedValue), 190, y + 10, { align: "right" });
          y += 26;
          if (y > 260) { doc.addPage(); doc.setFillColor(10, 10, 10); doc.rect(0, 0, 210, 297, "F"); y = 20; }
        }
        y += 4;
      }

      if (milestones.length > 0) {
        doc.setTextColor(...gold);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Milestones", 15, y);
        y += 6;

        for (const m of milestones) {
          const pct = Math.min(100, (currentBalance / Number(m.targetAmount)) * 100);
          doc.setFillColor(30, 30, 30);
          doc.roundedRect(15, y, 180, 18, 2, 2, "F");
          doc.setTextColor(...white);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(m.milestoneName, 20, y + 7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...gray);
          doc.setFontSize(8);
          doc.text(`Target: ${fmtMoney(Number(m.targetAmount))}  Progress: ${pct.toFixed(1)}%  Status: ${m.status}`, 20, y + 14);
          y += 22;
          if (y > 260) { doc.addPage(); doc.setFillColor(10, 10, 10); doc.rect(0, 0, 210, 297, "F"); y = 20; }
        }
      }

      // Footer
      doc.setTextColor(...gray);
      doc.setFontSize(7);
      doc.text("Generated by DIVA Growth Capital. This document is for informational purposes only.", 105, 290, { align: "center" });

      doc.save(`diva-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      setPdfStatus("done");
      setTimeout(() => setPdfStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setPdfStatus("idle");
    }
  }

  const exports = [
    {
      icon: Table2,
      title: "CSV Export",
      desc: "Download scenarios and milestones as a spreadsheet",
      action: downloadCSV,
      status: csvStatus,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      icon: FileText,
      title: "PDF Report",
      desc: "Download a formatted portfolio forecast report",
      action: downloadPDF,
      status: pdfStatus,
      color: "text-[#D4AF37]",
      bg: "bg-[#D4AF37]/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exports.map(({ icon: Icon, title, desc, action, status, color, bg }) => (
          <GlassCard key={title} className="p-6">
            <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
            <p className="text-xs text-white/30 mb-5">{desc}</p>
            <button onClick={action} disabled={status === "loading"}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                status === "done"
                  ? "bg-emerald-400/20 text-emerald-400"
                  : "bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black hover:opacity-90 disabled:opacity-50"
              }`}>
              {status === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
               : status === "done" ? <><CheckCircle2 className="w-4 h-4" /> Downloaded!</>
               : <><Download className="w-4 h-4" /> Download {title.split(" ")[0]}</>}
            </button>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4">
        <p className="text-xs text-white/25 text-center">
          Export includes {scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""} and {milestones.length} milestone{milestones.length !== 1 ? "s" : ""}.
          Reports are generated client-side and never stored on our servers.
        </p>
      </GlassCard>
    </div>
  );
}
