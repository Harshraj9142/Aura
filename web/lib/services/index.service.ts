/**
 * APIx Web — Index Service
 *
 * Reads from the index_values table (populated by the Python scraper's
 * index calculation module). Gracefully falls back if the table
 * doesn't exist yet.
 *
 * Wrapped with unstable_cache — revalidates hourly.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { IndexValue, IndexFrequency } from "@/types/fare";

/**
 * Get index time series data.
 *
 * @param frequency - daily, weekly, or monthly
 * @param origin - Optional route filter
 * @param destination - Optional route filter
 * @param dateFrom - Start of date range
 * @param dateTo - End of date range
 */
async function _getIndexTimeSeries(
  frequency: IndexFrequency = "daily",
  origin?: string,
  destination?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<IndexValue[]> {
  try {
    const where: Record<string, unknown> = { frequency };

    if (origin) where.origin = origin;
    if (destination) where.destination = destination;

    if (dateFrom || dateTo) {
      where.period_date = {};
      if (dateFrom) (where.period_date as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.period_date as Record<string, Date>).lte = new Date(dateTo);
    }

    const records = await prisma.indexValue.findMany({
      where,
      orderBy: { period_date: "asc" },
    });

    return records.map((r: any) => ({
      id: r.id,
      date: r.period_date instanceof Date ? r.period_date.toISOString().split("T")[0] : String(r.period_date),
      origin: r.origin,
      destination: r.destination,
      frequency: r.frequency as IndexFrequency,
      index_value: Number(r.index_score),
      pct_change: r.pct_change != null ? Number(r.pct_change) : null,
      created_at: r.computed_at instanceof Date ? r.computed_at.toISOString() : String(r.computed_at),
    }));
  } catch {
    // index_values table may not exist yet — return empty array
    console.warn(
      "index_values table not available — returning empty time series"
    );
    return [];
  }
}

/**
 * Cached version — revalidates every hour.
 */
export const getIndexTimeSeries = unstable_cache(
  _getIndexTimeSeries,
  ["index"],
  { revalidate: 3600, tags: ["index"] }
);
