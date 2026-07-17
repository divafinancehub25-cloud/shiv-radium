"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { HomepageConfig } from "@/lib/storefront";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function FlashDeal({
  deal,
  story,
}: {
  deal?: HomepageConfig["flashDeal"];
  story?: HomepageConfig["story"];
}) {
  const [secs, setSecs] = useState(2 * 24 * 3600 + 14 * 3600 + 32 * 60 + 47);
  const [videoOpen, setVideoOpen] = useState(false);
  // YouTube link → inline embed id
  const ytMatch = story?.videoUrl?.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  const ytId = ytMatch?.[1] ?? null;
  const isFileVideo = !!story?.videoUrl && (story.videoUrl.startsWith("data:video") || /\.(mp4|webm)(\?|$)/i.test(story.videoUrl));
  const isPlayable = isFileVideo || !!ytId;

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const dealOn = deal?.enabled ?? true;
  const storyOn = story?.enabled ?? true;
  if (!dealOn && !storyOn) return null;

  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  const socials = [
    { key: "whatsapp", url: story?.whatsapp, icon: "🟢", label: "WhatsApp" },
    { key: "instagram", url: story?.instagram, icon: "📷", label: "Instagram" },
    { key: "facebook", url: story?.facebook, icon: "🔵", label: "Facebook" },
  ].filter((x) => x.url);

  return (
    <div className={`mx-3 mt-4 grid ${dealOn && storyOn ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
      {/* Flash Deal */}
      {dealOn && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 relative overflow-hidden">
          {deal?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deal.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
          )}
          <div className="relative">
            <p className="text-orange-500 text-xs font-bold flex items-center gap-1">{deal?.label ?? "⚡ FLASH DEAL"}</p>
            <p className="text-gray-900 font-bold text-sm mt-1">{deal?.title ?? "Flat"} <span className="text-orange-500 text-xl">{deal?.highlight ?? "40% OFF"}</span></p>
            <p className="text-gray-500 text-[10px] mt-0.5">{deal?.subtitle ?? "On Customized Photo Frames"}</p>
            <Link href={deal?.link || "/products"} className="inline-block mt-3 bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">
              SHOP NOW →
            </Link>
            <div className="flex gap-1.5 mt-3">
              {[{ v: pad(d), l: "Days" }, { v: pad(h), l: "Hours" }, { v: pad(m), l: "Mins" }, { v: pad(s), l: "Secs" }].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center bg-white border border-orange-100 rounded-lg px-1.5 py-1 min-w-[26px]">
                  <span className="text-xs font-bold text-gray-900 leading-none">{v}</span>
                  <span className="text-[8px] text-gray-400 mt-0.5">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Our Story — video + social stories */}
      {storyOn && (
        <div className="bg-orange-500 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <p className="text-white font-bold text-sm leading-tight">Our Story<br />In A Video</p>
            <p className="text-orange-100 text-[10px] mt-1">Watch & Know More About Shiv Radium</p>
          </div>
          <div className="flex items-center justify-center mt-3">
            {isPlayable ? (
              <button
                onClick={() => setVideoOpen(true)}
                className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center border-2 border-white/40 transition-colors"
                title="Story video dekho"
              >
                <span className="text-white text-base ml-0.5">▶</span>
              </button>
            ) : story?.videoUrl ? (
              <a
                href={story.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center border-2 border-white/40 transition-colors"
                title="Story video dekho"
              >
                <span className="text-white text-base ml-0.5">▶</span>
              </a>
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40">
                <span className="text-white text-base ml-0.5">▶</span>
              </div>
            )}
          </div>
          {/* Inline video modal */}
          {videoOpen && isPlayable && (
            <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={() => setVideoOpen(false)}>
              <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setVideoOpen(false)} className="absolute -top-9 right-0 text-white text-sm font-bold bg-white/20 rounded-full px-3 py-1">✕ Close</button>
                {ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&playsinline=1`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="w-full aspect-video rounded-2xl shadow-2xl bg-black"
                  />
                ) : (
                  <video src={story!.videoUrl} controls autoPlay playsInline className="w-full rounded-2xl shadow-2xl bg-black" />
                )}
              </div>
            </div>
          )}

          {/* Social story links */}
          {socials.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {socials.map((x) => (
                <a
                  key={x.key}
                  href={x.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${x.label} stories`}
                  className="w-7 h-7 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-xs transition-colors"
                >
                  {x.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
