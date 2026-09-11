/**
 * GET /api/fares/[id] — Single fare record
 *
 * Returns a single fare record by UUID, or 404 if not found.
 */

import { NextRequest, NextResponse } from "next/server";
import { getFareById } from "@/lib/services/fares.service";
import { ok, notFound, fail } from "@/lib/utils/apiResponse";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Basic UUID format check
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return fail("Invalid fare ID format", "VALIDATION_ERROR", 400);
    }

    const fare = await getFareById(id);
    if (!fare) {
      return notFound(`Fare with ID '${id}' not found`);
    }

    return ok(fare);
  } catch (error) {
    console.error("Error fetching fare:", error);
    return fail("Failed to fetch fare", "INTERNAL_ERROR", 500);
  }
}
