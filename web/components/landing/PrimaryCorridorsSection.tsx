"use client";

import React, { useState } from "react";
import { Plane } from "lucide-react";

interface CorridorItem {
  id: string;
  code: string;
  cities: string;
  benchmark: string;
  index: string;
  optimalAdvance: string;
  savings: string;
  trendType: "deflation" | "inflation";
  trendValue: string;
  category: "golden" | "metro" | "regional";
  image: string;
  flightCount: string;
}

const corridors: CorridorItem[] = [
  {
    id: "del-bom",
    code: "DEL ↔ BOM",
    cities: "Delhi ↔ Mumbai",
    benchmark: "₹7,928",
    index: "126.9",
    optimalAdvance: "14–21 Days Advance",
    savings: "-16.4%",
    trendType: "deflation",
    trendValue: "-16.4% vs Peak",
    category: "golden",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80",
    flightCount: "928 Database Records",
  },
  {
    id: "del-blr",
    code: "DEL ↔ BLR",
    cities: "Delhi ↔ Bengaluru",
    benchmark: "₹8,943",
    index: "126.9",
    optimalAdvance: "18–25 Days Advance",
    savings: "-18.5%",
    trendType: "deflation",
    trendValue: "-18.5% vs Peak",
    category: "golden",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80",
    flightCount: "1,842 Database Records",
  },
  {
    id: "bom-blr",
    code: "BOM ↔ BLR",
    cities: "Mumbai ↔ Bengaluru",
    benchmark: "₹6,635",
    index: "126.9",
    optimalAdvance: "10–14 Days Advance",
    savings: "-12.0%",
    trendType: "deflation",
    trendValue: "-12.0% vs Peak",
    category: "golden",
    image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80",
    flightCount: "1,320 Database Records",
  },
  {
    id: "del-ccu",
    code: "DEL ↔ CCU",
    cities: "Delhi ↔ Kolkata",
    benchmark: "₹7,203",
    index: "126.9",
    optimalAdvance: "14–21 Days Advance",
    savings: "-15.8%",
    trendType: "deflation",
    trendValue: "-15.8% vs Peak",
    category: "metro",
    image: "https://images.unsplash.com/photo-1558431382-27e303142255?w=800&auto=format&fit=crop&q=80",
    flightCount: "1,048 Database Records",
  },
  {
    id: "blr-hyd",
    code: "BLR ↔ HYD",
    cities: "Bengaluru ↔ Hyderabad",
    benchmark: "₹4,724",
    index: "126.9",
    optimalAdvance: "7–14 Days Advance",
    savings: "-11.4%",
    trendType: "deflation",
    trendValue: "-11.4% vs Peak",
    category: "metro",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80",
    flightCount: "785 Database Records",
  },
  {
    id: "maa-del",
    code: "MAA ↔ DEL",
    cities: "Chennai ↔ Delhi",
    benchmark: "₹8,545",
    index: "126.9",
    optimalAdvance: "12–18 Days Advance",
    savings: "-14.0%",
    trendType: "deflation",
    trendValue: "-14.0% vs Peak",
    category: "metro",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80",
    flightCount: "792 Database Records",
  },
];

export function PrimaryCorridorsSection() {
  const [filter, setFilter] = useState<"all" | "golden" | "metro">("all");

  const filteredCorridors = corridors.filter(
    (c) => filter === "all" || c.category === filter
  );

  return (
    <section className="relative z-10 bg-transparent py-24 px-4 sm:px-8 lg:px-16 border-t border-black/5 select-none font-display">

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section Header (No generic AI pill tags!) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            {/* Title following global typography hierarchy */}
            <h2 className="font-heading text-3xl sm:text-5xl font-normal tracking-tight text-[#08080D] leading-[1.08]">
              Primary High-Density <span className="font-semibold text-[#08080D]">Corridors</span>
            </h2>

            {/* Subtitle following global typography hierarchy */}
            <p className="font-body mt-3 text-sm sm:text-base text-[#08080D]/75 max-w-2xl leading-relaxed">
              Benchmark lower fares across limited routes, corridors, and cities to make primary order High-Density corridors.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-full border border-black/5 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                filter === "all"
                  ? "bg-[#08080D] text-white shadow-xs"
                  : "text-[#08080D]/70 hover:text-[#08080D]"
              }`}
            >
              All Corridors
            </button>
            <button
              onClick={() => setFilter("golden")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                filter === "golden"
                  ? "bg-[#08080D] text-white shadow-xs"
                  : "text-[#08080D]/70 hover:text-[#08080D]"
              }`}
            >
              Golden Corridors
            </button>
            <button
              onClick={() => setFilter("metro")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                filter === "metro"
                  ? "bg-[#08080D] text-white shadow-xs"
                  : "text-[#08080D]/70 hover:text-[#08080D]"
              }`}
            >
              Metro Hubs
            </button>
          </div>
        </div>

        {/* Corridor Cards Grid with Smooth Rounded Corners (rounded-[32px]) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCorridors.map((item) => (
            <a
              key={item.id}
              href="/dashboard/trends"
              className="group relative h-[300px] sm:h-[320px] w-full rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between p-6 sm:p-8 text-white cursor-pointer border border-black/5 hover:-translate-y-1.5"
            >
              {/* Background Landmark Image */}
              <img
                src={item.image}
                alt={item.cities}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.82]"
              />

              {/* Gradient Vignette & Dark Overlay for readable white text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/25" />

              {/* Top Pill Badge: Flights + Flight count */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-[#08080D] shadow-xs">
                  <Plane className="h-3.5 w-3.5 text-[#08080D]" />
                  <span>Flights</span>
                </div>

                <span className="text-[11px] font-body font-medium text-white/90 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  {item.flightCount}
                </span>
              </div>

              {/* Bottom Card Content: Benchmark, Index, Optimal Days & Inflation/Deflation */}
              <div className="relative z-10 pt-4">
                {/* Route Code */}
                <div className="flex items-baseline justify-between mb-1.5">
                  <h3 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
                    {item.code}
                  </h3>
                </div>

                {/* Benchmark & Index Parameters */}
                <div className="font-body text-xs sm:text-sm text-white/90 font-normal mb-1.5 flex items-center gap-2 tracking-normal">
                  <span>Benchmark <strong className="text-white font-medium">{item.benchmark}</strong></span>
                  <span className="text-white/40">|</span>
                  <span>Index <strong className="text-white font-medium">{item.index}</strong></span>
                </div>

                {/* Optimal Days Window */}
                <div className="font-body text-xs sm:text-sm text-white/85 font-normal flex items-center gap-2 tracking-normal">
                  <span>Optimal: <strong className="text-white font-medium">{item.optimalAdvance}</strong></span>
                  <span className="font-medium text-emerald-400">({item.savings})</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Action Banner Card matching exact reference design */}
        <div className="mt-16 sm:mt-24 rounded-[32px] sm:rounded-[36px] bg-[#08080D] text-white p-10 sm:p-16 text-center flex flex-col items-center justify-center shadow-2xl border border-white/10">
          <h3 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white max-w-2xl leading-[1.1] mb-4">
            Ready to explore live airline fare matrices?
          </h3>
          <p className="font-body text-sm sm:text-base text-white/75 font-normal max-w-xl leading-relaxed mb-8">
            Access the full terminal with granular fare records, interactive route heatmaps, and historical trend comparisons.
          </p>
          <a
            href="/dashboard"
            className="font-display group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-xs sm:text-sm font-semibold text-[#08080D] shadow-xs hover:bg-[#F3F6F7] active:scale-95 transition-all duration-200"
          >
            <span>Launch Dashboard Terminal</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
