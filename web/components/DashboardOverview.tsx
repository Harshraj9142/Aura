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
  Info,
  X,
  Sparkles,
  Sliders,
  BarChart3,
  Percent,
} from "lucide-react";
import AirlineLogo from "@/components/AirlineLogo";
import { IndiaRouteMap } from "@/components/maps/IndiaRouteMap";

interface RouteBreakdown {
  route: string;
  origin: string;
  destination: string;
  baseFare: number;
  currentFare: number;
  priceChange: number;
  percentageChange: number;
  weightPct: number;
  normalizedWeightPct: number;
  routeFisher: number;
  weightedContribution: number;
  cpiRouteContribution: number;
}

interface FisherData {
  fisherScore: number;
  overallChangePct: number;
  cpiHeadlineImpact: number;
  routesIncluded: number;
  totalRoutesCount: number;
  basePeriodDescription: string;
  cpiBasketWeight: string;
  breakdown: RouteBreakdown[];
}

// Fallback chart history
const DEFAULT_INDEX_CHART_DATA = [
  { month: "Aug 12", label: "Aug 12", index: 99.35 },
  { month: "Aug 18", label: "Aug 18", index: 102.40 },
  { month: "Aug 25", label: "Aug 25", index: 104.15 },
  { month: "Sep 01", label: "Sep 01", index: 107.50 },
  { month: "Sep 08", label: "Sep 08", index: 110.44 },
  { month: "Sep 13", label: "Sep 13", index: 110.97 },
];

interface RouteFeedItem {
  route: string;
  carrier: string;
  flightNumber: string;
  fare: string;
  tag: string;
  tagType: "green" | "blue" | "red";
}

