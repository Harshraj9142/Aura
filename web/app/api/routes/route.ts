/**
 * GET /api/routes — List all tracked routes
 *
 * Returns distinct (origin, destination) pairs from the fares table
 * with first/last seen dates, record counts, and city names.
 */

import { NextResponse } from "next/server";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { ok, fail } from "@/lib/utils/apiResponse";

const CITY_NAMES: Record<string, string> = {
  DEL: "Delhi",
  BOM: "Mumbai",
  BLR: "Bengaluru",
  CCU: "Kolkata",
  HYD: "Hyderabad",
  MAA: "Chennai",
};

export async function GET(): Promise<NextResponse> {
  try {
    const rawRoutes = await getTrackedRoutes();
    const enriched = rawRoutes.map((r: any) => ({
      ...r,
      code: r.pair || `${r.origin}-${r.destination}`,
      originCity: CITY_NAMES[r.origin] || r.origin,
      destinationCity: CITY_NAMES[r.destination] || r.destination,
    }));
    return ok(enriched);
  } catch (error) {
    console.error("Error fetching routes:", error);
    return fail("Failed to fetch routes", "INTERNAL_ERROR", 500);
  }
}
