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
import { TrendingUp, Calendar, Info } from "lucide-react";

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
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100">
              Multi-Horizon Price Progression Curve
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              30-Day Lead Window
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated price trajectory across advance booking horizons using champion gradient boosting regressor.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-400">ML Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-amber-400 border-dashed" />
            <span className="text-slate-400">Current Fare (₹{currentPrice.toLocaleString()})</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="horizonLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              tickFormatter={(v) => `₹${v.toLocaleString()}`}
            />
            <ReferenceLine
              y={currentPrice}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload as HorizonPoint;
                  return (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
                      <p className="text-xs font-semibold text-slate-300">
                        {p.horizonLabel}
                      </p>
                      <p className="text-base font-mono font-bold text-purple-400 mt-1">
                        ₹{p.predictedPrice.toLocaleString()}
                      </p>
                      <p className="text-xs font-mono text-slate-400">
                        Delta:{" "}
                        <span
                          className={
                            p.priceDelta > 0
                              ? "text-rose-400"
                              : p.priceDelta < 0
                              ? "text-emerald-400"
                              : "text-slate-400"
                          }
                        >
                          {p.priceDelta > 0 ? `+₹${p.priceDelta}` : `₹${p.priceDelta}`} ({p.percentChange > 0 ? `+${p.percentChange}%` : `${p.percentChange}%`})
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
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#predictionGradient)"
              dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 1, stroke: "#ffffff" }}
              activeDot={{ r: 6, fill: "#a855f7" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-900/50 px-3 py-2 text-[11px] text-slate-400 border border-slate-800/60">
        <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span>
          Prices typically escalate within the 7-day lead window due to dynamic yield management by low-cost carriers (LCCs) and sudden business travel demand spikes.
        </span>
      </div>
    </div>
  );
}
