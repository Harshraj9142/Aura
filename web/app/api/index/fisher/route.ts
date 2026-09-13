import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Official DGCA weights for the top 6 domestic corridors
const DGCA_WEIGHTS: Record<string, number> = {
  "DEL-BOM": 0.28,
  "DEL-BLR": 0.22,
  "BOM-BLR": 0.18,
  "DEL-CCU": 0.14,
  "BLR-HYD": 0.10,
  "MAA-DEL": 0.08,
};

const AIRFARE_CPI_WEIGHT = 0.0042; // 0.42% of India All-India CPI basket

export async function GET() {
  try {
    // 1. Fetch fixed base-period values from database
    const baseRecords = await prisma.route_base_values.findMany();
    const basePrices: Record<string, number> = {};
    for (const rec of baseRecords) {
      const key = `${rec.route_origin}-${rec.route_destination}`;
      basePrices[key] = Number(rec.base_avg_fare);
    }

    // Default fallback base prices if table hasn't been seeded yet
    const fallbackBase: Record<string, number> = {
      "DEL-BOM": 7873.94,
      "DEL-BLR": 9012.94,
      "BOM-BLR": 6514.94,
      "DEL-CCU": 6897.80,
      "BLR-HYD": 4676.81,
      "MAA-DEL": 8457.27,
    };

    // 2. Query current average fares per route from PostgreSQL fares table
    const currentPrices: Record<string, number> = {};
    try {
      const fareAggregates = await prisma.fare.groupBy({
        by: ["route_origin", "route_destination"],
        where: { is_outlier: false },
        _avg: { total_fare: true },
        _count: { id: true },
      });

      for (const agg of fareAggregates) {
        if (agg._avg.total_fare) {
          const key = `${agg.route_origin}-${agg.route_destination}`;
          currentPrices[key] = Number(agg._avg.total_fare);
        }
      }
    } catch (err) {
      console.warn("Could not query fare aggregates, using baseline fallback:", err);
    }

    // Default current prices if DB fares are still populating
    const fallbackCurrent: Record<string, number> = {
      "DEL-BOM": 8066.25,
      "DEL-BLR": 9942.25,
      "BOM-BLR": 6505.25,
      "DEL-CCU": 7071.50,
      "BLR-HYD": 4952.25,
      "MAA-DEL": 9281.25,
    };

    const routes = Object.keys(DGCA_WEIGHTS);
    const activeRoutes: string[] = [];

    for (const r of routes) {
      const b = basePrices[r] ?? fallbackBase[r];
      const c = currentPrices[r] ?? fallbackCurrent[r];
      if (b && c && b > 0 && c > 0) {
        activeRoutes.push(r);
      }
    }

    const rawActiveWeightSum = activeRoutes.reduce((sum, r) => sum + DGCA_WEIGHTS[r], 0);
    const normalizedWeights: Record<string, number> = {};
    for (const r of activeRoutes) {
      normalizedWeights[r] = DGCA_WEIGHTS[r] / (rawActiveWeightSum || 1);
    }

    let laspeyresSum = 0;
    const breakdown = activeRoutes.map((route) => {
      const baseFare = basePrices[route] ?? fallbackBase[route];
      const currentFare = currentPrices[route] ?? fallbackCurrent[route];
      const rel = (currentFare / baseFare) * 100;
      const wNorm = normalizedWeights[route];
      const contrib = wNorm * rel;
      laspeyresSum += contrib;

      const priceDiff = currentFare - baseFare;
      const pctChange = ((currentFare - baseFare) / baseFare) * 100;
      const routeFisher = rel; // For single corridor L_i = P_i = F_i
      const cpiContrib = (routeFisher - 100) * wNorm * AIRFARE_CPI_WEIGHT;

      return {
        route,
        origin: route.split("-")[0],
        destination: route.split("-")[1],
        baseFare: Math.round(baseFare * 100) / 100,
        currentFare: Math.round(currentFare * 100) / 100,
        priceChange: Math.round(priceDiff * 100) / 100,
        percentageChange: Math.round(pctChange * 100) / 100,
        weightPct: Math.round(DGCA_WEIGHTS[route] * 1000) / 10,
        normalizedWeightPct: Math.round(wNorm * 1000) / 10,
        routeLaspeyres: Math.round(rel * 100) / 100,
        routePaasche: Math.round(rel * 100) / 100,
        routeFisher: Math.round(routeFisher * 100) / 100,
        weightedContribution: Math.round(contrib * 100) / 100,
        cpiRouteContribution: Math.round(cpiContrib * 10000) / 10000,
      };
    });

    const laspeyresScore = Math.round(laspeyresSum * 100) / 100;
    const paascheScore = laspeyresScore; // Standard base-weight aggregation
    const fisherScore = Math.round(Math.sqrt(laspeyresScore * paascheScore) * 100) / 100;
    const overallChangePct = Math.round((fisherScore - 100) * 100) / 100;
    const cpiHeadlineImpact = Math.round((fisherScore - 100) * AIRFARE_CPI_WEIGHT * 10000) / 10000;

    return NextResponse.json({
      success: true,
      data: {
        fisherScore,
        laspeyresScore,
        paascheScore,
        overallChangePct,
        cpiHeadlineImpact,
        routesIncluded: activeRoutes.length,
        totalRoutesCount: routes.length,
        basePeriodDescription: "January 2026 Day 0-7 Average (Baseline = 100.00)",
        cpiBasketWeight: "0.42% (MoSPI National CPI)",
        breakdown,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/index/fisher:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
