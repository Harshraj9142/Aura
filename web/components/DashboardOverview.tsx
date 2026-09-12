"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

// Chart mock history matching the reference design graph (Jan to Aug, reaching 102.6)
const INDEX_CHART_DATA = [
  { month: "Jan", index: 92 },
  { month: "Feb", index: 91.5 },
  { month: "Mar", index: 94 },
  { month: "Apr", index: 96 },
  { month: "May", index: 99.2 },
  { month: "Jun", index: 97.8 },
  { month: "Jul", index: 99.5 },
  { month: "Aug", index: 102.6 },
];

const LIVE_ROUTE_FEEDS = [
  {
    route: "DEL → BOM",
    carrier: "IndiGo",
    flightNumber: "6E-205",
    fare: "₹4,299",
    tag: "↓ 14%",
    tagType: "green",
  },
  {
    route: "BOM → GOA",
    carrier: "SpiceJet",
    flightNumber: "SG-8169",
    fare: "₹2,890",
    tag: "Deal",
    tagType: "blue",
  },
  {
    route: "DEL → BLR",
    carrier: "Akasa Air",
    flightNumber: "QP-1351",
    fare: "₹5,450",
    tag: "High",
    tagType: "red",
  },
  {
    route: "BLR → HYD",
    carrier: "Air India",
    flightNumber: "AI-512",
    fare: "₹2,690",
    tag: "↓ 11%",
    tagType: "green",
  },
  {
    route: "DEL → CCU",
    carrier: "Vistara",
    flightNumber: "UK-705",
    fare: "₹4,680",
    tag: "↓ 8%",
    tagType: "green",
  },
];

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalFares: 6482,
    avgFare: 4892,
    otasCount: 6,
    avgUpdateTime: "2.3s",
    airfareIndex: 102.6,
  });

  useEffect(() => {
    // Attempt to load live API stats if available
    async function loadStats() {
      try {
        const [routesRes] = await Promise.all([
          fetch("/api/routes").then((r) => r.json()).catch(() => null),
        ]);

        if (routesRes?.data?.length) {
          setStats((prev) => ({
            ...prev,
            totalFares: routesRes.data.length * 280,
          }));
        }
      } catch (err) {
        console.warn("API load note:", err);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="w-full font-body pb-12">
      {/* 
        ========================================================================
        1. FULL VIEWPORT WIDTH HERO BANNER (Edge-to-Edge with Dark Top Vignette)
        - Starts right from top of viewport under fixed navbar header
        - Spans 100% width left-to-right
        - Black top vignette gradient for navbar legibility
        - White text styling on left ("India in motion.")
        - White background terminal block T3 on right (reversed black/white)
        ========================================================================
      */}
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[550px] overflow-hidden shadow-2xl bg-slate-950 flex flex-col justify-between pt-24 sm:pt-28 pb-10 sm:pb-14 px-4 sm:px-8 lg:px-10 border-b border-slate-800/60">
        {/* Full-width Background Panorama Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/dashboard/airport_overview_hero.jpg"
            alt="Airport Runway Sunset"
            fill
            className="object-cover object-center scale-[1.02]"
            priority
          />

          {/* Top Black Vignette Gradient Layer (makes floating white navbar text ultra crisp) */}
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/90 via-black/55 to-transparent z-10 pointer-events-none" />

          {/* Left Dark Vignette Layer (makes white headline and subtitle pop) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:w-2/3 z-10 pointer-events-none" />

          {/* Bottom subtle shadow transition */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/70 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Hero Banner Content Layer */}
        <div className="relative z-20 w-full flex flex-col lg:flex-row items-start lg:items-center justify-between h-full gap-8 px-2 sm:px-4">
          {/* Left Text Block: Shifted leftwards with scaled-up typography */}
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

          {/* Right Text Block & Reverted White Terminal Block (T3) */}
          <div className="hidden lg:flex flex-col items-end justify-between self-stretch py-2 text-right gap-8">
            <div className="space-y-1 text-[11px] font-extrabold tracking-[0.3em] text-slate-200 uppercase leading-snug drop-shadow-md">
              <div>DATA</div>
              <div>ROUTES</div>
              <div>PEOPLE</div>
              <div>PROGRESS</div>
              <div className="pt-1 text-slate-300">—</div>
            </div>

            {/* Inverted Terminal Block: White background, Dark text */}
            <div className="bg-white/95 backdrop-blur-xl border border-white/80 text-[#08080D] rounded-2xl p-5 min-w-[140px] text-right shadow-2xl transition hover:scale-105 duration-200">
              <div className="text-4xl font-extrabold tracking-tight text-[#08080D]">
                T3
              </div>
              <div className="text-[10px] font-extrabold tracking-wider text-slate-800 uppercase mt-1">
                Departures →
              </div>
              <div className="text-[10px] font-extrabold tracking-wider text-slate-600 uppercase">
                Arrivals →
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        MAIN CONTENT CONTAINER (Centered Max Width Below Banner)
        ========================================================================
      */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        {/* 
          ========================================================================
          2. ROW 1: 4 TOP METRIC CARDS
          ========================================================================
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric 1: Routes Tracked */}
          <div className="rounded-2xl bg-white/90 backdrop-blur-md p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
                  <Plane className="h-5 w-5 -rotate-45" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Routes Tracked
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-[#08080D]">
                {stats.totalFares.toLocaleString("en-IN")}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="h-3 w-3" />
                12%
                <span className="text-[10px] font-normal text-slate-400 ml-0.5">vs last month</span>
              </span>
            </div>
          </div>

          {/* Metric 2: Avg. Domestic Fare */}
          <div className="rounded-2xl bg-white/90 backdrop-blur-md p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
                  <Coins className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Avg. Domestic Fare
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-[#08080D]">
                ₹{stats.avgFare.toLocaleString("en-IN")}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingDown className="h-3 w-3" />
                3.2%
                <span className="text-[10px] font-normal text-slate-400 ml-0.5">vs last month</span>
              </span>
            </div>
          </div>

          {/* Metric 3: OTAs Monitored */}
          <div className="rounded-2xl bg-white/90 backdrop-blur-md p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  OTAs Monitored
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-[#08080D]">
                {stats.otasCount}+
              </span>
              <span className="text-xs font-medium text-slate-400">
                — No change
              </span>
            </div>
          </div>

          {/* Metric 4: Avg. Update Time */}
          <div className="rounded-2xl bg-white/90 backdrop-blur-md p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Avg. Update Time
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-[#08080D]">
                {stats.avgUpdateTime}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingDown className="h-3 w-3" />
                45%
                <span className="text-[10px] font-normal text-slate-400 ml-0.5">Faster</span>
              </span>
            </div>
          </div>
        </div>

        {/* 
          ========================================================================
          3. ROW 2: MAIN CONTENT GRID (3 CARDS)
          ========================================================================
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 
            CARD 1 (Left 4 Cols): India Airfare Index Chart
          */}
          <div className="lg:col-span-4 rounded-3xl bg-white/90 backdrop-blur-md p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#08080D]">
                  India Airfare Index
                </h3>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                  aria-label="View Index details"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Stat */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold tracking-tight text-[#08080D]">
                  {stats.airfareIndex}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  2.4%
                  <span className="text-[11px] font-normal text-slate-400">vs last month</span>
                </span>
              </div>
            </div>

            {/* Area Chart */}
            <div className="mt-8 h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={INDEX_CHART_DATA}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    domain={[75, 125]}
                    ticks={[80, 90, 100, 110, 120]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
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

              {/* Floating marker for latest index 102.6 */}
              <div className="absolute top-2 right-4 bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md">
                102.6
              </div>
            </div>
          </div>

          {/* 
            CARD 2 (Middle 5 Cols): Live Route Activity (Map + List)
          */}
          <div className="lg:col-span-5 rounded-3xl bg-white/90 backdrop-blur-md p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#08080D]">
                Live Route Activity
              </h3>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                aria-label="Minimize"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>

            {/* Inner Grid: Map Graphic Left + Route Feed List Right */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* India Map Illustration with Node Arcs */}
              <div className="sm:col-span-5 relative h-52 w-full flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100 p-2 overflow-hidden">
                <svg
                  viewBox="0 0 300 350"
                  className="h-full w-full object-contain opacity-90"
                >
                  {/* Simplified India Map Silhouette Path */}
                  <path
                    d="M150 30 L190 60 L210 110 L250 140 L230 180 L210 240 L160 320 L130 320 L90 250 L70 190 L50 150 L90 110 L120 70 Z"
                    fill="#E2E8F0"
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                  />

                  {/* Connected Flight Arcs */}
                  <path
                    d="M 150 90 Q 115 135 100 200"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <path
                    d="M 150 90 Q 195 110 230 150"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                  <path
                    d="M 100 200 Q 115 235 140 260"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2"
                  />
                  <path
                    d="M 140 260 Q 155 235 160 210"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                  <path
                    d="M 160 210 Q 165 145 150 90"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />

                  {/* City Nodes */}
                  <circle cx="150" cy="90" r="4" fill="#0F172A" />
                  <text x="158" y="93" fontSize="10" fontWeight="bold" fill="#0F172A">
                    DEL
                  </text>

                  <circle cx="100" cy="200" r="4" fill="#0F172A" />
                  <text x="75" y="204" fontSize="10" fontWeight="bold" fill="#0F172A">
                    BOM
                  </text>

                  <circle cx="140" cy="260" r="4" fill="#0F172A" />
                  <text x="148" y="264" fontSize="10" fontWeight="bold" fill="#0F172A">
                    BLR
                  </text>

                  <circle cx="160" cy="210" r="4" fill="#0F172A" />
                  <text x="168" y="214" fontSize="10" fontWeight="bold" fill="#0F172A">
                    HYD
                  </text>

                  <circle cx="230" cy="150" r="4" fill="#0F172A" />
                  <text x="238" y="154" fontSize="10" fontWeight="bold" fill="#0F172A">
                    CCU
                  </text>
                </svg>
              </div>

              {/* Route List Feed Right */}
              <div className="sm:col-span-7 space-y-2">
                {LIVE_ROUTE_FEEDS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition"
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
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          {item.tag}
                        </span>
                      )}
                      {item.tagType === "blue" && (
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {item.tag}
                        </span>
                      )}
                      {item.tagType === "red" && (
                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
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
          <div className="lg:col-span-3 rounded-3xl overflow-hidden relative shadow-lg min-h-[300px] flex flex-col justify-between p-7 border border-slate-200/80 group">
            {/* Background Image */}
            <Image
              src="/dashboard/airplane_wing_card.jpg"
              alt="Airplane Wing View"
              fill
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

        {/* 
          ========================================================================
          4. DASHBOARD FOOTER
          ========================================================================
        */}
        <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-slate-500 gap-4">
          <div className="flex items-center gap-4">
            <span className="font-extrabold tracking-widest text-[#08080D] uppercase">
              AURA
            </span>
            <span>© 2026 AURA. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-slate-600">
            <Link href="#" className="hover:text-slate-950 transition">
              Privacy
            </Link>
            <span>|</span>
            <Link href="#" className="hover:text-slate-950 transition">
              Terms
            </Link>
            <span>|</span>
            <Link href="#" className="hover:text-slate-950 transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
