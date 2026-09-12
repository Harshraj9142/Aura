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
    <section className="bg-slate-950 py-20 px-6 sm:px-10 lg:px-14 border-t border-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-0.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
              <Plane className="h-3 w-3" />
              Corridor Watch
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Primary High-Density Corridors
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              Live pricing dynamics across India&apos;s busiest commercial aviation sectors.
            </p>
          </div>
          <Link
            href="/dashboard/heatmap"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300 transition"
          >
            <span>View Full Route Heatmap</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {corridorList.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-slate-700 hover:bg-slate-900/80"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xl font-extrabold text-white">
                    {item.origin}
                  </div>
                  <Plane className="h-4 w-4 text-sky-400" />
                  <div className="font-mono text-xl font-extrabold text-white">
                    {item.destination}
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                    item.isDrop
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  <TrendingDown className="h-3 w-3" />
                  <span>{item.change}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Routing:</span>
                  <span className="text-slate-300 font-medium">
                    {item.originName} → {item.destinationName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Benchmark Fare:</span>
                  <span className="text-base font-bold font-mono text-white">
                    {item.avgFare}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price Index (APIx):</span>
                  <span className="font-mono font-semibold text-sky-400">
                    {item.baseIndex}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3 text-indigo-400" /> Optimal Window:
                  </span>
                  <span className="text-[11px] text-indigo-300 font-medium">
                    {item.leadTimeDeal}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <Link
                  href={`/dashboard/fares?origin=${item.origin}&destination=${item.destination}`}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
                >
                  Browse Fares →
                </Link>
                <Link
                  href={`/dashboard/trends?origin=${item.origin}&destination=${item.destination}`}
                  className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
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
