"use client";

import React from "react";
import {
  TrendingDown,
  Layers,
  Award,
  Sparkles,
  ArrowRightLeft,
  Percent,
} from "lucide-react";
import type { ComparisonSummary } from "@/types/comparison";

interface ComparisonKpiCardsProps {
  summary: ComparisonSummary;
}

export default function ComparisonKpiCards({ summary }: ComparisonKpiCardsProps) {
  const topPlatform =
    summary.platformStats && summary.platformStats.length > 0
      ? summary.platformStats[0]
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full">
      {/* Metric 1: Avg Price Spread */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-7 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-200/50">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">
              Avg. Platform Spread
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            <Percent className="h-3 w-3" />
            {summary.avgSpreadPercent}%
          </span>
        </div>
        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
            ₹{summary.avgSpreadAmount.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            variance per flight
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 leading-normal">
          Average price discrepancy between highest and lowest platform on identical flights.
        </p>
      </div>

      {/* Metric 2: Best Value Platform */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-7 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/50">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">
              Best Deal Leader
            </span>
          </div>
          {topPlatform && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Sparkles className="h-3 w-3" />
              {topPlatform.winRate}% wins
            </span>
          )}
        </div>
        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#08080D] capitalize truncate max-w-[200px]">
            {topPlatform ? topPlatform.source : "N/A"}
          </span>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            {topPlatform?.sourceType === "airline" ? "Direct" : "OTA"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 leading-normal">
          Platform with the highest frequency of offering the absolute lowest fare.
        </p>
      </div>

      {/* Metric 3: Max Savings Found */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-7 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 border border-purple-200/50">
              <TrendingDown className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">
              Max Savings Detected
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
            Top Opportunity
          </span>
        </div>
        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
            ₹{(summary.maxSpreadFlight?.spread || 0).toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-slate-500 font-mono font-medium">
            {summary.maxSpreadFlight?.flightNumber || "Direct"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 leading-normal truncate">
          {summary.maxSpreadFlight
            ? `On ${summary.maxSpreadFlight.route} (${summary.maxSpreadFlight.carrier})`
            : "Comparing all routes"}
        </p>
      </div>

      {/* Metric 4: Compared Flights */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-7 border border-white/90 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200/50">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">
              Active Comparison Set
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            {summary.totalPlatformsTracked} Channels
          </span>
        </div>
        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#08080D]">
            {summary.totalFlightsCompared.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            matched flights
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 leading-normal">
          Flights paired across multiple independent channels in the database.
        </p>
      </div>
    </div>
  );
}
