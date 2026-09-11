/**
 * GET /api/sources — List all tracked data sources
 *
 * Returns distinct sources (airlines/OTAs) with type and record count.
 */

import { NextResponse } from "next/server";
import { getTrackedSources } from "@/lib/services/sources.service";
import { ok, fail } from "@/lib/utils/apiResponse";

export async function GET(): Promise<NextResponse> {
  try {
    const sources = await getTrackedSources();
    return ok(sources);
  } catch (error) {
    console.error("Error fetching sources:", error);
    return fail("Failed to fetch sources", "INTERNAL_ERROR", 500);
  }
}
