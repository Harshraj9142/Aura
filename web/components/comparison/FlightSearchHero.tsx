"use client";

import React from "react";
import Image from "next/image";
import {
  PlaneTakeoff,
  PlaneLanding,
  ArrowRightLeft,
  Calendar,
  Clock,
  Search,
} from "lucide-react";

export const AIRPORT_OPTIONS = [
  { code: "DEL", city: "Delhi", airport: "Indira Gandhi Int'l (DEL)" },
  { code: "BOM", city: "Mumbai", airport: "Chhatrapati Shivaji Maharaj (BOM)" },
  { code: "BLR", city: "Bengaluru", airport: "Kempegowda Int'l (BLR)" },
  { code: "CCU", city: "Kolkata", airport: "Netaji Subhash Chandra Bose (CCU)" },
  { code: "HYD", city: "Hyderabad", airport: "Rajiv Gandhi Int'l (HYD)" },
  { code: "MAA", city: "Chennai", airport: "Chennai Int'l (MAA)" },
];

export const TIME_OPTIONS = [
  { value: "any", label: "Any Time (All Day)" },
  { value: "morning", label: "Morning (05:00 - 11:59)" },
  { value: "afternoon", label: "Afternoon (12:00 - 17:59)" },
  { value: "evening", label: "Evening (18:00 - 23:59)" },
  { value: "night", label: "Night / Early Morning (00:00 - 04:59)" },
];

interface FlightSearchHeroProps {
  origin: string;
  destination: string;
  travelDate: string;
  timeOfDay: string;
  availableDates: string[];
  onOriginChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onDateChange: (val: string) => void;
  onTimeChange: (val: string) => void;
  onSwap: () => void;
  onSearch: () => void;
  isSearching?: boolean;
}

export default function FlightSearchHero({
  origin,
  destination,
  travelDate,
  timeOfDay,
  availableDates,
  onOriginChange,
  onDestinationChange,
  onDateChange,
  onTimeChange,
  onSwap,
  onSearch,
  isSearching = false,
}: FlightSearchHeroProps) {
  const POPULAR_ROUTES = [
    { origin: "DEL", dest: "BOM" },
    { origin: "BOM", dest: "BLR" },
    { origin: "DEL", dest: "BLR" },
    { origin: "DEL", dest: "CCU" },
    { origin: "BLR", dest: "HYD" },
    { origin: "MAA", dest: "DEL" },
  ];

  const handleSelectPopularRoute = (orig: string, dest: string) => {
    onOriginChange(orig);
    onDestinationChange(dest);
    onSearch();
  };

  return (
    <div className="relative w-full overflow-hidden space-y-0 font-sans">
      {/* 
        ========================================================================
        1. HERO PANORAMA BANNER (Exact layout matching Overview, Heatmap & Trends tabs)
        - Dedicated Wide-Angle Airport Terminal Sunset Photo (/dashboard/platform_comparison_hero.jpg)
        - Masked gradient transition at bottom
        - Crisp vignetted typography overlays
        ========================================================================
      */}
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex flex-col justify-between pt-24 sm:pt-28 pb-20 sm:pb-24 px-6 sm:px-10 lg:px-14 xl:px-16">
        {/* Masked Panorama Background Layer */}
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
            src="/dashboard/platform_comparison_hero.jpg"
            alt="Platform Comparison Airport Terminal Sunset"
            fill
            sizes="100vw"
            className="object-cover object-center scale-[1.02]"
            priority
          />

          {/* Top Black Vignette Gradient Layer (crisp white navbar text) */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/95 via-black/60 to-transparent z-10" />

          {/* Left Dark Vignette Layer (title text contrast) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:w-2/3 z-10" />

          {/* Right Dark Vignette Layer */}
          <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-black/90 via-black/60 to-transparent z-10" />
        </div>

        {/* Hero Content Layer */}
        <div className="relative z-20 w-full flex flex-col lg:flex-row items-start lg:items-center justify-between h-full gap-8">
          {/* Left Text Block */}
          <div className="max-w-3xl space-y-4 pt-2">
            <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-bold tracking-tight text-white drop-shadow-xl leading-[1.02]">
              Compare <span className="font-serif italic font-normal text-white">Platform</span> Fares.
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 font-medium leading-relaxed max-w-2xl drop-shadow-md">
              Real-time price spread & variation intelligence between Airline Direct portals and OTAs.
            </p>

            <div className="pt-3 flex items-center gap-3 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-300 uppercase drop-shadow-sm">
              <span className="h-[2px] w-10 bg-white" />
              <span>REAL-TIME PLATFORM SPREAD INTELLIGENCE • AURA SEARCH</span>
            </div>
          </div>

          {/* Right Text Block */}
          <div className="hidden lg:flex flex-col items-end justify-start self-stretch py-2 text-right gap-8">
            <div className="space-y-1.5 text-xs font-black tracking-[0.35em] text-white uppercase leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <div>DATA</div>
              <div>FARES</div>
              <div>CARRIERS</div>
              <div>SPREADS</div>
              <div className="pt-2 text-white/90">—</div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. FLOATING GLASS SEARCH CONTROL CARD (Matching Fare Explorer / Overview Specs)
        ========================================================================
      */}
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 -mt-14 sm:-mt-20 relative z-30 space-y-6 pb-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/90 p-5 sm:p-6 shadow-2xl shadow-slate-900/10 space-y-4 transition-all duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            {/* 1. Source (Origin) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <PlaneTakeoff className="h-3.5 w-3.5 text-blue-600" />
                <span>Flying From (Origin)</span>
              </label>
              <select
                value={origin}
                onChange={(e) => onOriginChange(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              >
                {AIRPORT_OPTIONS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.city} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="hidden md:flex md:col-span-1 justify-center pb-1">
              <button
                type="button"
                onClick={onSwap}
                title="Swap Origin and Destination"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            {/* 2. Destination */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <PlaneLanding className="h-3.5 w-3.5 text-emerald-600" />
                <span>Flying To (Destination)</span>
              </label>
              <select
                value={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              >
                {AIRPORT_OPTIONS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.city} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Travel Date */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-purple-600" />
                <span>Travel Date</span>
              </label>
              <select
                value={travelDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              >
                <option value="all">Any Date (All Flights)</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      weekday: "short",
                    })}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Time Window */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Departure Time</span>
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Quick-Pick Popular Corridors */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">
                Popular:
              </span>
              {POPULAR_ROUTES.map((r) => {
                const isSelected = origin === r.origin && destination === r.dest;
                return (
                  <button
                    key={`${r.origin}-${r.dest}`}
                    type="button"
                    onClick={() => handleSelectPopularRoute(r.origin, r.dest)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {r.origin} → {r.dest}
                  </button>
                );
              })}
            </div>

            {/* Search CTA */}
            <button
              type="button"
              onClick={onSearch}
              disabled={isSearching}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#08080D] hover:bg-[#1A1F2B] text-white px-6 py-2.5 text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{isSearching ? "Searching Flights…" : "Compare Platform Prices"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
