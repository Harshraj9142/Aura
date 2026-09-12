/**
 * APIx Web — Routes Service
 *
 * Queries distinct tracked routes strictly from the database fares table
 * with first/last seen dates and record counts.
 */

import { prisma } from "@/lib/db/prisma";
import type { RouteInfo } from "@/types/fare";

/**
 * Get all distinct tracked routes with metadata.
 * Returns empty array if database has no records (Strict Database Mode).
 */
export async function getTrackedRoutes(): Promise<RouteInfo[]> {
  try {
    const routes = await prisma.fare.groupBy({
      by: ["route_origin", "route_destination"],
      _count: { id: true },
      _min: { scraped_at: true },
      _max: { scraped_at: true },
    });

    return routes.map((r: any) => ({
      origin: r.route_origin,
      destination: r.route_destination,
      pair: `${r.route_origin}-${r.route_destination}`,
      firstSeen: r._min.scraped_at?.toISOString() ?? "",
      lastSeen: r._max.scraped_at?.toISOString() ?? "",
      recordCount: r._count.id,
    }));
  } catch (error) {
    console.warn("Database error or empty table in getTrackedRoutes:", error);
    return [];
  }
}

/**
 * Get just the distinct route pairs as string array (for filter dropdowns).
 */
export async function getRouteOptions(): Promise<string[]> {
  try {
    const routes = await prisma.fare.groupBy({
      by: ["route_origin", "route_destination"],
    });

    return routes.map((r: any) => `${r.route_origin}-${r.route_destination}`);
  } catch {
    return [];
  }
}
