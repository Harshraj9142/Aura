/**
 * APIx Web — Sources Service
 *
 * Queries distinct data sources (airlines/OTAs) strictly from the fares table.
 */

import { prisma } from "@/lib/db/prisma";
import type { SourceInfo } from "@/types/fare";

/**
 * Get all distinct tracked sources with record counts.
 * Returns empty array if database has no records (Strict Database Mode).
 */
export async function getTrackedSources(): Promise<SourceInfo[]> {
  try {
    const sources = await prisma.fare.groupBy({
      by: ["source", "source_type"],
      _count: { id: true },
    });

    return sources.map((s: any) => ({
      source: s.source,
      sourceType: s.source_type as "airline" | "ota",
      recordCount: s._count.id,
    }));
  } catch {
    return [];
  }
}

/**
 * Get just the distinct source names as string array (for filter dropdowns).
 */
export async function getSourceOptions(): Promise<string[]> {
  try {
    const sources = await prisma.fare.groupBy({
      by: ["source"],
    });

    return sources.map((s: any) => s.source);
  } catch {
    return [];
  }
}
