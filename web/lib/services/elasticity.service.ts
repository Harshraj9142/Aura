/**
 * APIx Web — Elasticity Service
 *
 * Computes lead-time elasticity data: average fare grouped by
 * advance_purchase_days for a specific route. Shows how fares
 * change as the booking window narrows.
 *
 * Wrapped with unstable_cache — revalidates hourly.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { ElasticityPoint } from "@/types/fare";

/**
 * Get elasticity curve data for a specific route.
 *
 * Groups fares by advance_purchase_days and returns avg/min/max
 * for each bucket.
 */
async function _getElasticityData(
  origin: string,
  destination: string
): Promise<ElasticityPoint[]> {
  const results = await prisma.fare.groupBy({
    by: ["advance_purchase_days"],
    where: {
      route_origin: origin,
      route_destination: destination,
      is_outlier: false, // Exclude outliers
    },
    _avg: { total_fare: true },
    _min: { total_fare: true },
    _max: { total_fare: true },
    _count: { id: true },
    orderBy: { advance_purchase_days: "asc" },
  });

  return results.map((r: any) => ({
    advance_purchase_days: r.advance_purchase_days,
    avg_fare: Math.round(Number(r._avg.total_fare ?? 0)),
    min_fare: Math.round(Number(r._min.total_fare ?? 0)),
    max_fare: Math.round(Number(r._max.total_fare ?? 0)),
    sample_size: r._count.id,
  }));
}

/**
 * Cached version — revalidates every hour.
 */
export const getElasticityData = unstable_cache(
  _getElasticityData,
  ["elasticity"],
  { revalidate: 3600, tags: ["elasticity"] }
);
