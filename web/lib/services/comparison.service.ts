/**
 * APIx Web — Platform Comparison Service
 *
 * Compares airfares between Airline Direct platforms (IndiGo, Air India, etc.)
 * and Online Travel Agencies (EaseMyTrip, Cleartrip, Ixigo, MakeMyTrip).
 *
 * STRICT DATABASE MODE: Queries existing verified records from PostgreSQL/Prisma.
 */

import { prisma } from "@/lib/db/prisma";
import type {
  ComparisonDataResponse,
  FlightComparisonGroup,
  PlatformPriceEntry,
  PlatformStat,
  ComparisonSummary,
} from "@/types/comparison";
import { Prisma } from "@prisma/client";

export interface ComparisonFilters {
  origin?: string;
  destination?: string;
  travelDate?: string;
  carrier?: string;
  advanceDays?: number;
  minSpread?: number;
  timeOfDay?: "any" | "morning" | "afternoon" | "evening" | "night";
}

/**
 * Clean and normalize flight numbers for matching across sources.
 * Example: "6E-261 (11:20)" -> { clean: "6E261", display: "6E-261", time: "11:20" }
 */
export function parseFlightNumber(raw?: string | null): {
  clean: string;
  display: string;
  time?: string;
} {
  if (!raw || !raw.trim()) {
    return { clean: "UNKNOWN", display: "Unknown" };
  }

  const str = raw.trim();
  const timeMatch = str.match(/\(([^)]+)\)/);
  const time = timeMatch ? timeMatch[1].trim() : undefined;

  const withoutTime = str.replace(/\s*\(.*?\)/, "").trim();
  const clean = withoutTime.replace(/[-\s]/g, "").toUpperCase();

  return {
    clean,
    display: withoutTime || str,
    time,
  };
}

/**
 * Resolve airline name if missing or generic in raw scraped data
 */
export function resolveCarrierName(carrier?: string | null, flightNumber?: string | null): string {
  const c = (carrier || "").trim().toLowerCase();
  const fn = (flightNumber || "").trim().toUpperCase();

  if (c.includes("indigo") || fn.startsWith("6E")) return "IndiGo";
  if (c.includes("air india express") || fn.startsWith("IX")) return "Air India Express";
  if (c.includes("air india") || fn.startsWith("AI")) return "Air India";
  if (c.includes("akasa") || fn.startsWith("QP")) return "Akasa Air";
  if (c.includes("spicejet") || fn.startsWith("SG")) return "SpiceJet";
  if (c.includes("vistara") || fn.startsWith("UK")) return "Vistara";

  if (carrier && !c.includes("free meals") && !c.includes("airline")) {
    return carrier.trim();
  }
  return "Unknown Carrier";
}

/**
 * Fetch and aggregate platform price comparisons strictly from the database.
 */
