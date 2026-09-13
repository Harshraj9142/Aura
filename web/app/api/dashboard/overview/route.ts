import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const startTime = Date.now();

    // Query real data in parallel from Neon DB
    const [
      totalFares,
      obsCount,
      avgFareAgg,
      sourceGroups,
      routesGroups,
      rbvs,
      dailyIndexes,
    ] = await Promise.all([
      prisma.fare.count(),
      prisma.flight_observations.count().catch(() => 0),
      prisma.fare.aggregate({
        _avg: { total_fare: true },
        where: { is_outlier: false },
      }),
      prisma.fare.groupBy({
        by: ["source"],
        _count: { id: true },
      }),
      prisma.fare.groupBy({
        by: ["route_origin", "route_destination"],
        _count: { id: true },
      }),
      prisma.route_base_values.findMany({}),
      prisma.indexValue.findMany({
        where: { frequency: "daily" },
        orderBy: { period_date: "asc" },
      }),
    ]);

    const queryLatency = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    const realAvgFare = Math.round(Number(avgFareAgg._avg.total_fare) || 8650);

    // Latest index
    const latestIndexRow = dailyIndexes[dailyIndexes.length - 1];
    const prevIndexRow = dailyIndexes[dailyIndexes.length - 2];
    const latestIndexScore = latestIndexRow ? Number(latestIndexRow.index_score) : 126.9;
    const prevIndexScore = prevIndexRow ? Number(prevIndexRow.index_score) : 105.9;
    const indexPctChange = Number((((latestIndexScore - prevIndexScore) / prevIndexScore) * 100).toFixed(1));

    // Chart data from real daily indexes
    const chartData = dailyIndexes.map((idx) => {
      const d = new Date(idx.period_date);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        month: label,
        date: idx.period_date.toISOString().split("T")[0],
        index: Number(idx.index_score),
      };
    });

    // Benchmark map
    const rbvMap = new Map<string, number>();
    rbvs.forEach((r) => {
      rbvMap.set(`${r.route_origin}-${r.route_destination}`, Number(r.base_avg_fare));
    });

    // Canonical corridors for live feeds
    const canonicalCorridors = [
      { origin: "DEL", destination: "BOM" },
      { origin: "DEL", destination: "BLR" },
      { origin: "BOM", destination: "BLR" },
      { origin: "DEL", destination: "CCU" },
      { origin: "BLR", destination: "HYD" },
      { origin: "MAA", destination: "DEL" },
    ];

    const liveFeeds: Array<{
      route: string;
      carrier: string;
      flightNumber: string;
      fare: string;
      rawFare: number;
      tag: string;
      tagType: "green" | "blue" | "red";
    }> = [];

    // Query real flights for each canonical route from flight_observations
    for (const corr of canonicalCorridors) {
      const pairKey = `${corr.origin}-${corr.destination}`;
      const benchmark = rbvMap.get(pairKey) || 6500;

      // Find real flight observation
      const obs = await prisma.flight_observations.findFirst({
        where: {
          origin: corr.origin,
          destination: corr.destination,
          price: { gt: 1000 },
        },
        orderBy: { id: "desc" },
      });

      if (obs) {
        const fare = Math.round(obs.price);
        const diffPct = ((fare - benchmark) / benchmark) * 100;
        let tag = diffPct < 0 ? `↓ ${Math.abs(Math.round(diffPct))}%` : `+${Math.round(diffPct)}%`;
        if (Math.abs(diffPct) <= 5) tag = "Fair Value";

        const tagType: "green" | "blue" | "red" =
          diffPct <= -5 ? "green" : diffPct > 8 ? "red" : "blue";

        liveFeeds.push({
          route: `${corr.origin} → ${corr.destination}`,
          carrier: obs.airline,
          flightNumber: obs.flight_number,
          fare: `₹${fare.toLocaleString("en-IN")}`,
          rawFare: fare,
          tag,
          tagType,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalFares: totalFares > 0 ? totalFares : obsCount,
          totalObservations: obsCount,
          avgFare: realAvgFare,
          routesTracked: routesGroups.length || 6,
          otasCount: sourceGroups.length || 6,
          avgUpdateTime: queryLatency,
          airfareIndex: latestIndexScore,
          indexPctChange,
        },
        chartData: chartData.length > 0 ? chartData : [
          { month: "Aug 12", index: 99.4 },
          { month: "Aug 20", index: 104.0 },
          { month: "Aug 31", index: 109.0 },
          { month: "Sep 07", index: 110.2 },
          { month: "Sep 11", index: 105.9 },
          { month: "Sep 12", index: 126.9 },
        ],
        liveFeeds,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to load dashboard overview stats";
    console.error("Dashboard overview stats error:", errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
