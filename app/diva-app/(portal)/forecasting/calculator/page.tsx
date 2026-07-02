import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FVCalculator } from "@/components/diva/forecasting/fv-calculator";
import { ForecastingStoreProvider } from "@/components/diva/forecasting/forecasting-store-provider";

export const metadata = { title: "Future Value Calculator — DIVA" };

export default async function CalculatorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Future Value Calculator</h1>
        <p className="text-white/40 text-sm">Project your portfolio growth with compound interest modeling</p>
      </div>
      <ForecastingStoreProvider>
        <FVCalculator />
      </ForecastingStoreProvider>
    </div>
  );
}
