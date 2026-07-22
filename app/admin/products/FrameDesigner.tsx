"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Image as ImageIcon, Type, Square, Circle, ZoomIn, ZoomOut, ChevronUp, ChevronDown, Copy } from "lucide-react";
import CropModal from "@/components/CropModal";

// ─── Types ───────────────────────────────────────────────────────────────────

type ElementType = "image" | "text" | "frame";
type Shape = "rect" | "ellipse" | "rounded";

export type FrameElement = {
  id: string;
  type: ElementType;
  label: string;
  x: number; // percent of canvas
  y: number;
  w: number;
  h: number;
  radius: number; // px
  rotation: number; // deg
  z: number;
  // text
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  align?: "left" | "center" | "right";
  color?: string;
  // frame/shape
  shape?: Shape;
  fill?: string;
  // image box: admin's default image (customer can replace it)
  defaultImage?: string;
  // zoom + pan of the image inside the box (cursor-adjustable)
  imgScale?: number;
  imgX?: number; // % offset inside the box
  imgY?: number;
  // ── Per-element effects (each element keeps its own copy) ──
  shadowOn?: boolean;
  shadowType?: "outer" | "inner";
  shadowColor?: string;
  shadowBlur?: number;   // px
  shadowX?: number;      // px offset
  shadowY?: number;      // px offset
  gradOn?: boolean;
  gradColor1?: string;
  gradColor2?: string;
  gradAngle?: number;    // deg
  gradIntensity?: number; // 0-100, where color1 stops
};

// Build CSS for an element's own shadow (text vs box differ)
export function shadowCss(el: FrameElement): { boxShadow?: string; textShadow?: string } {
  if (!el.shadowOn) return {};
  const color = el.shadowColor ?? "#000000";
  const blur = el.shadowBlur ?? 10;
  const x = el.shadowX ?? 0;
  const y = el.shadowY ?? 4;
  if (el.type === "text") {
    // Text can't do inset — inner is faked with a tight dark shadow
    return { textShadow: el.shadowType === "inner" ? `0 1px 1px ${color}` : `${x}px ${y}px ${blur}px ${color}` };
  }
  return { boxShadow: `${el.shadowType === "inner" ? "inset " : ""}${x}px ${y}px ${blur}px ${color}` };
}

// Build CSS gradient for an element
export function gradientCss(el: FrameElement): string | null {
  if (!el.gradOn) return null;
  const c1 = el.gradColor1 ?? "#f97316";
  const c2 = el.gradColor2 ?? "#ffffff";
  const angle = el.gradAngle ?? 135;
  const stop = Math.max(0, Math.min(100, el.gradIntensity ?? 50));
  return `linear-gradient(${angle}deg, ${c1} ${stop}%, ${c2} 100%)`;
}

// url = Google Fonts stylesheet; dataUrl = uploaded font file (.ttf/.otf/.woff)
export type CustomFont = { label: string; family: string; url?: string; dataUrl?: string };

export type CustomerOptions = {
  frameColors: { allowed: string[]; default: string };
  textColors: { allowed: string[]; default: string };
  fonts: { allowed: string[]; default: string };
  textSizes: { allowed: { label: string; px: number }[]; default: number };
  customFonts: CustomFont[];
  // canvas aspect ratio = bg image's natural width/height (no cropping)
  bgAspect?: number;
  // Acrylic mirror text: admin per-product enable + allowed mirror finishes
  acrylicMirror?: { enabled: boolean; allowed: string[]; default: string };
};

// Acrylic mirror finishes — premium 4mm mirror look with 3D raised text
export const ACRYLIC_MIRROR_COLORS = [
  { label: "Normal Gold", value: "#d4af37", gradient: "linear-gradient(135deg,#fdf3c0 0%,#d4af37 35%,#8a6d1f 60%,#f7e690 100%)" },
  { label: "Copper Gold", value: "#b87333", gradient: "linear-gradient(135deg,#f6d3ad 0%,#b87333 40%,#7a4318 65%,#e8b98a 100%)" },
  { label: "Rose Gold", value: "#b76e79", gradient: "linear-gradient(135deg,#f9d6d0 0%,#b76e79 40%,#7d4750 65%,#f2c0b8 100%)" },
  { label: "Pink Gold", value: "#e0a3a3", gradient: "linear-gradient(135deg,#ffe3e6 0%,#e0a3a3 40%,#a9666c 65%,#ffd0d6 100%)" },
  { label: "Metallic Gold", value: "#cfa93f", gradient: "linear-gradient(135deg,#fffbe6 0%,#cfa93f 30%,#6b5310 55%,#ffe98a 80%,#cfa93f 100%)" },
  { label: "Silver Mirror", value: "#c7ccd1", gradient: "linear-gradient(135deg,#ffffff 0%,#c7ccd1 35%,#7d8288 60%,#eef1f4 100%)" },
  { label: "Black Mirror", value: "#2b2b2b", gradient: "linear-gradient(135deg,#6e6e6e 0%,#2b2b2b 40%,#000000 65%,#5a5a5a 100%)" },
];

// 3D raised text on 4mm acrylic mirror
export const MIRROR_TEXT_SHADOW = "0 1px 0 rgba(255,255,255,.6), 0 2px 2px rgba(0,0,0,.35), 0 4px 6px rgba(0,0,0,.3)";

export const TEXT_SIZE_PRESETS = [
  { label: "Small", px: 18 },
  { label: "Medium", px: 24 },
  { label: "Large", px: 32 },
  { label: "XL", px: 40 },
];

function defaultOptions(): CustomerOptions {
  return {
    frameColors: { allowed: ["#9b1b30", "#2a5fc1", "#d4a437", "#1c1c1c"], default: "#9b1b30" },
    textColors: { allowed: ["#1c1c1c", "#ffffff", "#d4a437"], default: "#1c1c1c" },
    fonts: { allowed: ["Arial, sans-serif", "'Playfair Display', serif", "'Dancing Script', cursive"], default: "Arial, sans-serif" },
    textSizes: { allowed: TEXT_SIZE_PRESETS.slice(0, 3), default: 24 },
    customFonts: [],
    bgAspect: 1,
    acrylicMirror: { enabled: false, allowed: ACRYLIC_MIRROR_COLORS.map((c) => c.label), default: "Normal Gold" },
  };
}

