"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Slide } from "@/lib/storefront";

const DEFAULT_SLIDES: Slide[] = [
  { badge: "NEW ARRIVAL", title1: "Personalized", title2: "LED PHOTO FRAME", subtitle: "Make Your Memories More Beautiful", emoji: "🖼️", bg: "from-[#3a1a00] to-[#7a3500]" },
  { badge: "BESTSELLER", title1: "Custom Name", title2: "BOARDS & PLATES", subtitle: "Your Name, Your Style, Your Door", emoji: "🪧", bg: "from-[#1a003a] to-[#3a0070]" },
  { badge: "TRENDING", title1: "Couple Gift", title2: "LED FRAMES", subtitle: "Perfect for Anniversaries & Birthdays", emoji: "💑", bg: "from-[#001a3a] to-[#003a7a]" },
];

// Motion animations for slide transitions
const MOTION_CLASS: Record<string, string> = {
  slide: "hero-slide",
  fade: "hero-fade",
  zoom: "hero-zoom",
  slideUp: "hero-slideup",
};

export default function HeroBanner({
  slides = DEFAULT_SLIDES,
  interval = 4,
  motion = "slide",
}: {
  slides?: Slide[];
  interval?: number;
  motion?: string;
}) {
  const [current, setCurrent] = useState(0);
  const list = slides.length > 0 ? slides : DEFAULT_SLIDES;

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setCurrent((p) => (p + 1) % list.length), Math.max(2, interval) * 1000);
    return () => clearInterval(t);
  }, [interval, list.length]);

  const slide = list[current % list.length];
  const motionClass = MOTION_CLASS[motion] ?? MOTION_CLASS.slide;

  return (
    <div className={`relative bg-gradient-to-r ${slide.bg} mx-3 mt-3 rounded-2xl overflow-hidden`}>
      <style>{`
        @keyframes heroSlide { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes heroFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes heroZoom { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes heroSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .hero-slide { animation: heroSlide 0.5s ease both; }
        .hero-fade { animation: heroFade 0.7s ease both; }
        .hero-zoom { animation: heroZoom 0.5s ease both; }
        .hero-slideup { animation: heroSlideUp 0.5s ease both; }
      `}</style>
      {slide.fullImage ? (
        <Link key={current} href={slide.link || "/products"} className={`block ${motionClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.fullImage} alt={slide.title1 || "Slide"} className="w-full h-auto object-cover" />
        </Link>
      ) : (
      <div key={current} className={`px-5 py-6 flex items-center gap-4 ${motionClass}`}>
        <div className="flex-1">
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {slide.badge}
          </span>
          <h1 className="text-white font-bold text-xl leading-tight mt-3">
            {slide.title1}<br />
            <span className="text-orange-400 text-2xl">{slide.title2}</span>
          </h1>
          <p className="text-gray-300 text-xs mt-2 leading-relaxed">{slide.subtitle}</p>
          <Link
            href="/products"
            className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            SHOP NOW →
          </Link>
          <p className="text-gray-400 text-[10px] mt-3 flex items-center gap-1">
            🚚 Free Delivery on Prepaid Orders
          </p>
        </div>
        {slide.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.image} alt="" className="w-28 h-28 object-cover rounded-2xl select-none" />
        ) : (
          <div className="text-7xl select-none">{slide.emoji}</div>
        )}
      </div>
      )}
      {/* Dots */}
      {list.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-orange-500" : "w-1.5 bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
