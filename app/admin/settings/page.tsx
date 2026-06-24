export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import SettingsForm from "./SettingsForm";

export default async function AdminSettingsPage() {
  const settingRows = await db.setting.findMany();
  const settings: Record<string, string> = {};
  for (const s of settingRows) settings[s.key] = s.value;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <SettingsForm settings={settings} razorpaySet={!!process.env.RAZORPAY_KEY_ID} />
    </div>
  );
}
