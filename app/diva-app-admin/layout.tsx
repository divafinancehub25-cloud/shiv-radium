import { DivaAdminSidebar } from "@/components/diva/admin/admin-sidebar";
import { DivaQueryProvider } from "@/components/diva/providers/query-provider";
import { DivaSessionProvider } from "@/components/diva/providers/session-provider";

export default function DivaAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DivaSessionProvider>
      <DivaQueryProvider>
        <div className="min-h-screen bg-[#0A0A0A] flex">
          <DivaAdminSidebar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </DivaQueryProvider>
    </DivaSessionProvider>
  );
}
