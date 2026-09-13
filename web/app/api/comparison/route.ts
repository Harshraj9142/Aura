/**
 * GET /api/comparison — Platform Airfare Comparison Endpoint
 *
 * Compares flight fares across direct airline portals and OTAs
 * (MakeMyTrip, EaseMyTrip, Cleartrip, Ixigo, etc.) using strictly verified database records.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPlatformComparisons } from "@/lib/services/comparison.service";
import { ok, fail } from "@/lib/utils/apiResponse";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;

    const origin = searchParams.get("origin") || undefined;
    const destination = searchParams.get("destination") || undefined;
    const travelDate = searchParams.get("travelDate") || undefined;
    const carrier = searchParams.get("carrier") || undefined;
    const advanceDaysRaw = searchParams.get("advanceDays");
    const advanceDays = advanceDaysRaw ? parseInt(advanceDaysRaw, 10) : undefined;
    const minSpreadRaw = searchParams.get("minSpread");
    const minSpread = minSpreadRaw ? parseFloat(minSpreadRaw) : undefined;

    const result = await getPlatformComparisons({
      origin,
      destination,
      travelDate,
      carrier,
      advanceDays: !isNaN(advanceDays as number) ? advanceDays : undefined,
      minSpread: !isNaN(minSpread as number) ? minSpread : undefined,
    });

    return ok(result);
  } catch (error) {
    console.error("Error in GET /api/comparison:", error);
    return fail("Failed to fetch platform comparison data", "INTERNAL_ERROR", 500);
  }
}
