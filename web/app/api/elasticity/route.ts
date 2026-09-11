/**
 * GET /api/elasticity — Lead-time elasticity data
 *
 * Returns avg fare by advance_purchase_days for a specific route.
 * Both origin and destination are required.
 */

import { NextRequest, NextResponse } from "next/server";
import { getElasticityData } from "@/lib/services/elasticity.service";
import { elasticityQuerySchema } from "@/lib/validators/elasticity.schema";
import { ok, fail, validationError } from "@/lib/utils/apiResponse";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    const parsed = elasticityQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    const data = await getElasticityData(
      parsed.data.origin,
      parsed.data.destination
    );
    return ok(data);
  } catch (error) {
    console.error("Error fetching elasticity data:", error);
    return fail("Failed to fetch elasticity data", "INTERNAL_ERROR", 500);
  }
}
