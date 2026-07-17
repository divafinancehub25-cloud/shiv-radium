import { db } from "@/lib/db";

// ─── Shared storefront config helpers ────────────────────────────────────────

// fullImage set = poora slider us image se replace (text/emoji nahi dikhta)
export type Slide = { badge: string; title1: string; title2: string; subtitle: string; emoji: string; bg: string; image?: string; fullImage?: string; link?: string };
export type HomepageConfig = {
  slider: { enabled: boolean; interval: number; motion: "slide" | "fade" | "zoom" | "slideUp"; slides: Slide[] };
  flashDeal: { enabled: boolean; label: string; title: string; highlight: string; subtitle: string; link: string; image?: string };
  story: { enabled: boolean; videoUrl: string; whatsapp: string; instagram: string; facebook: string };
};
export type ThemeConfig = {
  primary: string;
  searchPlaceholder: string;
  icons: { wishlist: boolean; cart: boolean; bell: boolean };
};

export const DEFAULT_SLIDES: Slide[] = [
  { badge: "NEW ARRIVAL", title1: "Personalized", title2: "LED PHOTO FRAME", subtitle: "Make Your Memories More Beautiful", emoji: "🖼️", bg: "from-[#3a1a00] to-[#7a3500]" },
  { badge: "BESTSELLER", title1: "Custom Name", title2: "BOARDS & PLATES", subtitle: "Your Name, Your Style, Your Door", emoji: "🪧", bg: "from-[#1a003a] to-[#3a0070]" },
  { badge: "TRENDING", title1: "Couple Gift", title2: "LED FRAMES", subtitle: "Perfect for Anniversaries & Birthdays", emoji: "💑", bg: "from-[#001a3a] to-[#003a7a]" },
];

export const DEFAULT_HOMEPAGE: HomepageConfig = {
  slider: { enabled: true, interval: 4, motion: "slide", slides: DEFAULT_SLIDES },
  flashDeal: { enabled: true, label: "⚡ FLASH DEAL", title: "Flat", highlight: "40% OFF", subtitle: "On Customized Photo Frames", link: "/products" },
  story: { enabled: true, videoUrl: "", whatsapp: "", instagram: "", facebook: "" },
};

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#f97316",
  searchPlaceholder: "Search for products...",
  icons: { wishlist: true, cart: true, bell: true },
};

export async function getStorefrontConfig() {
  const rows = await db.setting.findMany({
    where: { key: { in: ["store_logo", "store_name", "store_phone", "homepage_config", "theme_config"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  let homepage = DEFAULT_HOMEPAGE;
  try { if (map.homepage_config) homepage = { ...DEFAULT_HOMEPAGE, ...JSON.parse(map.homepage_config) }; } catch {}
  let theme = DEFAULT_THEME;
  try { if (map.theme_config) theme = { ...DEFAULT_THEME, ...JSON.parse(map.theme_config), icons: { ...DEFAULT_THEME.icons, ...(JSON.parse(map.theme_config).icons ?? {}) } }; } catch {}

  return {
    storeName: map.store_name ?? "Shiv Radium",
    storeLogo: map.store_logo ?? null,
    storePhone: map.store_phone ?? "+91 98765 43210",
    homepage,
    theme,
  };
}
