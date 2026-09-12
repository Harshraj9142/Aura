"use client";

import React from "react";
import { LoggedPrediction } from "@/lib/ml/types";
import { History, CheckCircle2, Clock, Sparkles } from "lucide-react";
import AirlineLogo from "@/components/AirlineLogo";

interface PredictionHistoryTableProps {
  predictions: LoggedPrediction[];
}

export function PredictionHistoryTable({ predictions }: PredictionHistoryTableProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-purple-400" />
          <h3 className="text-base font-bold text-slate-100">
            Database Logged Predictions Audit Feed
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Continuous Learning Pipeline Telemetry
        </span>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500">
          No past predictions recorded yet. Run simulations above or wait for continuous scraping cycles.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Prediction ID</th>
                <th className="pb-2 font-medium">Flight Signature</th>
                <th className="pb-2 font-medium">Horizon</th>
                <th className="pb-2 font-medium text-right">Predicted Price</th>
                <th className="pb-2 font-medium text-center">Model</th>
                <th className="pb-2 font-medium text-right">Target Window</th>
                <th className="pb-2 font-medium text-center">Ground Truth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {predictions.map((p) => {
                const parts = p.flightSignature.split("_");
                const carrierFlight = parts[0] || p.flightSignature;
                const route = parts.length >= 3 ? `${parts[1]} → ${parts[2]}` : "";

                return (
                  <tr key={p.predictionId} className="hover:bg-slate-900/40 transition">
                    <td className="py-2.5 font-mono text-slate-400">{p.predictionId}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <AirlineLogo airline={carrierFlight} flightNumber={carrierFlight} size="xs" />
                        <div>
                          <div className="font-medium text-slate-200">{carrierFlight}</div>
                          {route && <div className="text-[10px] text-slate-500">{route}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 font-mono text-slate-400">
                      +{p.targetHorizonHours}h
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-purple-300">
                      ₹{p.predictedPrice.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-purple-400 border border-purple-500/20">
                        {p.modelVersion}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">
                      {p.targetTime ? p.targetTime.substring(0, 16).replace("T", " ") : "—"}
                    </td>
                    <td className="py-2.5 text-center">
                      {p.actualPrice !== null && p.actualPrice !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-mono">
                          <CheckCircle2 className="h-3 w-3" />
                          ₹{p.actualPrice.toFixed(0)} (Err: ₹{p.error?.toFixed(0)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-[10px]">
                          <Clock className="h-3 w-3" />
                          Awaiting Re-Scrape
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
