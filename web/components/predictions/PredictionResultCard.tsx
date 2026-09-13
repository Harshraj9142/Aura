"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { FlightPredictionResult } from "@/lib/ml/types";

interface PredictionResultCardProps {
  result: FlightPredictionResult | null;
  loading: boolean;
}

export function PredictionResultCard({ result, loading }: PredictionResultCardProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center shadow-xl">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-purple-600 border-t-transparent mb-3" />
        <p className="text-sm font-bold text-slate-900">
          Traversing 100 Gradient Boosting Trees...
        </p>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Evaluating corridor price momentum, load factor elasticity & booking window
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-3xl border border-dashed border-purple-200 bg-white/80 backdrop-blur-xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center shadow-xl">
        <div className="h-12 w-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 mb-3 shadow-xs">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Configure Flight Parameters & Forecast
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          Select origin, destination, airline, and departure timeframe to run ML inference on domestic airfares.
        </p>
      </div>
    );
  }

  const isBuyNow = result.recommendation === "BUY_NOW";
  const isWait = result.recommendation === "WAIT_AND_MONITOR";

  return (
    <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Glow highlight */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isBuyNow
            ? "bg-rose-500/10"
            : isWait
            ? "bg-emerald-500/10"
            : "bg-blue-500/10"
        }`}
      />

      <div>
        {/* Recommendation Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                isBuyNow
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : isWait
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-blue-100 text-blue-800 border-blue-200"
              }`}
            >
              {isBuyNow && <TrendingUp className="h-4 w-4" />}
              {isWait && <TrendingDown className="h-4 w-4" />}
              {!isBuyNow && !isWait && <Minus className="h-4 w-4" />}
              {result.recommendation.replace(/_/g, " ")}
            </span>

            <span className="text-[11px] text-slate-500 font-mono font-semibold">
              24h Horizon Forecast
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
            <span>Confidence: </span>
            <span className="font-mono font-bold text-slate-900">
              {result.confidenceScore}%
            </span>
          </div>
        </div>

        {/* Primary Predicted Fare Display (Direct ML Predicted Total Price) */}
        <div className="rounded-2xl bg-purple-50/80 border border-purple-200 p-5 mb-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-purple-900 tracking-wider">
              PREDICTED TOTAL FARE
            </span>
            <span className="text-[11px] text-purple-700 font-mono font-semibold">
              24h Horizon Forecast
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-950">
              ₹{result.predictedPrice.toLocaleString("en-IN")}
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 block">Trajectory</span>
              <span
                className={`text-xs font-mono font-black ${
                  result.priceDelta > 0
                    ? "text-rose-700"
                    : result.priceDelta < 0
                    ? "text-emerald-700"
                    : "text-slate-700"
                }`}
              >
                {result.percentChange > 0 ? `+${result.percentChange}%` : `${result.percentChange}%`}
              </span>
            </div>
          </div>
        </div>

        {/* AI Insight Explanation */}
        <div className="rounded-2xl bg-purple-100/60 border border-purple-200 p-4 text-xs text-purple-950 font-medium leading-relaxed mb-4">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-purple-700 shrink-0 mt-0.5" />
            <p>{result.recommendationReason}</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <span className="flex items-center gap-1 font-mono font-semibold">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          Latency: &lt;1ms (Node Native AST)
        </span>
        <span className="font-mono font-bold text-purple-700">
          Model: {result.modelVersion}
        </span>
      </div>
    </div>
  );
}
