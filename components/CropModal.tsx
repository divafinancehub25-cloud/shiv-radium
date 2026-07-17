"use client";

import { useState, useRef, useEffect } from "react";

// Crop tool: image box ke preset aspect ratio mein photo crop karke upload.
// Zoom slider + drag to position, phir "Crop & Use" canvas se cropped JPEG deta hai.
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
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // px offset of image center
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const boxW = 320;
  const boxH = Math.max(80, Math.round(boxW / (aspect || 1)));

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setPos({ x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) });
  }
  function endDrag() {
    dragRef.current = null;
  }

  async function crop() {
    const img = imgRef.current;
    if (!img) return;
    setProcessing(true);
    // Image is rendered with object-cover semantics: base scale fills the box
    const natW = img.naturalWidth, natH = img.naturalHeight;
    const baseScale = Math.max(boxW / natW, boxH / natH);
    const scale = baseScale * zoom;
    const dispW = natW * scale, dispH = natH * scale;
    // Top-left of image in box coords (image centered + pos offset)
    const left = boxW / 2 - dispW / 2 + pos.x;
    const top = boxH / 2 - dispH / 2 + pos.y;
    // Source rect in natural pixels
    const sx = Math.max(0, -left / scale);
    const sy = Math.max(0, -top / scale);
    const sw = Math.min(natW - sx, boxW / scale);
    const sh = Math.min(natH - sy, boxH / scale);

    const outW = Math.min(1200, Math.round(sw));
    const outH = Math.round(outW * (sh / sw));
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    canvas.toBlob((blob) => {
      setProcessing(false);
      if (!blob) return;
      onDone(new File([blob], file.name.replace(/\.\w+$/, "") + "-crop.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="font-bold text-gray-900 mb-1">✂️ Photo Crop karo</p>
        <p className="text-xs text-gray-400 mb-3">Photo ko drag karke set karo, zoom se adjust karo — box ke shape mein crop hogi</p>

        <div
          ref={boxRef}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          className="relative mx-auto overflow-hidden rounded-xl border-2 border-orange-400 bg-gray-100 touch-none"
          style={{ width: boxW, height: boxH }}
        >
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={imgUrl}
              alt="Crop"
              draggable={false}
              onPointerDown={startDrag}
              className="absolute cursor-move select-none"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                minWidth: "100%",
                minHeight: "100%",
                objectFit: "cover",
                width: boxW,
                height: boxH,
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-gray-500">Zoom</span>
          <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-orange-500" />
          <span className="text-xs font-semibold w-10 text-right">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={onCancel} className="border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={crop} disabled={processing} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold">
            {processing ? "Cropping..." : "✓ Crop & Use"}
          </button>
        </div>
      </div>
    </div>
  );
}
