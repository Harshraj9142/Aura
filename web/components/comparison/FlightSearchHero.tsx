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
  Sparkles,
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
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/90 bg-slate-950 shadow-2xl">
      {/* Background Graphic Image with Dark Gradient Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/dashboard/airplane_wing_card.jpg"
          alt="Flight Over Clouds"
          fill
          className="object-cover object-center opacity-40 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 space-y-8">
        {/* Title */}
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md leading-[1.1]">
            Compare Prices Across Airline & OTA Platforms
          </h1>

          <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed drop-shadow-sm">
            Find which platform gives you the lowest price on identical flights. Compare official airline direct booking against EaseMyTrip, Cleartrip, Ixigo, and MakeMyTrip.
          </p>
        </div>

        {/* The Search Form Card */}
        <div className="rounded-2xl bg-white/95 backdrop-blur-xl p-4 sm:p-6 border border-white/90 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* 1. Source (Origin) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <PlaneTakeoff className="h-3.5 w-3.5 text-blue-600" />
                <span>Flying From (Source)</span>
              </label>
              <select
                value={origin}
                onChange={(e) => onOriginChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {AIRPORT_OPTIONS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.city} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="hidden md:flex md:col-span-1 justify-center pb-2">
              <button
                type="button"
                onClick={onSwap}
                title="Swap Origin and Destination"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-transform active:scale-95 shadow-xs cursor-pointer"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            {/* 2. Destination */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <PlaneLanding className="h-3.5 w-3.5 text-emerald-600" />
                <span>Flying To (Destination)</span>
              </label>
              <select
                value={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5 text-purple-600" />
                <span>Travel Date</span>
              </label>
              <select
                value={travelDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Departure Time</span>
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {r.origin} → {r.dest}
                  </button>
                );
              })}
            </div>

            {/* Big Search CTA */}
            <button
              type="button"
              onClick={onSearch}
              disabled={isSearching}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              <span>{isSearching ? "Searching Flights…" : "Compare Platform Prices"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
