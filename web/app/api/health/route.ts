/**
 * GET /api/health — Health check endpoint
 *
 * Pings the database and returns connection status.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/utils/apiResponse";

export async function GET(): Promise<NextResponse> {
  try {
    // Attempt a simple query to verify DB connectivity
    await prisma.$queryRaw`SELECT 1`;

    return ok({
      status: "healthy",
      timestamp: new Date().toISOString(),
      dbConnected: true,
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    return fail(
      `Database connection failed: ${error.message || String(error)}`,
      "DB_ERROR",
      503
    );
  }
}
