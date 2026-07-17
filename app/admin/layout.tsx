import { db } from "@/lib/db";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let logo: string | null = null;
  let name = "Shiv Radium";
  try {
    const rows = await db.setting.findMany({ where: { key: { in: ["store_logo", "store_name"] } } });
    for (const r of rows) {
      if (r.key === "store_logo") logo = r.value || null;
      if (r.key === "store_name" && r.value) name = r.value;
    }
  } catch {}
  return <AdminShell logo={logo} name={name}>{children}</AdminShell>;
}
