import { WalletManagement } from "@/components/diva/admin/wallet-management";

export const metadata = { title: "Wallet Management — DIVA Admin" };

export default function DivaAdminWalletsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Deposit Wallets</h1>
        <p className="text-white/40 text-sm mt-1">Manage active deposit addresses shown to members.</p>
      </div>
      <WalletManagement />
    </div>
  );
}
