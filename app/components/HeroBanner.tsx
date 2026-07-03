"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const slides = [
  {
    badge: "NEW ARRIVAL",
    title: "Personalized\nLED PHOTO FRAME",
    subtitle: "Make Your Memories More Beautiful",
    bg: "from-[#3a1a00] to-[#7a3500]",
    emoji: "🖼️",
  },
  {
    badge: "BESTSELLER",
    title: "Custom Name\nBOARDS & PLATES",
    subtitle: "Your Name, Your Style, Your Door",
    bg: "from-[#1a003a] to-[#3a0070]",
    emoji: "🪧",
  },
  {
    badge: "TRENDING",
    title: "Couple Gift\nLED FRAMES",
    subtitle: "Perfect for Anniversaries & Birthdays",
    bg: "from-[#001a3a] to-[#003a7a]",
    emoji: "💑",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];

  return (
    <div className={`relative bg-gradient-to-r ${slide.bg} mx-3 mt-3 rounded-2xl overflow-hidden transition-all duration-500`}>
      <div className="px-5 py-6 flex items-center gap-4">
        <div className="flex-1">
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {slide.badge}
          </span>
          <h1 className="text-white font-bold text-xl leading-tight mt-3 whitespace-pre-line">
            {slide.title.split("\n")[0]}<br />
            <span className="text-orange-400 text-2xl">{slide.title.split("\n")[1]}</span>
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
        <div className="text-7xl select-none">{slide.emoji}</div>
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-1.5 pb-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-orange-500" : "w-1.5 bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  );
}
