"use client";

import { useState } from "react";
import { Upload, Save, Plus, Trash2 } from "lucide-react";

type Slide = { badge: string; title1: string; title2: string; subtitle: string; emoji: string; bg: string; image?: string; fullImage?: string; link?: string };
type HomepageConfig = {
  slider: { enabled: boolean; interval: number; motion: string; slides: Slide[]; desktopHeight: number; mobileHeight: number };
  flashDeal: { enabled: boolean; label: string; title: string; highlight: string; subtitle: string; link: string; image?: string };
  story: { enabled: boolean; videoUrl: string; whatsapp: string; instagram: string; facebook: string };
  sectionOrder: string[];
};
type ThemeConfig = { primary: string; searchPlaceholder: string; icons: { wishlist: boolean; cart: boolean; bell: boolean }; logoHeight: number; categoryStyle: { size: string; shape: string } };

const SECTION_LABELS: Record<string, string> = {
  slider: "🎠 Homepage Slider",
  categories: "🗂️ Category Menu",
  flashStory: "⚡ Flash Deal + Our Story",
  featured: "⭐ Featured Products",
  howItWorks: "🛠️ How It Works",
  testimonials: "💬 Testimonials",
  cta: "📣 CTA Banner",
};
const DEFAULT_SECTION_ORDER = ["slider", "categories", "flashStory", "featured", "howItWorks", "testimonials", "cta"];

const BG_PRESETS = [
  { label: "🟠 Orange-Brown", value: "from-[#3a1a00] to-[#7a3500]" },
  { label: "🟣 Purple", value: "from-[#1a003a] to-[#3a0070]" },
  { label: "🔵 Blue", value: "from-[#001a3a] to-[#003a7a]" },
  { label: "🟢 Green", value: "from-[#00301a] to-[#006a3a]" },
  { label: "🔴 Red", value: "from-[#3a0000] to-[#7a0f00]" },
  { label: "⚫ Black", value: "from-[#111111] to-[#333333]" },
];

const DEFAULT_HOMEPAGE: HomepageConfig = {
  sectionOrder: DEFAULT_SECTION_ORDER,
  slider: {
    enabled: true, interval: 4, motion: "slide", desktopHeight: 320, mobileHeight: 180,
    slides: [
      { badge: "NEW ARRIVAL", title1: "Personalized", title2: "LED PHOTO FRAME", subtitle: "Make Your Memories More Beautiful", emoji: "🖼️", bg: BG_PRESETS[0].value },
      { badge: "BESTSELLER", title1: "Custom Name", title2: "BOARDS & PLATES", subtitle: "Your Name, Your Style, Your Door", emoji: "🪧", bg: BG_PRESETS[1].value },
      { badge: "TRENDING", title1: "Couple Gift", title2: "LED FRAMES", subtitle: "Perfect for Anniversaries & Birthdays", emoji: "💑", bg: BG_PRESETS[2].value },
    ],
  },
  flashDeal: { enabled: true, label: "⚡ FLASH DEAL", title: "Flat", highlight: "40% OFF", subtitle: "On Customized Photo Frames", link: "/products" },
  story: { enabled: true, videoUrl: "", whatsapp: "", instagram: "", facebook: "" },
};
const DEFAULT_THEME: ThemeConfig = { primary: "#f97316", searchPlaceholder: "Search for products...", icons: { wishlist: true, cart: true, bell: true }, logoHeight: 40, categoryStyle: { size: "md", shape: "rounded" } };

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return { ...fallback, ...JSON.parse(raw) }; } catch { return fallback; }
}

