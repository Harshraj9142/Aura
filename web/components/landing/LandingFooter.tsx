"use client";

import Link from "next/link";
import { Plane, ArrowUpRight } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white font-bold text-sm">
                <Plane className="h-4 w-4 -rotate-45" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Aura <span className="text-xs text-sky-400 font-semibold tracking-widest">APIx</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Real-time Airfare Price Index for India. Scientifically monitoring domestic airline pricing, lead-time elasticity, and route corridors across 5 carriers and 6 online travel agencies.
            </p>
            <div className="text-xs text-slate-500">
              Data collected continuously and indexed daily at 06:00 IST.
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Dashboard
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/dashboard/fares" className="hover:text-white transition">
                  Fares Explorer
                </Link>
              </li>
              <li>
                <Link href="/dashboard/trends" className="hover:text-white transition">
                  Price Trends
                </Link>
              </li>
              <li>
                <Link href="/dashboard/heatmap" className="hover:text-white transition">
                  Route Heatmap
                </Link>
              </li>
              <li>
                <Link href="/dashboard/elasticity" className="hover:text-white transition">
                  Lead-Time Elasticity
                </Link>
              </li>
              <li>
                <Link href="/dashboard/predictions" className="text-purple-400 hover:text-purple-300 transition flex items-center gap-1">
                  <span>AI Price Predictions</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1 rounded">ML</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Routes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Corridors
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/dashboard/fares?origin=DEL&destination=BOM"
                  className="flex items-center gap-1 hover:text-white transition"
                >
                  <span>DEL ↔ BOM</span>
                  <ArrowUpRight className="h-3 w-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/fares?origin=DEL&destination=BLR"
                  className="flex items-center gap-1 hover:text-white transition"
                >
                  <span>DEL ↔ BLR</span>
                  <ArrowUpRight className="h-3 w-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/fares?origin=BOM&destination=BLR"
                  className="flex items-center gap-1 hover:text-white transition"
                >
                  <span>BOM ↔ BLR</span>
                  <ArrowUpRight className="h-3 w-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/fares?origin=BOM&destination=GOA"
                  className="flex items-center gap-1 hover:text-white transition"
                >
                  <span>BOM ↔ GOA</span>
                  <ArrowUpRight className="h-3 w-3 text-slate-500" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Aura Fly — Airfare Price Index (APIx). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>DGCA Weighted Laspeyres Benchmark</span>
            <Link href="/dashboard" className="text-sky-400 hover:underline">
              Terminal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