// Read natural aspect ratio (w/h) of an image URL
function readAspect(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1);
    img.onerror = () => resolve(1);
    img.src = url;
  });
}

type Template = {
  id: string;
  name: string;
  elements: FrameElement[];
  bgImage: string | null;
  options?: CustomerOptions | null;
};

const FONTS = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Amatic SC', cursive", label: "Amatic SC" },
  { value: "'Dancing Script', cursive", label: "Dancing Script" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
];

const DEFAULT_COLORS = ["#7b2fbe", "#2ab3c9", "#f97316", "#1c1c1c", "#2a5fc1", "#9b1b30", "#d4a437", "#ffffff"];

let uid = 0;
function newId() {
  return `el_${Date.now()}_${uid++}`;
}

// Small hex-code input with live swatch preview + Add button
function ColorCodeInput({ onAdd }: { onAdd: (hex: string) => void }) {
  const [code, setCode] = useState("");
  const valid = /^#[0-9a-fA-F]{6}$/.test(code);
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ background: valid ? code : "#fff" }} className="w-6 h-6 rounded border border-gray-200 shrink-0" />
      <input
        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-400"
        placeholder="#ff6b2c"
        value={code}
        onChange={(e) => {
          let v = e.target.value.trim();
          if (v && !v.startsWith("#")) v = "#" + v;
          setCode(v.slice(0, 7));
        }}
        onKeyDown={(e) => { if (e.key === "Enter" && valid) { onAdd(code.toLowerCase()); setCode(""); } }}
      />
      <button
        disabled={!valid}
        onClick={() => { onAdd(code.toLowerCase()); setCode(""); }}
        className="text-[10px] font-semibold bg-gray-900 disabled:opacity-40 text-white px-2 py-1 rounded-lg"
      >
        Add
      </button>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export type PendingTemplate = { name: string; elements: FrameElement[]; bgImage: string | null; options: CustomerOptions };

