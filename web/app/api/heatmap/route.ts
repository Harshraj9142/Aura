/**
 * GET /api/heatmap — Route × Date fare heatmap data
 *
 * Returns average fares grouped by route and travel date.
 */

import { NextRequest, NextResponse } from "next/server";
import { getHeatmapData } from "@/lib/services/heatmap.service";
import { heatmapQuerySchema } from "@/lib/validators/heatmap.schema";
import { ok, fail, validationError } from "@/lib/utils/apiResponse";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    const parsed = heatmapQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    const data = await getHeatmapData(parsed.data.dateFrom, parsed.data.dateTo);
    return ok(data);
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return fail("Failed to fetch heatmap data", "INTERNAL_ERROR", 500);
  }
}
