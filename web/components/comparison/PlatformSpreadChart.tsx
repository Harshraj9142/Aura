"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { PlatformStat } from "@/types/comparison";
import { getPlatformMeta } from "./PlatformBadge";

interface PlatformSpreadChartProps {
  platformStats: PlatformStat[];
}

const BAR_COLORS: Record<string, string> = {
  indigo: "#2563eb",     // Royal Blue
  airindia: "#dc2626",   // Red
  easemytrip: "#059669", // Emerald
  cleartrip: "#d97706",  // Amber
  ixigo: "#9333ea",      // Purple
  makemytrip: "#e11d48",  // Rose
  yatra: "#ea580c",      // Orange
};

export default function PlatformSpreadChart({ platformStats }: PlatformSpreadChartProps) {
  if (!platformStats || platformStats.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-500 text-sm">
        No platform fare comparisons available for this selection.
      </div>
    );
  }

  const chartData = platformStats.map((item) => {
    const meta = getPlatformMeta(item.source, item.sourceType);
    return {
      source: item.source,
      displayName: meta.name,
      sourceType: item.sourceType,
      avgFare: item.avgFare,
      winRate: item.winRate,
      appearances: item.appearances,
      minFare: item.minFare,
      maxFare: item.maxFare,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Bar Chart of Average Fares */}
      <div className="lg:col-span-2 rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-7 border border-white/90 shadow-xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Average Ticket Price by Platform
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of mean fare across all matching flights in the database (INR).
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Airline Direct
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              OTA Platform
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="displayName"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                domain={["dataMin - 500", "dataMax + 500"]}
              />
              <Tooltip
                cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  backdropFilter: "blur(8px)",
                  borderColor: "#334155",
                  borderRadius: "1rem",
                  color: "#f8fafc",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                  padding: "10px 14px",
                }}
                formatter={(val: any, name: any, item: any) => [
                  `₹${Number(val).toLocaleString("en-IN")}`,
                  `Average Fare (${item.payload.sourceType.toUpperCase()})`,
                ]}
              />
              <Bar
                dataKey="avgFare"
                radius={[8, 8, 0, 0]}
                maxBarSize={52}
              >
                {chartData.map((entry, index) => {
                  const color =
                    BAR_COLORS[entry.source.toLowerCase()] ||
                    (entry.sourceType === "airline" ? "#2563eb" : "#059669");
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Best Price Win Rate Leaderboard */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-7 border border-white/90 shadow-xl flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Cheapest Fare Win Rate
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            How often each platform offers the lowest fare on identical flights.
          </p>

          <div className="mt-5 space-y-4">
            {platformStats.map((p, idx) => {
              const meta = getPlatformMeta(p.source, p.sourceType);
              const color =
                BAR_COLORS[p.source.toLowerCase()] ||
                (p.sourceType === "airline" ? "#2563eb" : "#059669");

              return (
                <div key={p.source} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {meta.name}
                      </span>
                      <span className="text-[10px] text-slate-600 font-medium">
                        ({p.bestPriceCount}/{p.appearances} flights)
                      </span>
                    </div>
                    <span className="font-bold text-slate-950">
                      {p.winRate}%
                    </span>
                  </div>

                  {/* Win rate progress bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(p.winRate, 3)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
          💡 <strong className="text-slate-800 font-semibold">Smart Tip:</strong> Airlines often provide lower direct base fares, but OTAs may offer promotional subsidies or bundled discounts on specific routes.
        </div>
      </div>
    </div>
  );
}
