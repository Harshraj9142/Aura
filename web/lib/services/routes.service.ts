/**
 * APIx Web — Routes Service
 *
 * Queries distinct tracked routes from the fares table
 * with first/last seen dates and record counts.
 */

import { prisma } from "@/lib/db/prisma";
import type { RouteInfo } from "@/types/fare";

/**
 * Get all distinct tracked routes with metadata.
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
    console.warn("Database error in getTrackedRoutes — returning fallback routes", error);
    return [
      { origin: "DEL", destination: "BOM", pair: "DEL-BOM", firstSeen: "", lastSeen: "", recordCount: 0 },
      { origin: "DEL", destination: "BLR", pair: "DEL-BLR", firstSeen: "", lastSeen: "", recordCount: 0 },
      { origin: "BOM", destination: "BLR", pair: "BOM-BLR", firstSeen: "", lastSeen: "", recordCount: 0 },
      { origin: "DEL", destination: "CCU", pair: "DEL-CCU", firstSeen: "", lastSeen: "", recordCount: 0 },
      { origin: "BLR", destination: "HYD", pair: "BLR-HYD", firstSeen: "", lastSeen: "", recordCount: 0 },
      { origin: "MAA", destination: "DEL", pair: "MAA-DEL", firstSeen: "", lastSeen: "", recordCount: 0 },
    ];
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
    return ["DEL-BOM", "DEL-BLR", "BOM-BLR", "DEL-CCU", "BLR-HYD", "MAA-DEL"];
  }
}
