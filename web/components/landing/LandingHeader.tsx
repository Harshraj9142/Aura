"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  LineChart,
  TrendingUp,
  Grid,
  Activity,
  Plane,
  ArrowRight,
} from "lucide-react";

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menu dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all duration-300 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Govt Badge matching Dashboard Header */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold group-hover:bg-emerald-500/20 transition-all">
              <Plane className="w-5 h-5 text-emerald-400 -rotate-45 transition-transform duration-200 group-hover:scale-110" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold tracking-tight text-slate-100">
                  AURA
                </span>
                <span className="text-[10px] font-mono uppercase py-0.5 px-1.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-bold">
                  MoSPI Govt
                </span>
              </div>
              <p className="text-slate-400 text-[11px] font-medium tracking-wide leading-none mt-0.5 hidden sm:block">
                Real-time Airfare Price Index
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links matching Dashboard Component Styling */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 rounded-full px-3.5 py-1.5 backdrop-blur-md">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 transition-all"
            >
              <LineChart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Price Index</span>
            </Link>
            <Link
              href="/dashboard/trends"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Corridor Trends</span>
            </Link>
            <Link
              href="/dashboard/heatmap"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 transition-all"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-400" />
              <span>Heatmap</span>
            </Link>
            <Link
              href="/dashboard/elasticity"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 transition-all"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Elasticity</span>
            </Link>
          </nav>

          {/* Right Controls: Menu Dropdown & CTA Button */}
          <div className="relative flex items-center gap-3 sm:gap-4" ref={dropdownRef}>
            {/* Menu Toggle Dropdown Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold text-slate-300 hover:text-emerald-400 bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {menuOpen ? <X className="h-4 w-4 text-emerald-400" /> : <Menu className="h-4 w-4 text-slate-400" />}
              <span>Menu</span>
            </button>

            {/* Menu Dropdown Popover */}
            {menuOpen && (
              <div className="absolute right-36 sm:right-40 top-12 w-60 rounded-2xl bg-slate-900/95 p-2.5 shadow-2xl border border-slate-800 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                <div className="flex flex-col space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-200 hover:bg-slate-800/90 hover:text-emerald-400 transition-colors"
                  >
                    <LineChart className="h-4 w-4 text-emerald-400" />
                    <span>Price Index (/dashboard)</span>
                  </Link>
                  <Link
                    href="/dashboard/trends"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-200 hover:bg-slate-800/90 hover:text-emerald-400 transition-colors"
                  >
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span>Corridor Trends (/trends)</span>
                  </Link>
                  <Link
                    href="/dashboard/heatmap"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-200 hover:bg-slate-800/90 hover:text-emerald-400 transition-colors"
                  >
                    <Grid className="h-4 w-4 text-emerald-400" />
                    <span>Heatmap (/heatmap)</span>
                  </Link>
                  <Link
                    href="/dashboard/elasticity"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-200 hover:bg-slate-800/90 hover:text-emerald-400 transition-colors"
                  >
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <span>Elasticity (/elasticity)</span>
                  </Link>
                </div>
              </div>
            )}

            {/* CTA Button matching Dashboard styling */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all duration-200 whitespace-nowrap"
            >
              <span>Get Ticket Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
