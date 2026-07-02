"use client";

import { useState } from "react";
import { DivaAdminSidebar } from "@/components/diva/admin/admin-sidebar";
import { DivaQueryProvider } from "@/components/diva/providers/query-provider";
import { DivaSessionProvider } from "@/components/diva/providers/session-provider";
import { Menu, X } from "lucide-react";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="relative h-full">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 z-10 lg:hidden text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <DivaAdminSidebar />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="flex lg:hidden items-center gap-3 h-14 px-4 border-b border-white/[0.05] bg-black/20 backdrop-blur-xl shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-white/50 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-white font-semibold text-sm">STICKO Admin</p>
        </div>
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-[#0A0A0A]">{children}</main>
      </div>
    </div>
  );
}

export default function DivaAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DivaSessionProvider>
      <DivaQueryProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </DivaQueryProvider>
    </DivaSessionProvider>
  );
}
