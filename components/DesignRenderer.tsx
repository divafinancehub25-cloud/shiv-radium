"use client";

import { clipPathCss } from "@/lib/clipShapes";

// Read-only renderer that reproduces a customer's EXACT final design from the
// immutable order snapshot + their choices. Same math as the customer preview
// so Admin Order Preview === Customer Preview.

type El = {
  id: string; type: "image" | "text" | "frame"; label: string;
  x: number; y: number; w: number; h: number; radius: number; rotation: number; z: number;
  text?: string; fontFamily?: string; fontSize?: number; fontWeight?: string;
  align?: "left" | "center" | "right"; color?: string;
  mirror?: "none" | "h" | "v";
  shape?: string; fill?: string; defaultImage?: string;
  imgScale?: number; imgX?: number; imgY?: number;
  shadowOn?: boolean; shadowType?: "outer" | "inner"; shadowColor?: string; shadowBlur?: number; shadowX?: number; shadowY?: number;
  gradOn?: boolean; gradColor1?: string; gradColor2?: string; gradAngle?: number; gradIntensity?: number;
  clipShape?: import("@/lib/clipShapes").ClipShape; clipPoints?: import("@/lib/clipShapes").ClipPoint[];
  maskImage?: string; fillImage?: string;
  strokeOn?: boolean; strokeColor?: string; strokeWidth?: number; strokeStyle?: "solid" | "dashed" | "dotted"; opacity?: number;
  locked?: boolean; hidden?: boolean;
};

type Snapshot = { name?: string; bgImage?: string | null; aspect?: number; elements: El[]; options?: { customFonts?: { family: string; url?: string }[] } | null };
type Design = {
  overrides?: Record<string, { text?: string; image?: string; scale?: number; offX?: number; offY?: number; mirror?: "none" | "h" | "v" }>;
  frameColor?: string; textColor?: string; font?: string; textSize?: number;
  mirrorFinish?: string; gradient?: { c1: string; c2: string; angle: number; allImages: boolean };
  light?: { color: string; intensity: number };
};

const MIRROR_FINISHES: Record<string, string> = {
  "Normal Gold": "linear-gradient(135deg,#fdf3c0 0%,#d4af37 35%,#8a6d1f 60%,#f7e690 100%)",
  "Copper Gold": "linear-gradient(135deg,#f6d3ad 0%,#b87333 40%,#7a4318 65%,#e8b98a 100%)",
  "Rose Gold": "linear-gradient(135deg,#f9d6d0 0%,#b76e79 40%,#7d4750 65%,#f2c0b8 100%)",
  "Pink Gold": "linear-gradient(135deg,#ffe3e6 0%,#e0a3a3 40%,#a9666c 65%,#ffd0d6 100%)",
  "Metallic Gold": "linear-gradient(135deg,#fffbe6 0%,#cfa93f 30%,#6b5310 55%,#ffe98a 80%,#cfa93f 100%)",
  "Silver Mirror": "linear-gradient(135deg,#ffffff 0%,#c7ccd1 35%,#7d8288 60%,#eef1f4 100%)",
  "Black Mirror": "linear-gradient(135deg,#6e6e6e 0%,#2b2b2b 40%,#000000 65%,#5a5a5a 100%)",
};

function shadowCss(el: El): React.CSSProperties {
  if (!el.shadowOn) return {};
  const color = el.shadowColor ?? "#000", blur = el.shadowBlur ?? 10, x = el.shadowX ?? 0, y = el.shadowY ?? 4;
  if (el.type === "text") return { textShadow: el.shadowType === "inner" ? `0 1px 1px ${color}` : `${x}px ${y}px ${blur}px ${color}` };
  return { boxShadow: `${el.shadowType === "inner" ? "inset " : ""}${x}px ${y}px ${blur}px ${color}` };
}
function gradientCss(el: El): string | null {
  if (!el.gradOn) return null;
  const c1 = el.gradColor1 ?? "#f97316", c2 = el.gradColor2 ?? "#fff", angle = el.gradAngle ?? 135;
  const stop = Math.max(0, Math.min(100, el.gradIntensity ?? 50));
  return `linear-gradient(${angle}deg, ${c1} ${stop}%, ${c2} 100%)`;
}
function maskStyle(url?: string): React.CSSProperties {
  if (!url) return {};
  return { WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
}
function mirrorCss(mirror?: "none" | "h" | "v"): string {
  return mirror === "h" ? " scaleX(-1)" : mirror === "v" ? " scaleY(-1)" : "";
}
function strokeStyleCss(el: El): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (el.opacity != null && el.opacity < 100) s.opacity = Math.max(0, Math.min(100, el.opacity)) / 100;
  if (el.strokeOn) s.border = `${el.strokeWidth ?? 2}px ${el.strokeStyle ?? "solid"} ${el.strokeColor ?? "#000000"}`;
  return s;
}

