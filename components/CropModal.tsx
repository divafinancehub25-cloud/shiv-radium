"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Universal non-destructive crop engine — shared by Admin (FrameDesigner) and
// User (FrameCustomizer). The source image is never auto-cut on upload: it is
// loaded full and FIT (contain) into the frame ratio by default, so nothing is
// lost unless the user zooms/pans. Fit/Fill, rotate, drag, pinch/wheel zoom are
// all supported; only the confirm button rasterises at print resolution.
//
// mode="admin" and mode="customer" render the same engine; only labels differ.
export default function CropModal({
  file,
  aspect, // width / height of the target box
  onDone,
  onCancel,
  confirmLabel = "✓ Crop & Use",
}: {
  file: File;
  aspect: number;
  onDone: (cropped: File) => void;
  onCancel: () => void;
  confirmLabel?: string;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0); // degrees: 0 / 90 / 180 / 270
  const [mode, setMode] = useState<"fit" | "fill">("fit");
  const [pos, setPos] = useState({ x: 0, y: 0 }); // px offset of image centre
  const [box, setBox] = useState({ w: 320, h: 320 });
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lowQ, setLowQ] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  // Load the file → object URL, read natural size
  useEffect(() => {
    setErr(null);
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const probe = new Image();
    probe.onload = () => {
      if (!probe.naturalWidth || !probe.naturalHeight) { setErr("Yeh image kharab ya unsupported hai."); return; }
      setNat({ w: probe.naturalWidth, h: probe.naturalHeight });
    };
    probe.onerror = () => setErr("Image load nahi hui — doosri photo try karein.");
    probe.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Responsive crop-box size: fit inside available viewport area, keep frame ratio
  useEffect(() => {
    function measure() {
      const a = aspect || 1;
      const availW = Math.min(window.innerWidth - 32, 460);
      const availH = Math.max(180, Math.min(window.innerHeight * 0.46, 520));
      let w = availW, h = availW / a;
      if (h > availH) { h = availH; w = availH * a; }
      setBox({ w: Math.round(w), h: Math.round(h) });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [aspect]);

  // Rotated footprint (per unit scale): at 90/270 the width/height swap.
  const swap = rot % 180 !== 0;
  const ew = nat ? (swap ? nat.h : nat.w) : 1; // footprint width  (source units)
  const eh = nat ? (swap ? nat.w : nat.h) : 1; // footprint height
  // FIT = contain (whole image visible, letterboxed). FILL = cover (frame filled).
  const base = nat
    ? (mode === "fill" ? Math.max(box.w / ew, box.h / eh) : Math.min(box.w / ew, box.h / eh))
    : 1;
  const coverScale = nat ? Math.max(box.w / ew, box.h / eh) : 1;
  const maxZoom = Math.max(4, (coverScale / base) * 3);

  const displayScale = base * zoom;         // px per source px
  const iw = nat ? nat.w * displayScale : box.w; // on-screen (unrotated) img size
  const ih = nat ? nat.h * displayScale : box.h;
  const footW = ew * displayScale;          // rotated footprint on screen
  const footH = eh * displayScale;

  // Clamp pan so the rotated footprint never leaves blank inside the box (fill),
  // and stays centred where it is smaller than the box (fit letterbox).
  const clampPos = useCallback((p: { x: number; y: number }) => {
    const maxX = Math.max(0, (footW - box.w) / 2);
    const maxY = Math.max(0, (footH - box.h) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, p.x)), y: Math.max(-maxY, Math.min(maxY, p.y)) };
  }, [footW, footH, box.w, box.h]);

  // Re-clamp whenever the transform changes
  useEffect(() => { setPos((p) => clampPos(p)); }, [zoom, rot, mode, clampPos]);

  // Low-resolution warning based on the actually-shown source density
  useEffect(() => {
    if (!nat) return;
    setLowQ(nat.w * base * zoom < box.w * 2 * 0.6);
  }, [nat, base, zoom, box.w]);

  function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
      pinchRef.current = null;
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = { startDist: dist(a, b), startZoom: zoom };
      dragRef.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()];
      const d = dist(a, b);
      if (pinchRef.current.startDist > 0) {
        setZoom(Math.max(1, Math.min(maxZoom, pinchRef.current.startZoom * (d / pinchRef.current.startDist))));
      }
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    setPos(clampPos({ x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) }));
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) dragRef.current = null;
    else if (pointers.current.size === 1) {
      const [only] = [...pointers.current.values()];
      dragRef.current = { startX: only.x, startY: only.y, origX: pos.x, origY: pos.y };
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.max(1, Math.min(maxZoom, z - e.deltaY * 0.0015)));
  }

  function rotateBy(delta: number) { setRot((r) => (r + delta + 360) % 360); }
  function reset() { setZoom(1); setRot(0); setMode("fit"); setPos({ x: 0, y: 0 }); }

  async function crop() {
    const img = imgRef.current;
    if (!img || !nat) return;
    setProcessing(true);
    try {
      const outW = Math.round(Math.min(2400, Math.max(1600, box.w * 3)));
      const outScale = outW / box.w;
      const outH = Math.round(box.h * outScale);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { setErr("Browser canvas support nahi karta."); setProcessing(false); return; }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // Mirror the on-screen preview EXACTLY: move to box centre + pan, rotate,
      // then draw the (unrotated) image centred. All in output-scaled coords.
      ctx.save();
      ctx.translate((box.w / 2 + pos.x) * outScale, (box.h / 2 + pos.y) * outScale);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(img, (-iw / 2) * outScale, (-ih / 2) * outScale, iw * outScale, ih * outScale);
      ctx.restore();
      canvas.toBlob((blob) => {
        setProcessing(false);
        if (!blob) { setErr("Crop fail hua — dobara try karein."); return; }
        onDone(new File([blob], file.name.replace(/\.\w+$/, "") + "-crop.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    } catch {
      setProcessing(false);
      setErr("Crop fail hua — dobara try karein.");
    }
  }

  const toolBtn = "flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold border transition-colors";

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      onClick={onCancel}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-base font-bold">✂️ Photo set karein</span>
        <button onClick={onCancel} aria-label="Close crop editor" className="w-9 h-9 -mr-2 flex items-center justify-center text-2xl leading-none text-white/80 hover:text-white">✕</button>
      </div>

      {/* Crop stage */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0" onClick={(e) => e.stopPropagation()}>
        {err ? (
          <div className="text-center text-white/90 text-sm max-w-xs">{err}</div>
        ) : (
          <>
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
              className="relative overflow-hidden rounded-xl bg-white touch-none select-none ring-1 ring-white/40 shadow-2xl"
              style={{ width: box.w, height: box.h, cursor: "move" }}
            >
              {imgUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imgRef}
                  src={imgUrl}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={(e) => { const t = e.currentTarget; if (t.naturalWidth) setNat({ w: t.naturalWidth, h: t.naturalHeight }); }}
                  className="absolute pointer-events-none"
                  style={{
                    // Natural-aspect sizing + rotate about centre — identical model
                    // to the canvas export, so editor and product preview match 1:1.
                    width: iw,
                    height: ih,
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${rot}deg)`,
                  }}
                />
              )}
              <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)" }} />
            </div>
            {lowQ && (
              <p className="mt-3 text-xs text-amber-300 text-center max-w-xs">⚠️ Photo ki quality print ke liye kam ho sakti hai — zyada zoom na karein.</p>
            )}
          </>
        )}
      </div>

      {/* Controls (fixed at bottom on mobile) */}
      <div className="bg-white rounded-t-2xl px-5 pt-4 pb-5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-gray-500 mb-3 text-center">Photo ko drag karein • pinch/scroll ya slider se zoom • ghumane ke liye rotate</p>

        {/* Fit / Fill / Rotate / Reset */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <button
            onClick={() => setMode("fit")} aria-label="Fit — show full photo" disabled={!!err}
            className={`${toolBtn} ${mode === "fit" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >⬜ Fit</button>
          <button
            onClick={() => setMode("fill")} aria-label="Fill — cover the frame" disabled={!!err}
            className={`${toolBtn} ${mode === "fill" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >⬛ Fill</button>
          <button onClick={() => rotateBy(-90)} aria-label="Rotate left" disabled={!!err} className={`${toolBtn} border-gray-200 text-gray-600 hover:bg-gray-50`}>⟲ Left</button>
          <button onClick={() => rotateBy(90)} aria-label="Rotate right" disabled={!!err} className={`${toolBtn} border-gray-200 text-gray-600 hover:bg-gray-50`}>⟳ Right</button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-gray-500 shrink-0">Zoom</span>
          <input
            type="range" min={1} max={maxZoom} step={0.02}
            value={zoom}
            aria-label="Zoom image"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-orange-500"
            disabled={!!err}
          />
          <span className="text-xs font-semibold w-10 text-right">{Math.round(zoom * 100)}%</span>
          <button onClick={reset} aria-label="Reset crop" disabled={!!err} className="text-xs font-semibold text-gray-500 hover:text-orange-600 shrink-0">⟳ Reset</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} aria-label="Cancel" className="border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={crop} disabled={processing || !!err || !nat} aria-label="Use this photo" className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-bold">
            {processing ? "Ho raha hai..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
