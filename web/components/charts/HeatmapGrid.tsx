"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HeatmapCell } from "@/types/fare";
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  Plane,
  Sparkles,
  Info,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface HeatmapGridProps {
  data: HeatmapCell[];
}

const CITY_NAMES: Record<string, string> = {
  DEL: "Delhi",
  BOM: "Mumbai",
  BLR: "Bengaluru",
  CCU: "Kolkata",
  HYD: "Hyderabad",
  MAA: "Chennai",
};

export function HeatmapGrid({ data }: HeatmapGridProps) {
  // Horizon filter: 7d, 14d, 30d, all
  const [horizon, setHorizon] = useState<"7d" | "14d" | "30d" | "all">("14d");
  // View mode: relative (% vs corridor baseline) vs absolute (raw INR)
  const [viewMode, setViewMode] = useState<"relative" | "absolute">("relative");
  // Route corridor filter
  const [selectedCorridor, setSelectedCorridor] = useState<string>("ALL");
  // Selected cell for deep inspection
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);

  // All distinct dates sorted
  const allDates = useMemo(() => {
    if (!data || data.length === 0) return [];
    const dateSet = new Set<string>();
    data.forEach((c) => dateSet.add(c.travel_date));
    return Array.from(dateSet).sort();
  }, [data]);

  // Filtered dates based on horizon
  const visibleDates = useMemo(() => {
    if (horizon === "7d") return allDates.slice(0, 7);
    if (horizon === "14d") return allDates.slice(0, 14);
    if (horizon === "30d") return allDates.slice(0, 30);
    return allDates;
  }, [allDates, horizon]);

  // All distinct routes sorted
  const allRoutes = useMemo(() => {
    if (!data || data.length === 0) return [];
    const routeSet = new Set<string>();
    data.forEach((c) => routeSet.add(c.route));
    return Array.from(routeSet).sort();
  }, [data]);

  // Visible routes based on corridor filter
  const visibleRoutes = useMemo(() => {
    if (selectedCorridor === "ALL") return allRoutes;
    return allRoutes.filter((r) => r === selectedCorridor);
  }, [allRoutes, selectedCorridor]);

  // Lookup map for fast cell access
  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    if (data) {
      data.forEach((cell) => {
        map.set(`${cell.route}|${cell.travel_date}`, cell);
      });
    }
    return map;
  }, [data]);

  // Visible cells for metrics computation
  const visibleCells = useMemo(() => {
    const list: HeatmapCell[] = [];
    visibleRoutes.forEach((route) => {
      visibleDates.forEach((date) => {
        const cell = cellMap.get(`${route}|${date}`);
        if (cell) list.push(cell);
      });
    });
    return list;
  }, [visibleRoutes, visibleDates, cellMap]);

  // Summary Metrics for the visible window
  const metrics = useMemo(() => {
    if (visibleCells.length === 0) {
      return { minCell: null, maxCell: null, avgFare: 0, totalFlights: 0 };
    }

    let minCell = visibleCells[0];
    let maxCell = visibleCells[0];
    let sumFare = 0;
    let totalFlights = 0;

    visibleCells.forEach((c) => {
      sumFare += c.avg_total_fare;
      totalFlights += c.sample_count ?? 1;
      if (c.avg_total_fare < minCell.avg_total_fare) minCell = c;
      if (c.avg_total_fare > maxCell.avg_total_fare) maxCell = c;
    });

    return {
      minCell,
      maxCell,
      avgFare: Math.round(sumFare / visibleCells.length),
      totalFlights,
    };
  }, [visibleCells]);

  // Active inspected cell: either selected or default to the best deal
  const activeInspectedCell = useMemo(() => {
    if (selectedCellKey && cellMap.has(selectedCellKey)) {
      return cellMap.get(selectedCellKey)!;
    }
    return metrics.minCell;
  }, [selectedCellKey, cellMap, metrics.minCell]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
        <Plane className="h-10 w-10 text-slate-300 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No Heatmap Data Found</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md">
          There are currently no recorded airline fares matching the selected criteria.
        </p>
      </div>
    );
  }

  // Calculate cell color and delta
  const getCellDetails = (cell?: HeatmapCell) => {
    if (!cell) {
      return {
        bg: "bg-slate-50/50 text-slate-400 border-slate-100",
        deltaText: null,
        badgeBg: "",
        ratio: 0,
      };
    }

    const benchmark = cell.base_benchmark || cell.avg_total_fare;
    const deltaPct = Math.round(((cell.avg_total_fare - benchmark) / benchmark) * 100);

    if (viewMode === "relative") {
      if (deltaPct <= -15) {
        return {
          bg: "bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400",
          deltaText: `${deltaPct}%`,
          badgeBg: "bg-emerald-200 text-emerald-900",
          ratio: -2,
        };
      }
      if (deltaPct < -3) {
        return {
          bg: "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
          deltaText: `${deltaPct}%`,
          badgeBg: "bg-emerald-100 text-emerald-800",
          ratio: -1,
        };
      }
      if (deltaPct <= 5) {
        return {
          bg: "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300",
          deltaText: `${deltaPct >= 0 ? "+" : ""}${deltaPct}%`,
          badgeBg: "bg-slate-200 text-slate-700",
          ratio: 0,
        };
      }
      if (deltaPct <= 20) {
        return {
          bg: "bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100 hover:border-amber-300",
          deltaText: `+${deltaPct}%`,
          badgeBg: "bg-amber-100 text-amber-800",
          ratio: 1,
        };
      }
      return {
        bg: "bg-rose-100 text-rose-950 border-rose-300 hover:bg-rose-200 hover:border-rose-400 font-semibold",
        deltaText: `+${deltaPct}%`,
        badgeBg: "bg-rose-200 text-rose-900",
        ratio: 2,
      };
    } else {
      // Absolute scaling across visibleCells
      const min = metrics.minCell?.avg_total_fare || 3000;
      const max = metrics.maxCell?.avg_total_fare || 14000;
      const norm = max === min ? 0.5 : (cell.avg_total_fare - min) / (max - min);

      if (norm < 0.2) {
        return {
          bg: "bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200",
          deltaText: null,
          badgeBg: "bg-emerald-200 text-emerald-900",
          ratio: -2,
        };
      }
      if (norm < 0.4) {
        return {
          bg: "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100",
          deltaText: null,
          badgeBg: "bg-emerald-100 text-emerald-800",
          ratio: -1,
        };
      }
      if (norm < 0.6) {
        return {
          bg: "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100",
          deltaText: null,
          badgeBg: "bg-slate-200 text-slate-700",
          ratio: 0,
        };
      }
      if (norm < 0.8) {
        return {
          bg: "bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100",
          deltaText: null,
          badgeBg: "bg-amber-100 text-amber-800",
          ratio: 1,
        };
      }
      return {
        bg: "bg-rose-100 text-rose-950 border-rose-300 hover:bg-rose-200 font-semibold",
        deltaText: null,
        badgeBg: "bg-rose-200 text-rose-900",
        ratio: 2,
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Lowest Fare */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lowest Fare in Window
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <TrendingDown className="mr-1 h-3.5 w-3.5" />
              Best Deal
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.minCell ? `₹${metrics.minCell.avg_total_fare.toLocaleString("en-IN")}` : "—"}
            </span>
            {metrics.minCell && (
              <span className="text-xs font-bold text-slate-600 font-mono">
                {metrics.minCell.route}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.minCell ? (
              <>
                Departure:{" "}
                <span className="font-semibold text-slate-700">
                  {new Date(metrics.minCell.travel_date).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </span>
              </>
            ) : (
              "No data available"
            )}
          </p>
        </div>

        {/* Metric 2: Network Average */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Window Average Fare
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Average
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{metrics.avgFare.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-medium text-slate-500">across corridors</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Across {visibleCells.length} corridor departure dates
          </p>
        </div>

        {/* Metric 3: Highest Fare / Peak Surge */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Peak Surge Fare
            </span>
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
              <TrendingUp className="mr-1 h-3.5 w-3.5" />
              Peak
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.maxCell ? `₹${metrics.maxCell.avg_total_fare.toLocaleString("en-IN")}` : "—"}
            </span>
            {metrics.maxCell && (
              <span className="text-xs font-bold text-slate-600 font-mono">
                {metrics.maxCell.route}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.maxCell ? (
              <>
                Departure:{" "}
                <span className="font-semibold text-slate-700">
                  {new Date(metrics.maxCell.travel_date).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </span>
              </>
            ) : (
              "No data available"
            )}
          </p>
        </div>

        {/* Metric 4: Flight Observations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Observations
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              <Plane className="mr-1 h-3.5 w-3.5" />
              Live DB
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metrics.totalFlights.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-medium text-slate-500">flights</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Across {visibleRoutes.length} route{visibleRoutes.length > 1 ? "s" : ""} × {visibleDates.length} date
            {visibleDates.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Interactive Controls & Mode Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Mode:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode("relative")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "relative"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Corridor Relative (%)
            </button>
            <button
              onClick={() => setViewMode("absolute")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "absolute"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Absolute Fare (₹)
            </button>
          </div>
        </div>

        {/* Middle & Right: Horizon & Corridor Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Corridor Filter */}
          <select
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(e.target.value)}
            aria-label="Filter by corridor"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Corridors (6)</option>
            {allRoutes.map((r) => {
              const [orig, dest] = r.split("-");
              return (
                <option key={r} value={r}>
                  {r} ({CITY_NAMES[orig] || orig} → {CITY_NAMES[dest] || dest})
                </option>
              );
            })}
          </select>

          {/* Date Horizon Pills */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {(
              [
                { id: "7d", label: "7 Days" },
                { id: "14d", label: "14 Days" },
                { id: "30d", label: "30 Days" },
                { id: "all", label: `All (${allDates.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setHorizon(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  horizon === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Guidance Note */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          {viewMode === "relative" ? (
            <span>
              <strong>Corridor Relative Mode:</strong> Compares day fare against that route&apos;s baseline
              benchmark so short and long routes can be evaluated fairly.
            </span>
          ) : (
            <span>
              <strong>Absolute Mode:</strong> Highlights raw pricing levels across all displayed flights.
            </span>
          )}
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-2">
          {viewMode === "relative" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-emerald-200 border border-emerald-400"></span>
                <span className="text-emerald-900 font-medium">&le; -15% Deal</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-emerald-100 border border-emerald-300"></span>
                <span className="text-emerald-800 font-medium">-15% to -3%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-slate-100 border border-slate-300"></span>
                <span className="text-slate-700 font-medium">±0% Baseline</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-amber-100 border border-amber-300"></span>
                <span className="text-amber-800 font-medium">+5% to +20%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-rose-200 border border-rose-400"></span>
                <span className="text-rose-900 font-medium">&gt; +20% Surge</span>
              </span>
            </>
          ) : (
            <>
              <span className="text-slate-500 font-medium">Lower (₹)</span>
              <div className="flex h-2.5 w-24 rounded-full overflow-hidden border border-slate-200">
                <div className="w-1/5 bg-emerald-200"></div>
                <div className="w-1/5 bg-emerald-100"></div>
                <div className="w-1/5 bg-slate-200"></div>
                <div className="w-1/5 bg-amber-200"></div>
                <div className="w-1/5 bg-rose-200"></div>
              </div>
              <span className="text-slate-500 font-medium">Higher (₹)</span>
            </>
          )}
        </div>
      </div>

      {/* Heatmap Grid Main Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                {/* Sticky Route Header */}
                <th className="sticky left-0 z-20 bg-slate-100/95 backdrop-blur px-4 py-3 text-xs font-bold text-slate-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                  Route Corridor
                </th>
                {/* Dates Headers */}
                {visibleDates.map((dateStr) => {
                  const d = new Date(dateStr);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
                  const dateNum = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

                  return (
                    <th
                      key={dateStr}
                      className={`px-3 py-2.5 text-center text-xs font-medium whitespace-nowrap min-w-[85px] border-l border-slate-200/60 ${
                        isWeekend ? "bg-amber-50/40 text-amber-900" : "text-slate-700"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isWeekend ? "text-amber-700 font-extrabold" : "text-slate-400"
                          }`}
                        >
                          {dayName}
                        </span>
                        <span className="font-semibold text-slate-800 text-xs">{dateNum}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRoutes.map((route) => {
                const [orig, dest] = route.split("-");
                return (
                  <tr key={route} className="hover:bg-slate-50/50 transition-colors">
                    {/* Sticky Route Cell */}
                    <td className="sticky left-0 z-10 bg-white/95 backdrop-blur px-4 py-3 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200/80">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-slate-900 text-sm tracking-tight">
                          {route}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                          {CITY_NAMES[orig] || orig} &rarr; {CITY_NAMES[dest] || dest}
                        </span>
                      </div>
                    </td>

                    {/* Date Cells */}
                    {visibleDates.map((dateStr) => {
                      const key = `${route}|${dateStr}`;
                      const cell = cellMap.get(key);
                      const isSelected = selectedCellKey === key || (!selectedCellKey && activeInspectedCell === cell);
                      const { bg, deltaText } = getCellDetails(cell);

                      return (
                        <td key={dateStr} className="p-1 text-center border-l border-slate-100">
                          {cell ? (
                            <button
                              onClick={() => setSelectedCellKey(key)}
                              className={`w-full h-14 rounded-xl px-1.5 py-1 transition-all flex flex-col items-center justify-center border text-center relative cursor-pointer ${bg} ${
                                isSelected
                                  ? "ring-2 ring-blue-600 shadow-md scale-[1.03] z-10 font-bold"
                                  : "hover:scale-[1.02]"
                              }`}
                            >
                              <span className="text-xs font-black tracking-tight leading-tight">
                                ₹{cell.avg_total_fare.toLocaleString("en-IN")}
                              </span>

                              {viewMode === "relative" && deltaText && (
                                <span className="text-[10px] font-bold mt-0.5 opacity-90">
                                  {deltaText}
                                </span>
                              )}

                              {viewMode === "absolute" && cell.min_fare && (
                                <span className="text-[9px] text-slate-500 font-medium">
                                  min ₹{cell.min_fare.toLocaleString("en-IN")}
                                </span>
                              )}
                            </button>
                          ) : (
                            <div className="w-full h-14 rounded-xl flex items-center justify-center text-slate-300 text-xs">
                              &mdash;
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Cell Deep Dive Inspector Card */}
      {activeInspectedCell && (
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-black text-white font-mono">
                  {activeInspectedCell.route}
                </span>
                <span className="text-base font-bold text-slate-900">
                  {CITY_NAMES[activeInspectedCell.route.split("-")[0]] || activeInspectedCell.route.split("-")[0]} &rarr;{" "}
                  {CITY_NAMES[activeInspectedCell.route.split("-")[1]] || activeInspectedCell.route.split("-")[1]}
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 ml-2">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  {new Date(activeInspectedCell.travel_date).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Detailed airfare snapshot based on {activeInspectedCell.sample_count || 1} live airline/OTA observations.
              </p>
            </div>

            {/* Verdict Badge */}
            <div className="flex items-center gap-2">
              {activeInspectedCell.base_benchmark && (
                (() => {
                  const delta = Math.round(
                    ((activeInspectedCell.avg_total_fare - activeInspectedCell.base_benchmark) /
                      activeInspectedCell.base_benchmark) *
                      100
                  );
                  if (delta <= -10) {
                    return (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Excellent Deal ({delta}% vs Corridor Norm)
                      </span>
                    );
                  }
                  if (delta >= 15) {
                    return (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-100 px-3.5 py-1.5 text-xs font-bold text-rose-900 border border-rose-300">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        High Demand Surge (+{delta}% vs Corridor Norm)
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-800 border border-slate-300">
                      <Zap className="h-4 w-4 text-blue-600" />
                      Fair Benchmark Rate ({delta >= 0 ? "+" : ""}{delta}%)
                    </span>
                  );
                })()
              )}

              <Link
                href={`/dashboard/predictions?origin=${activeInspectedCell.route.split("-")[0]}&destination=${
                  activeInspectedCell.route.split("-")[1]
                }`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                Run Forecast
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 4 Detail Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Average Total Fare
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                ₹{activeInspectedCell.avg_total_fare.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Calculated weighted mean</span>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Lowest Available
              </span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                ₹{(activeInspectedCell.min_fare ?? activeInspectedCell.avg_total_fare).toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Cheapest ticket found</span>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Highest Available
              </span>
              <span className="text-xl font-black text-rose-700 mt-1 block">
                ₹{(activeInspectedCell.max_fare ?? activeInspectedCell.avg_total_fare).toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">Peak carrier fare</span>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Route Baseline
              </span>
              <span className="text-xl font-black text-slate-700 mt-1 block">
                ₹{(activeInspectedCell.base_benchmark ?? activeInspectedCell.avg_total_fare).toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Historical corridor base</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
