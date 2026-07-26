// Clip-mask helpers shared by admin Frame Designer and customer customizer.
// All shapes are expressed as CSS clip-path values in PERCENT units so they
// scale perfectly with any box size (unlike path() which uses px).

export type ClipPoint = { x: number; y: number; curved?: boolean }; // 0-100 in the box

export type ClipShape =
  | "none" | "ellipse" | "circle" | "rounded"
  | "heart" | "star" | "hexagon" | "arch" | "diamond" | "custom";

export const CLIP_PRESETS: { value: ClipShape; label: string }[] = [
  { value: "none", label: "▭ None" },
  { value: "ellipse", label: "⬭ Ellipse" },
  { value: "circle", label: "⚫ Circle" },
  { value: "rounded", label: "▢ Rounded" },
  { value: "heart", label: "❤️ Heart" },
  { value: "star", label: "⭐ Star" },
  { value: "hexagon", label: "⬡ Hexagon" },
  { value: "diamond", label: "◆ Diamond" },
  { value: "arch", label: "🕌 Arch" },
  { value: "custom", label: "✎ Custom (curve tool)" },
];

// Preset polygon point sets (percent). Ellipse/circle use CSS functions.
function heartPoints(): string {
  const pts: string[] = [];
  for (let t = 0; t <= 360; t += 6) {
    const a = (t * Math.PI) / 180;
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    const px = 50 + (x / 34) * 100;
    const py = 42 - (y / 34) * 100;
    pts.push(`${px.toFixed(1)}% ${py.toFixed(1)}%`);
  }
  return pts.join(", ");
}

function polygonRing(n: number, rot = -90, r = 50): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)}% ${(50 + r * Math.sin(a)).toFixed(1)}%`);
  }
  return pts.join(", ");
}

function starPoints(spikes = 5, outer = 50, inner = 21): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((-90 + (180 / spikes) * i) * Math.PI) / 180;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)}% ${(50 + r * Math.sin(a)).toFixed(1)}%`);
  }
  return pts.join(", ");
}

function archPoints(): string {
  // window/arch: rounded top, flat bottom
  const pts: string[] = ["0% 100%", "0% 42%"];
  for (let t = 180; t >= 0; t -= 12) {
    const a = (t * Math.PI) / 180;
    pts.push(`${(50 - 50 * Math.cos(a)).toFixed(1)}% ${(42 - 42 * Math.sin(a)).toFixed(1)}%`);
  }
  pts.push("100% 100%");
  return pts.join(", ");
}

// Catmull-Rom → sampled polygon for smooth custom curves
export function customPolygon(points: ClipPoint[]): string {
  if (points.length < 3) return "";
  const anyCurved = points.some((p) => p.curved);
  if (!anyCurved) return points.map((p) => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`).join(", ");
  const out: string[] = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const steps = p1.curved || p2.curved ? 10 : 1;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t, t3 = t2 * t;
      const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      out.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
    }
  }
  return out.join(", ");
}

// Return a CSS clip-path value for an element's clip settings
export function clipPathCss(shape?: ClipShape, customPoints?: ClipPoint[]): string | undefined {
  switch (shape) {
    case "ellipse": return "ellipse(50% 50% at 50% 50%)";
    case "circle": return "circle(50% at 50% 50%)";
    case "rounded": return "inset(0 round 14%)";
    case "heart": return `polygon(${heartPoints()})`;
    case "star": return `polygon(${starPoints()})`;
    case "hexagon": return `polygon(${polygonRing(6, -90)})`;
    case "diamond": return `polygon(${polygonRing(4, -90)})`;
    case "arch": return `polygon(${archPoints()})`;
    case "custom": {
      const poly = customPolygon(customPoints ?? []);
      return poly ? `polygon(${poly})` : undefined;
    }
    default: return undefined;
  }
}
