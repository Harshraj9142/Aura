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
    <div className="rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/95 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] space-y-6">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-950">
              Database Logged Predictions Audit Feed
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Verified flight-level forecasts continuously evaluated against actual scraped airfare telemetry
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Continuous Learning Pipeline Telemetry
        </span>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500 font-medium">
          No past predictions recorded yet. Run simulations above or wait for continuous scraping cycles.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-600 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                <th className="px-4 py-4 font-extrabold">Prediction ID</th>
                <th className="px-4 py-4 font-extrabold">Flight Signature</th>
                <th className="px-4 py-4 font-extrabold">Horizon</th>
                <th className="px-4 py-4 font-extrabold text-right">Predicted Price</th>
                <th className="px-4 py-4 font-extrabold text-center">Model</th>
                <th className="px-4 py-4 font-extrabold text-right">Target Window</th>
                <th className="px-4 py-4 font-extrabold text-center">Ground Truth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90">
              {predictions.map((p) => {
                const parts = p.flightSignature.split("_");
                const carrierFlight = parts[0] || p.flightSignature;
                const route = parts.length >= 3 ? `${parts[1]} → ${parts[2]}` : "";
                const depDate = parts.length >= 4 ? parts[3].split("T")[0] : "";

                return (
                  <tr key={p.predictionId} className="hover:bg-slate-50/90 transition">
                    <td className="py-3 px-4 font-mono text-xs sm:text-sm text-slate-600 font-medium">
                      {p.predictionId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <AirlineLogo airline={carrierFlight} flightNumber={carrierFlight} size="sm" />
                        <div>
                          <div className="font-bold text-sm sm:text-base text-slate-950">{carrierFlight}</div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            {route} {depDate ? `· ${depDate}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs sm:text-sm text-slate-700 font-bold">
                      +{p.targetHorizonHours}h
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-purple-700 text-sm sm:text-base">
                      ₹{p.predictedPrice.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-700 border border-purple-200">
                        {p.modelVersion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs sm:text-sm text-slate-600 font-medium">
                      {p.targetTime ? p.targetTime.substring(0, 16).replace("T", " ") : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.actualPrice !== null && p.actualPrice !== undefined ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs sm:text-sm font-mono font-bold bg-emerald-50/80 px-3 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ₹{p.actualPrice.toFixed(0)}{" "}
                          <span className="text-xs text-emerald-600 font-semibold">
                            (Err: ₹{p.error !== null && p.error !== undefined ? p.error.toFixed(0) : "0"}
                            {p.percentageError !== null && p.percentageError !== undefined
                              ? ` · ${p.percentageError.toFixed(1)}%`
                              : ""}
                            )
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
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
