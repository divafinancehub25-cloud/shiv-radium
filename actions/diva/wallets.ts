"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createWalletSchema, updateWalletSchema } from "@/lib/diva/validators/deposit";
import { writeAuditLog } from "@/lib/diva/audit";
import { headers } from "next/headers";

async function requireFinanceAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return null;
  return session.user;
}

async function getIp() {
  const h = await headers();
  return h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown";
}

// ── List active wallets (user-facing) ─────────────────────────────────────────
export async function getActiveWallets() {
  return prisma.divaDepositWallet.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      walletName: true,
      coinType: true,
      network: true,
      address: true,
      qrImageUrl: true,
      instructions: true,
    },
  });
}

// ── List all wallets (admin) ───────────────────────────────────────────────────
export async function adminListWallets() {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Unauthorized" };

  const wallets = await prisma.divaDepositWallet.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      creator: { select: { id: true, name: true, email: true } },
      _count: { select: { deposits: true } },
    },
  });
  return { wallets };
}

// ── Create wallet ─────────────────────────────────────────────────────────────
export async function createWallet(data: unknown) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Unauthorized" };

  const parsed = createWalletSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const wallet = await prisma.divaDepositWallet.create({
    data: { ...parsed.data, createdBy: admin.id! },
  });

  await writeAuditLog({
    action: "WALLET_CREATED",
    entityType: "DivaDepositWallet",
    entityId: wallet.id,
    performedBy: admin.id!,
    ipAddress: await getIp(),
    metadata: { walletName: wallet.walletName, coinType: wallet.coinType, network: wallet.network },
  });

  revalidatePath("/diva-app-admin/wallets");
  return { wallet };
}

// ── Update wallet ─────────────────────────────────────────────────────────────
export async function updateWallet(id: string, data: unknown) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Unauthorized" };

  const parsed = updateWalletSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const wallet = await prisma.divaDepositWallet.update({
    where: { id },
    data: parsed.data,
  });

  await writeAuditLog({
    action: "WALLET_UPDATED",
    entityType: "DivaDepositWallet",
    entityId: id,
    performedBy: admin.id!,
    ipAddress: await getIp(),
    metadata: parsed.data as Record<string, unknown>,
  });

  revalidatePath("/diva-app-admin/wallets");
  return { wallet };
}

// ── Toggle status ─────────────────────────────────────────────────────────────
export async function toggleWalletStatus(id: string, status: "ACTIVE" | "INACTIVE") {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Unauthorized" };

  const wallet = await prisma.divaDepositWallet.update({
    where: { id },
    data: { status },
  });

  await writeAuditLog({
    action: status === "ACTIVE" ? "WALLET_ACTIVATED" : "WALLET_DEACTIVATED",
    entityType: "DivaDepositWallet",
    entityId: id,
    performedBy: admin.id!,
    ipAddress: await getIp(),
  });

  revalidatePath("/diva-app-admin/wallets");
  revalidatePath("/diva-app/deposit");
  return { wallet };
}

// ── Delete wallet ─────────────────────────────────────────────────────────────
export async function deleteWallet(id: string) {
  const admin = await requireFinanceAdmin();
  if (!admin) return { error: "Unauthorized" };

  const hasDeposits = await prisma.divaDeposit.count({ where: { walletId: id } });
  if (hasDeposits > 0) return { error: "Cannot delete wallet with existing deposits" };

  await prisma.divaDepositWallet.delete({ where: { id } });

  await writeAuditLog({
    action: "WALLET_DELETED",
    entityType: "DivaDepositWallet",
    entityId: id,
    performedBy: admin.id!,
    ipAddress: await getIp(),
  });

  revalidatePath("/diva-app-admin/wallets");
  return { success: true };
}
