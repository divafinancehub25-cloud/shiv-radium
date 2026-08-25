import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Shiv Radium — Personalized Gifts",
    template: "%s | Shiv Radium",
  },
  description:
    "Customize and order personalized gifts — photo frames, mugs, name plates, corporate gifts and more. Pan India delivery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-white text-gray-900">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
