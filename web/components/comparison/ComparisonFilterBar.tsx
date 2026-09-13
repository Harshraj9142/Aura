"use client";

import React from "react";
import { Filter, Search, RotateCcw } from "lucide-react";

interface ComparisonFilterBarProps {
  availableRoutes: { origin: string; destination: string; count: number }[];
  availableCarriers: string[];
  selectedOrigin?: string;
  selectedDestination?: string;
  selectedCarrier?: string;
  searchQuery: string;
  minSpread: number;
  sortBy: "spread" | "price" | "flight";
  onSelectRoute: (origin?: string, destination?: string) => void;
  onSelectCarrier: (carrier?: string) => void;
  onSearchChange: (query: string) => void;
  onMinSpreadChange: (min: number) => void;
  onSortByChange: (sort: "spread" | "price" | "flight") => void;
  onReset: () => void;
}

export default function ComparisonFilterBar({
  availableRoutes,
  availableCarriers,
  selectedOrigin,
  selectedDestination,
  selectedCarrier,
  searchQuery,
  minSpread,
  sortBy,
  onSelectRoute,
  onSelectCarrier,
  onSearchChange,
  onMinSpreadChange,
  onSortByChange,
  onReset,
}: ComparisonFilterBarProps) {
  const activeRoutePair =
    selectedOrigin && selectedDestination
      ? `${selectedOrigin}-${selectedDestination}`
      : "all";

  const hasActiveFilters =
    Boolean(selectedOrigin) ||
    Boolean(selectedCarrier) ||
    searchQuery.trim().length > 0 ||
    minSpread > 0 ||
    sortBy !== "spread";

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-5 sm:p-6 border border-white/90 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            Platform Filters & Corridors
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
        {/* 1. Route Corridor Dropdown */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Flight Corridor
          </label>
          <select
            value={activeRoutePair}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all") {
                onSelectRoute(undefined, undefined);
              } else {
                const [orig, dest] = val.split("-");
                onSelectRoute(orig, dest);
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
          >
            <option value="all">All Corridors ({availableRoutes.reduce((acc, r) => acc + r.count, 0)} flights)</option>
            {availableRoutes.map((r) => (
              <option key={`${r.origin}-${r.destination}`} value={`${r.origin}-${r.destination}`}>
                {r.origin} → {r.destination} ({r.count} compared)
              </option>
            ))}
          </select>
        </div>

        {/* 2. Carrier Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Airline Carrier
          </label>
          <select
            value={selectedCarrier || "all"}
            onChange={(e) => {
              const val = e.target.value;
              onSelectCarrier(val === "all" ? undefined : val);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
          >
            <option value="all">All Airlines</option>
            {availableCarriers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Min Price Variation */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Min. Price Variance
          </label>
          <select
            value={minSpread}
            onChange={(e) => onMinSpreadChange(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
          >
            <option value={0}>Any Difference (All)</option>
            <option value={100}>₹100+ Variation</option>
            <option value={300}>₹300+ Variation</option>
            <option value={500}>₹500+ Variation</option>
            <option value={1000}>₹1,000+ Big Spread</option>
          </select>
        </div>

        {/* 4. Sort Ordering */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
          >
            <option value="spread">Highest Price Spread First</option>
            <option value="price">Lowest Fare First</option>
            <option value="flight">Flight Number (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Search Input for Flight Number */}
      <div className="relative pt-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by flight number (e.g. 6E-261, AI-2945, QP-1119)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
        />
      </div>
    </div>
  );
}
