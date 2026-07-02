"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "gold" | "outline" | "ghost";
};

export function GoldButton({ className, loading, variant = "gold", children, disabled, ...props }: Props) {
  const base = "relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    gold: "bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black hover:opacity-90 shadow-lg shadow-[#D4AF37]/20",
    outline: "border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10",
    ghost: "text-[#D4AF37] hover:bg-[#D4AF37]/10",
  };

  return (
    <button className={cn(base, variants[variant], className)} disabled={loading || disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
