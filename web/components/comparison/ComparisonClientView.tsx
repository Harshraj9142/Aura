"use client";

import React, { useState, useMemo } from "react";
import type { ComparisonDataResponse, FlightComparisonGroup } from "@/types/comparison";
import FlightSearchHero, { AIRPORT_OPTIONS } from "./FlightSearchHero";
import SimpleFlightCard from "./SimpleFlightCard";
import { Plane, Search, ArrowUpDown, Filter, RotateCcw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardClosingBanner } from "@/components/DashboardClosingBanner";

interface ComparisonClientViewProps {
  initialData: ComparisonDataResponse;
}

export default function ComparisonClientView({ initialData }: ComparisonClientViewProps) {
  // Search state
  const [origin, setOrigin] = useState<string>("DEL");
  const [destination, setDestination] = useState<string>("BOM");
  const [travelDate, setTravelDate] = useState<string>("all");
  const [timeOfDay, setTimeOfDay] = useState<string>("any");

  // Secondary filters & sorting
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"price" | "spread" | "flight">("price");

  const [hasSearched, setHasSearched] = useState<boolean>(true);
  const router = useRouter();

  // Swap origin & destination
  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSearch = () => {
    setHasSearched(true);
  };

  // Filter flights based on search inputs
  const matchingFlights = useMemo(() => {
    return initialData.flights.filter((f) => {
      // 1. Origin & Destination match
      if (f.routeOrigin !== origin) return false;
      if (f.routeDestination !== destination) return false;

      // 2. Travel Date match (if specific date selected)
      if (travelDate !== "all" && f.travelDate !== travelDate) {
        return false;
      }

      // 3. Time of Day match
      if (timeOfDay !== "any" && f.departureTime) {
        const hour = parseInt(f.departureTime.split(":")[0], 10);
        if (!isNaN(hour)) {
          if (timeOfDay === "morning" && (hour < 5 || hour >= 12)) return false;
          if (timeOfDay === "afternoon" && (hour < 12 || hour >= 18)) return false;
          if (timeOfDay === "evening" && (hour < 18 || hour >= 24)) return false;
          if (timeOfDay === "night" && hour >= 5) return false;
        }
      }

      // 4. Carrier filter
      if (
        carrierFilter !== "all" &&
        !f.carrier.toLowerCase().includes(carrierFilter.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [
    initialData.flights,
    origin,
    destination,
    travelDate,
    timeOfDay,
    carrierFilter,
  ]);

  // Sorted flights
  const sortedFlights = useMemo(() => {
    const list = [...matchingFlights];
    if (sortBy === "price") {
      list.sort((a, b) => a.bestPrice - b.bestPrice);
    } else if (sortBy === "spread") {
      list.sort((a, b) => b.spreadAmount - a.spreadAmount);
    } else if (sortBy === "flight") {
      list.sort((a, b) => a.flightNumber.localeCompare(b.flightNumber));
    }
    return list;
  }, [matchingFlights, sortBy]);

  // Extract dates that actually have flights for the current origin & destination
  const datesForSelectedCorridor = useMemo(() => {
    const dates = new Set<string>();
    for (const f of initialData.flights) {
      if (f.routeOrigin === origin && f.routeDestination === destination) {
        dates.add(f.travelDate);
      }
    }
    return Array.from(dates).sort();
  }, [initialData.flights, origin, destination]);

  // Extract carriers for the current filtered flights
  const availableCarriersForCorridor = useMemo(() => {
    const set = new Set<string>();
    for (const f of initialData.flights) {
      if (f.routeOrigin === origin && f.routeDestination === destination) {
        set.add(f.carrier);
      }
    }
    return Array.from(set).sort();
  }, [initialData.flights, origin, destination]);

  const originName = AIRPORT_OPTIONS.find((a) => a.code === origin)?.city || origin;
  const destinationName =
    AIRPORT_OPTIONS.find((a) => a.code === destination)?.city || destination;

  return (
    <div className="w-full space-y-0">
      {/* 1. Hero Banner and Search Control Card */}
      <FlightSearchHero
        origin={origin}
        destination={destination}
        travelDate={travelDate}
        timeOfDay={timeOfDay}
        availableDates={datesForSelectedCorridor.length > 0 ? datesForSelectedCorridor : initialData.availableDates}
        onOriginChange={(newOrig) => {
          setOrigin(newOrig);
        }}
        onDestinationChange={(newDest) => {
          setDestination(newDest);
        }}
        onDateChange={setTravelDate}
        onTimeChange={setTimeOfDay}
        onSwap={handleSwap}
        onSearch={handleSearch}
        isSearching={false}
      />

      {/* 2. Results Section: Displayed after search */}
      {hasSearched && (
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 pb-24 pt-4">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  Flights from {originName} ({origin}) to {destinationName} ({destination})
                </h2>
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
                  Showing all flight records and price variations across airline direct and OTA platforms.
                </p>
              </div>

              {/* Quick controls: Carrier & Sort */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Carrier selector */}
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    value={carrierFilter}
                    onChange={(e) => setCarrierFilter(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Airlines</option>
                    {availableCarriersForCorridor.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="price">Lowest Price First</option>
                    <option value="spread">Highest Price Difference First</option>
                    <option value="flight">Flight Number (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Flight Cards List */}
            {sortedFlights.length > 0 ? (
              <div className="space-y-6">
                {sortedFlights.map((flight) => (
                  <SimpleFlightCard key={flight.flightKey} flight={flight} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-10 sm:p-16 text-center border border-white/90 shadow-2xl space-y-5 max-w-2xl mx-auto my-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
                  <Plane className="h-8 w-8 -rotate-45" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    No Flights Found for {origin} → {destination}
                    {travelDate !== "all" ? ` on ${travelDate}` : ""}
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    We couldn&apos;t find matching records in the database with the selected date or time filter.
                  </p>
                </div>

                {datesForSelectedCorridor.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs sm:text-sm font-bold text-slate-700 block mb-2.5">
                      Available dates with flight records on this corridor:
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {datesForSelectedCorridor.slice(0, 6).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setTravelDate(d)}
                          className="rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-800 transition-colors shadow-xs"
                        >
                          {new Date(d).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOrigin("DEL");
                    setDestination("BOM");
                    setTravelDate("all");
                    setTimeOfDay("any");
                    setCarrierFilter("all");
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#08080D] hover:bg-[#1A1F2B] text-white px-6 py-3 text-sm font-bold shadow-lg transition cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Show Popular DEL → BOM Flights</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Closing Quote Banner */}
      <DashboardClosingBanner quote="SAME FLIGHT. DIFFERENT FARE. NOW VISIBLE." />
    </div>
  );
}
