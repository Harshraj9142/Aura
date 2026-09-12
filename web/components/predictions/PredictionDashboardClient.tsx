"use client";

import React, { useState } from "react";
import { FlightPredictionResult, LoggedPrediction, ModelPerformanceStats } from "@/lib/ml/types";
import { ModelRegistryCard } from "./ModelRegistryCard";
import { PredictionSimulator } from "./PredictionSimulator";
import { PredictionResultCard } from "./PredictionResultCard";
import { PredictionForecastChart } from "./PredictionForecastChart";
import { PredictionHistoryTable } from "./PredictionHistoryTable";

interface PredictionDashboardClientProps {
  initialRegistryStats: ModelPerformanceStats[];
  initialPredictions: LoggedPrediction[];
}

export function PredictionDashboardClient({
  initialRegistryStats,
  initialPredictions,
}: PredictionDashboardClientProps) {
  const [currentPrediction, setCurrentPrediction] = useState<FlightPredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* Active Production Champion Telemetry */}
      <ModelRegistryCard stats={initialRegistryStats} />

      {/* Simulator + Result Card Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <PredictionSimulator
            onPredictionChange={setCurrentPrediction}
            onLoadingChange={setLoading}
          />
        </div>
        <div className="lg:col-span-5">
          <PredictionResultCard result={currentPrediction} loading={loading} />
        </div>
      </div>

      {/* Multi-Horizon Progression Chart */}
      {currentPrediction && (
        <PredictionForecastChart
          data={currentPrediction.horizonCurve}
          currentPrice={currentPrediction.currentPrice}
        />
      )}

      {/* Logged Predictions Audit Feed */}
      <PredictionHistoryTable predictions={initialPredictions} />
    </div>
  );
}
