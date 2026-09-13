/**
 * POST /api/predict
 *
 * Runs the Champion v2 Gradient Boosting ML model to predict future flight airfare,
 * computes price horizon projections (+24h, +48h, +7d, +14d, +30d), and outputs
 * BUY_NOW / WAIT_AND_MONITOR recommendation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getFlightPrediction, logPrediction } from "@/lib/services/prediction.service";
import { ok, fail } from "@/lib/utils/apiResponse";
import { verifyApiAccess } from "@/lib/apiAuth";
import { FlightPredictionInput } from "@/lib/ml/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // If an API key header is provided (external developer API usage), verify it
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-api-key");
    if (authHeader || apiKeyHeader) {
      const user = await verifyApiAccess(request);
      if (!user) {
        return fail("Unauthorized - Invalid API Key", "UNAUTHORIZED", 401);
      }
    }

    const body = await request.json();

    if (!body.origin || !body.destination || !body.airline || body.currentPrice === undefined) {
      return fail(
        "Missing required fields: origin, destination, airline, currentPrice",
        "VALIDATION_ERROR",
        400
      );
    }

    const currentPrice = Number(body.currentPrice);
    if (isNaN(currentPrice) || currentPrice <= 0) {
      return fail("currentPrice must be a positive number", "VALIDATION_ERROR", 400);
    }

    const input: FlightPredictionInput = {
      origin: String(body.origin).toUpperCase().trim(),
      destination: String(body.destination).toUpperCase().trim(),
      airline: String(body.airline).trim(),
      departureTime: body.departureTime ? String(body.departureTime) : undefined,
      daysToDeparture: body.daysToDeparture !== undefined ? Number(body.daysToDeparture) : 7,
      currentPrice,
      stops: body.stops !== undefined ? Number(body.stops) : 0,
      durationMinutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) : 130,
    };

    const result = await getFlightPrediction(input);

    // Optionally log prediction asynchronously
    if (body.logToDb) {
      const flightSig = `${body.flightNumber || input.airline}_${input.origin}_${input.destination}_${input.departureTime || "TBD"}`;
      logPrediction(flightSig, result.predictedPrice, 24, result.modelVersion).catch((e) =>
        console.warn("Async log error:", e)
      );
    }

    return ok(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate flight prediction";
    console.error("Predict error:", err);
    return fail(message, "INFERENCE_ERROR", 500);
  }
}
