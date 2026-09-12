"use client";

import Link from "next/link";
import { Plane, ArrowRight, TrendingDown, Clock, Shield } from "lucide-react";

interface CorridorItem {
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  avgFare: string;
  baseIndex: string;
  leadTimeDeal: string;
  change: string;
  isDrop: boolean;
}

const corridorList: CorridorItem[] = [
  {
    origin: "DEL",
    originName: "New Delhi (IGI)",
    destination: "BOM",
    destinationName: "Mumbai (CSMIA)",
    avgFare: "₹4,299",
    baseIndex: "104.2",
    leadTimeDeal: "14-21 Days Advance",
    change: "-14.2%",
    isDrop: true,
  },
  {
    origin: "DEL",
    originName: "New Delhi (IGI)",
    destination: "BLR",
    destinationName: "Bengaluru (KIA)",
    avgFare: "₹5,450",
    baseIndex: "98.7",
    leadTimeDeal: "21+ Days Advance",
    change: "-6.8%",
    isDrop: true,
  },
  {
    origin: "BOM",
    originName: "Mumbai (CSMIA)",
    destination: "BLR",
    destinationName: "Bengaluru (KIA)",
    avgFare: "₹3,850",
    baseIndex: "101.4",
    leadTimeDeal: "7-14 Days Advance",
    change: "+1.5%",
    isDrop: false,
  },
  {
    origin: "BOM",
    originName: "Mumbai (CSMIA)",
    destination: "GOA",
    destinationName: "Goa (Mopa / Dabolim)",
    avgFare: "₹2,890",
    baseIndex: "92.1",
    leadTimeDeal: "Tue / Wed Departures",
    change: "-22.4%",
    isDrop: true,
  },
  {
    origin: "DEL",
    originName: "New Delhi (IGI)",
    destination: "CCU",
    destinationName: "Kolkata (NSCBI)",
    avgFare: "₹4,680",
    baseIndex: "106.8",
    leadTimeDeal: "10-15 Days Advance",
    change: "-8.1%",
    isDrop: true,
  },
  {
    origin: "BLR",
    originName: "Bengaluru (KIA)",
    destination: "HYD",
    destinationName: "Hyderabad (RGIA)",
    avgFare: "₹2,690",
    baseIndex: "96.3",
    leadTimeDeal: "Weekend Saver",
    change: "-11.0%",
    isDrop: true,
  },
];

export function CorridorsSection() {
  return (
    <section className="bg-[#F3F6F7] py-20 px-6 sm:px-10 lg:px-14 border-t border-black/5">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#08080D]/10 bg-[#08080D]/5 px-3.5 py-1 text-xs font-semibold text-[#08080D] uppercase tracking-wider mb-3">
              <Plane className="h-3 w-3" />
              Corridor Watch
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
              Primary High-Density Corridors
            </h2>
            <p className="font-body mt-2 text-sm sm:text-base text-[#08080D]/70">
              Live pricing dynamics across India&apos;s busiest commercial aviation sectors.
            </p>
          </div>
          <Link
            href="/dashboard/heatmap"
            className="group inline-flex items-center gap-2 rounded-full bg-[#08080D] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1A1F2B] transition"
          >
            <span>View Full Route Heatmap</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {corridorList.map((item, index) => (
            <div
              key={index}
              className="rounded-3xl border border-black/5 bg-white p-7 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-black/5">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xl font-bold text-[#08080D]">
                      {item.origin}
                    </div>
                    <Plane className="h-4 w-4 text-[#08080D]/40" />
                    <div className="font-mono text-xl font-bold text-[#08080D]">
                      {item.destination}
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      item.isDrop
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <TrendingDown className="h-3 w-3" />
                    <span>{item.change}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 text-xs text-[#08080D]/70 font-body">
                  <div className="flex justify-between">
                    <span>Routing:</span>
                    <span className="text-[#08080D] font-semibold">
                      {item.originName} → {item.destinationName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Benchmark Fare:</span>
                    <span className="text-xl font-bold font-mono text-[#08080D]">
                      {item.avgFare}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price Index (APIx):</span>
                    <span className="font-mono font-bold text-[#08080D]">
                      {item.baseIndex}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="flex items-center gap-1 text-[11px] text-[#08080D]/60">
                      <Clock className="h-3 w-3 text-[#08080D]" /> Optimal Window:
                    </span>
                    <span className="text-[11px] text-[#08080D] font-semibold">
                      {item.leadTimeDeal}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between">
                <Link
                  href={`/dashboard/fares?origin=${item.origin}&destination=${item.destination}`}
                  className="text-xs font-semibold text-[#08080D] hover:underline"
                >
                  Browse Fares →
                </Link>
                <Link
                  href={`/dashboard/trends?origin=${item.origin}&destination=${item.destination}`}
                  className="rounded-full bg-[#F3F6F7] border border-black/5 px-4 py-1.5 text-xs font-semibold text-[#08080D] hover:bg-[#08080D] hover:text-white transition-colors"
                >
                  Trend
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
