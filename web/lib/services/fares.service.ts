/**
 * APIx Web — Fares Service
 *
 * Main data access layer for fare records. Supports full filtering,
 * pagination, and sorting. NOT cached — filters vary too much for
 * effective caching, and the underlying data changes daily.
 */

import { prisma } from "@/lib/db/prisma";
import type { Fare, PaginationMeta, DashboardStats } from "@/types/fare";
import type { FaresQueryInput } from "@/lib/validators/fares.schema";
import { Prisma } from "@prisma/client";

interface FaresResult {
  data: Fare[];
  pagination: PaginationMeta;
}

/**
 * Get paginated, filtered, sorted fare records.
 */
export async function getFares(filters: FaresQueryInput): Promise<FaresResult> {
  const page = filters.page || 1;
  const limit = filters.limit || 25;

  try {
    const where: Prisma.FareWhereInput = {};

    // Build WHERE clause from filters
    if (filters.origin) where.route_origin = filters.origin;
    if (filters.destination) where.route_destination = filters.destination;
    if (filters.source) where.source = filters.source;
    if (filters.sourceType) where.source_type = filters.sourceType;
    if (filters.isOutlier !== undefined) where.is_outlier = filters.isOutlier;

    // Advance purchase days filters
    if (filters.advanceDays !== undefined) {
      where.advance_purchase_days = filters.advanceDays;
    } else {
      if (filters.minAdvanceDays !== undefined || filters.maxAdvanceDays !== undefined) {
        where.advance_purchase_days = {};
        if (filters.minAdvanceDays !== undefined) {
          (where.advance_purchase_days as Prisma.IntFilter).gte = filters.minAdvanceDays;
        }
        if (filters.maxAdvanceDays !== undefined) {
          (where.advance_purchase_days as Prisma.IntFilter).lte = filters.maxAdvanceDays;
        }
      }
    }

    // Date range filters
    if (filters.dateFrom || filters.dateTo) {
      where.travel_date = {};
      if (filters.dateFrom) {
        (where.travel_date as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (where.travel_date as Prisma.DateTimeFilter).lte = new Date(filters.dateTo);
      }
    }

    // Count total for pagination
    const total = await prisma.fare.count({ where });

    // Build ORDER BY
    const orderBy: Prisma.FareOrderByWithRelationInput = {
      [filters.sortBy || "scraped_at"]: filters.sortOrder || "desc",
    };

    // Fetch page
    const skip = (page - 1) * limit;

    const records = await prisma.fare.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    const fares: Fare[] = records.map(mapFareRecord);

    return {
      data: fares,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error) {
    console.warn("Database query error in getFares — returning empty result", error);
    return {
      data: [],
      pagination: { page, limit, totalCount: 0, totalPages: 1 },
    };
  }
}

/**
 * Get a single fare record by ID.
 */
export async function getFareById(id: string): Promise<Fare | null> {
  try {
    const record = await prisma.fare.findUnique({ where: { id } });
    if (!record) return null;
    return mapFareRecord(record);
  } catch {
    return null;
  }
}

/**
 * Get dashboard overview stats.
 */
export async function getFareStats(): Promise<DashboardStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalFares, faresToday, outliersCount, lastRun] = await Promise.all([
      prisma.fare.count(),
      prisma.fare.count({ where: { scraped_at: { gte: today } } }),
      prisma.fare.count({ where: { is_outlier: true } }),
      prisma.scrapeRun.findFirst({ orderBy: { started_at: "desc" } }),
    ]);

    return {
      totalFares,
      faresToday,
      outliersCount,
      latestScrapeRun: lastRun
        ? {
            startedAt: lastRun.started_at.toISOString(),
            completedAt: lastRun.completed_at?.toISOString() ?? null,
            status: lastRun.status,
            totalSuccess: lastRun.total_success ?? 0,
            totalFailed: lastRun.total_failed ?? 0,
          }
        : null,
    };
  } catch (error) {
    console.warn("Database error in getFareStats — returning fallback stats", error);
    return {
      totalFares: 0,
      faresToday: 0,
      outliersCount: 0,
      latestScrapeRun: null,
    };
  }
}

/**
 * Map a Prisma fares record to our Fare interface.
 */
function mapFareRecord(record: any): Fare {
  return {
    id: record.id,
    route_origin: record.route_origin,
    route_destination: record.route_destination,
    travel_date: record.travel_date instanceof Date ? record.travel_date.toISOString().split("T")[0] : String(record.travel_date),
    advance_purchase_days: record.advance_purchase_days,
    source: record.source,
    source_type: record.source_type as "airline" | "ota",
    carrier: record.carrier,
    flight_number: record.flight_number,
    fare_class: record.fare_class,
    base_fare: record.base_fare ? Number(record.base_fare) : null,
    taxes_and_fees: record.taxes_and_fees ? Number(record.taxes_and_fees) : null,
    total_fare: Number(record.total_fare),
    currency: record.currency,
    is_outlier: record.is_outlier ?? false,
    validation_warnings: record.validation_warnings,
    scraped_at: record.scraped_at instanceof Date ? record.scraped_at.toISOString() : String(record.scraped_at),
    created_at: record.created_at instanceof Date ? record.created_at.toISOString() : String(record.created_at),
  };
}
