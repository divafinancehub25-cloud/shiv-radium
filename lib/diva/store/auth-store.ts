"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
};

type AuthStore = {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null }),
    }),
    { name: "diva-auth" }
  )
);
