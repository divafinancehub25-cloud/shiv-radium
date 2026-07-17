"use client";

import { useState } from "react";
import { Star, Upload, X } from "lucide-react";

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string | null;
  images: string[];
  videoUrl: string | null;
  createdAt: string;
};

function Stars({ n, size = "w-4 h-4" }: { n: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= n ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-100"}`} />
      ))}
    </div>
  );
}

export default function ReviewSection({ productId, initialReviews }: { productId: string; initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function uploadImage(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) setImages((p) => [...p, data.url].slice(0, 4));
    setUploading(false);
  }

  async function submit() {
    if (!name.trim()) { setMsg("Apna naam likho"); return; }
    setSubmitting(true);
    setMsg("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, name: name.trim(), rating, text: text.trim(), images, videoUrl: videoUrl.trim() }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setMsg(data.error ?? "Kuch galat hua"); return; }
    setReviews((p) => [data.review, ...p]);
    setFormOpen(false);
    setName(""); setText(""); setImages([]); setVideoUrl(""); setRating(5);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-16">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
            {reviews.length > 0 ? (
              <div className="flex items-center gap-2 mt-1">
                <Stars n={Math.round(avg)} />
                <span className="text-sm font-semibold text-gray-700">{avg.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({reviews.length} reviews)</span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Abhi koi review nahi — pehla review aap do!</p>
            )}
          </div>
          <button
            onClick={() => setFormOpen((o) => !o)}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            ⭐ Write a Review
          </button>
        </div>

        {/* Review form */}
        {formOpen && (
          <div className="border border-orange-100 bg-orange-50/50 rounded-2xl p-5 mb-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Aapka Naam *</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rating *</label>
                <div className="flex gap-1 py-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} onClick={() => setRating(i)}>
                      <Star className={`w-7 h-7 transition-colors ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Review</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" value={text} onChange={(e) => setText(e.target.value)} placeholder="Product kaisa laga? Quality, delivery..." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photos (max 4)</label>
                <div className="flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                      <button onClick={() => setImages((p) => p.filter((_, x) => x !== i))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 bg-white">
                      {uploading ? <span className="text-[9px] text-gray-400">...</span> : <Upload className="w-4 h-4 text-gray-400" />}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file);
                        e.target.value = "";
                      }} />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Video link (optional)</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube / Instagram video link" />
              </div>
            </div>
            {msg && <p className="text-xs text-red-500">{msg}</p>}
            <button onClick={submit} disabled={submitting} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-8 py-3 rounded-xl transition-colors">
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}

        {/* Reviews list */}
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                  <div className="flex items-center gap-2">
                    <Stars n={r.rating} size="w-3 h-3" />
                    <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
              {r.text && <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>}
              {(r.images.length > 0 || r.videoUrl) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {r.images.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-200 hover:opacity-80" />
                    </a>
                  ))}
                  {r.videoUrl && (
                    <a href={r.videoUrl} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center text-white text-lg hover:opacity-80">▶</a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
