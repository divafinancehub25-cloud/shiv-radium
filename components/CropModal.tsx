"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Universal non-destructive crop engine — shared by Admin (FrameDesigner) and
// User (FrameCustomizer). The source image is never auto-cut on upload: it is
// loaded full, fitted to COVER the crop viewport (frame ratio), and the user
// drags + zooms to choose the visible area. Only "Crop & Use" rasterises the
// chosen region at print resolution.
//
// Props are intentionally stable (file, aspect, onDone, onCancel) so both
// panels use the exact same engine and produce identical output.
export default function CropModal({
  file,
  aspect, // width / height of the target box
  onDone,
  onCancel,
}: {
  file: File;
  aspect: number;
  onDone: (cropped: File) => void;
  onCancel: () => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // px offset of image centre
  const [box, setBox] = useState({ w: 320, h: 320 });
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lowQ, setLowQ] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  // pointerId -> current position, for drag (1 finger) + pinch (2 fingers)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  const MAX_ZOOM = 4;

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
      const availH = Math.max(180, Math.min(window.innerHeight * 0.52, 520));
      let w = availW, h = availW / a;
      if (h > availH) { h = availH; w = availH * a; }
      setBox({ w: Math.round(w), h: Math.round(h) });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [aspect]);

  // COVER scale: smallest scale that fully fills the box (no blank area at zoom 1)
  const cover = nat ? Math.max(box.w / nat.w, box.h / nat.h) : 1;

  // Clamp the pan so the (scaled) image always fully covers the box — never blank
  const clampPos = useCallback((p: { x: number; y: number }, z: number) => {
    if (!nat) return p;
    const contentW = nat.w * cover * z;
    const contentH = nat.h * cover * z;
    const maxX = Math.max(0, (contentW - box.w) / 2);
    const maxY = Math.max(0, (contentH - box.h) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, p.x)),
      y: Math.max(-maxY, Math.min(maxY, p.y)),
    };
  }, [nat, cover, box.w, box.h]);

  // Re-clamp position whenever zoom shrinks
  useEffect(() => { setPos((p) => clampPos(p, zoom)); }, [zoom, clampPos]);

  // Low-resolution warning: is source big enough for the print box?
  useEffect(() => {
    if (!nat) return;
    const needW = box.w * 2; // print target derived below is >= 1600; 2x preview is a soft floor
    setLowQ(nat.w * cover * zoom < needW * 0.6);
  }, [nat, cover, zoom, box.w]);

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
        const z = Math.max(1, Math.min(MAX_ZOOM, pinchRef.current.startZoom * (d / pinchRef.current.startDist)));
        setZoom(z);
      }
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    setPos(clampPos({ x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) }, zoom));
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) dragRef.current = null;
    else if (pointers.current.size === 1) {
      // remaining finger becomes the drag anchor
      const [only] = [...pointers.current.values()];
      dragRef.current = { startX: only.x, startY: only.y, origX: pos.x, origY: pos.y };
    }
  }

  // Desktop wheel zoom
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.max(1, Math.min(MAX_ZOOM, z - e.deltaY * 0.0015)));
  }

  async function crop() {
    const img = imgRef.current;
    if (!img || !nat) return;
    setProcessing(true);
    try {
      // Mirror the on-screen preview EXACTLY: cover into the box, scale(zoom)
      // around box centre, then pan by pos. Draw in destination coords so the
      // aspect ratio is never distorted and the visible area matches 1:1.
      const displayScale = cover * zoom;
      const contentW = nat.w * displayScale;
      const contentH = nat.h * displayScale;
      const contentLeft = box.w / 2 + pos.x - contentW / 2;
      const contentTop = box.h / 2 + pos.y - contentH / 2;

      // Print-quality output: keep box ratio, upscale to a print-safe target
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
      ctx.drawImage(
        img,
        contentLeft * outScale,
        contentTop * outScale,
        contentW * outScale,
        contentH * outScale
      );
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
              className="relative overflow-hidden rounded-xl bg-black/40 touch-none select-none ring-1 ring-white/40 shadow-2xl"
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
                    left: "50%",
                    top: "50%",
                    width: box.w,
                    height: box.h,
                    objectFit: "cover",
                    transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                  }}
                />
              )}
              {/* subtle grid to signal the crop frame */}
              <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)" }} />
            </div>
            {lowQ && (
              <p className="mt-3 text-[11px] text-amber-300 text-center max-w-xs">⚠️ Photo ki quality print ke liye kam ho sakti hai — zyada zoom na karein.</p>
            )}
          </>
        )}
      </div>

      {/* Controls (fixed at bottom on mobile) */}
      <div className="bg-white rounded-t-2xl px-5 pt-4 pb-5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <p className="text-[12px] text-gray-500 mb-3 text-center">Photo ko drag karke position set karein • do ungliyon se pinch karke zoom • ya slider</p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-gray-500 shrink-0">Zoom</span>
          <input
            type="range" min={1} max={MAX_ZOOM} step={0.02}
            value={zoom}
            aria-label="Zoom image"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-orange-500"
            disabled={!!err}
          />
          <span className="text-xs font-semibold w-10 text-right">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} aria-label="Cancel" className="border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={crop} disabled={processing || !!err || !nat} aria-label="Crop and use image" className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-bold">
            {processing ? "Ho raha hai..." : "✓ Crop & Use"}
          </button>
        </div>
      </div>
    </div>
  );
}
