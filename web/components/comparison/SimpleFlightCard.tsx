"use client";

import React from "react";
import AirlineLogo from "@/components/AirlineLogo";
import PlatformBadge from "./PlatformBadge";
import type { FlightComparisonGroup } from "@/types/comparison";
import {
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface SimpleFlightCardProps {
  flight: FlightComparisonGroup;
}

export default function SimpleFlightCard({ flight }: SimpleFlightCardProps) {
  const bestPlatform = flight.platforms.find((p) => p.isBestPrice);
  const directPlatform = flight.platforms.find((p) => p.sourceType === "airline");

  // Determine savings insight
  let savingsMessage = "";
  if (flight.spreadAmount > 0) {
    if (bestPlatform?.sourceType === "airline") {
      savingsMessage = `Official Airline Direct booking offers the lowest price (Save ₹${flight.spreadAmount.toLocaleString(
        "en-IN"
      )} vs OTAs)!`;
    } else {
      savingsMessage = `Save ₹${flight.spreadAmount.toLocaleString(
        "en-IN"
      )} by booking on ${bestPlatform?.source?.toUpperCase()}!`;
    }
  }

  return (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl p-5 sm:p-7 border border-white/90 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Top Header: Airline & Flight Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        {/* Left: Carrier + Flight Number + Departure */}
        <div className="flex items-center gap-4">
          <AirlineLogo
            airline={flight.carrier}
            flightNumber={flight.flightNumber}
            size="lg"
            className="shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                {flight.carrier}
              </h3>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                {flight.flightNumber}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Economy
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 mt-1.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {flight.routeOrigin}
                <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                {flight.routeDestination}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {new Date(flight.travelDate).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {flight.departureTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {flight.departureTime} Departure
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Best Price Callout */}
        <div className="flex items-center gap-3 sm:text-right self-start sm:self-auto">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 px-4 py-2 text-right">
            <div className="flex items-center justify-end gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Best Available Price</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
              ₹{flight.bestPrice.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] font-semibold text-emerald-700 capitalize truncate max-w-[160px]">
              on {bestPlatform?.source}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body: All Different Platforms & Prices Comparison */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
            Platform Prices Comparison ({flight.platforms.length} Platforms)
          </span>
          {flight.spreadAmount > 0 && (
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              ₹{flight.spreadAmount.toLocaleString("en-IN")} price spread ({flight.spreadPercent}%)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {flight.platforms.map((p) => {
            const isBest = p.isBestPrice;
            const diffFromBest = p.totalFare - flight.bestPrice;

            return (
              <div
                key={p.source}
                className={`relative flex flex-col justify-between rounded-2xl p-4 border transition-all ${
                  isBest
                    ? "bg-gradient-to-b from-emerald-50/90 to-emerald-100/40 border-emerald-300 ring-2 ring-emerald-500/25 shadow-md"
                    : "bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300"
                }`}
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <PlatformBadge
                    source={p.source}
                    sourceType={p.sourceType}
                    isBest={isBest}
                    size="sm"
                  />
                </div>

                {/* Price Display */}
                <div className="my-2 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`text-xl font-black tracking-tight ${
                        isBest ? "text-emerald-950" : "text-slate-900"
                      }`}
                    >
                      ₹{p.totalFare.toLocaleString("en-IN")}
                    </span>

                    {/* Badge: Best Price vs Difference */}
                    {isBest ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                        <Sparkles className="h-2.5 w-2.5" />
                        CHEAPEST
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        +₹{diffFromBest.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {/* Micro Breakdown of base and taxes if available */}
                  {(p.baseFare != null || p.taxesAndFees != null) && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Base: ₹{p.baseFare?.toLocaleString("en-IN") || "—"}</span>
                      <span>Taxes: ₹{p.taxesAndFees?.toLocaleString("en-IN") || "—"}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Channel Tag */}
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">
                    {p.sourceType === "airline" ? "Official Portal" : "OTA Agency"}
                  </span>
                  <span
                    className={`font-bold ${
                      isBest ? "text-emerald-700" : "text-slate-600"
                    }`}
                  >
                    {isBest ? "Best Deal" : "Available"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      {savingsMessage && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-medium">
            <TrendingDown className="h-4 w-4 text-emerald-600" />
            <span>{savingsMessage}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Real database verified prices</span>
          </div>
        </div>
      )}
    </div>
  );
}
