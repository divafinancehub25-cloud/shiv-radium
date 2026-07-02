"use client";

import { useState } from "react";
import { DivaPortalSidebar } from "@/components/diva/dashboard/sidebar";
import { DivaHeader } from "@/components/diva/dashboard/header";
import { DivaQueryProvider } from "@/components/diva/providers/query-provider";
import { DivaSessionProvider } from "@/components/diva/providers/session-provider";
import { X } from "lucide-react";

function PortalLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — fixed on mobile, sticky on desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="relative h-full">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 z-10 lg:hidden text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <DivaPortalSidebar />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <DivaHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-[#0A0A0A]">{children}</main>
      </div>
    </div>
  );
}

export default function DivaPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <DivaSessionProvider>
      <DivaQueryProvider>
        <PortalLayoutInner>{children}</PortalLayoutInner>
      </DivaQueryProvider>
    </DivaSessionProvider>
  );
}
