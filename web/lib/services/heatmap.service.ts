/**
 * APIx Web — Heatmap Service
 *
 * Computes the route × date heatmap data: average total_fare
 * for each (route, travel_date) combination within a date range.
 *
 * Wrapped with unstable_cache since the underlying scrape data
 * only changes ~once a day.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { HeatmapCell } from "@/types/fare";
import { Prisma } from "@prisma/client";

/**
 * Get heatmap data — avg fare by route and date.
 *
 * @param dateFrom - Start of date range (ISO string, default: 30 days ago)
 * @param dateTo - End of date range (ISO string, default: today)
 */
async function _getHeatmapData(
  dateFrom?: string,
  dateTo?: string
): Promise<HeatmapCell[]> {
  const where: Prisma.FareWhereInput = {
    is_outlier: false, // Exclude outliers from averages
  };

  if (dateFrom || dateTo) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    where.travel_date = dateFilter;
  }

  const results = await prisma.fare.groupBy({
    by: ["route_origin", "route_destination", "travel_date"],
    where,
    _avg: { total_fare: true },
    orderBy: { travel_date: "asc" },
  });

  return results.map((r) => ({
    route: `${r.route_origin}-${r.route_destination}`,
    travel_date: r.travel_date instanceof Date ? r.travel_date.toISOString().split("T")[0] : String(r.travel_date),
    avg_total_fare: Math.round(Number(r._avg.total_fare ?? 0)),
  }));
}

/**
 * Cached version of getHeatmapData — revalidates every hour.
 */
export const getHeatmapData = unstable_cache(
  _getHeatmapData,
  ["heatmap"],
  { revalidate: 3600, tags: ["heatmap"] }
);
