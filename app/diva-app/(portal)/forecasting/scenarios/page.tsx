import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserScenarios } from "@/actions/diva/forecasting";
import { ScenarioManager } from "@/components/diva/forecasting/scenario-manager";
import { ScenarioComparison } from "@/components/diva/forecasting/scenario-comparison";
import { ForecastingStoreProvider } from "@/components/diva/forecasting/forecasting-store-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Scenarios — DIVA" };

export default async function ScenariosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");

  const res = await getUserScenarios();
  const scenarios = "error" in res ? [] : res.scenarios;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Scenario Planning</h1>
        <p className="text-white/40 text-sm">Build and compare multiple growth scenarios</p>
      </div>
      <ForecastingStoreProvider>
        <Tabs defaultValue="compare">
          <TabsList className="bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl mb-6">
            <TabsTrigger value="compare" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 text-xs rounded-lg px-4 py-1.5">
              Compare Scenarios
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 text-xs rounded-lg px-4 py-1.5">
              Saved Scenarios ({scenarios.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="compare"><ScenarioComparison /></TabsContent>
          <TabsContent value="saved"><ScenarioManager initial={scenarios as any} /></TabsContent>
        </Tabs>
      </ForecastingStoreProvider>
    </div>
  );
}
