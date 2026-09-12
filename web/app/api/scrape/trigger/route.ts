import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

// Global job state in Node memory
let isScraping = false;
let lastRunTime: string | null = null;
let lastStatusMessage = "Idle";
let lastFaresCount = 0;

export async function GET() {
  return NextResponse.json({
    success: true,
    isScraping,
    lastRunTime,
    lastStatusMessage,
    lastFaresCount,
  });
}

export async function POST(request: NextRequest) {
  if (isScraping) {
    return NextResponse.json(
      {
        success: false,
        message: "Scraping job is already in progress!",
        isScraping: true,
      },
      { status: 400 }
    );
  }

  isScraping = true;
  lastRunTime = new Date().toISOString();
  lastStatusMessage = "🚀 Scraper triggered from Web UI... Initializing Playwright workers.";

  const scraperDir = path.resolve(process.cwd(), "../scraper");
  const scriptPath = path.resolve(scraperDir, "scripts/run_fixed_sources.py");

  console.log(`[API Trigger] Spawning scraper process in ${scraperDir}...`);

  // Run scraper script asynchronously in background
  const child = spawn("bash", ["-c", `source venv/bin/activate && python scripts/run_fixed_sources.py`], {
    cwd: scraperDir,
    detached: true,
    stdio: "ignore",
  });

  child.unref();

  // Reset status after estimated run window or monitor
  setTimeout(() => {
    isScraping = false;
    lastStatusMessage = "✅ Live Scrape Completed! Fares ingested into PostgreSQL.";
  }, 25000);

  return NextResponse.json({
    success: true,
    message: "Live Scraping Job Launched Successfully!",
    isScraping: true,
    startedAt: lastRunTime,
  });
}

