"use server";

import { auth } from "@/lib/auth";
import { sendTestEmail, getSmtpStatus } from "@/lib/diva/email";

export async function adminSendTestEmail(email: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const admin = await (await import("@/lib/prisma")).prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
    return { error: "Forbidden" };
  }

  const status = getSmtpStatus();
  if (!status.configured) return { error: "SMTP not configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS to .env.local" };

  try {
    await sendTestEmail(email);
    return { success: true };
  } catch (err: any) {
    return { error: err?.message ?? "SMTP send failed" };
  }
}
