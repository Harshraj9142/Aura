"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Plane,
  Coins,
  Users,
  Clock,
  ChevronRight,
  Minus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import AirlineLogo from "@/components/AirlineLogo";
import { IndiaRouteMap } from "@/components/maps/IndiaRouteMap";

// Default real baseline data from Neon PostgreSQL (Ep-quiet-dawn)
const INITIAL_INDEX_CHART_DATA = [
  { month: "Aug 12", index: 99.4 },
  { month: "Aug 16", index: 101.4 },
  { month: "Aug 22", index: 105.5 },
  { month: "Aug 29", index: 106.4 },
  { month: "Sep 04", index: 110.3 },
  { month: "Sep 08", index: 110.4 },
  { month: "Sep 11", index: 106.0 },
  { month: "Sep 12", index: 126.9 },
];

interface RouteFeedItem {
  route: string;
  carrier: string;
  flightNumber: string;
  fare: string;
  tag: string;
  tagType: "green" | "blue" | "red";
}

const INITIAL_LIVE_ROUTE_FEEDS: RouteFeedItem[] = [
  {
    route: "DEL → BOM",
    carrier: "Air India",
    flightNumber: "AI-525",
    fare: "₹6,223",
    tag: "↓ 22%",
    tagType: "green" as const,
  },
  {
    route: "DEL → BLR",
    carrier: "Air India",
    flightNumber: "AI-168",
    fare: "₹7,225",
    tag: "↓ 19%",
    tagType: "green" as const,
  },
  {
    route: "BOM → BLR",
    carrier: "Air India",
    flightNumber: "AI-726",
    fare: "₹5,408",
    tag: "↓ 18%",
    tagType: "green" as const,
  },
  {
    route: "DEL → CCU",
    carrier: "Air India",
    flightNumber: "AI-325",
    fare: "₹5,297",
    tag: "↓ 26%",
    tagType: "green" as const,
  },
  {
    route: "BLR → HYD",
    carrier: "Air India",
    flightNumber: "AI-549",
    fare: "₹3,690",
    tag: "↓ 22%",
    tagType: "green" as const,
  },
  {
    route: "MAA → DEL",
    carrier: "Air India",
    flightNumber: "AI-112",
    fare: "₹6,392",
    tag: "↓ 25%",
    tagType: "green" as const,
  },
];

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalFares: 6715,
    avgFare: 8841,
    otasCount: 6,
    avgUpdateTime: "1.2s",
    airfareIndex: 126.9,
    indexPctChange: 19.7,
  });

  const [chartData, setChartData] = useState(INITIAL_INDEX_CHART_DATA);
  const [liveRouteFeeds, setLiveRouteFeeds] = useState(INITIAL_LIVE_ROUTE_FEEDS);

  useEffect(() => {
    // Load live database stats from PostgreSQL
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/overview");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (json.data.stats) setStats(json.data.stats);
            if (json.data.chartData?.length) setChartData(json.data.chartData);
            if (json.data.liveFeeds?.length) setLiveRouteFeeds(json.data.liveFeeds);
          }
        }
      } catch (err) {
        console.warn("API load note:", err);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="w-full font-body pb-16">
      {/* 
        ========================================================================
        1. HERO BANNER: Full Viewport Width with Blended Bottom Blur Mask
        - Spans 100% full viewport width edge-to-edge
        - Dark vignette layers for navbar legibility & text contrast
        - Fades smoothly at bottom into custom cloud background
        ========================================================================
      */}
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex flex-col justify-between pt-24 sm:pt-28 pb-20 sm:pb-24 px-6 sm:px-10 lg:px-14 xl:px-16">
        {/* Full-width Background Panorama Image with Smooth Bottom Mask Blend */}
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
            src="/dashboard/airport_overview_hero.jpg"
            alt="Airport Runway Sunset"
            fill
            sizes="100vw"
            className="object-cover object-center scale-[1.02]"
            priority
          />

          {/* Top Black Vignette Gradient Layer (makes floating white navbar text ultra crisp) */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/95 via-black/60 to-transparent z-10" />

          {/* Left Dark Vignette Layer (makes white headline and subtitle pop) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:w-2/3 z-10" />

          {/* Right Dark Vignette Layer (makes DATA / ROUTES / PEOPLE / PROGRESS text 100% visible) */}
          <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-black/90 via-black/60 to-transparent z-10" />
        </div>

        {/* Hero Banner Content Layer (Full Viewport Width) */}
        <div className="relative z-20 w-full flex flex-col lg:flex-row items-start lg:items-center justify-between h-full gap-8">
          {/* Left Text Block */}
          <div className="max-w-3xl space-y-5 pt-2">
            <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-bold tracking-tight text-white drop-shadow-xl leading-[1.02]">
              India <span className="font-serif italic font-normal text-white">in</span> motion.
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 font-medium leading-relaxed max-w-2xl drop-shadow-md">
              Real-time airfare intelligence for a more connected India.
            </p>
            <div className="pt-3 flex items-center gap-3 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-300 uppercase drop-shadow-sm">
              <span className="h-[2px] w-10 bg-white" />
              <span>SAME SKIES, A BRIGHTER TOMORROW.</span>
            </div>
          </div>

          {/* Right Text Block: Ultra Crisp High-Contrast Text */}
          <div className="hidden lg:flex flex-col items-end justify-start self-stretch py-2 text-right gap-8">
            <div className="space-y-1.5 text-xs font-black tracking-[0.35em] text-white uppercase leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <div>DATA</div>
              <div>ROUTES</div>
              <div>PEOPLE</div>
              <div>PROGRESS</div>
              <div className="pt-2 text-white/90">—</div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. GLASSMORPHIC CARDS CONTAINER (100% FULL VIEWPORT WIDTH)
        - Stretches across entire screen from left edge to right edge
        - Balanced spacing and margins between all cards
        ========================================================================
      */}
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 -mt-14 sm:-mt-20 relative z-30 space-y-8 sm:space-y-10">
        {/* 
          ========================================================================
          ROW 1: 4 TOP GLASS METRIC CARDS (Stretched Full Width with Spacings)
          ========================================================================
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 xl:gap-10 w-full">
          {/* Metric 1: Routes Tracked */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <Plane className="h-5 w-5 -rotate-45" />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Routes Tracked
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
                {stats.totalFares.toLocaleString("en-IN")}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <TrendingUp className="h-3 w-3" />
                12%
                <span className="text-[10px] font-normal text-slate-500 ml-0.5">vs last month</span>
              </span>
            </div>
          </div>

          {/* Metric 2: Avg. Domestic Fare */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <Coins className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Avg. Domestic Fare
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
                ₹{stats.avgFare.toLocaleString("en-IN")}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <TrendingDown className="h-3 w-3" />
                3.2%
                <span className="text-[10px] font-normal text-slate-500 ml-0.5">vs last month</span>
              </span>
            </div>
          </div>

          {/* Metric 3: OTAs Monitored */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  OTAs Monitored
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
                {stats.otasCount}+
              </span>
              <span className="text-xs font-medium text-slate-500">
                — No change
              </span>
            </div>
          </div>

          {/* Metric 4: Avg. Update Time */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 border border-slate-200/50">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Avg. Update Time
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
                {stats.avgUpdateTime}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <TrendingDown className="h-3 w-3" />
                45%
                <span className="text-[10px] font-normal text-slate-500 ml-0.5">Faster</span>
              </span>
            </div>
          </div>
        </div>

        {/* 
          ========================================================================
          ROW 2: MAIN CONTENT GLASS GRID (3 CARDS - Full Viewport Width)
          ========================================================================
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 xl:gap-10 w-full items-stretch">
          {/* 
            CARD 1 (Left 4 Cols): India Airfare Index Chart
          */}
          <div className="lg:col-span-4 rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl flex flex-col justify-between hover:bg-white/85 transition-all duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-[#08080D]">
                  India Airfare Index
                </h3>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  aria-label="View Index details"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Stat */}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#08080D]">
                  {stats.airfareIndex}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {stats.indexPctChange >= 0 ? `+${stats.indexPctChange}%` : `${stats.indexPctChange}%`}
                  <span className="text-[11px] font-normal text-slate-500">vs 30d base</span>
                </span>
              </div>
            </div>

            {/* Area Chart */}
            <div className="mt-8 h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                    itemStyle={{ color: "#38bdf8" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="index"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#indexGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Floating marker for latest index */}
              <div className="absolute top-2 right-4 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                {stats.airfareIndex}
              </div>
            </div>
          </div>

          {/* 
            CARD 2 (Middle 5 Cols): Live Route Activity (Map + List)
          */}
          <div className="lg:col-span-5 rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 border border-white/90 shadow-xl flex flex-col justify-between hover:bg-white/85 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#08080D]">
                Live Route Activity
              </h3>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                aria-label="Minimize"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>

            {/* Inner Grid: Map Graphic Left + Route Feed List Right */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* India Map Graphic Container with D3 Accurate Mercator Projection & Real Coordinates */}
              <div className="sm:col-span-5 relative h-56 sm:h-64 w-full flex items-center justify-center p-0">
                <IndiaRouteMap width={320} height={360} />
              </div>

              {/* Route List Feed Right */}
              <div className="sm:col-span-7 space-y-2">
                {liveRouteFeeds.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 transition border border-slate-200/40"
                  >
                    <div className="flex items-center gap-3">
                      <AirlineLogo airline={item.carrier} flightNumber={item.flightNumber} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#08080D]">
                            {item.route}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            • {item.carrier}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600">
                          {item.fare}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Pill Tag */}
                    <div>
                      {item.tagType === "green" && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          {item.tag}
                        </span>
                      )}
                      {item.tagType === "blue" && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                          {item.tag}
                        </span>
                      )}
                      {item.tagType === "red" && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                          {item.tag}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 
            CARD 3 (Right 3 Cols): Airplane Wing Media Feature Card
          */}
          <div className="lg:col-span-3 rounded-3xl overflow-hidden relative shadow-xl min-h-[320px] flex flex-col justify-between p-7 border border-white/90 backdrop-blur-xl group">
            {/* Background Image */}
            <Image
              src="/dashboard/airplane_wing_card.jpg"
              alt="Airplane Wing View"
              fill
              sizes="(max-width: 1024px) 100vw, 25vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80 z-0" />

            {/* Card Top Text Overlay */}
            <div className="relative z-10 space-y-1 text-[10px] font-bold tracking-[0.25em] text-white/90 uppercase leading-relaxed max-w-[140px]">
              <div>A</div>
              <div>CLEARER</div>
              <div>SKY</div>
              <div>FOR A</div>
              <div>BRIGHTER</div>
              <div>INDIA</div>
            </div>

            {/* Card Bottom Text Overlay */}
            <div className="relative z-10 pt-8 border-t border-white/20">
              <div className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                DATA TODAY.
              </div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase">
                A FAIRER TOMORROW.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