// productId null = create mode: design locally, product create hone par save hota hai (onPending)
export default function FrameDesigner({ productId, productImage, onPending }: { productId: string | null; productImage: string | null; onPending?: (tpl: PendingTemplate) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [elements, setElements] = useState<FrameElement[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [bgImage, setBgImage] = useState<string | null>(productImage);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [options, setOptions] = useState<CustomerOptions>(defaultOptions());
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [newFontName, setNewFontName] = useState("");
  const [cropState, setCropState] = useState<{ file: File; elId: string; aspect: number } | null>(null);

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    return res.ok && data.url ? data.url : null;
  }

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; mode: "move" | "resize" | "imgscale" | "imgpan"; startX: number; startY: number; orig: FrameElement } | null>(null);
  const [globalFonts, setGlobalFonts] = useState<CustomFont[]>([]);

  // Global font library — shared across all templates/products
  useEffect(() => {
    fetch("/api/admin/fonts").then((r) => r.json()).then((d) => {
      if (d.fonts) setGlobalFonts(d.fonts);
    }).catch(() => {});
  }, []);

  async function addFontToLibrary(font: CustomFont) {
    setGlobalFonts((p) => p.some((f) => f.family === font.family) ? p : [...p, font]);
    setOptions((o) => ({ ...o, fonts: { ...o.fonts, allowed: o.fonts.allowed.includes(font.family) ? o.fonts.allowed : [...o.fonts.allowed, font.family] } }));
    await fetch("/api/admin/fonts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ font }) });
  }

  async function deleteFontFromLibrary(family: string) {
    if (!confirm("Ye font sabhi templates ki list se hat jayega. Delete karein?")) return;
    setGlobalFonts((p) => p.filter((f) => f.family !== family));
    setOptions((o) => ({
      ...o,
      fonts: { allowed: o.fonts.allowed.filter((x) => x !== family), default: o.fonts.default === family ? "Arial, sans-serif" : o.fonts.default },
      customFonts: o.customFonts.filter((f) => f.family !== family),
    }));
    await fetch("/api/admin/fonts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ family }) });
  }

  // Union of library + fonts embedded in the open template
  const allCustomFonts = [...globalFonts, ...options.customFonts.filter((f) => !globalFonts.some((g) => g.family === f.family))];

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  // ── Load templates ──
  const loadTemplates = useCallback(async () => {
    if (!productId) return;
    const res = await fetch(`/api/admin/frame-templates?productId=${productId}`);
    const data = await res.json();
    if (res.ok) setTemplates(data.templates.map((t: Template & { elements: unknown }) => ({ ...t, elements: (t.elements as FrameElement[]) ?? [] })));
  }, [productId]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  function openTemplate(t: Template) {
    setActiveId(t.id);
    setTemplateName(t.name);
    setElements(t.elements);
    setBgImage(t.bgImage ?? productImage);
    setOptions({ ...defaultOptions(), ...(t.options ?? {}), acrylicMirror: { ...defaultOptions().acrylicMirror!, ...(t.options?.acrylicMirror ?? {}) } });
    setSelectedId(null);
  }

  function newTemplate() {
    setActiveId(null);
    setTemplateName(`Template ${templates.length + 1}`);
    setElements([]);
    setBgImage(productImage);
    setOptions(defaultOptions());
    setSelectedId(null);
  }

  // ── Add elements ──
  function maxZ() {
    return elements.reduce((m, e) => Math.max(m, e.z), 0);
  }

  function addImageBox(shape: Shape) {
    const el: FrameElement = {
      id: newId(), type: "image", label: `Img box ${elements.filter((e) => e.type === "image").length + 1}`,
      x: 30, y: 30, w: 30, h: 30, radius: shape === "rounded" ? 16 : 0, rotation: 0, z: maxZ() + 1, shape,
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  }

  function addTextBox() {
    const el: FrameElement = {
      id: newId(), type: "text", label: `Text box ${elements.filter((e) => e.type === "text").length + 1}`,
      x: 25, y: 65, w: 50, h: 12, radius: 0, rotation: 0, z: maxZ() + 1,
      text: "Your Text", fontFamily: FONTS[0].value, fontSize: 24, fontWeight: "600", align: "center", color: "#1c1c1c",
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  }

  function addFrame(shape: Shape) {
    const el: FrameElement = {
      id: newId(), type: "frame", label: `Frame ${elements.filter((e) => e.type === "frame").length + 1}`,
      x: 15, y: 15, w: 70, h: 70, radius: shape === "rounded" ? 24 : 0, rotation: 0, z: maxZ() + 1,
      shape, fill: "#f97316",
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy = { ...selected, id: newId(), label: selected.label + " copy", x: Math.min(90, selected.x + 4), y: Math.min(90, selected.y + 4), z: maxZ() + 1 };
    setElements((p) => [...p, copy]);
    setSelectedId(copy.id);
  }

  function removeSelected() {
    if (!selectedId) return;
    setElements((p) => p.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }

  function updateSelected(patch: Partial<FrameElement>) {
    if (!selectedId) return;
    setElements((p) => p.map((e) => (e.id === selectedId ? { ...e, ...patch } : e)));
  }

  function moveLayer(dir: 1 | -1) {
    if (!selected) return;
    updateSelected({ z: Math.max(0, selected.z + dir) });
  }

  // ── Drag / Resize ──
  async function setBgWithAspect(url: string | null) {
    setBgImage(url);
    const aspect = url ? await readAspect(url) : 1;
    setOptions((o) => ({ ...o, bgAspect: aspect }));
  }

  function startDrag(id: string, mode: "move" | "resize" | "imgscale" | "imgpan", e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find((x) => x.id === id);
    if (!el) return;
    setSelectedId(id);
    dragRef.current = { id, mode, startX: e.clientX, startY: e.clientY, orig: { ...el } };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - d.startX) / r.width) * 100;
    const dy = ((e.clientY - d.startY) / r.height) * 100;
    setElements((p) => p.map((el) => {
      if (el.id !== d.id) return el;
      if (d.mode === "move") {
        return { ...el, x: Math.max(-20, Math.min(95, d.orig.x + dx)), y: Math.max(-20, Math.min(95, d.orig.y + dy)) };
      }
      if (d.mode === "imgscale") {
        return { ...el, imgScale: Math.max(0.3, Math.min(4, (d.orig.imgScale ?? 1) + dx / 30)) };
      }
      if (d.mode === "imgpan") {
        return {
          ...el,
          imgX: Math.max(-100, Math.min(100, (d.orig.imgX ?? 0) + (dx / el.w) * 100)),
          imgY: Math.max(-100, Math.min(100, (d.orig.imgY ?? 0) + (dy / el.h) * 100)),
        };
      }
      return { ...el, w: Math.max(4, Math.min(140, d.orig.w + dx)), h: Math.max(3, Math.min(140, d.orig.h + dy)) };
    }));
  }

  function endDrag() {
    dragRef.current = null;
  }

  // ── Save ──
  async function saveTemplate() {
    if (!templateName.trim()) { setMsg("Template ka naam do"); return; }
    // Create mode: template locally hold karo — product create hote hi save hoga
    if (!productId) {
      const embedded = allCustomFonts.filter((f) => options.fonts.allowed.includes(f.family));
      onPending?.({ name: templateName.trim(), elements, bgImage, options: { ...options, customFonts: embedded } });
      setMsg("✅ Template ready — 'Create Product' dabate hi save ho jayega");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      // Embed the allowed custom fonts (from global library) into this template
      // so the customer page is self-contained
      const embeddedFonts = allCustomFonts.filter((f) => options.fonts.allowed.includes(f.family));
      const body = { productId, name: templateName.trim(), elements, bgImage, options: { ...options, customFonts: embeddedFonts } };
      const res = activeId
        ? await fetch(`/api/admin/frame-templates/${activeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/frame-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (!activeId) setActiveId(data.template.id);
      setMsg("✅ Template saved!");
      loadTemplates();
    } catch (err) {
      setMsg("❌ " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Ye template delete karna hai?")) return;
    await fetch(`/api/admin/frame-templates/${id}`, { method: "DELETE" });
    if (activeId === id) newTemplate();
    loadTemplates();
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400";
  const num = (v: number) => Math.round(v * 10) / 10;

  // ── Render one element on canvas ──
  function renderElement(el: FrameElement) {
    const isSel = el.id === selectedId;
    const borderRadius = el.shape === "ellipse" ? "50%" : `${el.radius}px`;
    const common: React.CSSProperties = {
      position: "absolute",
      left: `${el.x}%`,
      top: `${el.y}%`,
      width: `${el.w}%`,
      height: `${el.h}%`,
      transform: `rotate(${el.rotation}deg)`,
      zIndex: el.z,
      borderRadius,
      touchAction: "none",
      // element's own shadow (boxes only; text shadow applied on the span)
      ...(el.type !== "text" ? shadowCss(el) : {}),
    };
    const grad = gradientCss(el);
    return (
      <div
        key={el.id}
        style={common}
        onPointerDown={(e) => startDrag(el.id, "move", e)}
        className={`cursor-move select-none group ${isSel ? "ring-1 ring-gray-400/60" : ""}`}
      >
        {el.type === "image" && (
          el.defaultImage ? (
            <div style={{ borderRadius }} className="w-full h-full overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={el.defaultImage} alt={el.label} draggable={false} style={{ transform: `translate(${el.imgX ?? 0}%, ${el.imgY ?? 0}%) scale(${el.imgScale ?? 1})` }} className="w-full h-full object-cover" />
              {grad && <div style={{ background: grad, borderRadius }} className="absolute inset-0 pointer-events-none mix-blend-overlay" />}
              {isSel && (
                <>
                  <div
                    onPointerDown={(e) => startDrag(el.id, "imgscale", e)}
                    title="Image zoom — drag karo"
                    className="absolute bottom-1 right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => startDrag(el.id, "imgpan", e)}
                    title="Image adjust — up/down/left/right drag karo"
                    className="absolute bottom-1 left-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-move shadow"
                  />
                </>
              )}
            </div>
          ) : (
            <div style={{ borderRadius }} className="w-full h-full bg-gray-200/90 flex flex-col items-center justify-center overflow-hidden">
              <ImageIcon className="w-5 h-5 text-gray-500" />
              <span className="text-[9px] text-gray-500 font-medium px-1 text-center leading-tight">{el.label}</span>
            </div>
          )
        )}
        {el.type === "text" && (
          <div
            style={{ fontFamily: el.fontFamily, fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight as React.CSSProperties["fontWeight"], color: grad ? undefined : el.color, textAlign: el.align, borderRadius }}
            className="w-full h-full bg-white/60 flex items-center overflow-hidden px-1"
          >
            <span
              className="w-full leading-tight"
              style={{
                textAlign: el.align,
                ...shadowCss(el),
                ...(grad ? { backgroundImage: grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : {}),
              }}
            >
              {el.text}
            </span>
          </div>
        )}
        {el.type === "frame" && (
          <div style={{ background: grad ?? el.fill, borderRadius }} className="w-full h-full" />
        )}
        {/* Resize handle */}
        {isSel && (
          <div
            onPointerDown={(e) => startDrag(el.id, "resize", e)}
            className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-orange-500 border-2 border-white rounded-full cursor-se-resize shadow"
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Google Fonts for canvas preview */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Amatic+SC:wght@400;700&family=Dancing+Script&family=Poppins:wght@400;600&display=swap"
        rel="stylesheet"
      />
      {allCustomFonts.filter((f) => f.url).map((f) => (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link key={f.url} href={f.url} rel="stylesheet" />
      ))}
      {allCustomFonts.some((f) => f.dataUrl) && (
        <style>{allCustomFonts.filter((f) => f.dataUrl).map((f) =>
          `@font-face{font-family:${f.family.split(",")[0]};src:url(${f.dataUrl});font-display:swap;}`
        ).join("\n")}</style>
      )}

      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-gray-900">🖼️ Frame Designer</h2>
        <div className="flex items-center gap-2">
          <button onClick={newTemplate} className="flex items-center gap-1 text-xs font-semibold text-orange-500 border border-orange-300 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
          <button onClick={saveTemplate} disabled={saving} className="flex items-center gap-1 text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg transition-colors">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">Product template banao — image box, text box aur frames drag karke set karo</p>

      {msg && <p className="text-xs mb-3 font-medium text-gray-700">{msg}</p>}

      {/* Template tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {templates.map((t) => (
          <div key={t.id} className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs cursor-pointer transition-colors ${activeId === t.id ? "border-orange-500 bg-orange-50 text-orange-600 font-semibold" : "border-gray-200 text-gray-600 hover:border-orange-300"}`}>
            <span onClick={() => openTemplate(t)}>{t.name}</span>
            <button onClick={() => deleteTemplate(t.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        {templates.length === 0 && <span className="text-xs text-gray-400">Abhi koi template nahi — elements add karke Save karo</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] lg:grid-cols-[180px_1fr_240px] gap-4">
        {/* ── Left: Insert palette ── */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Template Name</label>
            <input className={inputClass} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Watch 3-photo" />
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-2">Create frame</div>
            <div className="p-2 space-y-1.5">
              <details className="border border-gray-200 rounded-lg" open>
                <summary className="cursor-pointer px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 select-none">▸ Insert frame</summary>
                <div className="flex gap-2 p-2.5 pt-1">
                  <button onClick={() => addFrame("rect")} title="Rectangle frame" className="w-9 h-7 border-2 border-gray-800 rounded-sm hover:bg-orange-50" />
                  <button onClick={() => addFrame("ellipse")} title="Ellipse frame" className="w-9 h-7 border-2 border-gray-800 rounded-full hover:bg-orange-50" />
                  <button onClick={() => addFrame("rounded")} title="Rounded frame" className="w-9 h-7 border-2 border-gray-800 rounded-lg hover:bg-orange-50" />
                </div>
              </details>
              <details className="border border-gray-200 rounded-lg" open>
                <summary className="cursor-pointer px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 select-none">▸ Insert img box</summary>
                <div className="flex gap-2 p-2.5 pt-1">
                  <button onClick={() => addImageBox("rect")} title="Rectangle image box" className="w-9 h-9 border-2 border-gray-800 rounded-sm hover:bg-orange-50 flex items-center justify-center"><Square className="w-3.5 h-3.5" /></button>
                  <button onClick={() => addImageBox("ellipse")} title="Circle image box" className="w-9 h-9 border-2 border-gray-800 rounded-full hover:bg-orange-50 flex items-center justify-center"><Circle className="w-3.5 h-3.5" /></button>
                  <button onClick={() => addImageBox("rounded")} title="Rounded image box" className="w-9 h-9 border-2 border-blue-500 rounded-xl hover:bg-orange-50 flex items-center justify-center text-blue-500"><Square className="w-3.5 h-3.5" /></button>
                </div>
              </details>
              <details className="border border-gray-200 rounded-lg" open>
                <summary className="cursor-pointer px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 select-none">▸ Insert text box</summary>
                <div className="p-2.5 pt-1">
                  <button onClick={addTextBox} className="w-full flex items-center justify-center gap-1.5 border-2 border-gray-800 rounded-lg py-2 text-xs font-semibold hover:bg-orange-50">
                    <Type className="w-3.5 h-3.5" /> Text box
                  </button>
                </div>
              </details>
            </div>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom((z) => Math.max(0.4, num(z - 0.15)))} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-semibold text-gray-600 flex-1 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, num(z + 0.15)))} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ZoomIn className="w-4 h-4" /></button>
          </div>

          {/* Background image */}
          <div className="border border-gray-200 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-semibold text-gray-500">Background Image</p>
            <p className="text-[9px] text-gray-400">Customer isko change nahi kar sakta</p>
            <label className="flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
              {uploadingBg ? "Uploading..." : "⬆️ Upload Background"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingBg}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingBg(true);
                  const url = await uploadFile(file);
                  if (url) await setBgWithAspect(url);
                  setUploadingBg(false);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="flex gap-1.5">
              <button onClick={() => setBgWithAspect(productImage)} className="flex-1 text-[10px] border border-gray-200 rounded-lg py-1 hover:bg-gray-50">Product image</button>
              <button onClick={() => setBgWithAspect(null)} className="flex-1 text-[10px] border border-gray-200 rounded-lg py-1 hover:bg-gray-50">Blank</button>
            </div>
            {bgImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bgImage} alt="bg" className="w-full h-14 object-cover rounded-lg border border-gray-100" />
            )}
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div className="overflow-auto bg-gray-100 rounded-xl p-4 flex items-start justify-center" style={{ maxHeight: 640 }}>
          <div
            ref={canvasRef}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerDown={() => setSelectedId(null)}
            className="relative bg-white shadow-lg shrink-0 overflow-hidden"
            style={{
              width: 420 * zoom,
              height: (420 / (options.bgAspect || 1)) * zoom,
              backgroundImage: bgImage ? `url(${bgImage})` : "repeating-conic-gradient(#f3f4f6 0% 25%, #ffffff 0% 50%)",
              backgroundSize: bgImage ? "100% 100%" : "24px 24px",
              backgroundPosition: "center",
            }}
          >
            {[...elements].sort((a, b) => a.z - b.z).map(renderElement)}
          </div>
        </div>

        {/* ── Right: Properties panel ── */}
        <div className="border border-gray-200 rounded-xl p-3 space-y-3 text-xs h-fit">
          {!selected ? (
            <div className="text-gray-400 text-center py-8">
              <p className="font-medium">Koi element select karo</p>
              <p className="text-[10px] mt-1">Canvas pe element pe click karo — phir yahan properties aayengi</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-800 capitalize">{selected.type} properties</p>
                <div className="flex gap-1">
                  <button onClick={duplicateSelected} title="Duplicate" className="p-1 border border-gray-200 rounded hover:bg-gray-50"><Copy className="w-3 h-3" /></button>
                  <button onClick={removeSelected} title="Delete" className="p-1 border border-gray-200 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-0.5">Label Name</label>
                <input className={inputClass} value={selected.label} onChange={(e) => updateSelected({ label: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-gray-500 mb-0.5">X (%)</label><input type="number" className={inputClass} value={num(selected.x)} onChange={(e) => updateSelected({ x: Number(e.target.value) })} /></div>
                <div><label className="block text-gray-500 mb-0.5">Y (%)</label><input type="number" className={inputClass} value={num(selected.y)} onChange={(e) => updateSelected({ y: Number(e.target.value) })} /></div>
                <div><label className="block text-gray-500 mb-0.5">Width (%)</label><input type="number" className={inputClass} value={num(selected.w)} onChange={(e) => updateSelected({ w: Number(e.target.value) })} /></div>
                <div><label className="block text-gray-500 mb-0.5">Height (%)</label><input type="number" className={inputClass} value={num(selected.h)} onChange={(e) => updateSelected({ h: Number(e.target.value) })} /></div>
                <div><label className="block text-gray-500 mb-0.5">Border Radius</label><input type="number" className={inputClass} value={selected.radius} onChange={(e) => updateSelected({ radius: Number(e.target.value) })} /></div>
                <div><label className="block text-gray-500 mb-0.5">Rotation (°)</label><input type="number" className={inputClass} value={selected.rotation} onChange={(e) => updateSelected({ rotation: Number(e.target.value) })} /></div>
              </div>

              {/* Layer */}
              <div>
                <label className="block text-gray-500 mb-0.5">Layer (Z-index: {selected.z})</label>
                <div className="flex gap-2">
                  <button onClick={() => moveLayer(1)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50"><ChevronUp className="w-3 h-3" /> Upar</button>
                  <button onClick={() => moveLayer(-1)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50"><ChevronDown className="w-3 h-3" /> Niche</button>
                </div>
              </div>

              {/* ── Shadow (per-element) ── */}
              <div className="border-t border-gray-100 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.shadowOn ?? false}
                    onChange={(e) => updateSelected({
                      shadowOn: e.target.checked,
                      ...(e.target.checked && selected.shadowColor === undefined
                        ? { shadowType: "outer" as const, shadowColor: "#000000", shadowBlur: 10, shadowX: 0, shadowY: 4 }
                        : {}),
                    })}
                    className="w-3.5 h-3.5 accent-orange-500"
                  />
                  <span className="font-bold text-gray-800">🌑 Shadow</span>
                </label>
                {selected.shadowOn && (
                  <div className="mt-2 space-y-2 pl-5">
                    <div className="flex gap-1.5">
                      {(["outer", "inner"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => updateSelected({ shadowType: t })}
                          className={`flex-1 py-1.5 rounded-lg capitalize ${(selected.shadowType ?? "outer") === t ? "bg-orange-500 text-white font-semibold" : "bg-gray-100 text-gray-600"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-12 shrink-0">Color</span>
                      <input type="color" value={selected.shadowColor ?? "#000000"} onChange={(e) => updateSelected({ shadowColor: e.target.value })} className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0" />
                      <input className={inputClass + " flex-1 font-mono"} value={selected.shadowColor ?? "#000000"} onChange={(e) => updateSelected({ shadowColor: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-0.5">Size / Blur: {selected.shadowBlur ?? 10}px</label>
                      <input type="range" min={0} max={60} value={selected.shadowBlur ?? 10} onChange={(e) => updateSelected({ shadowBlur: Number(e.target.value) })} className="w-full accent-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-500 mb-0.5">Offset X</label>
                        <input type="number" className={inputClass} value={selected.shadowX ?? 0} onChange={(e) => updateSelected({ shadowX: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-0.5">Offset Y</label>
                        <input type="number" className={inputClass} value={selected.shadowY ?? 4} onChange={(e) => updateSelected({ shadowY: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Gradient (per-element, admin only) ── */}
              <div className="border-t border-gray-100 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.gradOn ?? false}
                    onChange={(e) => updateSelected({
                      gradOn: e.target.checked,
                      ...(e.target.checked && selected.gradColor1 === undefined
                        ? { gradColor1: "#d4af37", gradColor2: "#ffffff", gradAngle: 135, gradIntensity: 50 }
                        : {}),
                    })}
                    className="w-3.5 h-3.5 accent-orange-500"
                  />
                  <span className="font-bold text-gray-800">🎨 Gradient</span>
                </label>
                {selected.gradOn && (
                  <div className="mt-2 space-y-2 pl-5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-12 shrink-0">Color 1</span>
                      <input type="color" value={selected.gradColor1 ?? "#d4af37"} onChange={(e) => updateSelected({ gradColor1: e.target.value })} className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0" />
                      <input className={inputClass + " flex-1 font-mono"} value={selected.gradColor1 ?? "#d4af37"} onChange={(e) => updateSelected({ gradColor1: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-12 shrink-0">Color 2</span>
                      <input type="color" value={selected.gradColor2 ?? "#ffffff"} onChange={(e) => updateSelected({ gradColor2: e.target.value })} className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0" />
                      <input className={inputClass + " flex-1 font-mono"} value={selected.gradColor2 ?? "#ffffff"} onChange={(e) => updateSelected({ gradColor2: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-0.5">Direction: {selected.gradAngle ?? 135}°</label>
                      <input type="range" min={0} max={360} value={selected.gradAngle ?? 135} onChange={(e) => updateSelected({ gradAngle: Number(e.target.value) })} className="w-full accent-orange-500" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-0.5">Intensity: {selected.gradIntensity ?? 50}%</label>
                      <input type="range" min={0} max={100} value={selected.gradIntensity ?? 50} onChange={(e) => updateSelected({ gradIntensity: Number(e.target.value) })} className="w-full accent-orange-500" />
                    </div>
                    <div style={{ background: gradientCss(selected) ?? undefined }} className="h-6 rounded-lg" />
                  </div>
                )}
              </div>

              {/* Image box props */}
              {selected.type === "image" && (
                <div>
                  <label className="block text-gray-500 mb-0.5">Default Image (customer change kar sakta hai)</label>
                  <label className="flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                    {uploadingImg ? "Uploading..." : selected.defaultImage ? "🔄 Change Image" : "⬆️ Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImg}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        // Crop first — box ke preset shape mein
                        if (file && selected) setCropState({ file, elId: selected.id, aspect: (selected.w / selected.h) * (options.bgAspect || 1) });
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {selected.defaultImage && (
                    <>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 shrink-0">Image Zoom</span>
                        <input
                          type="range" min={0.3} max={4} step={0.05}
                          value={selected.imgScale ?? 1}
                          onChange={(e) => updateSelected({ imgScale: Number(e.target.value) })}
                          className="flex-1 accent-orange-500"
                        />
                        <span className="text-[10px] font-semibold w-9 text-right">{Math.round((selected.imgScale ?? 1) * 100)}%</span>
                      </div>
                      <button onClick={() => updateSelected({ defaultImage: undefined, imgScale: undefined })} className="mt-1.5 text-[10px] text-red-500 hover:underline">✕ Image hatao</button>
                    </>
                  )}
                </div>
              )}

              {/* Text props */}
              {selected.type === "text" && (
                <>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Default Text</label>
                    <input className={inputClass} value={selected.text ?? ""} onChange={(e) => updateSelected({ text: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Font Family</label>
                    <select className={inputClass + " bg-white"} value={selected.fontFamily} onChange={(e) => updateSelected({ fontFamily: e.target.value })}>
                      {[...FONTS, ...allCustomFonts.map((f) => ({ value: f.family, label: f.label + " (custom)" }))].map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-gray-500 mb-0.5">Font Size</label><input type="number" className={inputClass} value={selected.fontSize} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} /></div>
                    <div>
                      <label className="block text-gray-500 mb-0.5">Font Weight</label>
                      <select className={inputClass + " bg-white"} value={selected.fontWeight} onChange={(e) => updateSelected({ fontWeight: e.target.value })}>
                        <option value="400">Normal</option><option value="600">Semi Bold</option><option value="700">Bold</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Text Alignment</label>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map((a) => (
                        <button key={a} onClick={() => updateSelected({ align: a })} className={`flex-1 border rounded-lg py-1.5 capitalize ${selected.align === a ? "border-orange-500 bg-orange-50 text-orange-600 font-semibold" : "border-gray-200"}`}>{a}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Text Color</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_COLORS.map((c) => (
                        <button key={c} onClick={() => updateSelected({ color: c })} style={{ background: c }} className={`w-6 h-6 rounded border-2 ${selected.color === c ? "border-orange-500 scale-110" : "border-gray-200"}`} />
                      ))}
                      <input type="color" value={selected.color ?? "#1c1c1c"} onChange={(e) => updateSelected({ color: e.target.value })} className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0" />
                    </div>
                  </div>
                </>
              )}

              {/* Frame props */}
              {selected.type === "frame" && (
                <div>
                  <label className="block text-gray-500 mb-0.5">Default Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_COLORS.map((c) => (
                      <button key={c} onClick={() => updateSelected({ fill: c })} style={{ background: c }} className={`w-6 h-6 rounded border-2 ${selected.fill === c ? "border-orange-500 scale-110" : "border-gray-200"}`} />
                    ))}
                    <input type="color" value={selected.fill ?? "#f97316"} onChange={(e) => updateSelected({ fill: e.target.value })} className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Layer list */}
          {elements.length > 0 && (
            <div className="border-t border-gray-100 pt-2">
              <p className="text-[10px] font-semibold text-gray-500 mb-1">Layers ({elements.length})</p>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {[...elements].sort((a, b) => b.z - a.z).map((el) => (
                  <button
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left ${selectedId === el.id ? "bg-orange-50 text-orange-600 font-semibold" : "hover:bg-gray-50 text-gray-600"}`}
                  >
                    {el.type === "image" ? <ImageIcon className="w-3 h-3" /> : el.type === "text" ? <Type className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                    <span className="truncate flex-1">{el.label}</span>
                    <span className="text-[9px] text-gray-400">z{el.z}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Customer Options — jo customer choose kar sakega ── */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-900 mb-1">🎛️ Customer Options</h3>
        <p className="text-xs text-gray-400 mb-4">
          Customer sirf yahi options choose kar payega — design/layout locked rahega. Chips pe click karke allow/remove karo.
        </p>
        <div className="grid md:grid-cols-2 gap-4">

          {/* Frame Color */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-800 mb-2">Frame Color (allowed)</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {options.frameColors.allowed.map((c) => (
                <button
                  key={c}
                  onClick={() => setOptions((o) => ({ ...o, frameColors: { allowed: o.frameColors.allowed.filter((x) => x !== c), default: o.frameColors.default === c ? (o.frameColors.allowed.find((x) => x !== c) ?? "") : o.frameColors.default } }))}
                  title="Click = remove"
                  style={{ background: c }}
                  className={`w-8 h-8 rounded-lg border-2 ${options.frameColors.default === c ? "border-orange-500 ring-2 ring-orange-200" : "border-gray-200"}`}
                />
              ))}
              <input
                type="color"
                title="Naya color add karo"
                onChange={(e) => {
                  const c = e.target.value;
                  setOptions((o) => o.frameColors.allowed.includes(c) ? o : { ...o, frameColors: { ...o.frameColors, allowed: [...o.frameColors.allowed, c] } });
                }}
                className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer p-0"
              />
            </div>
            {/* Editable color code */}
            <ColorCodeInput onAdd={(c) => setOptions((o) => o.frameColors.allowed.includes(c) ? o : ({ ...o, frameColors: { ...o.frameColors, allowed: [...o.frameColors.allowed, c] } }))} />
            <label className="block text-[10px] text-gray-500 mb-0.5 mt-2">Default color</label>
            <div className="flex flex-wrap gap-1.5">
              {options.frameColors.allowed.map((c) => (
                <button key={c} onClick={() => setOptions((o) => ({ ...o, frameColors: { ...o.frameColors, default: c } }))} style={{ background: c }} className={`w-5 h-5 rounded border ${options.frameColors.default === c ? "border-orange-500 scale-110" : "border-gray-200"}`} />
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-800 mb-2">Text Color (allowed)</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {options.textColors.allowed.map((c) => (
                <button
                  key={c}
                  onClick={() => setOptions((o) => ({ ...o, textColors: { allowed: o.textColors.allowed.filter((x) => x !== c), default: o.textColors.default === c ? (o.textColors.allowed.find((x) => x !== c) ?? "") : o.textColors.default } }))}
                  title="Click = remove"
                  style={{ background: c }}
                  className={`w-8 h-8 rounded-lg border-2 ${options.textColors.default === c ? "border-orange-500 ring-2 ring-orange-200" : "border-gray-200"}`}
                />
              ))}
              <input
                type="color"
                title="Naya color add karo"
                onChange={(e) => {
                  const c = e.target.value;
                  setOptions((o) => o.textColors.allowed.includes(c) ? o : { ...o, textColors: { ...o.textColors, allowed: [...o.textColors.allowed, c] } });
                }}
                className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer p-0"
              />
            </div>
            {/* Editable color code */}
            <ColorCodeInput onAdd={(c) => setOptions((o) => o.textColors.allowed.includes(c) ? o : ({ ...o, textColors: { ...o.textColors, allowed: [...o.textColors.allowed, c] } }))} />
            <label className="block text-[10px] text-gray-500 mb-0.5 mt-2">Default color</label>
            <div className="flex flex-wrap gap-1.5">
              {options.textColors.allowed.map((c) => (
                <button key={c} onClick={() => setOptions((o) => ({ ...o, textColors: { ...o.textColors, default: c } }))} style={{ background: c }} className={`w-5 h-5 rounded border ${options.textColors.default === c ? "border-orange-500 scale-110" : "border-gray-200"}`} />
              ))}
            </div>
          </div>

          {/* Font Style */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-800 mb-2">Font Style (allowed)</p>
            <details className="mb-3 border border-gray-200 rounded-lg">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-gray-600 select-none">
                📂 Font list kholo ({options.fonts.allowed.length} allowed)
              </summary>
            <div className="space-y-1 p-3 pt-1 max-h-56 overflow-y-auto">
              {[...FONTS.map((f) => ({ ...f, custom: false })), ...allCustomFonts.map((f) => ({ value: f.family, label: f.label, custom: true }))].map((f) => {
                const checked = options.fonts.allowed.includes(f.value);
                return (
                  <label key={f.value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setOptions((o) => ({
                        ...o,
                        fonts: {
                          allowed: e.target.checked ? [...o.fonts.allowed, f.value] : o.fonts.allowed.filter((x) => x !== f.value),
                          default: !e.target.checked && o.fonts.default === f.value ? (o.fonts.allowed.find((x) => x !== f.value) ?? "") : o.fonts.default,
                        },
                      }))}
                      className="w-3.5 h-3.5 accent-orange-500"
                    />
                    <span style={{ fontFamily: f.value }} className={checked ? "text-gray-900" : "text-gray-400"}>{f.label}</span>
                    {options.fonts.default === f.value && <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">DEFAULT</span>}
                    {checked && options.fonts.default !== f.value && (
                      <button onClick={(e) => { e.preventDefault(); setOptions((o) => ({ ...o, fonts: { ...o.fonts, default: f.value } })); }} className="text-[9px] text-gray-400 hover:text-orange-500 underline">set default</button>
                    )}
                    {f.custom && (
                      <button
                        onClick={(e) => { e.preventDefault(); deleteFontFromLibrary(f.value); }}
                        title="Font library se delete karo"
                        className="ml-auto text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </label>
                );
              })}
            </div>
            </details>
            {/* Add external Google Font */}
            <label className="block text-[10px] text-gray-500 mb-1">Naya font add karo (Google Fonts se — sirf naam likho)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                placeholder="e.g. Lobster, Pacifico, Great Vibes"
                value={newFontName}
                onChange={(e) => setNewFontName(e.target.value)}
              />
              <button
                onClick={() => {
                  const name = newFontName.trim();
                  if (!name) return;
                  const family = `'${name}', sans-serif`;
                  const url = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:wght@400;700&display=swap`;
                  addFontToLibrary({ label: name, family, url });
                  setNewFontName("");
                }}
                className="text-xs font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700"
              >
                + Add Font
              </button>
            </div>
            {/* Upload downloaded font files (.ttf/.otf/.woff) — multiple */}
            <label className="mt-2 flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
              ⬆️ Font file upload karo (.ttf / .otf / .woff — multiple)
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  for (const file of files) {
                    const reader = new FileReader();
                    const name = file.name.replace(/\.(ttf|otf|woff2?)$/i, "").replace(/[-_]/g, " ").trim();
                    reader.onload = () => {
                      const family = `'${name}', sans-serif`;
                      addFontToLibrary({ label: name, family, dataUrl: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {/* Acrylic Mirror Text */}
          <div className="border border-gray-200 rounded-xl p-4 md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={options.acrylicMirror?.enabled ?? false}
                onChange={(e) => setOptions((o) => ({ ...o, acrylicMirror: { ...(o.acrylicMirror ?? { allowed: [], default: "Normal Gold" }), enabled: e.target.checked } }))}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-xs font-bold text-gray-800">✨ Acrylic Mirror Text Enable</span>
              <span className="text-[10px] text-gray-400">(4mm mirror finish, 3D raised text — normal colors bhi rahenge)</span>
            </label>
            {options.acrylicMirror?.enabled && (
              <div className="pl-6 space-y-2">
                <p className="text-[10px] text-gray-500">Allowed mirror finishes (customer inme se choose karega):</p>
                <div className="flex flex-wrap gap-3">
                  {ACRYLIC_MIRROR_COLORS.map((c) => {
                    const on = options.acrylicMirror!.allowed.includes(c.label);
                    const isDefault = options.acrylicMirror!.default === c.label;
                    return (
                      <button
                        key={c.label}
                        onClick={() => setOptions((o) => {
                          const am = o.acrylicMirror!;
                          const allowed = on ? am.allowed.filter((x) => x !== c.label) : [...am.allowed, c.label];
                          return { ...o, acrylicMirror: { ...am, allowed, default: allowed.includes(am.default) ? am.default : (allowed[0] ?? "") } };
                        })}
                        className="flex flex-col items-center gap-1"
                        title={on ? "Click = remove" : "Click = allow"}
                      >
                        <span
                          style={{ background: c.gradient }}
                          className={`w-11 h-11 rounded-xl shadow-inner transition-transform ${on ? "ring-2 ring-orange-500 scale-105" : "opacity-40"}`}
                        />
                        <span className={`text-[9px] leading-tight text-center max-w-[62px] ${on ? "text-gray-700 font-medium" : "text-gray-400"}`}>{c.label}</span>
                        {isDefault && <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded-full font-bold">DEFAULT</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-gray-500">Default:</span>
                  {options.acrylicMirror.allowed.map((label) => (
                    <button
                      key={label}
                      onClick={() => setOptions((o) => ({ ...o, acrylicMirror: { ...o.acrylicMirror!, default: label } }))}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${options.acrylicMirror!.default === label ? "bg-orange-500 text-white font-bold" : "bg-gray-100 text-gray-600"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Size */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-800 mb-2">Text Size (fixed choices)</p>
            <div className="space-y-1">
              {TEXT_SIZE_PRESETS.map((s) => {
                const checked = options.textSizes.allowed.some((x) => x.px === s.px);
                return (
                  <label key={s.px} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setOptions((o) => ({
                        ...o,
                        textSizes: {
                          allowed: e.target.checked ? [...o.textSizes.allowed, s].sort((a, b) => a.px - b.px) : o.textSizes.allowed.filter((x) => x.px !== s.px),
                          default: !e.target.checked && o.textSizes.default === s.px ? (o.textSizes.allowed.find((x) => x.px !== s.px)?.px ?? 24) : o.textSizes.default,
                        },
                      }))}
                      className="w-3.5 h-3.5 accent-orange-500"
                    />
                    <span className={checked ? "text-gray-900" : "text-gray-400"}>{s.label} ({s.px}px)</span>
                    {options.textSizes.default === s.px && <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">DEFAULT</span>}
                    {checked && options.textSizes.default !== s.px && (
                      <button onClick={(e) => { e.preventDefault(); setOptions((o) => ({ ...o, textSizes: { ...o.textSizes, default: s.px } })); }} className="text-[9px] text-gray-400 hover:text-orange-500 underline">set default</button>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Crop modal for image box default image */}
      {cropState && (
        <CropModal
          file={cropState.file}
          aspect={cropState.aspect}
          onCancel={() => setCropState(null)}
          onDone={async (cropped) => {
            setCropState(null);
            setUploadingImg(true);
            const url = await uploadFile(cropped);
            if (url) updateSelected({ defaultImage: url });
            setUploadingImg(false);
          }}
        />
      )}
    </div>
  );
}
