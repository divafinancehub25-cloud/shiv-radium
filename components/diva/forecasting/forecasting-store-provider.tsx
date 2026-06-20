"use client";
import { useEffect } from "react";
import { useForecastingStore } from "@/lib/diva/store/forecasting-store";

export function ForecastingStoreProvider({ children }: { children: React.ReactNode }) {
  const { runCalc } = useForecastingStore();
  useEffect(() => { runCalc(); }, [runCalc]);
  return <>{children}</>;
}
