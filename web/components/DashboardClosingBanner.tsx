"use client";

import React from "react";

interface DashboardClosingBannerProps {
  quote: string;
  subtitle?: string;
}

export function DashboardClosingBanner({
  quote,
  subtitle = "Aura Airfare Intelligence Telemetry · Real-time Domestic Aviation Insights",
}: DashboardClosingBannerProps) {
  return (
    <div className="w-full my-12 pt-8 border-t border-slate-200/80">
      <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl border border-slate-800">
        {/* Glow decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-purple-600/15 blur-3xl pointer-events-none rounded-full" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-3">
          <p className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
            Aura Aviation Intelligence
          </p>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase leading-snug">
            {quote}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium pt-1">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashboardClosingBanner;