export default function SettingsForm({ settings, razorpaySet }: { settings: Record<string, string>; razorpaySet: boolean }) {
  const [form, setForm] = useState({
    store_name: settings.store_name ?? "Shiv Radium",
    store_phone: settings.store_phone ?? "",
    store_email: settings.store_email ?? "",
    store_logo: settings.store_logo ?? "",
    shipping_free_above: settings.shipping_free_above ?? "999",
    shipping_charge: settings.shipping_charge ?? "99",
    gift_wrapping_enabled: settings.gift_wrapping_enabled ?? "true",
    gift_wrapping_charge: settings.gift_wrapping_charge ?? "49",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [homepage, setHomepage] = useState<HomepageConfig>(() => {
    const p = parseJson(settings.homepage_config, DEFAULT_HOMEPAGE);
    return {
      ...p,
      slider: { ...DEFAULT_HOMEPAGE.slider, ...p.slider },
      flashDeal: { ...DEFAULT_HOMEPAGE.flashDeal, ...p.flashDeal },
      story: { ...DEFAULT_HOMEPAGE.story, ...p.story },
      sectionOrder: Array.isArray(p.sectionOrder) && p.sectionOrder.length > 0 ? p.sectionOrder : DEFAULT_SECTION_ORDER,
    };
  });
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const p = parseJson(settings.theme_config, DEFAULT_THEME);
    return { ...p, icons: { ...DEFAULT_THEME.icons, ...p.icons }, categoryStyle: { ...DEFAULT_THEME.categoryStyle, ...(p.categoryStyle ?? {}) }, logoHeight: p.logoHeight ?? 40 };
  });
  const [uploadingSlide, setUploadingSlide] = useState<number | null>(null);

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    return res.ok && data.url ? data.url : null;
  }

  function setSlide(i: number, patch: Partial<Slide>) {
    setHomepage((h) => ({ ...h, slider: { ...h.slider, slides: h.slider.slides.map((s, si) => si === i ? { ...s, ...patch } : s) } }));
  }

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) set("store_logo", data.url);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, homepage_config: JSON.stringify(homepage), theme_config: JSON.stringify(theme) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Store Logo</h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-gray-50">
            {form.store_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.store_logo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-2xl font-bold text-orange-500">SR</span>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Logo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
            {form.store_logo && (
              <button onClick={() => set("store_logo", "")} className="text-xs text-red-400 mt-2 hover:text-red-600 block">Remove logo</button>
            )}
            <p className="text-xs text-gray-400 mt-2">PNG/SVG, transparent background recommended</p>
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Store Info</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
            <input className={inputClass} value={form.store_name} onChange={(e) => set("store_name", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
            <input className={inputClass} placeholder="+91 98765 43210" value={form.store_phone} onChange={(e) => set("store_phone", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
            <input className={inputClass} placeholder="orders@shivradium.com" value={form.store_email} onChange={(e) => set("store_email", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Shipping Charges</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Free Shipping Above (₹)</label>
            <input className={inputClass} type="number" value={form.shipping_free_above} onChange={(e) => set("shipping_free_above", e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Orders above this amount get free shipping</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Standard Shipping Charge (₹)</label>
            <input className={inputClass} type="number" value={form.shipping_charge} onChange={(e) => set("shipping_charge", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Gift Wrapping */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Gift Wrapping</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable Gift Wrapping Option</p>
              <p className="text-xs text-gray-400">Customers can add gift wrapping at checkout</p>
            </div>
            <button
              onClick={() => set("gift_wrapping_enabled", form.gift_wrapping_enabled === "true" ? "false" : "true")}
              className={`w-12 h-6 rounded-full transition-colors ${form.gift_wrapping_enabled === "true" ? "bg-orange-500" : "bg-gray-200"}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.gift_wrapping_enabled === "true" ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          {form.gift_wrapping_enabled === "true" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gift Wrapping Charge (₹)</label>
              <input className={inputClass} type="number" value={form.gift_wrapping_charge} onChange={(e) => set("gift_wrapping_charge", e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* ── Homepage Slider ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">Homepage Slider</h2>
          <button
            onClick={() => setHomepage((h) => ({ ...h, slider: { ...h.slider, enabled: !h.slider.enabled } }))}
            className={`w-12 h-6 rounded-full transition-colors ${homepage.slider.enabled ? "bg-orange-500" : "bg-gray-200"}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${homepage.slider.enabled ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Off karne par homepage se slider hat jayega</p>
        {homepage.slider.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Timer (seconds)</label>
                <input className={inputClass} type="number" min={2} max={20} value={homepage.slider.interval}
                  onChange={(e) => setHomepage((h) => ({ ...h, slider: { ...h.slider, interval: Number(e.target.value) || 4 } }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Motion / Animation</label>
                <select className={inputClass + " bg-white"} value={homepage.slider.motion}
                  onChange={(e) => setHomepage((h) => ({ ...h, slider: { ...h.slider, motion: e.target.value } }))}>
                  <option value="slide">➡️ Slide</option>
                  <option value="fade">🌫️ Fade</option>
                  <option value="zoom">🔍 Zoom</option>
                  <option value="slideUp">⬆️ Slide Up</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">💻 Laptop Banner Height (px)</label>
                <input className={inputClass} type="number" min={100} max={800} value={homepage.slider.desktopHeight}
                  onChange={(e) => setHomepage((h) => ({ ...h, slider: { ...h.slider, desktopHeight: Number(e.target.value) || 320 } }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">📱 Mobile Banner Height (px)</label>
                <input className={inputClass} type="number" min={80} max={500} value={homepage.slider.mobileHeight}
                  onChange={(e) => setHomepage((h) => ({ ...h, slider: { ...h.slider, mobileHeight: Number(e.target.value) || 180 } }))} />
              </div>
            </div>

            {/* Banner slides — sirf full image + link */}
            <div className="space-y-3">
              {homepage.slider.slides.map((slide, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Banner {i + 1}</p>
                    <button
                      onClick={() => setHomepage((h) => ({ ...h, slider: { ...h.slider, slides: h.slider.slides.filter((_, si) => si !== i) } }))}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {slide.fullImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slide.fullImage} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-100 mb-2" />
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">⚠️ Banner image upload karo — bina image ke slide nahi dikhega</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center justify-center gap-1.5 border-2 border-dashed border-orange-200 rounded-xl py-2 text-xs font-semibold cursor-pointer hover:border-orange-400 transition-colors">
                      {uploadingSlide === i ? "Uploading..." : slide.fullImage ? "🔄 Change banner" : "⬆️ Upload banner image"}
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingSlide(i);
                        const url = await uploadFile(file);
                        if (url) setSlide(i, { fullImage: url });
                        setUploadingSlide(null);
                        e.target.value = "";
                      }} />
                    </label>
                    <input className={inputClass} placeholder="Click link (/products)" value={slide.link ?? ""} onChange={(e) => setSlide(i, { link: e.target.value })} />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setHomepage((h) => ({ ...h, slider: { ...h.slider, slides: [...h.slider.slides, { badge: "", title1: "", title2: "", subtitle: "", emoji: "", bg: BG_PRESETS[0].value }] } }))}
                className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 border border-orange-300 hover:bg-orange-50 px-4 py-2 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Banner
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Homepage Section Order ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Homepage Sections — Order</h2>
        <p className="text-xs text-gray-400 mb-4">⬆️⬇️ se sections ka order badlo — homepage pe isi order mein dikhenge</p>
        <div className="space-y-2">
          {homepage.sectionOrder.map((key, i) => (
            <div key={key} className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-2.5">
              <span className="text-sm text-gray-700 flex-1">{SECTION_LABELS[key] ?? key}</span>
              <button
                disabled={i === 0}
                onClick={() => setHomepage((h) => {
                  const arr = [...h.sectionOrder];
                  [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                  return { ...h, sectionOrder: arr };
                })}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30"
              >⬆️</button>
              <button
                disabled={i === homepage.sectionOrder.length - 1}
                onClick={() => setHomepage((h) => {
                  const arr = [...h.sectionOrder];
                  [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                  return { ...h, sectionOrder: arr };
                })}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30"
              >⬇️</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flash Deal ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">Flash Deal Poster</h2>
          <button
            onClick={() => setHomepage((h) => ({ ...h, flashDeal: { ...h.flashDeal, enabled: !h.flashDeal.enabled } }))}
            className={`w-12 h-6 rounded-full transition-colors ${homepage.flashDeal.enabled ? "bg-orange-500" : "bg-gray-200"}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${homepage.flashDeal.enabled ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Off = homepage se poster hat jayega</p>
        {homepage.flashDeal.enabled && (
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Label (⚡ FLASH DEAL)" value={homepage.flashDeal.label} onChange={(e) => setHomepage((h) => ({ ...h, flashDeal: { ...h.flashDeal, label: e.target.value } }))} />
            <input className={inputClass} placeholder="Title (Flat)" value={homepage.flashDeal.title} onChange={(e) => setHomepage((h) => ({ ...h, flashDeal: { ...h.flashDeal, title: e.target.value } }))} />
            <input className={inputClass} placeholder="Highlight (40% OFF)" value={homepage.flashDeal.highlight} onChange={(e) => setHomepage((h) => ({ ...h, flashDeal: { ...h.flashDeal, highlight: e.target.value } }))} />
            <input className={inputClass} placeholder="Subtitle" value={homepage.flashDeal.subtitle} onChange={(e) => setHomepage((h) => ({ ...h, flashDeal: { ...h.flashDeal, subtitle: e.target.value } }))} />
            <input className={inputClass + " col-span-2"} placeholder="Link (/products)" value={homepage.flashDeal.link} onChange={(e) => setHomepage((h) => ({ ...h, flashDeal: { ...h.flashDeal, link: e.target.value } }))} />
          </div>
        )}
      </div>

      {/* ── Our Story / Social Stories ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">Our Story — Video & Social Stories</h2>
          <button
            onClick={() => setHomepage((h) => ({ ...h, story: { ...h.story, enabled: !h.story.enabled } }))}
            className={`w-12 h-6 rounded-full transition-colors ${homepage.story.enabled ? "bg-orange-500" : "bg-gray-200"}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${homepage.story.enabled ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Video/story link daalo — customer play button pe click karke dekhega. Instagram/WhatsApp/Facebook story ka link yahan paste karo (nayi story dalne par yahan naya link update karo).
        </p>
        {homepage.story.enabled && (
          <div className="space-y-3">
            <input className={inputClass} placeholder="🎬 Video URL (YouTube / Instagram reel link)" value={homepage.story.videoUrl.startsWith("data:") ? "" : homepage.story.videoUrl} onChange={(e) => setHomepage((h) => ({ ...h, story: { ...h.story, videoUrl: e.target.value } }))} />
            {/* Video file upload — website pe inline play hoga */}
            <label className="flex items-center justify-center gap-1.5 border-2 border-dashed border-orange-200 rounded-xl py-2.5 text-xs font-semibold cursor-pointer hover:border-orange-400 transition-colors">
              {homepage.story.videoUrl.startsWith("data:video") ? "🎬 Video uploaded ✓ — change karne ke liye click karo" : "⬆️ Ya video file upload karo (max 4MB MP4 — badi video YouTube link se, wo bhi website ke andar hi chalegi)"}
              <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 4 * 1024 * 1024) { alert("Hosting limit ki wajah se file 4MB tak ho sakti hai. 30MB jaisi badi video YouTube pe 'Unlisted' upload karke link yahan daalo — website ke andar hi inline play hogi."); return; }
                const reader = new FileReader();
                reader.onload = () => setHomepage((h) => ({ ...h, story: { ...h.story, videoUrl: reader.result as string } }));
                reader.readAsDataURL(file);
                e.target.value = "";
              }} />
            </label>
            {homepage.story.videoUrl.startsWith("data:video") && (
              <button onClick={() => setHomepage((h) => ({ ...h, story: { ...h.story, videoUrl: "" } }))} className="text-xs text-red-400 hover:text-red-600">✕ Uploaded video hatao</button>
            )}
            <input className={inputClass} placeholder="🟢 WhatsApp channel/story link" value={homepage.story.whatsapp} onChange={(e) => setHomepage((h) => ({ ...h, story: { ...h.story, whatsapp: e.target.value } }))} />
            <input className={inputClass} placeholder="📷 Instagram profile/story link" value={homepage.story.instagram} onChange={(e) => setHomepage((h) => ({ ...h, story: { ...h.story, instagram: e.target.value } }))} />
            <input className={inputClass} placeholder="🔵 Facebook page/story link" value={homepage.story.facebook} onChange={(e) => setHomepage((h) => ({ ...h, story: { ...h.story, facebook: e.target.value } }))} />
          </div>
        )}
      </div>

      {/* ── Website UI / Theme ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Website UI — Color, Search Bar, Icons</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Brand Color</label>
            <input type="color" value={theme.primary} onChange={(e) => setTheme((t) => ({ ...t, primary: e.target.value }))} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" />
            <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono w-28" value={theme.primary} onChange={(e) => setTheme((t) => ({ ...t, primary: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Bar Text</label>
            <input className={inputClass} value={theme.searchPlaceholder} onChange={(e) => setTheme((t) => ({ ...t, searchPlaceholder: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo Size (height px) — sabhi headers pe apply</label>
            <div className="flex items-center gap-3">
              <input type="range" min={24} max={80} value={theme.logoHeight} onChange={(e) => setTheme((t) => ({ ...t, logoHeight: Number(e.target.value) }))} className="flex-1 accent-orange-500" />
              <span className="text-sm font-semibold w-14 text-right">{theme.logoHeight}px</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Tile Size</label>
              <select className={inputClass + " bg-white"} value={theme.categoryStyle.size} onChange={(e) => setTheme((t) => ({ ...t, categoryStyle: { ...t.categoryStyle, size: e.target.value } }))}>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Tile Shape</label>
              <select className={inputClass + " bg-white"} value={theme.categoryStyle.shape} onChange={(e) => setTheme((t) => ({ ...t, categoryStyle: { ...t.categoryStyle, shape: e.target.value } }))}>
                <option value="rounded">Rounded</option>
                <option value="circle">Circle</option>
                <option value="square">Square</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Header Icons (show/hide)</label>
            <div className="flex gap-4">
              {([["wishlist", "❤️ Wishlist"], ["cart", "🛒 Cart"], ["bell", "🔔 Bell"]] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={theme.icons[key]} onChange={(e) => setTheme((t) => ({ ...t, icons: { ...t.icons, [key]: e.target.checked } }))} className="w-4 h-4 accent-orange-500" />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Payment — Razorpay</h2>
        <p className="text-xs text-gray-400 mb-4">Keys Vercel environment variables mein set karo</p>
        <div className="flex justify-between py-2 text-sm">
          <span className="text-gray-500">RAZORPAY_KEY_ID</span>
          <span className={`font-medium text-xs ${razorpaySet ? "text-green-600" : "text-red-400"}`}>{razorpaySet ? "✓ Set" : "Not set"}</span>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-orange-100"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
      </button>
    </div>
  );
}
