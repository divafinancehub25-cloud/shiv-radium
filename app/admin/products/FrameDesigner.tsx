"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Image as ImageIcon, Type, Square, Circle, ZoomIn, ZoomOut, ChevronUp, ChevronDown, Copy } from "lucide-react";

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
};

type Template = {
  id: string;
  name: string;
  elements: FrameElement[];
  bgImage: string | null;
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function FrameDesigner({ productId, productImage }: { productId: string; productImage: string | null }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [elements, setElements] = useState<FrameElement[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [bgImage, setBgImage] = useState<string | null>(productImage);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; startX: number; startY: number; orig: FrameElement } | null>(null);

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  // ── Load templates ──
  const loadTemplates = useCallback(async () => {
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
    setSelectedId(null);
  }

  function newTemplate() {
    setActiveId(null);
    setTemplateName(`Template ${templates.length + 1}`);
    setElements([]);
    setBgImage(productImage);
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
  function startDrag(id: string, mode: "move" | "resize", e: React.PointerEvent) {
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
      return { ...el, w: Math.max(4, Math.min(140, d.orig.w + dx)), h: Math.max(3, Math.min(140, d.orig.h + dy)) };
    }));
  }

  function endDrag() {
    dragRef.current = null;
  }

  // ── Save ──
  async function saveTemplate() {
    if (!templateName.trim()) { setMsg("Template ka naam do"); return; }
    setSaving(true);
    setMsg("");
    try {
      const body = { productId, name: templateName.trim(), elements, bgImage };
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
    };
    return (
      <div
        key={el.id}
        style={common}
        onPointerDown={(e) => startDrag(el.id, "move", e)}
        className={`cursor-move select-none group ${isSel ? "ring-2 ring-orange-500" : "hover:ring-1 hover:ring-orange-300"}`}
      >
        {el.type === "image" && (
          <div style={{ borderRadius }} className="w-full h-full bg-gray-200/90 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center overflow-hidden">
            <ImageIcon className="w-5 h-5 text-gray-500" />
            <span className="text-[9px] text-gray-500 font-medium px-1 text-center leading-tight">{el.label}</span>
          </div>
        )}
        {el.type === "text" && (
          <div
            style={{ fontFamily: el.fontFamily, fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight as React.CSSProperties["fontWeight"], color: el.color, textAlign: el.align, borderRadius }}
            className="w-full h-full bg-white/60 border border-dashed border-gray-400 flex items-center overflow-hidden px-1"
          >
            <span className="w-full leading-tight" style={{ textAlign: el.align }}>{el.text}</span>
          </div>
        )}
        {el.type === "frame" && (
          <div style={{ background: el.fill, borderRadius }} className="w-full h-full" />
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

      <div className="grid lg:grid-cols-[180px_1fr_240px] gap-4">
        {/* ── Left: Insert palette ── */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Template Name</label>
            <input className={inputClass} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Watch 3-photo" />
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-2">Create frame</div>
            <div className="p-3">
              <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Insert frame</p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => addFrame("rect")} title="Rectangle frame" className="w-9 h-7 border-2 border-gray-800 rounded-sm hover:bg-orange-50" />
                <button onClick={() => addFrame("ellipse")} title="Ellipse frame" className="w-9 h-7 border-2 border-gray-800 rounded-full hover:bg-orange-50" />
                <button onClick={() => addFrame("rounded")} title="Rounded frame" className="w-9 h-7 border-2 border-gray-800 rounded-lg hover:bg-orange-50" />
              </div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Insert img box</p>
              <div className="flex gap-2 mb-3">
                <button onClick={() => addImageBox("rect")} title="Rectangle image box" className="w-9 h-9 border-2 border-gray-800 rounded-sm hover:bg-orange-50 flex items-center justify-center"><Square className="w-3.5 h-3.5" /></button>
                <button onClick={() => addImageBox("ellipse")} title="Circle image box" className="w-9 h-9 border-2 border-gray-800 rounded-full hover:bg-orange-50 flex items-center justify-center"><Circle className="w-3.5 h-3.5" /></button>
                <button onClick={() => addImageBox("rounded")} title="Rounded image box" className="w-9 h-9 border-2 border-blue-500 rounded-xl hover:bg-orange-50 flex items-center justify-center text-blue-500"><Square className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Insert text box</p>
              <button onClick={addTextBox} className="w-full flex items-center justify-center gap-1.5 border-2 border-gray-800 rounded-lg py-2 text-xs font-semibold hover:bg-orange-50">
                <Type className="w-3.5 h-3.5" /> Text box
              </button>
            </div>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom((z) => Math.max(0.4, num(z - 0.15)))} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-semibold text-gray-600 flex-1 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, num(z + 0.15)))} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ZoomIn className="w-4 h-4" /></button>
          </div>

          {/* Background toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
            <input type="checkbox" checked={!!bgImage} onChange={(e) => setBgImage(e.target.checked ? productImage : null)} className="w-3.5 h-3.5 accent-orange-500" />
            Product image background
          </label>
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
              height: 420 * zoom,
              backgroundImage: bgImage ? `url(${bgImage})` : "repeating-conic-gradient(#f3f4f6 0% 25%, #ffffff 0% 50%)",
              backgroundSize: bgImage ? "cover" : "24px 24px",
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
                      {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
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
    </div>
  );
}
