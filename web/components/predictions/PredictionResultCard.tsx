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
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-300">
          Traversing 100 Gradient Boosting Trees...
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Evaluating corridor price momentum, load factor elasticity & booking window
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="h-12 w-12 rounded-full bg-purple-950/40 border border-purple-800/40 flex items-center justify-center text-purple-400 mb-3">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          Configure Flight Parameters & Forecast
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Select origin, destination, airline, and departure timeframe to run ML inference on domestic airfares.
        </p>
      </div>
    );
  }

  const isBuyNow = result.recommendation === "BUY_NOW";
  const isWait = result.recommendation === "WAIT_AND_MONITOR";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
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
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isBuyNow
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : isWait
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-blue-500/15 text-blue-400 border-blue-500/30"
              }`}
            >
              {isBuyNow && <TrendingUp className="h-4 w-4" />}
              {isWait && <TrendingDown className="h-4 w-4" />}
              {!isBuyNow && !isWait && <Minus className="h-4 w-4" />}
              {result.recommendation.replace(/_/g, " ")}
            </span>

            <span className="text-[11px] text-slate-400 font-mono">
              24h Horizon Forecast
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
            <span>Confidence: </span>
            <span className="font-mono font-bold text-slate-200">
              {result.confidenceScore}%
            </span>
          </div>
        </div>

        {/* Primary Predicted Fare Display (Direct ML Predicted Total Price) */}
        <div className="rounded-2xl bg-slate-900/90 border border-purple-500/30 p-5 mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
              PREDICTED TOTAL FARE
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              24h Horizon Forecast
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
              ₹{result.predictedPrice.toLocaleString("en-IN")}
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block">Trajectory</span>
              <span
                className={`text-xs font-mono font-extrabold ${
                  result.priceDelta > 0
                    ? "text-rose-400"
                    : result.priceDelta < 0
                    ? "text-emerald-400"
                    : "text-slate-300"
                }`}
              >
                {result.percentChange > 0 ? `+${result.percentChange}%` : `${result.percentChange}%`}
              </span>
            </div>
          </div>
        </div>

        {/* AI Insight Explanation */}
        <div className="rounded-lg bg-purple-950/20 border border-purple-500/20 p-3.5 text-xs text-purple-200/90 leading-relaxed mb-4">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <p>{result.recommendationReason}</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <span className="flex items-center gap-1 font-mono">
          <Clock className="h-3 w-3" />
          Latency: &lt;1ms (Node Native AST)
        </span>
        <span className="font-mono text-purple-400">
          Model: {result.modelVersion}
        </span>
      </div>
    </div>
  );
}
