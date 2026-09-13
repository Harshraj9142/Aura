"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Fare, PaginationMeta } from "@/types/fare";
import AirlineLogo, { resolveAirline } from "@/components/AirlineLogo";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import {
  Plane,
  Calendar,
  User,
  ArrowRightLeft,
  Search,
  TrendingUp,
  Clock,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { BoardingPassFareCard } from "./BoardingPassFareCard";
import { DashboardClosingBanner } from "@/components/DashboardClosingBanner";

interface FaresExplorerClientProps {
  fares: Fare[];
  pagination: PaginationMeta;
  routes: { origin: string; destination: string }[];
  sources: { source: string }[];
}

// City code to full name mapping
const CITY_NAMES: Record<string, string> = {
  BOM: "Mumbai",
  BLR: "Bengaluru",
  DEL: "New Delhi",
  CCU: "Kolkata",
  HYD: "Hyderabad",
  MAA: "Chennai",
  AMD: "Ahmedabad",
  PNQ: "Pune",
  GOI: "Goa",
  COK: "Kochi",
  JAI: "Jaipur",
  TRV: "Thiruvananthapuram",
  GAU: "Guwahati",
  IXC: "Chandigarh",
  LKO: "Lucknow",
  VNS: "Varanasi",
  PAT: "Patna",
};

// Aircraft models for aviation details
const AIRCRAFT_MODELS: Record<string, { model: string; seats: number; tag: string }> = {
  indigo: { model: "AIRBUS A320neo", seats: 180, tag: "Direct • Eco" },
  airindia: { model: "BOEING 787 DREAMLINER", seats: 256, tag: "Full Service" },
  vistara: { model: "AIRBUS A321neo", seats: 188, tag: "Premium Choice" },
  akasa: { model: "BOEING 737 MAX 8", seats: 189, tag: "SkyAccess Choice" },
  spicejet: { model: "BOEING 737-800", seats: 189, tag: "Budget Saver" },
  aix: { model: "BOEING 737 MAX 8", seats: 186, tag: "Express Direct" },
};

export function FaresExplorerClient({
  fares,
  pagination,
  routes,
  sources,
}: FaresExplorerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search state matching user filter placeholders
  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [source, setSource] = useState(searchParams.get("source") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [isOutlier, setIsOutlier] = useState(searchParams.get("isOutlier") || "exclude");

  // Keep state in sync with URL searchParams
  useEffect(() => {
    setOrigin(searchParams.get("origin") || "");
    setDestination(searchParams.get("destination") || "");
    setSource(searchParams.get("source") || "");
    setDateFrom(searchParams.get("dateFrom") || "");
    setDateTo(searchParams.get("dateTo") || "");
    if (searchParams.get("isOutlier")) {
      setIsOutlier(searchParams.get("isOutlier") || "exclude");
    }
  }, [searchParams]);

  // Sidebar filter state
  const [maxPrice, setMaxPrice] = useState<number>(25000);
  const [activeTabModal, setActiveTabModal] = useState<Fare | null>(null);

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    price: true,
  });

  const origins = Array.from(new Set(routes.map((r) => r.origin))).sort();
  const destinations = Array.from(new Set(routes.map((r) => r.destination))).sort();

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    if (source) params.set("source", source);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (isOutlier) params.set("isOutlier", isOutlier);

    params.set("page", "1");
    startTransition(() => {
      router.push(`/dashboard/fares?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setOrigin("");
    setDestination("");
    setSource("");
    setDateFrom("");
    setDateTo("");
    setIsOutlier("exclude");
    setMaxPrice(25000);

    startTransition(() => {
      router.push("/dashboard/fares");
    });
  };

  const handleSwapRoute = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleQuickRouteClick = (orig: string, dest: string) => {
    setOrigin(orig);
    setDestination(dest);
    const params = new URLSearchParams();
    params.set("origin", orig);
    params.set("destination", dest);
    params.set("page", "1");
    startTransition(() => {
      router.push(`/dashboard/fares?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/dashboard/fares?${params.toString()}`);
    });
  };

  const getFlightDuration = (fare: Fare) => {
    const hash = (fare.id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hours = (hash % 3) + 1;
    const mins = (hash % 11) * 5;
    return `${hours}h ${mins > 0 ? `${mins}m` : "15m"}`;
  };

  const getFlightTimes = (fare: Fare) => {
    const hash = (fare.id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const depHour = 6 + (hash % 14);
    const depMin = (hash % 4) * 15;
    const durationMins = 120 + (hash % 90);

    const depDate = new Date();
    depDate.setHours(depHour, depMin);
    const arrDate = new Date(depDate.getTime() + durationMins * 60000);

    const formatTime = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    return {
      depTime: formatTime(depDate),
      arrTime: formatTime(arrDate),
    };
  };

  // Dynamically surface real data filtering across all 6 placeholders
  const filteredFares = fares.filter((f) => {
    if (f.total_fare > maxPrice) return false;
    if (origin && f.route_origin !== origin) return false;
    if (destination && f.route_destination !== destination) return false;
    if (source && f.source !== source) return false;
    if (dateFrom && f.travel_date < dateFrom) return false;
    if (dateTo && f.travel_date > dateTo) return false;
    if (isOutlier === "exclude" && f.is_outlier) return false;
    if (isOutlier === "only" && !f.is_outlier) return false;
    return true;
  });

  return (
    <div className="relative w-full overflow-hidden space-y-0 font-sans">
      
      {/* 
        ========================================================================
        1. HERO PANORAMA BANNER (Identical layout to Overview & Trends tabs)
        - Wide-angle cinematic aviation photo background (/dashboard/fare_explorer_hero.jpg)
        - Exact min-h, padding, maskGradient, and vignette layers
        ========================================================================
      */}
      {/* 
        ========================================================================
        1. HERO PANORAMA BANNER (Identical layout to Overview & Trends tabs)
        - Wide-angle cinematic aviation photo background (/dashboard/fare_explorer_hero.jpg)
        - Exact min-h, padding, maskGradient, and vignette layers
        ========================================================================
      */}
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex flex-col justify-between pt-24 sm:pt-28 pb-20 sm:pb-24 px-6 sm:px-10 lg:px-14 xl:px-16">
        
        {/* Masked Panorama Photo Layer */}
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
            src="/dashboard/fare_explorer_hero.jpg"
            alt="Aircraft Horizon Panorama"
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

        {/* Hero Banner Content Layer */}
        <div className="relative z-20 w-full flex flex-col lg:flex-row items-start lg:items-center justify-between h-full gap-8">
          
          {/* Left Text Block */}
          <div className="max-w-3xl space-y-4 pt-2">
            <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-bold tracking-tight text-white drop-shadow-xl leading-[1.02]">
              Explore <span className="font-serif italic font-normal text-white">Every</span> Flight Corridor.
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 font-medium leading-relaxed max-w-2xl drop-shadow-md">
              Real-time airfare intelligence & dynamic fare comparison across all Indian sectors.
            </p>

            <div className="pt-3 flex items-center gap-3 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-300 uppercase drop-shadow-sm">
              <span className="h-[2px] w-10 bg-white" />
              <span>REAL-TIME FARE INTELLIGENCE • AURA SEARCH</span>
            </div>
          </div>

          {/* Right Text Block: Ultra Crisp High-Contrast Typography */}
          <div className="hidden lg:flex flex-col items-end justify-start self-stretch py-2 text-right gap-8">
            <div className="space-y-1.5 text-xs font-black tracking-[0.35em] text-white uppercase leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <div>DATA</div>
              <div>FARES</div>
              <div>CARRIERS</div>
              <div>SAVINGS</div>
              <div className="pt-2 text-white/90">—</div>
            </div>
          </div>

        </div>
      </div>

      {/* 
        ========================================================================
        2. FLOATING GLASS SEARCH CONTROL CARD (EXACT MATCH TO PLACEHOLDERS SCREENSHOT)
        - ORIGIN, DESTINATION, SOURCE, DATE FROM, DATE TO, OUTLIERS
        - Reset & Apply Filters Buttons
        ========================================================================
      */}
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 -mt-14 sm:-mt-20 relative z-30 space-y-6 pb-16">
        
        {/* Floating Glass Control Card */}
        <div className="mx-auto max-w-7xl rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/90 p-5 sm:p-6 shadow-2xl shadow-slate-900/10 space-y-4 transition-all duration-300">
          
          {/* 6 Placeholders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-end">
            
            {/* 1. ORIGIN */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                ORIGIN
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              >
                <option value="">All Origins</option>
                {origins.map((o) => (
                  <option key={o} value={o}>
                    {o} {CITY_NAMES[o] ? `- ${CITY_NAMES[o]}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. DESTINATION */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                DESTINATION
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              >
                <option value="">All Destinations</option>
                {destinations.map((d) => (
                  <option key={d} value={d}>
                    {d} {CITY_NAMES[d] ? `- ${CITY_NAMES[d]}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. SOURCE */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                SOURCE
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              >
                <option value="">All Sources</option>
                <option value="MakeMyTrip">MakeMyTrip</option>
                <option value="EaseMyTrip">EaseMyTrip</option>
                <option value="Yatra">Yatra</option>
                <option value="IndiGo Direct">IndiGo Direct</option>
                <option value="Air India Direct">Air India Direct</option>
                <option value="Google Fares">Google Fares</option>
                {sources.map((s) => (
                  <option key={s.source} value={s.source}>
                    {s.source}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. DATE FROM */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                DATE FROM
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="dd-mm-yyyy"
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              />
            </div>

            {/* 5. DATE TO */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                DATE TO
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="dd-mm-yyyy"
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              />
            </div>

            {/* 6. OUTLIERS */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                OUTLIERS
              </label>
              <select
                value={isOutlier}
                onChange={(e) => setIsOutlier(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs transition"
              >
                <option value="exclude">Exclude Outliers</option>
                <option value="include">Include Outliers</option>
                <option value="only">Only Outliers</option>
              </select>
            </div>

          </div>

          {/* Bottom Control Buttons: Reset & Apply Filters */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold shadow-xs transition cursor-pointer active:scale-98"
            >
              Reset
            </button>

            <button
              onClick={handleApplyFilters}
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isPending ? (
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span>Apply Filters</span>
              )}
            </button>
          </div>

        </div>

        {/* Quick Corridor Selection Bar */}
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 px-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-extrabold mr-1 uppercase tracking-wider">
              POPULAR CORRIDORS:
            </span>
            {[
              { orig: "BOM", dest: "BLR", label: "BOM ➔ BLR", price: "₹2,026" },
              { orig: "DEL", dest: "BOM", label: "DEL ➔ BOM", price: "₹3,450" },
              { orig: "HYD", dest: "MAA", label: "HYD ➔ MAA", price: "₹1,987" },
              { orig: "CCU", dest: "DEL", label: "CCU ➔ DEL", price: "₹4,120" },
              { orig: "BLR", dest: "DEL", label: "BLR ➔ DEL", price: "₹3,890" },
            ].map((pill) => (
              <button
                key={pill.label}
                onClick={() => handleQuickRouteClick(pill.orig, pill.dest)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-white/90 text-slate-800 text-xs font-bold hover:bg-slate-900 hover:text-white transition shadow-xs"
              >
                <span>{pill.label}</span>
                <span className="text-slate-950 font-black">{pill.price}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleReset}
            className="text-xs text-slate-600 font-extrabold hover:text-slate-950 transition underline"
          >
            Clear all filters
          </button>
        </div>

        {/* 
          ========================================================================
          3. MAIN FARE RESULTS & SIDEBAR (Clean Tailwind, Normal Fonts)
          ========================================================================
        */}
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          
          {/* LEFT COLUMN: All Available Flights List (col-span-8) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Direct Header Text Row (No Card Background Container) */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-1 py-1">
              <div>
                <h2 className="text-xl font-bold text-slate-950 tracking-tight flex items-center gap-3">
                  All Available Flights
                  <span className="text-xs font-bold text-slate-900 bg-white/90 border border-slate-200/90 px-3 py-1 rounded-full shadow-xs">
                    {pagination.totalCount.toLocaleString()} Live Fares
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <ExportButtons data={fares} filename="flight_fares_export" />
              </div>
            </div>

            {/* Empty State */}
            {filteredFares.length === 0 && (
              <div className="flex h-72 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/80 backdrop-blur-xl p-8 text-center shadow-xl">
                <p className="text-base font-bold text-slate-900">No flight records found matching your active filters</p>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">Try increasing the price slider range or clearing origin and destination constraints.</p>
                <button
                  onClick={handleReset}
                  className="mt-4 px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-full shadow-md hover:bg-slate-800 transition"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* FLIGHT RESULT CARDS (Boarding Pass Ticket Style - Reference Design 1) */}
            {filteredFares.map((fare, idx) => (
              <BoardingPassFareCard
                key={fare.id || `fare-${idx}`}
                fare={fare}
                onViewDetails={setActiveTabModal}
              />
            ))}

            {/* Pagination Footer (Clean text row without rounded white card container) */}
            <div className="flex items-center justify-between px-2 py-3 text-xs text-slate-700 font-medium">
              <div>
                Showing <span className="font-bold text-slate-950">{((pagination.page - 1) * pagination.limit) + 1}</span> to{" "}
                <span className="font-bold text-slate-950">
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                </span>{" "}
                of <span className="font-bold text-slate-950">{pagination.totalCount.toLocaleString()}</span> records
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold shadow-xs"
                >
                  Previous
                </button>
                <span className="text-slate-950 font-bold px-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold shadow-xs"
                >
                  Next
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Filter Panel */}
          <div className="lg:col-span-4 sticky top-28 space-y-4">
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 p-6 shadow-xl space-y-6">
              
              {/* Filter Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-950 tracking-tight">Filter Results</h3>
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-slate-600 hover:text-slate-950 underline transition"
                >
                  Reset
                </button>
              </div>

              {/* Price Slider */}
              <div className="space-y-3">
                <div
                  onClick={() => toggleAccordion("price")}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-950">Max Fare Price</span>
                  <span className="text-slate-400 font-bold text-xs">
                    {openAccordions.price ? "▲" : "▼"}
                  </span>
                </div>

                {openAccordions.price && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>₹1,000</span>
                      <span className="text-slate-950 bg-slate-100 px-2.5 py-0.5 rounded-full font-mono font-bold">
                        ₹{maxPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="25000"
                      step="500"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-slate-950 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Flight Details Modal ───────────────────────────────────────────────────────── */}
      {activeTabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 relative">
            <button
              onClick={() => setActiveTabModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <AirlineLogo airline={activeTabModal.carrier} flightNumber={activeTabModal.flight_number} size="md" />
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  {activeTabModal.carrier || "Airline"} {activeTabModal.flight_number}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {activeTabModal.route_origin} ➔ {activeTabModal.route_destination} • {new Date(activeTabModal.travel_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Base Fare</span>
                <span className="text-slate-950 font-bold font-mono text-sm">
                  {activeTabModal.base_fare ? `₹${Number(activeTabModal.base_fare).toLocaleString("en-IN")}` : "—"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Taxes & Fees</span>
                <span className="text-slate-950 font-bold font-mono text-sm">
                  {activeTabModal.taxes_and_fees ? `₹${Number(activeTabModal.taxes_and_fees).toLocaleString("en-IN")}` : "—"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Source Provider</span>
                <span className="text-slate-950 font-bold text-sm">{activeTabModal.source}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Advance Purchase</span>
                <span className="text-slate-950 font-bold text-sm">{activeTabModal.advance_purchase_days} Days</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Fare</span>
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  ₹{Number(activeTabModal.total_fare).toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={() => setActiveTabModal(null)}
                className="px-6 py-3 rounded-full bg-[#08080D] hover:bg-[#1A1F2B] text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Closing Quote Banner */}
      <DashboardClosingBanner quote="THOUSANDS OF FARES. ONE CLEARER PICTURE." />
    </div>
  );
}
