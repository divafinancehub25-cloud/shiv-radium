"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DivaDocumentType } from "@prisma/client";

type Step1Data = {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
};

type DocEntry = { type: DivaDocumentType; url: string; fileName: string };

type KYCStore = {
  step: 1 | 2 | 3 | 4;
  step1: Step1Data;
  step2Docs: DocEntry[];
  step3Selfie: { url: string; fileName: string } | null;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setStep1: (data: Step1Data) => void;
  addDoc: (doc: DocEntry) => void;
  setSelfie: (data: { url: string; fileName: string }) => void;
  reset: () => void;
};

const initialState = {
  step: 1 as const,
  step1: { fullName: "", dateOfBirth: "", nationality: "", address: "" },
  step2Docs: [],
  step3Selfie: null,
};

export const useKYCStore = create<KYCStore>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) => set({ step }),
      setStep1: (step1) => set({ step1 }),
      addDoc: (doc) => set((s) => ({ step2Docs: [...s.step2Docs.filter((d) => d.type !== doc.type), doc] })),
      setSelfie: (step3Selfie) => set({ step3Selfie }),
      reset: () => set(initialState),
    }),
    { name: "diva-kyc" }
  )
);
