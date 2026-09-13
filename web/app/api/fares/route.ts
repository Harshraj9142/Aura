/**
 * GET /api/fares — Main fare data endpoint
 *
 * Supports full filtering, pagination, and sorting via query params.
 * All params validated with Zod before use.
 */

import { NextRequest, NextResponse } from "next/server";
import { getFares } from "@/lib/services/fares.service";
import { faresQuerySchema } from "@/lib/validators/fares.schema";
import { ok, fail, validationError } from "@/lib/utils/apiResponse";
import { verifyApiAccess } from "@/lib/apiAuth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user via API Key or Session
    const user = await verifyApiAccess(request);
    if (!user) {
      return fail("Unauthorized - Missing or Invalid API Key", "UNAUTHORIZED", 401);
    }

    // Extract search params into a plain object
    const searchParams = request.nextUrl.searchParams;
    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    // Validate with Zod
    const parsed = faresQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    // Fetch filtered fares
    const result = await getFares(parsed.data);

    return ok(result.data, result.pagination);
  } catch (error) {
    console.error("Error fetching fares:", error);
    return fail("Failed to fetch fares", "INTERNAL_ERROR", 500);
  }
}