export default function DesignRenderer({ snapshot, design, className = "" }: { snapshot: Snapshot; design: Design; className?: string }) {
  const els = [...(snapshot.elements ?? [])].filter((e) => !e.hidden).sort((a, b) => a.z - b.z);
  const ov = design.overrides ?? {};
  const custGrad = design.gradient ? `linear-gradient(${design.gradient.angle}deg, ${design.gradient.c1} 0%, ${design.gradient.c2} 100%)` : null;
  const fonts = (snapshot.options?.customFonts ?? []).filter((f) => f.url);

  function render(el: El) {
    const borderRadius = el.shape === "ellipse" ? "50%" : `${el.radius}px`;
    const base: React.CSSProperties = {
      position: "absolute", left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`,
      transform: `rotate(${el.rotation}deg)`, zIndex: el.z, borderRadius,
      ...(el.type !== "text" ? shadowCss(el) : {}),
      ...(el.type === "image" ? strokeStyleCss(el) : {}),
    };
    const adminGrad = gradientCss(el);

    if (el.type === "frame") {
      if (el.fillImage && !design.frameColor) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img key={el.id} src={el.fillImage} alt="" style={base} className="object-contain" />;
      }
      return <div key={el.id} style={{ ...base, background: design.frameColor ?? adminGrad ?? el.fill, ...maskStyle(el.maskImage) }} />;
    }

    if (el.type === "image") {
      const img = ov[el.id]?.image ?? el.defaultImage;
      const scale = ov[el.id]?.scale ?? el.imgScale ?? 1;
      const offX = ov[el.id]?.offX ?? el.imgX ?? 0;
      const offY = ov[el.id]?.offY ?? el.imgY ?? 0;
      const clip = clipPathCss(el.clipShape, el.clipPoints);
      const imgGrad = custGrad && design.gradient?.allImages ? custGrad : adminGrad;
      return (
        <div key={el.id} style={base}>
          {img ? (
            <div style={{ borderRadius, clipPath: clip, ...maskStyle(el.maskImage) }} className="w-full h-full overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={el.label} style={{ transform: `translate(${offX}%, ${offY}%) scale(${scale})` }} className="w-full h-full object-cover" />
              {imgGrad && <div style={{ background: imgGrad, borderRadius }} className="absolute inset-0 pointer-events-none mix-blend-overlay" />}
            </div>
          ) : (
            <div style={{ borderRadius, clipPath: clip, ...maskStyle(el.maskImage) }} className="w-full h-full bg-gray-100" />
          )}
        </div>
      );
    }

    // text
    const content = ov[el.id]?.text ?? el.text;
    const mirrorGrad = design.mirrorFinish ? MIRROR_FINISHES[design.mirrorFinish] : (custGrad ?? adminGrad);
    const textMirror = ov[el.id]?.mirror ?? el.mirror;
    return (
      <div
        key={el.id}
        style={{ ...base, transform: `rotate(${el.rotation}deg)${mirrorCss(textMirror)}`, fontFamily: design.font ?? el.fontFamily, fontSize: `${design.textSize ?? el.fontSize}px`, fontWeight: el.fontWeight as React.CSSProperties["fontWeight"], color: mirrorGrad ? undefined : (design.textColor ?? el.color), textAlign: el.align }}
        className="flex items-center overflow-hidden"
      >
        <span
          className="w-full leading-tight"
          style={mirrorGrad
            ? { textAlign: el.align, backgroundImage: mirrorGrad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", ...shadowCss(el) }
            : { textAlign: el.align, ...shadowCss(el) }}
        >
          {content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full bg-white overflow-hidden ${className}`}
      style={{
        aspectRatio: `${snapshot.aspect || 1}`,
        backgroundImage: snapshot.bgImage ? `url(${snapshot.bgImage})` : undefined,
        backgroundSize: "100% 100%", backgroundPosition: "center",
      }}
    >
      {fonts.map((f) => (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link key={f.url} href={f.url} rel="stylesheet" />
      ))}
      {els.map(render)}
      {design.light && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 45%, ${design.light.color}, transparent 72%)`, opacity: (design.light.intensity ?? 55) / 100, mixBlendMode: "screen", zIndex: 999 }} />
      )}
    </div>
  );
}
