"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

// Shared liked-ids cache so many buttons on a page make one request
let cache: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;

async function loadLiked(): Promise<Set<string>> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => {
        cache = new Set<string>(d.productIds ?? []);
        return cache;
      })
      .catch(() => new Set<string>());
  }
  return inflight;
}

export default function LikeButton({ productId, size = "sm" }: { productId: string; size?: "sm" | "lg" }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadLiked().then((s) => { if (alive) setLiked(s.has(productId)); });
    return () => { alive = false; };
  }, [productId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next); // optimistic
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setBusy(false);
    if (res.status === 401) {
      setLiked(false);
      router.push("/login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (typeof data.liked === "boolean") {
      setLiked(data.liked);
      if (cache) data.liked ? cache.add(productId) : cache.delete(productId);
    }
  }

  const box = size === "lg" ? "w-10 h-10" : "w-7 h-7";
  const icon = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";

  return (
    <button
      onClick={toggle}
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
      className={`${box} bg-white rounded-full shadow flex items-center justify-center transition-transform active:scale-90`}
    >
      <Heart className={`${icon} transition-colors ${liked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
    </button>
  );
}