export async function getPlatformComparisons(
  filters: ComparisonFilters = {}
): Promise<ComparisonDataResponse> {
  try {
    const where: Prisma.FareWhereInput = {
      is_outlier: false,
    };

    if (filters.origin) where.route_origin = filters.origin;
    if (filters.destination) where.route_destination = filters.destination;
    if (filters.advanceDays !== undefined && !isNaN(filters.advanceDays)) {
      where.advance_purchase_days = filters.advanceDays;
    }

    if (filters.travelDate) {
      const parsedDate = new Date(filters.travelDate);
      if (!isNaN(parsedDate.getTime())) {
        where.travel_date = parsedDate;
      }
    }

    // Fetch matching fares from database
    const records = await prisma.fare.findMany({
      where,
      orderBy: [{ travel_date: "asc" }, { total_fare: "asc" }],
      select: {
        id: true,
        route_origin: true,
        route_destination: true,
        travel_date: true,
        advance_purchase_days: true,
        source: true,
        source_type: true,
        carrier: true,
        flight_number: true,
        base_fare: true,
        taxes_and_fees: true,
        total_fare: true,
        currency: true,
        scraped_at: true,
      },
    });

    // Group by unique flight signature: Origin + Dest + TravelDate + CleanFlightNumber
    const flightMap = new Map<string, typeof records>();

    for (const record of records) {
      const { clean } = parseFlightNumber(record.flight_number);
      if (!clean || clean === "UNKNOWN") continue;

      const dateStr = record.travel_date.toISOString().split("T")[0];
      const key = `${record.route_origin}_${record.route_destination}_${dateStr}_${clean}`;

      if (!flightMap.has(key)) {
        flightMap.set(key, []);
      }
      flightMap.get(key)!.push(record);
    }

    const comparedFlights: FlightComparisonGroup[] = [];
    const platformCounters = new Map<
      string,
      {
        sourceType: "airline" | "ota";
        appearances: number;
        bestPriceCount: number;
        fareSum: number;
        minFare: number;
        maxFare: number;
      }
    >();

    // Process flight groups
    for (const [flightKey, fares] of flightMap.entries()) {
      // De-duplicate sources in same group (if scraped multiple times, pick lowest or latest)
      const platformMap = new Map<string, (typeof fares)[0]>();
      for (const f of fares) {
        const existing = platformMap.get(f.source);
        if (!existing || Number(f.total_fare) < Number(existing.total_fare)) {
          platformMap.set(f.source, f);
        }
      }

      const uniqueFares = Array.from(platformMap.values());
      // Only consider comparison if there are 2 or more distinct platforms
      if (uniqueFares.length < 2) continue;

      const firstRecord = uniqueFares[0];
      const { clean, display, time } = parseFlightNumber(firstRecord.flight_number);
      const carrierName = resolveCarrierName(firstRecord.carrier, firstRecord.flight_number);

      // Carrier filter if specified
      if (
        filters.carrier &&
        !carrierName.toLowerCase().includes(filters.carrier.toLowerCase())
      ) {
        continue;
      }

      // Time of day filter (morning: 05:00-11:59, afternoon: 12:00-17:59, evening: 18:00-23:59, night: 00:00-04:59)
      if (filters.timeOfDay && filters.timeOfDay !== "any" && time) {
        const hour = parseInt(time.split(":")[0], 10);
        if (!isNaN(hour)) {
          if (filters.timeOfDay === "morning" && (hour < 5 || hour >= 12)) continue;
          if (filters.timeOfDay === "afternoon" && (hour < 12 || hour >= 18)) continue;
          if (filters.timeOfDay === "evening" && (hour < 18 || hour >= 24)) continue;
          if (filters.timeOfDay === "night" && hour >= 5) continue;
        }
      }

      const dateStr = firstRecord.travel_date.toISOString().split("T")[0];

      // Determine baseline airline direct price if present
      const directRecord = uniqueFares.find((f) => f.source_type === "airline");
      const directPrice = directRecord ? Number(directRecord.total_fare) : null;

      // Find lowest fare in this flight group
      let minFare = Infinity;
      let maxFare = -Infinity;
      let bestSource = "";
      let bestSourceType: "airline" | "ota" = "airline";

      for (const f of uniqueFares) {
        const fareVal = Number(f.total_fare);
        if (fareVal < minFare) {
          minFare = fareVal;
          bestSource = f.source;
          bestSourceType = f.source_type as "airline" | "ota";
        }
        if (fareVal > maxFare) {
          maxFare = fareVal;
        }
      }

      const spreadAmount = maxFare - minFare;
      const spreadPercent = minFare > 0 ? Number(((spreadAmount / minFare) * 100).toFixed(1)) : 0;

      // Filter by minSpread if requested
      if (filters.minSpread !== undefined && spreadAmount < filters.minSpread) {
        continue;
      }

      const platformEntries: PlatformPriceEntry[] = uniqueFares.map((f) => {
        const fareVal = Number(f.total_fare);
        const isBest = fareVal === minFare;
        const diffFromDirect = directPrice != null ? fareVal - directPrice : null;
        const pctFromDirect =
          directPrice != null && directPrice > 0
            ? Number(((diffFromDirect! / directPrice) * 100).toFixed(1))
            : null;

        return {
          source: f.source,
          sourceType: f.source_type as "airline" | "ota",
          totalFare: fareVal,
          baseFare: f.base_fare != null ? Number(f.base_fare) : null,
          taxesAndFees: f.taxes_and_fees != null ? Number(f.taxes_and_fees) : null,
          currency: f.currency,
          isBestPrice: isBest,
          differenceFromDirect: diffFromDirect,
          percentFromDirect: pctFromDirect,
        };
      });

      // Sort platform entries so best price is first, then by price asc
      platformEntries.sort((a, b) => a.totalFare - b.totalFare);

      comparedFlights.push({
        flightKey,
        routeOrigin: firstRecord.route_origin,
        routeDestination: firstRecord.route_destination,
        travelDate: dateStr,
        advancePurchaseDays: firstRecord.advance_purchase_days,
        carrier: carrierName,
        flightNumber: display,
        cleanFlightNumber: clean,
        departureTime: time,
        bestPrice: minFare,
        bestPlatform: bestSource,
        bestSourceType,
        maxPrice: maxFare,
        spreadAmount,
        spreadPercent,
        hasAirlineDirect: directPrice != null,
        directPrice,
        platforms: platformEntries,
      });

      // Track platform analytics
      for (const entry of platformEntries) {
        const stat = platformCounters.get(entry.source) || {
          sourceType: entry.sourceType,
          appearances: 0,
          bestPriceCount: 0,
          fareSum: 0,
          minFare: Infinity,
          maxFare: -Infinity,
        };

        stat.appearances += 1;
        stat.fareSum += entry.totalFare;
        if (entry.isBestPrice) stat.bestPriceCount += 1;
        if (entry.totalFare < stat.minFare) stat.minFare = entry.totalFare;
        if (entry.totalFare > stat.maxFare) stat.maxFare = entry.totalFare;

        platformCounters.set(entry.source, stat);
      }
    }

    // Sort compared flights by highest spread amount first to highlight biggest savings
    comparedFlights.sort((a, b) => b.spreadAmount - a.spreadAmount);

    // Compute Summary Stats
    const totalFlightsCompared = comparedFlights.length;
    let totalSpreadSum = 0;
    let totalSpreadPctSum = 0;
    let maxSpreadFlight: ComparisonSummary["maxSpreadFlight"] = null;

    for (const cf of comparedFlights) {
      totalSpreadSum += cf.spreadAmount;
      totalSpreadPctSum += cf.spreadPercent;
      if (!maxSpreadFlight || cf.spreadAmount > maxSpreadFlight.spread) {
        maxSpreadFlight = {
          route: `${cf.routeOrigin} → ${cf.routeDestination}`,
          carrier: cf.carrier,
          flightNumber: cf.flightNumber,
          spread: cf.spreadAmount,
        };
      }
    }

    const avgSpreadAmount =
      totalFlightsCompared > 0 ? Math.round(totalSpreadSum / totalFlightsCompared) : 0;
    const avgSpreadPercent =
      totalFlightsCompared > 0
        ? Number((totalSpreadPctSum / totalFlightsCompared).toFixed(1))
        : 0;

    const platformStats: PlatformStat[] = Array.from(platformCounters.entries())
      .map(([source, data]) => ({
        source,
        sourceType: data.sourceType,
        appearances: data.appearances,
        bestPriceCount: data.bestPriceCount,
        winRate:
          data.appearances > 0
            ? Number(((data.bestPriceCount / data.appearances) * 100).toFixed(1))
            : 0,
        avgFare:
          data.appearances > 0 ? Math.round(data.fareSum / data.appearances) : 0,
        minFare: data.minFare === Infinity ? 0 : data.minFare,
        maxFare: data.maxFare === -Infinity ? 0 : data.maxFare,
      }))
      .sort((a, b) => b.winRate - a.winRate);

    // Group carrier stats
    const carrierMap = new Map<string, { totalSpread: number; count: number }>();
    for (const cf of comparedFlights) {
      const c = carrierMap.get(cf.carrier) || { totalSpread: 0, count: 0 };
      c.totalSpread += cf.spreadAmount;
      c.count += 1;
      carrierMap.set(cf.carrier, c);
    }

    const carrierStats = Array.from(carrierMap.entries()).map(([carrier, data]) => ({
      carrier,
      avgSpread: Math.round(data.totalSpread / data.count),
      flightCount: data.count,
    }));

    const summary: ComparisonSummary = {
      totalFlightsCompared,
      totalPlatformsTracked: platformStats.length,
      avgSpreadAmount,
      avgSpreadPercent,
      maxSpreadFlight,
      platformStats,
      carrierStats,
    };

    // Extract available filters from raw data
    const routeCounter = new Map<string, { origin: string; destination: string; count: number }>();
    const carrierSet = new Set<string>();
    const dateSet = new Set<string>();

    for (const cf of comparedFlights) {
      const pair = `${cf.routeOrigin}-${cf.routeDestination}`;
      const rc = routeCounter.get(pair) || {
        origin: cf.routeOrigin,
        destination: cf.routeDestination,
        count: 0,
      };
      rc.count += 1;
      routeCounter.set(pair, rc);

      carrierSet.add(cf.carrier);
      dateSet.add(cf.travelDate);
    }

    return {
      summary,
      flights: comparedFlights,
      availableRoutes: Array.from(routeCounter.values()).sort((a, b) => b.count - a.count),
      availableCarriers: Array.from(carrierSet).sort(),
      availableDates: Array.from(dateSet).sort(),
    };
  } catch (error) {
    console.error("Error in getPlatformComparisons service:", error);
    return {
      summary: {
        totalFlightsCompared: 0,
        totalPlatformsTracked: 0,
        avgSpreadAmount: 0,
        avgSpreadPercent: 0,
        platformStats: [],
        carrierStats: [],
      },
      flights: [],
      availableRoutes: [],
      availableCarriers: [],
      availableDates: [],
    };
  }
}
