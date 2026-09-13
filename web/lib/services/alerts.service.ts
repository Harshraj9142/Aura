/**
 * APIx Web — Anomaly & Surge Alert Engine
 * 
 * Analyzes live scraped fares & index data to detect abnormal price surges,
 * festival demand spikes, and route level volatility.
 */

import { prisma } from "@/lib/db/prisma";

export interface SurgeAlert {
  id: string;
  route: string;
  type: "FESTIVAL_SURGE" | "LAST_MINUTE_SPIKE" | "VOLATILITY_WARNING";
  severity: "HIGH" | "MEDIUM" | "INFO";
  title: string;
  message: string;
  scrapedAt: string;
  surgePct: number;
}

export async function getActiveSurgeAlerts(): Promise<SurgeAlert[]> {
  try {
    const alerts: SurgeAlert[] = [];

    // Query recent fare averages grouped by route
    const routeAvgFares = await prisma.fare.groupBy({
      by: ["route_origin", "route_destination"],
      where: { is_outlier: false },
      _avg: { total_fare: true },
      _max: { total_fare: true },
      _count: { id: true },
    });

    const baseValues = await prisma.route_base_values.findMany();
    const baseMap = new Map<string, number>(
      baseValues.map((b: any) => [`${b.route_origin}-${b.route_destination}`, Number(b.base_avg_fare)])
    );

    for (const r of routeAvgFares) {
      const pair = `${r.route_origin}-${r.route_destination}`;
      const avgFare = Number(r._avg.total_fare ?? 0);
      const maxFare = Number(r._max.total_fare ?? 0);
      const baseFare = baseMap.get(pair);

      if (baseFare !== undefined && baseFare > 0) {
        const surgePct = Math.round(((avgFare - baseFare) / baseFare) * 100);

        if (surgePct >= 20) {
          alerts.push({
            id: `alert-${pair}-surge`,
            route: pair,
            type: "FESTIVAL_SURGE",
            severity: surgePct >= 40 ? "HIGH" : "MEDIUM",
            title: `Dynamic Price Surge Detected on ${pair}`,
            message: `Average fare of ₹${avgFare.toLocaleString("en-IN")} is ${surgePct}% higher than baseline (₹${baseFare.toLocaleString("en-IN")}). Peak fare reached ₹${maxFare.toLocaleString("en-IN")}.`,
            scrapedAt: new Date().toISOString(),
            surgePct,
          });
        }
      }
    }

    return alerts.sort((a, b) => b.surgePct - a.surgePct);
  } catch (error) {
    console.error("Error generating surge alerts:", error);
    return [];
  }
}
