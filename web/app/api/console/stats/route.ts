/**
 * GET /api/console/stats — Comprehensive console statistics
 *
 * Returns source-wise breakdown, route-wise stats, time-series ingestion data,
 * and overall scraping health metrics from PostgreSQL.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Parallel queries for performance
    const [
      totalFares,
      faresToday,
      faresYesterday,
      outliersCount,
      sourceBreakdown,
      routeBreakdown,
      carrierBreakdown,
      latestFares,
      priceStats,
      hourlyIngestion,
    ] = await Promise.all([
      // Total count
      prisma.fare.count(),

      // Today's count
      prisma.fare.count({ where: { scraped_at: { gte: today } } }),

      // Yesterday's count
      prisma.fare.count({
        where: { scraped_at: { gte: yesterday, lt: today } },
      }),

      // Outlier count
      prisma.fare.count({ where: { is_outlier: true } }),

      // Source breakdown (group by source)
      prisma.fare.groupBy({
        by: ["source", "source_type"],
        _count: { id: true },
        _avg: { total_fare: true },
        _min: { total_fare: true },
        _max: { total_fare: true },
        orderBy: { _count: { id: "desc" } },
      }),

      // Route breakdown
      prisma.fare.groupBy({
        by: ["route_origin", "route_destination"],
        _count: { id: true },
        _avg: { total_fare: true },
        _min: { total_fare: true },
        _max: { total_fare: true },
        orderBy: { _count: { id: "desc" } },
      }),

      // Carrier breakdown
      prisma.fare.groupBy({
        by: ["carrier"],
        _count: { id: true },
        _avg: { total_fare: true },
        orderBy: { _count: { id: "desc" } },
        take: 15,
      }),

      // Latest 5 fares (for live feed)
      prisma.fare.findMany({
        orderBy: { scraped_at: "desc" },
        take: 5,
        select: {
          id: true,
          source: true,
          carrier: true,
          flight_number: true,
          route_origin: true,
          route_destination: true,
          total_fare: true,
          scraped_at: true,
        },
      }),

      // Overall price stats
      prisma.fare.aggregate({
        _avg: { total_fare: true },
        _min: { total_fare: true },
        _max: { total_fare: true },
        _count: { id: true },
        where: { is_outlier: false },
      }),

      // Hourly ingestion (last 24 hours) - raw query for time bucketing
      prisma.$queryRaw`
        SELECT 
          date_trunc('hour', scraped_at) as hour,
          COUNT(*)::int as count
        FROM fares
        WHERE scraped_at >= NOW() - INTERVAL '24 hours'
        GROUP BY date_trunc('hour', scraped_at)
        ORDER BY hour ASC
      `.catch(() => []),
    ]);

    // Format source breakdown
    const sources = sourceBreakdown.map((s) => ({
      name: s.source,
      type: s.source_type,
      count: s._count.id,
      avgFare: Math.round(Number(s._avg.total_fare) || 0),
      minFare: Math.round(Number(s._min.total_fare) || 0),
      maxFare: Math.round(Number(s._max.total_fare) || 0),
    }));

    // Format route breakdown
    const routes = routeBreakdown.map((r) => ({
      origin: r.route_origin,
      destination: r.route_destination,
      pair: `${r.route_origin}-${r.route_destination}`,
      count: r._count.id,
      avgFare: Math.round(Number(r._avg.total_fare) || 0),
      minFare: Math.round(Number(r._min.total_fare) || 0),
      maxFare: Math.round(Number(r._max.total_fare) || 0),
    }));

    // Format carrier breakdown
    const carriers = carrierBreakdown.map((c) => ({
      name: c.carrier,
      count: c._count.id,
      avgFare: Math.round(Number(c._avg.total_fare) || 0),
    }));

    // Format hourly ingestion
    const hourly = Array.isArray(hourlyIngestion)
      ? (hourlyIngestion as any[]).map((h) => ({
          hour: h.hour instanceof Date ? h.hour.toISOString() : String(h.hour),
          count: Number(h.count),
        }))
      : [];

    // Unique sources and routes count
    const uniqueSources = new Set(sourceBreakdown.map((s) => s.source)).size;
    const uniqueRoutes = routeBreakdown.length;
    const uniqueCarriers = carrierBreakdown.length;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalFares,
          faresToday,
          faresYesterday,
          outliersCount,
          outlierRate: totalFares > 0 ? ((outliersCount / totalFares) * 100).toFixed(2) : "0",
          uniqueSources,
          uniqueRoutes,
          uniqueCarriers,
          avgFare: Math.round(Number(priceStats._avg.total_fare) || 0),
          minFare: Math.round(Number(priceStats._min.total_fare) || 0),
          maxFare: Math.round(Number(priceStats._max.total_fare) || 0),
          growthRate: faresYesterday > 0
            ? (((faresToday - faresYesterday) / faresYesterday) * 100).toFixed(1)
            : "N/A",
        },
        sources,
        routes,
        carriers,
        latestFares: latestFares.map((f) => ({
          ...f,
          total_fare: Number(f.total_fare),
          scraped_at: f.scraped_at.toISOString(),
        })),
        hourlyIngestion: hourly,
      },
    });
  } catch (error: any) {
    console.error("Console stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch console stats" },
      { status: 500 }
    );
  }
}
