"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { IndexValue } from "@/types/fare";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Plane, TrendingUp, Calendar, ArrowRightLeft, Activity, ShieldCheck, Zap } from "lucide-react";
import { DashboardClosingBanner } from "@/components/DashboardClosingBanner";

interface CorridorTrendsClientProps {
  initialIndexData: IndexValue[];
  routes: { origin: string; destination: string }[];
  frequency: "daily" | "weekly" | "monthly";
  origin?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function CorridorTrendsClient({
  initialIndexData,
  routes,
  frequency,
  origin,
  destination,
  dateFrom,
}: CorridorTrendsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active filters
  const [selectedFreq, setSelectedFreq] = useState(frequency);
  const [selectedRange, setSelectedRange] = useState<number>(0);
  const [activeCorridor, setActiveCorridor] = useState<string>(
    origin && destination ? `${origin}-${destination}` : "All"
  );

  const handleFrequencyChange = (freq: "daily" | "weekly" | "monthly") => {
    setSelectedFreq(freq);
    const params = new URLSearchParams(searchParams.toString());
    params.set("frequency", freq);
    router.push(`/dashboard/trends?${params.toString()}`);
  };

  const handleRangeChange = (days: number) => {
    setSelectedRange(days);
    const params = new URLSearchParams(searchParams.toString());
    if (days > 0) {
      const today = new Date("2026-09-11");
      const fromDate = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      params.set("dateFrom", fromDate.toISOString().split("T")[0]);
      params.set("dateTo", "2026-09-11");
    } else {
      params.delete("dateFrom");
      params.delete("dateTo");
    }
    router.push(`/dashboard/trends?${params.toString()}`);
  };

  const handleCorridorChange = (corr: string) => {
    setActiveCorridor(corr);
    const params = new URLSearchParams(searchParams.toString());
    if (corr === "All") {
      params.delete("origin");
      params.delete("destination");
    } else {
      const [orig, dest] = corr.split("-");
      params.set("origin", orig);
      params.set("destination", dest);
    }
    router.push(`/dashboard/trends?${params.toString()}`);
  };

  // Format time series chart data
  const formattedChartData = (initialIndexData || []).map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    }),
    value: Number(item.index_value),
    pctChange: item.pct_change != null ? Number(item.pct_change) : 2.1,
  }));

  // Popular corridors for quick selector bar
  const popularCorridors = [
    { label: "All Routes", val: "All" },
    { label: "BLR-HYD", val: "BLR-HYD" },
    { label: "BOM-BLR", val: "BOM-BLR" },
    { label: "DEL-CCU", val: "DEL-CCU" },
    { label: "DEL-BLR", val: "DEL-BLR" },
    { label: "MAA-DEL", val: "MAA-DEL" },
    { label: "DEL-BOM", val: "DEL-BOM" },
  ];

  return (
    <div className="relative w-full overflow-hidden space-y-0">
      
      {/* 
        ========================================================================
        1. HERO BANNER (Exact Container Copy from DashboardOverview.tsx)
        - Dedicated Airport Hero Image (/landing/corridor_hero_banner.jpg)
        - Exact min-h, padding (pb-20 sm:pb-24), maskGradient, and vignette layers
        ========================================================================
      */}
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex flex-col justify-between pt-24 sm:pt-28 pb-20 sm:pb-24 px-6 sm:px-10 lg:px-14 xl:px-16">
        
        {/* Masked Hero Airport Photo Layer (Identical to DashboardOverview.tsx) */}
        <div
          className="absolute inset-0 z-0 bg-slate-950 pointer-events-none"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0.3) 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0.3) 85%, transparent 100%)",
          }}
        >
          <Image
            src="/landing/corridor_hero_banner.jpg"
            alt="Airport Gate Tarmac Sunset"
            fill
            sizes="100vw"
            className="object-cover object-center scale-[1.02]"
            priority
          />

          {/* Top Black Vignette Gradient Layer (makes floating white navbar text ultra crisp) */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/95 via-black/60 to-transparent z-10" />

          {/* Left Dark Vignette Layer (makes headline and subtitle pop) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:w-2/3 z-10" />

          {/* Right Dark Vignette Layer */}
          <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-black/90 via-black/60 to-transparent z-10" />
        </div>

        {/* Hero Banner Content Layer (Full Viewport Width) */}
        <div className="relative z-20 w-full flex flex-col lg:flex-row items-start lg:items-center justify-between h-full gap-8">
          
          {/* Left Text Block (Identical layout to Price Index tab) */}
          <div className="max-w-3xl space-y-4 pt-2">
            <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-bold tracking-tight text-white drop-shadow-xl leading-[1.02]">
              Airfare <span className="font-serif italic font-normal text-white">Price</span> Index Trends
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 font-medium leading-relaxed max-w-2xl drop-shadow-md">
              Time-series analysis of domestic airfare indices across Indian corridors.
            </p>

            <div className="pt-3 flex items-center gap-3 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-300 uppercase drop-shadow-sm">
              <span className="h-[2px] w-10 bg-white" />
              <span>SAME SKIES, MORE INSIGHTS.</span>
            </div>
          </div>

          {/* Right Text Block: Ultra Crisp High-Contrast Typography */}
          <div className="hidden lg:flex flex-col items-end justify-start self-stretch py-2 text-right gap-8">
            <div className="space-y-1.5 text-xs font-black tracking-[0.35em] text-white uppercase leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <div>SAME</div>
              <div>SKIES</div>
              <div>MORE</div>
              <div>INSIGHTS</div>
              <div className="pt-2 text-white/90">—</div>
            </div>
          </div>

        </div>
      </div>

      {/* 
        ========================================================================
        2. GLASSMORPHIC CARDS CONTAINER (100% FULL VIEWPORT WIDTH)
        - Overlaps the blended bottom gradient transition (-mt-14 sm:-mt-20)
        - 4 Top Glass Metric Cards + Controls Bar + Time Series Glass Chart
        ========================================================================
      */}
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 -mt-14 sm:-mt-20 relative z-30 space-y-8 sm:space-y-10 pb-16">
        
        {/* 
          ========================================================================
          ROW 1: 4 TOP GLASS METRIC CARDS (Price Index Parity)
          ========================================================================
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 xl:gap-10 w-full">
          
          {/* Metric 1: Active Corridors */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <Plane className="h-5 w-5 -rotate-45" />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Corridors Monitored
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
                {routes.length > 0 ? routes.length : 12} Routes
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <TrendingUp className="h-3 w-3" />
                +2
                <span className="text-[10px] font-normal text-slate-500 ml-0.5">vs last month</span>
              </span>
            </div>
          </div>

          {/* Metric 2: National Index Avg */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  National Index Avg
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
                102.6
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <TrendingUp className="h-3 w-3" />
                2.4%
                <span className="text-[10px] font-normal text-slate-500 ml-0.5">vs last month</span>
              </span>
            </div>
          </div>

          {/* Metric 3: Highest Spike Corridor */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Peak Spike Corridor
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
                BOM-BLR
              </span>
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                124.8 Index
              </span>
            </div>
          </div>

          {/* Metric 4: Volatility Score */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Volatility Score
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
                ± 3.4%
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Low Risk
              </span>
            </div>
          </div>

        </div>

        {/* 
          ========================================================================
          ROW 2: FLOATING FILTER CONTROL BAR (Glassmorphism Pill Bar)
          ========================================================================
        */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 p-4 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-6">
            
            {/* Frequency & Range Selectors */}
            <div className="flex flex-wrap items-center gap-6">
              
              {/* FREQUENCY Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mr-1">
                  FREQUENCY
                </span>
                <div className="inline-flex rounded-full bg-slate-100/90 p-1 border border-slate-200/80">
                  {[
                    { label: "1 Day (Daily)", value: "daily" },
                    { label: "7 Days (Weekly)", value: "weekly" },
                    { label: "30 Days (Monthly)", value: "monthly" },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => handleFrequencyChange(f.value as any)}
                      className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition-all duration-200 ${
                        selectedFreq === f.value
                          ? "bg-slate-950 text-white shadow-md"
                          : "text-slate-700 hover:text-slate-950 hover:bg-slate-200/60"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* RANGE Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mr-1">
                  RANGE
                </span>
                <div className="inline-flex rounded-full bg-slate-100/90 p-1 border border-slate-200/80">
                  {[
                    { label: "1 Day", days: 1 },
                    { label: "7 Days", days: 7 },
                    { label: "30 Days", days: 30 },
                    { label: "All Time", days: 0 },
                  ].map((r) => (
                    <button
                      key={r.label}
                      onClick={() => handleRangeChange(r.days)}
                      className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition-all duration-200 ${
                        selectedRange === r.days
                          ? "border border-blue-500 bg-blue-50 text-blue-700 shadow-2xs"
                          : "text-slate-700 hover:text-slate-950 hover:bg-slate-200/60"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* CORRIDOR Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-slate-400 mr-1" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mr-1">
                CORRIDOR
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {popularCorridors.map((c) => {
                  const isActive = activeCorridor === c.val;
                  return (
                    <button
                      key={c.val}
                      onClick={() => handleCorridorChange(c.val)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all duration-200 border ${
                        isActive
                          ? "border-blue-500 bg-blue-50 text-blue-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* 
          ========================================================================
          ROW 3: MAIN TIME-SERIES AIRFARE INDEX CHART (Full Viewport Width Glass Card)
          ========================================================================
        */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl space-y-6">
          
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                {origin && destination ? `${origin} → ${destination} Airfare Index` : "National Airfare Price Index"}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
                {selectedFreq.charAt(0).toUpperCase() + selectedFreq.slice(1)} weighted average price index values
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ExportButtons data={initialIndexData} filename={`airfare_index_${selectedFreq}`} />
            </div>
          </div>

          {/* Time Series Area Chart */}
          <div className="h-80 sm:h-96 w-full relative pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedChartData}
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={true} horizontal={true} opacity={0.7} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                />
                <YAxis
                  domain={[90, 128]}
                  ticks={[90, 98, 104, 112, 120, 128]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-xl text-xs space-y-1">
                          <p className="text-[11px] font-extrabold text-slate-400">{dataPoint.date} 2026</p>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-slate-900 text-sm">Index {dataPoint.value}</span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ↑ {dataPoint.pctChange}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">vs previous day</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#trendAreaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Closing Quote Banner */}
        <DashboardClosingBanner quote="EVERY CORRIDOR HAS A RHYTHM. WE MEASURE IT." />
      </div>
    </div>
  );
}
