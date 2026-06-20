import { DivaPortalSidebar } from "@/components/diva/dashboard/sidebar";
import { DivaHeader } from "@/components/diva/dashboard/header";
import { DivaQueryProvider } from "@/components/diva/providers/query-provider";
import { DivaSessionProvider } from "@/components/diva/providers/session-provider";

export default function DivaPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <DivaSessionProvider>
    <DivaQueryProvider>
      <div className="min-h-screen bg-[#0A0A0A] flex">
        <DivaPortalSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DivaHeader />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </DivaQueryProvider>
    </DivaSessionProvider>
  );
}
