/**
 * GET /api/index — Index time series data
 *
 * Returns index_values for charting, filtered by frequency and
 * optionally by route and date range.
 */

import { NextRequest, NextResponse } from "next/server";
import { getIndexTimeSeries } from "@/lib/services/index.service";
import { indexQuerySchema } from "@/lib/validators/index.schema";
import { ok, fail, validationError } from "@/lib/utils/apiResponse";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    const parsed = indexQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    const { frequency, origin, destination, dateFrom, dateTo } = parsed.data;
    const data = await getIndexTimeSeries(
      frequency,
      origin,
      destination,
      dateFrom,
      dateTo
    );

    return ok(data);
  } catch (error) {
    console.error("Error fetching index data:", error);
    return fail("Failed to fetch index data", "INTERNAL_ERROR", 500);
  }
}
