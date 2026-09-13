"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { HorizonPoint } from "@/lib/ml/types";
import { Info } from "lucide-react";

interface PredictionForecastChartProps {
  data: HorizonPoint[];
  currentPrice: number;
}

export function PredictionForecastChart({ data, currentPrice }: PredictionForecastChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const prices = data.map((d) => d.predictedPrice);
  const minPrice = Math.min(...prices, currentPrice);
  const maxPrice = Math.max(...prices, currentPrice);
  const yDomainMin = Math.floor((minPrice * 0.95) / 100) * 100;
  const yDomainMax = Math.ceil((maxPrice * 1.05) / 100) * 100;

  return (
    <div className="rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/95 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
              Multi-Horizon Price Progression Curve
            </h3>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-200 font-bold">
              30-Day Lead Window
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Simulated price trajectory across advance booking horizons using champion gradient boosting regressor.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
            <span className="text-slate-700 font-bold">ML Predicted Airfare</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
            <defs>
              <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#09090b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#09090b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="horizonLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
            />
            <ReferenceLine
              y={currentPrice}
              stroke="#d97706"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload as HorizonPoint;
                  return (
                    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
                      <p className="text-xs font-bold text-slate-800">
                        {p.horizonLabel}
                      </p>
                      <p className="text-lg font-mono font-black text-slate-950 mt-0.5">
                        ₹{p.predictedPrice.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">
                        Delta:{" "}
                        <span
                          className={
                            p.priceDelta > 0
                              ? "text-rose-600 font-bold"
                              : p.priceDelta < 0
                              ? "text-emerald-600 font-bold"
                              : "text-slate-600"
                          }
                        >
                          {p.priceDelta > 0 ? `+₹${p.priceDelta.toLocaleString("en-IN")}` : `₹${p.priceDelta.toLocaleString("en-IN")}`} ({p.percentChange > 0 ? `+${p.percentChange}%` : `${p.percentChange}%`})
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="predictedPrice"
              stroke="#09090b"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#predictionGradient)"
              dot={{ fill: "#09090b", r: 4, strokeWidth: 1.5, stroke: "#ffffff" }}
              activeDot={{ r: 6, fill: "#000000" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50/80 px-4 py-2.5 text-xs text-slate-600 border border-slate-200 font-medium">
        <Info className="h-4 w-4 text-slate-900 shrink-0" />
        <span>
          Prices typically escalate within the 7-day lead window due to dynamic yield management by low-cost carriers (LCCs) and sudden business travel demand spikes.
        </span>
      </div>
    </div>
  );
}
