"use client";

import { useState, useRef } from "react";
import { customPolygon, type ClipPoint } from "@/lib/clipShapes";

// Curvature tool: click to add anchor points, drag to move, double-click a
// point to toggle straight/curved. Produces a clip polygon for an image box.
export default function CurvatureEditor({
  initial,
  bgImage,
  onSave,
  onClose,
}: {
  initial: ClipPoint[];
  bgImage?: string | null;
  onSave: (points: ClipPoint[]) => void;
  onClose: () => void;
}) {
  const [points, setPoints] = useState<ClipPoint[]>(
    initial.length >= 3 ? initial : [
      { x: 50, y: 8 }, { x: 90, y: 50 }, { x: 50, y: 92 }, { x: 10, y: 50 },
    ]
  );
  const [selected, setSelected] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<number | null>(null);

  const SIZE = 320;

  function toPct(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const r = boxRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  }

  function addPoint(e: React.MouseEvent) {
    if (dragRef.current !== null) return;
    const p = toPct(e);
    // insert after the nearest point so the shape stays sensible
    setPoints((prev) => {
      let bestIdx = prev.length - 1, bestD = Infinity;
      for (let i = 0; i < prev.length; i++) {
        const d = (prev[i].x - p.x) ** 2 + (prev[i].y - p.y) ** 2;
        if (d < bestD) { bestD = d; bestIdx = i; }
      }
      const copy = [...prev];
      copy.splice(bestIdx + 1, 0, { x: p.x, y: p.y });
      return copy;
    });
  }

  const clip = customPolygon(points);

  return (
    <div className="fixed inset-0 z-[85] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="font-bold text-gray-900 mb-1">✎ Curvature Tool</p>
        <p className="text-xs text-gray-400 mb-3">
          Canvas pe click = naya point • point drag = move • point pe double-click = curve on/off • image isi shape mein clip hogi
        </p>

        <div
          ref={boxRef}
          onClick={addPoint}
          onPointerMove={(e) => {
            if (dragRef.current === null) return;
            const p = toPct(e);
            setPoints((prev) => prev.map((pt, i) => (i === dragRef.current ? { ...pt, x: p.x, y: p.y } : pt)));
          }}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerLeave={() => { dragRef.current = null; }}
          className="relative mx-auto rounded-xl overflow-hidden bg-gray-100 touch-none"
          style={{ width: SIZE, height: SIZE, backgroundImage: bgImage ? `url(${bgImage})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          {/* clipped preview overlay */}
          <div
            className="absolute inset-0 bg-orange-400/40"
            style={{ clipPath: clip ? `polygon(${clip})` : undefined }}
          />
          {/* anchor points */}
          {points.map((pt, i) => (
            <div
              key={i}
              onPointerDown={(e) => { e.stopPropagation(); dragRef.current = i; setSelected(i); }}
              onDoubleClick={(e) => { e.stopPropagation(); setPoints((prev) => prev.map((p, x) => (x === i ? { ...p, curved: !p.curved } : p))); }}
              title="Drag = move • Double-click = curve on/off"
              className={`absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full border-2 cursor-move ${pt.curved ? "bg-blue-500 border-white" : "bg-white border-gray-800"} ${selected === i ? "ring-2 ring-orange-400" : ""}`}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-gray-400">{points.length} points · blue = curved</span>
          <div className="flex gap-2">
            {selected !== null && points.length > 3 && (
              <button
                onClick={() => { setPoints((prev) => prev.filter((_, i) => i !== selected)); setSelected(null); }}
                className="text-red-500 hover:underline"
              >
                ✕ Delete point
              </button>
            )}
            <button onClick={() => setPoints([{ x: 50, y: 8 }, { x: 90, y: 50 }, { x: 50, y: 92 }, { x: 10, y: 50 }])} className="text-gray-500 hover:underline">Reset</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={onClose} style={{ border: "none" }} className="border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(points)} style={{ border: "none" }} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-bold">✓ Use this shape</button>
        </div>
      </div>
    </div>
  );
}
