"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Plane, ArrowRight, BarChart3 } from "lucide-react";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Brand Logo matching LuxFly / Aura aesthetics */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
              <Plane className="h-5 w-5 -rotate-45 text-white" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold tracking-tight text-white drop-shadow-md">
                Aura
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                Fly
              </span>
            </div>
          </Link>

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
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center gap-1.5 rounded-full bg-black/30 px-3.5 py-2 text-xs font-medium text-white border border-white/15 backdrop-blur-md hover:bg-black/50 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span>Menu</span>
            </button>

            {/* Desktop Menu indicator */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="hidden lg:flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white border border-white/15 backdrop-blur-md hover:bg-white/20 transition"
            >
              <Menu className="h-3.5 w-3.5" />
              <span>Menu</span>
            </button>

            {/* CTA Pill button matching the image's "Get Ticket Now" */}
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-white/15 hover:bg-slate-100 hover:shadow-white/25 active:scale-95 transition-all duration-200"
            >
              <span>Get Ticket Now</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

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
    </header>
  );
}
