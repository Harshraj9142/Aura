"use client";

import React from "react";
import { LoggedPrediction } from "@/lib/ml/types";
import { History, CheckCircle2, Clock } from "lucide-react";
import AirlineLogo from "@/components/AirlineLogo";

interface PredictionHistoryTableProps {
  predictions: LoggedPrediction[];
}

export function PredictionHistoryTable({ predictions }: PredictionHistoryTableProps) {
  return (
    <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 p-6 sm:p-8 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              Database Logged Predictions Audit Feed
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Verified flight-level forecasts continuously evaluated against actual scraped airfare telemetry
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-mono font-medium">
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
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="pb-3 font-bold">Prediction ID</th>
                <th className="pb-3 font-bold">Flight Signature</th>
                <th className="pb-3 font-bold">Horizon</th>
                <th className="pb-3 font-bold text-right">Predicted Price</th>
                <th className="pb-3 font-bold text-center">Model</th>
                <th className="pb-3 font-bold text-right">Target Window</th>
                <th className="pb-3 font-bold text-center">Ground Truth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {predictions.map((p) => {
                const parts = p.flightSignature.split("_");
                const carrierFlight = parts[0] || p.flightSignature;
                const route = parts.length >= 3 ? `${parts[1]} → ${parts[2]}` : "";
                const depDate = parts.length >= 4 ? parts[3].split("T")[0] : "";

                return (
                  <tr key={p.predictionId} className="hover:bg-slate-50/90 transition">
                    <td className="py-3 font-mono text-slate-500 font-medium">{p.predictionId}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <AirlineLogo airline={carrierFlight} flightNumber={carrierFlight} size="xs" />
                        <div>
                          <div className="font-bold text-slate-900">{carrierFlight}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {route} {depDate ? `· ${depDate}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-slate-600 font-medium">
                      +{p.targetHorizonHours}h
                    </td>
                    <td className="py-3 text-right font-mono font-black text-purple-700 text-sm">
                      ₹{p.predictedPrice.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-center">
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-700 border border-purple-200">
                        {p.modelVersion}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500">
                      {p.targetTime ? p.targetTime.substring(0, 16).replace("T", " ") : "—"}
                    </td>
                    <td className="py-3 text-center">
                      {p.actualPrice !== null && p.actualPrice !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-mono font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ₹{p.actualPrice.toFixed(0)}{" "}
                          <span className="text-[10px] text-emerald-600 font-medium">
                            (Err: ₹{p.error !== null && p.error !== undefined ? p.error.toFixed(0) : "0"}
                            {p.percentageError !== null && p.percentageError !== undefined
                              ? ` · ${p.percentageError.toFixed(1)}%`
                              : ""}
                            )
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-[10px] font-medium">
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