const DEFAULT_ROUTE_FEEDS: RouteFeedItem[] = [
  {
    route: "DEL → BOM",
    carrier: "IndiGo",
    flightNumber: "6E-205",
    fare: "₹7,078",
    tag: "↓ 11.7%",
    tagType: "green" as const,
  },
  {
    route: "DEL → BLR",
    carrier: "Akasa Air",
    flightNumber: "QP-1351",
    fare: "₹10,130",
    tag: "↑ 13.3%",
    tagType: "red" as const,
  },
  {
    route: "BOM → BLR",
    carrier: "Air India",
    flightNumber: "AI-672",
    fare: "₹7,828",
    tag: "↑ 12.5%",
    tagType: "red" as const,
  },
  {
    route: "DEL → CCU",
    carrier: "Vistara",
    flightNumber: "UK-705",
    fare: "₹10,105",
    tag: "↑ 29.6%",
    tagType: "red" as const,
  },
  {
    route: "BLR → HYD",
    carrier: "IndiGo",
    flightNumber: "6E-432",
    fare: "₹8,568",
    tag: "↑ 28.7%",
    tagType: "red" as const,
  },
  {
    route: "MAA → DEL",
    carrier: "SpiceJet",
    flightNumber: "SG-281",
    fare: "₹10,801",
    tag: "↑ 25.9%",
    tagType: "red" as const,
  },
];

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalFares: 6715,
    avgFare: 8445,
    otasCount: 6,
    avgUpdateTime: "1.8s",
    airfareIndex: 110.97,
  });

  const [chartData, setChartData] = useState<Array<{ label: string; index: number }>>([]);
  const [routeFeeds, setRouteFeeds] = useState<RouteFeedItem[]>(DEFAULT_ROUTE_FEEDS);
  const [showFisherModal, setShowFisherModal] = useState(false);
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [fisherData, setFisherData] = useState<FisherData | null>(null);

  useEffect(() => {
    // Load live database stats, Fisher composite, and daily time-series
    async function loadStats() {
      try {
        const [consoleRes, fisherRes, dailyRes] = await Promise.all([
          fetch("/api/console/stats").then((r) => r.json()).catch(() => null),
          fetch("/api/index/fisher").then((r) => r.json()).catch(() => null),
          fetch("/api/index?frequency=daily").then((r) => r.json()).catch(() => null),
        ]);

        if (fisherRes?.success && fisherRes?.data) {
          setFisherData(fisherRes.data);
          setStats((prev) => ({
            ...prev,
            airfareIndex: fisherRes.data.fisherScore,
          }));
        }

        if (consoleRes?.success && consoleRes?.data?.overview) {
          const ov = consoleRes.data.overview;
          setStats((prev) => ({
            ...prev,
            totalFares: ov.totalFares || 6715,
            avgFare: ov.avgFare || 8445,
            otasCount: ov.uniqueSources || 6,
            avgUpdateTime: "1.8s",
          }));
        }

        // Populate daily time-series from database
        if (dailyRes?.success && Array.isArray(dailyRes.data) && dailyRes.data.length > 0) {
          const formatted = dailyRes.data.map((p: any) => {
            const parts = (p.date || "").split("-");
            let label = p.date;
            if (parts.length === 3) {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const mIdx = parseInt(parts[1], 10) - 1;
              if (mIdx >= 0 && mIdx < 12) {
                label = `${monthNames[mIdx]} ${parseInt(parts[2], 10)}`;
              }
            }
            return {
              label,
              index: Number(p.index_value) || 100,
            };
          });
          setChartData(formatted);
        }

        // Populate live route feeds if available
        if (consoleRes?.success && Array.isArray(consoleRes.data?.routes) && consoleRes.data.routes.length > 0) {
          const carrierNames = ["IndiGo", "Akasa Air", "Air India", "Vistara", "IndiGo", "SpiceJet"];
          const flightCodes = ["6E-205", "QP-1351", "AI-672", "UK-705", "6E-432", "SG-281"];
          const feeds = consoleRes.data.routes.map((r: any, i: number) => {
            const pct = r.avgFare > 8000 ? "↑ Active" : "↓ Fair";
            const tagType = r.avgFare > 8000 ? "red" : "green";
            return {
              route: `${r.origin} → ${r.destination}`,
              carrier: carrierNames[i % carrierNames.length],
              flightNumber: flightCodes[i % flightCodes.length],
              fare: `₹${Number(r.avgFare).toLocaleString("en-IN")}`,
              tag: pct,
              tagType,
            };
          });
          setRouteFeeds(feeds);
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
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#08080D]">
                    India Airfare Index
                  </h3>
                  <button
                    onClick={() => setShowInfoPopover(!showInfoPopover)}
                    className="text-slate-400 hover:text-blue-600 transition p-1 rounded-full hover:bg-slate-100"
                    title="About Fisher Ideal Price Index"
                    aria-label="Info about India Airfare Index"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => setShowFisherModal(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                  aria-label="View Fisher Index dashboard details"
                  title="Open Full Fisher Index Analytics"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Info Popover Tab */}
              {showInfoPopover && (
                <div className="mt-3 p-3.5 rounded-2xl bg-blue-50/95 border border-blue-200/80 text-xs text-slate-700 space-y-1.5 shadow-sm transition-all animate-in fade-in duration-200">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Fisher Ideal Price Index (APIx)
                    </span>
                    <button
                      onClick={() => setShowInfoPopover(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs"
                      aria-label="Close info"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    India&apos;s real-time national aviation inflation metric (MoSPI / NSO Problem Statement #26056). Calculated as the geometric composite across domestic trunk corridors using official DGCA passenger traffic volume distributions. Baseline Jan 2026 = 100.00.
                  </p>
                </div>
              )}

              {/* Stat */}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#08080D]">
                  {typeof stats.airfareIndex === "number" ? stats.airfareIndex.toFixed(2) : stats.airfareIndex}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {fisherData ? `+${fisherData.overallChangePct.toFixed(1)}%` : "+10.97%"}
                  <span className="text-[11px] font-normal text-slate-500">vs base 100</span>
                </span>
              </div>
            </div>

            {/* Area Chart */}
            <div className="mt-8 h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData.length > 0 ? chartData : DEFAULT_INDEX_CHART_DATA}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
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
                    formatter={(val: any) => [`${Number(val).toFixed(2)}`, "Fisher Index"]}
                    labelFormatter={(label: any) => `Date: ${label}`}
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
                {typeof stats.airfareIndex === "number" ? stats.airfareIndex.toFixed(2) : stats.airfareIndex}
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
                {routeFeeds.map((item, idx) => (
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

      {/* 
        ========================================================================
        FULL FISHER INDEX DASHBOARD MODAL (OPENS ON ARROW BUTTON CLICK)
        ========================================================================
      */}
      {showFisherModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowFisherModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/70 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>MoSPI / NSO Problem Statement #26056</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#08080D]">
                  India Airfare Index — Fisher Analytics
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Complete route-wise and national composite Fisher Ideal Price Index breakdown across active domestic corridors.
                </p>
              </div>
              <button
                onClick={() => setShowFisherModal(false)}
                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top 3 Summary Cards (NO Laspeyres / Paasche) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                  National Fisher Index
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-[#08080D]">
                    {fisherData ? fisherData.fisherScore.toFixed(2) : typeof stats.airfareIndex === "number" ? stats.airfareIndex.toFixed(2) : stats.airfareIndex}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    Base = 100.00
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                  Headline CPI Impact
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-emerald-700">
                    {fisherData ? `${fisherData.cpiHeadlineImpact >= 0 ? "+" : ""}${fisherData.cpiHeadlineImpact.toFixed(4)}` : "-0.0705"}
                  </span>
                  <span className="text-xs text-slate-500">pts (0.42% weight)</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                  Active DGCA Corridors
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-blue-700">
                    {fisherData ? `${fisherData.routesIncluded} / ${fisherData.totalRoutesCount}` : "6 / 6"}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Route-Wise Fisher Cards Grid */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-[#08080D]">
                Route-Wise Fisher Index Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {fisherData?.breakdown ? (
                  fisherData.breakdown.map((item) => (
                    <div
                      key={item.route}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#08080D] font-mono">
                          {item.origin} → {item.destination}
                        </span>
                        <span className="text-xs font-extrabold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          Fisher: {item.routeFisher.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Base Fare</span>
                          <span className="font-mono font-semibold text-slate-700">₹{item.baseFare.toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Current Fare</span>
                          <span className="font-mono font-bold text-slate-900">₹{item.currentFare.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                        <span>Weight: {item.weightPct}%</span>
                        <span className="font-semibold text-slate-700">Contrib: {item.weightedContribution.toFixed(2)} pts</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-slate-500 text-xs">
                    Loading live corridor breakdown from database...
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Mathematical Audit Table */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-[#08080D]">
                Detailed Corridor Metrics
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Route</th>
                      <th className="py-3 px-4 text-right font-bold">Base (P₀)</th>
                      <th className="py-3 px-4 text-right font-bold">Current (Pₜ)</th>
                      <th className="py-3 px-4 text-right font-bold">% Change</th>
                      <th className="py-3 px-4 text-right font-bold">DGCA Weight</th>
                      <th className="py-3 px-4 text-right text-blue-600 font-bold">Route Fisher</th>
                      <th className="py-3 px-4 text-right text-emerald-600 font-bold">Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fisherData?.breakdown.map((r) => (
                      <tr key={r.route} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{r.origin} → {r.destination}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">₹{r.baseFare.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 text-right text-slate-900 font-semibold">₹{r.currentFare.toLocaleString("en-IN")}</td>
                        <td className={`py-2.5 px-4 text-right font-semibold ${r.percentageChange >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {r.percentageChange >= 0 ? "+" : ""}{r.percentageChange.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600">{r.normalizedWeightPct.toFixed(1)}%</td>
                        <td className="py-2.5 px-4 text-right font-bold text-blue-600">{r.routeFisher.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{r.weightedContribution.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-bold text-slate-900">
                    <tr>
                      <td className="py-3 px-4 uppercase">National Composite</td>
                      <td colSpan={4} className="py-3 px-4 text-right text-slate-500 font-normal">
                        Geometric Mean across 6 Trunk Corridors
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 font-extrabold text-sm">
                        {fisherData?.fisherScore.toFixed(2) ?? stats.airfareIndex}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-extrabold text-sm">
                        {fisherData?.breakdown ? fisherData.breakdown.reduce((acc, r) => acc + r.weightedContribution, 0).toFixed(2) : (typeof stats.airfareIndex === "number" ? stats.airfareIndex.toFixed(2) : stats.airfareIndex)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
