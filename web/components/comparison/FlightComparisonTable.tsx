"use client";

import React, { useState } from "react";
import AirlineLogo from "@/components/AirlineLogo";
import PlatformBadge from "./PlatformBadge";
import type { FlightComparisonGroup } from "@/types/comparison";
import {
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FlightComparisonTableProps {
  flights: FlightComparisonGroup[];
}

export default function FlightComparisonTable({ flights }: FlightComparisonTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (!flights || flights.length === 0) {
    return (
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-12 text-center border border-white/90 shadow-xl space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Info className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            No Comparable Flights Match Current Filters
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try choosing a different corridor, clearing your search query, or lowering the minimum price variance threshold.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Flight-by-Flight Price Comparison Matrix ({flights.length} flights)
        </h3>
        <span className="text-xs text-slate-500">
          Sorted by potential passenger savings
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {flights.map((flight) => {
          const isExpanded = expandedKey === flight.flightKey;
          const bestPlatformEntry = flight.platforms.find((p) => p.isBestPrice);

          return (
            <div
              key={flight.flightKey}
              className="rounded-3xl bg-white/80 backdrop-blur-xl p-5 sm:p-6 border border-white/90 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {/* Header row: Flight info & Price Spread Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                {/* Flight Left */}
                <div className="flex items-center gap-3.5">
                  <AirlineLogo
                    airline={flight.carrier}
                    flightNumber={flight.flightNumber}
                    size="md"
                    className="shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950 text-sm sm:text-base">
                        {flight.carrier}
                      </span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {flight.flightNumber}
                      </span>
                      {flight.departureTime && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Clock className="h-3 w-3" />
                          {flight.departureTime}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        {flight.routeOrigin}
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        {flight.routeDestination}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(flight.travelDate).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {flight.advancePurchaseDays !== undefined && (
                        <>
                          <span>•</span>
                          <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            {flight.advancePurchaseDays}d in advance
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Spread & Best Price Tag */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Best Price
                    </div>
                    <div className="text-lg sm:text-xl font-black text-emerald-700 tracking-tight flex items-center justify-end gap-1">
                      ₹{flight.bestPrice.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {flight.spreadAmount > 0 && (
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                        Price Spread
                      </div>
                      <div className="text-xs sm:text-sm font-extrabold text-amber-800">
                        +₹{flight.spreadAmount.toLocaleString("en-IN")} ({flight.spreadPercent}%)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Side-by-Side Platform Pricing Grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {flight.platforms.map((platform) => {
                  const isBest = platform.isBestPrice;
                  const isDirect = platform.sourceType === "airline";

                  return (
                    <div
                      key={platform.source}
                      className={`relative rounded-2xl p-3.5 border transition-all ${
                        isBest
                          ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <PlatformBadge
                          source={platform.source}
                          sourceType={platform.sourceType}
                          isBest={isBest}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-baseline justify-between gap-2 mt-1">
                        <span
                          className={`text-base sm:text-lg font-black tracking-tight ${
                            isBest ? "text-emerald-900" : "text-slate-900"
                          }`}
                        >
                          ₹{platform.totalFare.toLocaleString("en-IN")}
                        </span>

                        {/* Price difference vs Direct Airline Baseline */}
                        {platform.differenceFromDirect !== undefined &&
                          platform.differenceFromDirect !== null && (
                            <span
                              className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                platform.differenceFromDirect === 0
                                  ? "text-slate-500 bg-slate-200/50"
                                  : platform.differenceFromDirect < 0
                                  ? "text-emerald-700 bg-emerald-100"
                                  : "text-rose-700 bg-rose-100"
                              }`}
                            >
                              {platform.differenceFromDirect === 0
                                ? "Baseline"
                                : platform.differenceFromDirect < 0
                                ? `-₹${Math.abs(platform.differenceFromDirect)}`
                                : `+₹${platform.differenceFromDirect}`}
                            </span>
                          )}

                        {/* If this platform is the baseline direct airline itself */}
                        {isDirect && platform.differenceFromDirect == null && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Direct
                          </span>
                        )}
                      </div>

                      {/* Micro Fee breakdown if available */}
                      {(platform.baseFare != null || platform.taxesAndFees != null) && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Base: ₹{platform.baseFare?.toLocaleString("en-IN") || "—"}</span>
                          <span>Taxes: ₹{platform.taxesAndFees?.toLocaleString("en-IN") || "—"}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Insight Footer */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    Book on <strong className="text-slate-800 capitalize">{bestPlatformEntry?.source}</strong> for lowest fare
                  </span>
                  {flight.spreadAmount > 0 && (
                    <span className="text-emerald-700 font-semibold">
                      (Save ₹{flight.spreadAmount.toLocaleString("en-IN")})
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  Compared across {flight.platforms.length} platforms
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
