import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "STICKO Growth Capital — Grow Your Wealth The Smart Way",
  },
  description:
    "India's premium fintech investment platform. 18-24% annual returns, real-time portfolio tracking, bank-grade security and instant deposits/withdrawals.",
  openGraph: {
    title: "STICKO Growth Capital",
    description:
      "Grow your wealth the smart way — 18-24% annual returns, real-time portfolio tracking and bank-grade security. Trusted by 10,000+ investors.",
    type: "website",
    siteName: "STICKO Growth Capital",
  },
  twitter: {
    card: "summary_large_image",
    title: "STICKO Growth Capital",
    description:
      "Grow your wealth the smart way — 18-24% annual returns, real-time portfolio tracking and bank-grade security.",
  },
};

export default function StickoLandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {children}
    </div>
  );
}
