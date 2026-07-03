"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function FlashDeal() {
  const [secs, setSecs] = useState(2 * 24 * 3600 + 14 * 3600 + 32 * 60 + 47);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  return (
    <div className="mx-3 mt-4 grid grid-cols-2 gap-3">
      {/* Flash Deal */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
        <p className="text-orange-500 text-xs font-bold flex items-center gap-1">⚡ FLASH DEAL</p>
        <p className="text-gray-900 font-bold text-sm mt-1">Flat <span className="text-orange-500 text-xl">40%</span> OFF</p>
        <p className="text-gray-500 text-[10px] mt-0.5">On Customized Photo Frames</p>
        <Link href="/products" className="inline-block mt-3 bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">
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
      {/* Our Story */}
      <div className="bg-orange-500 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between">
        <div>
          <p className="text-white font-bold text-sm leading-tight">Our Story<br />In A Video</p>
          <p className="text-orange-100 text-[10px] mt-1">Watch & Know More About Shiv Radium</p>
        </div>
        <div className="flex items-center justify-center mt-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40">
            <span className="text-white text-base ml-0.5">▶</span>
          </div>
        </div>
      </div>
    </div>
  );
}
