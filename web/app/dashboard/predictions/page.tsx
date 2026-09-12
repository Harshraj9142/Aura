import { Metadata } from "next";
import { getModelRegistryStats, getRecentPredictions } from "@/lib/services/prediction.service";
import { PredictionDashboardClient } from "@/components/predictions/PredictionDashboardClient";
import { Sparkles, BrainCircuit } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Price Predictions & Forecasts | APIx",
  description:
    "Continuous-learning ML airfare price prediction and horizon forecasting for domestic Indian aviation corridors.",
};

export const revalidate = 60; // Refresh every minute

export default async function PredictionsPage() {
  const [registryStats, recentPredictions] = await Promise.all([
    getModelRegistryStats(),
    getRecentPredictions(25),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 flex items-center gap-2.5">
              <BrainCircuit className="h-7 w-7 text-purple-600" />
              Airfare Price Prediction & Forecasting
            </h1>
            <span className="rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-xs font-bold text-purple-900">
              ML Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 font-medium">
            Gradient Boosting Machine Learning model trained on domestic flight corridors, delivering real-time fare projections and buy/wait recommendations.
          </p>
        </div>
      </div>

      {/* Main Interactive Client Suite */}
      <PredictionDashboardClient
        initialRegistryStats={registryStats}
        initialPredictions={recentPredictions}
      />
    </div>
  );
}
