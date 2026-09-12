"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface FaresFilterBarProps {
  routes: { origin: string; destination: string }[];
  sources: { source: string }[];
}

export function FaresFilterBar({ routes, sources }: FaresFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [source, setSource] = useState(searchParams.get("source") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [isOutlier, setIsOutlier] = useState(searchParams.get("isOutlier") || "false");

  // Get unique origins and destinations
  const origins = Array.from(new Set(routes.map((r) => r.origin))).sort();
  const destinations = Array.from(new Set(routes.map((r) => r.destination))).sort();

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    if (source) params.set("source", source);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (isOutlier && isOutlier !== "false") params.set("isOutlier", isOutlier);

    params.set("page", "1"); // Reset to first page

    startTransition(() => {
      router.push(`/dashboard/fares?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setOrigin("");
    setDestination("");
    setSource("");
    setDateFrom("");
    setDateTo("");
    setIsOutlier("false");

    startTransition(() => {
      router.push("/dashboard/fares");
    });
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {/* Origin */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Origin
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Origins</option>
            {origins.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Destination
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Destinations</option>
            {destinations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s.source} value={s.source}>
                {s.source}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Outliers */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Outliers
          </label>
          <select
            value={isOutlier}
            onChange={(e) => setIsOutlier(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="false font-normal">Exclude Outliers</option>
            <option value="true">Only Outliers</option>
            <option value="all">Include All</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center justify-end space-x-2">
        <button
          onClick={handleReset}
          className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
        >
          Reset
        </button>
        <button
          onClick={handleApplyFilters}
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition"
        >
          {isPending ? "Applying..." : "Apply Filters"}
        </button>
      </div>
    </div>
  );
}
