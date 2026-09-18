/**
 * GET /api/health/dashboard — Health & Telemetry Dashboard Endpoint
 *
 * Returns live operational health metrics, database latency, last scrape run status,
 * and aggregated error/anti-bot telemetry logs from PostgreSQL.
 * (Backend API endpoint only — no UI changes)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    // 1. Verify database latency
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    // 2. Fetch parallel health & telemetry stats using raw SQL
    const [
      totalFaresResult,
      faresTodayResult,
      latestRunResult,
      recentErrorsResult,
      recentBlocksResult,
    ] = await Promise.all([
      // Total stored fares
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int as count FROM fares
      `,

      // Fares collected today (UTC)
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int as count FROM fares 
        WHERE scraped_at >= CURRENT_DATE
      `,

      // Latest scrape run status
      prisma.$queryRaw<Array<{
        run_id: string;
        started_at: Date;
        completed_at: Date | null;
        total_attempted: number;
        total_success: number;
        total_failed: number;
        total_blocked: number;
        status: string;
      }>>`
        SELECT run_id::text, started_at, completed_at, total_attempted, 
               total_success, total_failed, total_blocked, status::text
        FROM scrape_runs
        ORDER BY started_at DESC
        LIMIT 1
      `,

      // 24-Hour error log summary grouped by source and status
      prisma.$queryRaw<Array<{
        source: string;
        status: string;
        error_type: string | null;
        count: number;
      }>>`
        SELECT source, status, error_type, COUNT(*)::int as count
        FROM scrape_error_logs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY source, status, error_type
        ORDER BY count DESC
        LIMIT 25
      `,

      // Most recent 5 error records with details
      prisma.$queryRaw<Array<{
        id: string;
        created_at: Date;
        source: string;
        route_origin: string;
        route_destination: string;
        advance_purchase_days: number;
        status: string;
        error_type: string | null;
        error_message: string | null;
        duration_seconds: number | null;
      }>>`
        SELECT id::text, created_at, source, route_origin, route_destination,
               advance_purchase_days, status, error_type, error_message, duration_seconds
        FROM scrape_error_logs
        ORDER BY created_at DESC
        LIMIT 5
      `,
    ]);

    const totalFares = totalFaresResult[0]?.count ?? 0;
    const faresToday = faresTodayResult[0]?.count ?? 0;
    const latestRun = latestRunResult[0] ?? null;

    return ok({
      system: {
        service: "Aura Airfare Intelligence Engine",
        status: "healthy",
        uptimeCheckedAt: new Date().toISOString(),
        database: {
          connected: true,
          latencyMs: dbLatencyMs,
          engine: "Neon Serverless PostgreSQL",
        },
      },
      dataVolume: {
        totalFares,
        faresToday,
      },
      latestScrapeRun: latestRun
        ? {
            runId: latestRun.run_id,
            status: latestRun.status,
            startedAt: latestRun.started_at,
            completedAt: latestRun.completed_at,
            attempted: latestRun.total_attempted,
            success: latestRun.total_success,
            failed: latestRun.total_failed,
            blocked: latestRun.total_blocked,
            successRatePct:
              latestRun.total_attempted > 0
                ? Math.round(
                    (latestRun.total_success / latestRun.total_attempted) * 100
                  )
                : 0,
          }
        : null,
      telemetry: {
        errorCountLast24h: recentErrorsResult.reduce(
          (acc, row) => acc + row.count,
          0
        ),
        breakdownBySourceAndStatus: recentErrorsResult,
        recentIncidents: recentBlocksResult,
      },
    });
  } catch (error: any) {
    console.error("Health dashboard endpoint error:", error);
    return fail(
      `Health dashboard query error: ${error.message || String(error)}`,
      "HEALTH_DASHBOARD_ERROR",
      500
    );
  }
}
