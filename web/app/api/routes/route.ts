/**
 * GET /api/routes — List all tracked routes
 *
 * Returns distinct (origin, destination) pairs from the fares table
 * with first/last seen dates and record counts.
 */

import { NextResponse } from "next/server";
import { getTrackedRoutes } from "@/lib/services/routes.service";
import { ok, fail } from "@/lib/utils/apiResponse";

export async function GET(): Promise<NextResponse> {
  try {
    const routes = await getTrackedRoutes();
    return ok(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    return fail("Failed to fetch routes", "INTERNAL_ERROR", 500);
  }
}
