"use client";

import { useMemo } from "react";
import { HeatmapCell } from "@/types/fare";

interface HeatmapGridProps {
  data: HeatmapCell[];
}

export function HeatmapGrid({ data }: HeatmapGridProps) {
  // Extract distinct routes and travel dates sorted
  const { routes, dates, fareMap, minFare, maxFare } = useMemo(() => {
    if (!data || data.length === 0) {
      return { routes: [], dates: [], fareMap: new Map(), minFare: 0, maxFare: 0 };
    }

    const routeSet = new Set<string>();
    const dateSet = new Set<string>();
    const map = new Map<string, number>();
    let min = Infinity;
    let max = -Infinity;

    data.forEach((cell) => {
      routeSet.add(cell.route);
      dateSet.add(cell.travel_date);
      const key = `${cell.route}|${cell.travel_date}`;
      map.set(key, cell.avg_total_fare);
      if (cell.avg_total_fare < min) min = cell.avg_total_fare;
      if (cell.avg_total_fare > max) max = cell.avg_total_fare;
    });

    return {
      routes: Array.from(routeSet).sort(),
      dates: Array.from(dateSet).sort(),
      fareMap: map,
      minFare: min === Infinity ? 0 : min,
      maxFare: max === -Infinity ? 10000 : max,
    };
  }, [data]);

  if (routes.length === 0 || dates.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/50 text-slate-400">
        No fare data available to generate heatmap grid.
      </div>
    );
  }

  // Get color intensity (green = cheap, red = expensive)
  const getCellColor = (fare?: number) => {
    if (fare === undefined) return "bg-slate-900/40 text-slate-600";
    if (maxFare === minFare) return "bg-blue-600/30 text-blue-200";

    const ratio = (fare - minFare) / (maxFare - minFare);

    if (ratio < 0.25) return "bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900";
    if (ratio < 0.5) return "bg-blue-950/70 text-blue-300 border border-blue-800/40 hover:bg-blue-900";
    if (ratio < 0.75) return "bg-amber-950/70 text-amber-300 border border-amber-800/40 hover:bg-amber-900";
    return "bg-rose-950/70 text-rose-300 border border-rose-800/40 hover:bg-rose-900";
  };

  return (
    <div className="w-full space-y-4">
      {/* Color legend */}
      <div className="flex items-center justify-end space-x-3 text-xs text-slate-400">
        <span>Lower Fare</span>
        <div className="flex h-3 w-32 rounded overflow-hidden">
          <div className="w-1/4 bg-emerald-900"></div>
          <div className="w-1/4 bg-blue-900"></div>
          <div className="w-1/4 bg-amber-900"></div>
          <div className="w-1/4 bg-rose-900"></div>
        </div>
        <span>Higher Fare</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-slate-950 p-2 font-semibold text-slate-300 border-b border-slate-800">
                Route
              </th>
              {dates.map((d) => (
                <th
                  key={d}
                  className="p-2 font-medium text-slate-400 text-center border-b border-slate-800 whitespace-nowrap min-w-[70px]"
                >
                  {new Date(d).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route} className="border-b border-slate-900">
                <td className="sticky left-0 bg-slate-950 p-2 font-mono font-bold text-slate-200 whitespace-nowrap">
                  {route}
                </td>
                {dates.map((d) => {
                  const key = `${route}|${d}`;
                  const fare = fareMap.get(key);
                  return (
                    <td key={d} className="p-1 text-center">
                      <div
                        className={`group relative flex h-10 items-center justify-center rounded px-1 transition-all cursor-pointer ${getCellColor(
                          fare
                        )}`}
                      >
                        {fare !== undefined ? (
                          <>
                            <span className="font-medium">
                              ₹{Math.round(fare).toLocaleString("en-IN")}
                            </span>
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[10px] text-slate-100 shadow-xl group-hover:block z-20 whitespace-nowrap border border-slate-700">
                              {route} on {d}: <span className="font-bold">₹{Math.round(fare)}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
