"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, X, LineChart, TrendingUp, Grid, Activity } from "lucide-react";

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
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-6 sm:px-12 pt-6 sm:pt-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo matching reference image */}
          <Link href="/" className="group flex items-center gap-2">
            <svg
              className="h-5 w-5 text-[#1C222B] -rotate-45 transition-transform duration-200 group-hover:scale-105"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="3 3 21 12 3 21 7 12 3 3" />
            </svg>
            <span className="font-display text-xl font-bold tracking-tight text-[#1C222B]">
              AURA
            </span>
          </Link>

<<<<<<< Updated upstream
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 rounded-full bg-black/20 px-6 py-2 border border-white/10 backdrop-blur-md">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Price Index
            </Link>
            <Link
              href="/dashboard/trends"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Corridor Trends
            </Link>
            <Link
              href="/dashboard/heatmap"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Heatmap
            </Link>
            <Link
              href="/dashboard/elasticity"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Elasticity
            </Link>
            <Link
              href="/dashboard/predictions"
              className="text-sm font-medium text-purple-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              AI Predictor
            </Link>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
=======
          {/* Right Controls: Menu Dropdown & Get Ticket Now Pill */}
          <div className="relative flex items-center gap-4 sm:gap-6 font-display" ref={dropdownRef}>
            {/* Menu Toggle Dropdown Button */}
>>>>>>> Stashed changes
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 text-xs sm:text-sm font-semibold text-[#1C222B] hover:text-black transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="tracking-wide">Menu</span>
            </button>

            {/* Menu Dropdown Popover */}
            {menuOpen && (
              <div className="absolute right-36 sm:right-40 top-12 w-56 rounded-2xl bg-white/95 p-3 shadow-xl border border-black/5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                <div className="flex flex-col space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1C222B] hover:bg-[#F3F6F7] transition-colors"
                  >
                    <LineChart className="h-4 w-4 text-[#1C222B]/70" />
                    <span>Price Index</span>
                  </Link>
                  <Link
                    href="/dashboard/trends"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1C222B] hover:bg-[#F3F6F7] transition-colors"
                  >
                    <TrendingUp className="h-4 w-4 text-[#1C222B]/70" />
                    <span>Corridor Trends</span>
                  </Link>
                  <Link
                    href="/dashboard/heatmap"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1C222B] hover:bg-[#F3F6F7] transition-colors"
                  >
                    <Grid className="h-4 w-4 text-[#1C222B]/70" />
                    <span>Heatmap</span>
                  </Link>
                  <Link
                    href="/dashboard/elasticity"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1C222B] hover:bg-[#F3F6F7] transition-colors"
                  >
                    <Activity className="h-4 w-4 text-[#1C222B]/70" />
                    <span>Elasticity</span>
                  </Link>
                </div>
              </div>
            )}

            {/* CTA Pill button matching exact white pill from image */}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#1C222B] shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-white/80 hover:bg-slate-50 active:scale-95 transition-all duration-200"
            >
              Get Ticket Now
            </Link>
          </div>
        </div>
      </div>
<<<<<<< Updated upstream

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-slate-950/95 px-6 py-6 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-4">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between text-sm font-semibold text-slate-200 hover:text-white"
            >
              <span>Airfare Index Dashboard</span>
              <BarChart3 className="h-4 w-4 text-sky-400" />
            </Link>
            <Link
              href="/dashboard/fares"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              Raw Fares Explorer
            </Link>
            <Link
              href="/dashboard/trends"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              Route Corridor Trends
            </Link>
            <Link
              href="/dashboard/heatmap"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              Route × Date Heatmap
            </Link>
            <Link
              href="/dashboard/elasticity"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              Lead-Time Elasticity
            </Link>
            <Link
              href="/dashboard/predictions"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-purple-400 hover:text-white flex items-center gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              AI Price Predictor (ML)
            </Link>
            <div className="pt-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/30"
              >
                <span>Launch Flight Terminal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
=======
>>>>>>> Stashed changes
    </header>
  );
}
