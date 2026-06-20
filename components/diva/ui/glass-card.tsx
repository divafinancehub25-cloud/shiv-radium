"use client";
import { cn } from "@/lib/utils";

type Props = { className?: string; style?: React.CSSProperties; children: React.ReactNode; hover?: boolean; onClick?: () => void };

export function GlassCard({ className, style, children, hover, onClick }: Props) {
  return (
    <div
      style={style}
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
        hover && "transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-white/[0.05]",
        className
      )}
    >
      {children}
    </div>
  );
}
