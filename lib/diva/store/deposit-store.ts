import { create } from "zustand";
import type { DivaDeposit, DivaDepositWallet } from "@prisma/client";

type ActiveWallet = Pick<DivaDepositWallet, "id" | "walletName" | "coinType" | "network" | "address" | "qrImageUrl" | "instructions">;

type DepositStore = {
  selectedWallet: ActiveWallet | null;
  setSelectedWallet: (w: ActiveWallet | null) => void;
  submittedDeposit: Partial<DivaDeposit> | null;
  setSubmittedDeposit: (d: Partial<DivaDeposit> | null) => void;
  notificationCount: number;
  setNotificationCount: (n: number) => void;
};

export const useDepositStore = create<DepositStore>((set) => ({
  selectedWallet: null,
  setSelectedWallet: (w) => set({ selectedWallet: w }),
  submittedDeposit: null,
  setSubmittedDeposit: (d) => set({ submittedDeposit: d }),
  notificationCount: 0,
  setNotificationCount: (n) => set({ notificationCount: n }),
}));
