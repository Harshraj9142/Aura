"use client";

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="relative z-10 w-full bg-[#08080D] text-white py-16 sm:py-20 px-6 select-none font-display border-t border-white/10">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-center text-center">
        {/* Brand Logo Lockup: Flight Icon + AURA */}
        <Link href="/" className="group flex items-center justify-center gap-3.5 mb-10 sm:mb-12">
          <svg
            className="h-6 w-6 text-white -rotate-45 transition-transform duration-300 group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="3 3 21 12 3 21 7 12 3 3" />
          </svg>
          <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            AURA
          </span>
        </Link>

        {/* Center Navigation Links matching reference image */}
        <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-12 sm:mb-16">
          <Link
            href="/dashboard"
            className="text-xs sm:text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            Price Index
          </Link>
          <Link
            href="/dashboard/trends"
            className="text-xs sm:text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            Corridor Trends
          </Link>
          <Link
            href="/dashboard/heatmap"
            className="text-xs sm:text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            Route Heatmap
          </Link>
          <Link
            href="/dashboard/elasticity"
            className="text-xs sm:text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            Elasticity Matrix
          </Link>
          <Link
            href="/dashboard/predictions"
            className="text-xs sm:text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            AI Predictor
          </Link>
        </nav>

        {/* Copyright Line matching exact reference text style */}
        <div className="text-[10px] sm:text-xs font-mono font-medium tracking-[0.2em] text-white/40 uppercase">
          COPYRIGHTED © 2026 AURA
        </div>
      </div>
    </footer>
  );
}
