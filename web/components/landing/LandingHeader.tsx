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
          {/* Brand Logo matching original landing image */}
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

          {/* Right Controls: Menu Dropdown & Get Ticket Now Pill */}
          <div className="relative flex items-center gap-4 sm:gap-6 font-display" ref={dropdownRef}>
            {/* Menu Toggle Dropdown Button */}
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

            {/* Auth Links */}
            <div className="flex items-center text-xs sm:text-sm font-semibold text-[#1C222B]">
              <Link href="/login" className="hover:text-black transition-colors">
                Sign In
              </Link>
              <span className="mx-1.5 text-slate-400 font-medium">/</span>
              <Link href="/register" className="hover:text-black transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
