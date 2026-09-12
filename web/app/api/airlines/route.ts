/**
 * GET /api/airlines — List all tracked airlines
 */

import { NextResponse } from "next/server";
import { ok } from "@/lib/utils/apiResponse";

const TRACKED_AIRLINES = [
  "IndiGo",
  "Air India",
  "SpiceJet",
  "Akasa Air",
  "Air India Express",
];

export async function GET(): Promise<NextResponse> {
  return ok(TRACKED_AIRLINES);
}
