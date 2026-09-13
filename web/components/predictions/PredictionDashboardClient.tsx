"use client";

import React, { useState } from "react";
import {
  CorridorLiveSummary,
  FlightPredictionResult,
  LoggedPrediction,
  ModelPerformanceStats,
  RealTrackedFlight,
} from "@/lib/ml/types";
import { ModelRegistryCard } from "./ModelRegistryCard";
import { PredictionSimulator } from "./PredictionSimulator";
import { PredictionResultCard } from "./PredictionResultCard";
import { PredictionForecastChart } from "./PredictionForecastChart";
import { PredictionHistoryTable } from "./PredictionHistoryTable";
import { DashboardClosingBanner } from "@/components/DashboardClosingBanner";

interface PredictionDashboardClientProps {
  initialRegistryStats: ModelPerformanceStats[];
  initialPredictions: LoggedPrediction[];
  initialCorridors?: CorridorLiveSummary[];
  initialRealFlights?: RealTrackedFlight[];
}

export function PredictionDashboardClient({
  initialRegistryStats,
  initialPredictions,
  initialCorridors,
  initialRealFlights,
}: PredictionDashboardClientProps) {
  const [currentPrediction, setCurrentPrediction] = useState<FlightPredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* Active Production Champion Telemetry */}
      <ModelRegistryCard stats={initialRegistryStats} />

      {/* Joined Single Translucent Glass Card: Simulator (Left) + Result (Right) */}
      <div className="rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/95 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] relative overflow-hidden transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 pb-6 lg:pb-0 lg:pr-8 lg:border-r border-slate-200/80">
            <PredictionSimulator
              onPredictionChange={setCurrentPrediction}
              onLoadingChange={setLoading}
              initialCorridors={initialCorridors}
              initialRealFlights={initialRealFlights}
            />
          </div>
          <div className="lg:col-span-5 lg:pl-2">
            <PredictionResultCard result={currentPrediction} loading={loading} />
          </div>
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

      {/* Closing Quote Banner */}
      <DashboardClosingBanner quote="THE NEXT FARE IS ALREADY TAKING SHAPE." />
    </div>
  );
}
