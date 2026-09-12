/**
 * GET /api/predictions
 *
 * Returns recent logged predictions and model registry benchmark statistics.
 */

import { NextRequest, NextResponse } from "next/server";
import { getModelRegistryStats, getRecentPredictions } from "@/lib/services/prediction.service";
import { ok, fail } from "@/lib/utils/apiResponse";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const [recentPredictions, registryStats] = await Promise.all([
      getRecentPredictions(limit),
      getModelRegistryStats(),
    ]);

    return ok({
      models: registryStats,
      predictions: recentPredictions,
    });
  } catch (err: any) {
    console.error("Predictions API error:", err);
    return fail("Failed to retrieve predictions", "INTERNAL_ERROR", 500);
  }
}
