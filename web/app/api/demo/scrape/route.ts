/**
 * POST /api/demo/scrape — Scraper execution status
 *
 * Strict Database Mode: Does not insert fake records.
 * Informs the user on triggering the real Python scraper CLI.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/utils/apiResponse";

export async function POST(): Promise<NextResponse> {
  try {
    const latestRun = await prisma.scrapeRun.findFirst({
      orderBy: { started_at: "desc" },
    });

    const totalFares = await prisma.fare.count();

    return ok({
      status: latestRun?.status || "idle",
      sourcesScanned: 0,
      routesProcessed: 0,
      recordsCollected: totalFares,
      validRecords: totalFares,
      recordsInserted: 0,
      message: totalFares > 0
        ? `Database contains ${totalFares} scraped records. To trigger a live scrape run, execute: python main.py --run-now in the scraper directory.`
        : "Database is currently empty. Run: python main.py --run-now in the scraper directory to scrape live fare records.",
    });
  } catch (error: any) {
    return ok({
      status: "idle",
      sourcesScanned: 0,
      routesProcessed: 0,
      recordsCollected: 0,
      validRecords: 0,
      recordsInserted: 0,
      message: "To run the scraper, execute: python main.py --run-now in the scraper directory.",
    });
  }
}
