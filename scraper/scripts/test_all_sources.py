"""
Diagnostic Script: Test each enabled source for DEL-BOM (T+7d) locally
"""

import asyncio
import sys
import time
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config.settings import settings, get_enabled_sources
from main import load_scraper
from pipeline.models import Route, ScrapeStatus

async def test_source(source_cfg, route: Route, travel_date: date, advance_days: int):
    name = source_cfg["name"]
    print(f"Testing {name}...", flush=True)
    t0 = time.time()
    try:
        scraper = load_scraper(source_cfg)
        res = await asyncio.wait_for(
            scraper.scrape(route, travel_date, advance_days),
            timeout=35.0
        )
        duration = round(time.time() - t0, 1)
        fares_count = len(res.fares) if res.fares else 0
        status = res.status.value if hasattr(res.status, "value") else str(res.status)
        return {
            "source": name,
            "status": "PASS" if fares_count > 0 else ("NO_FLIGHTS" if status == "no_flights" else status.upper()),
            "fares": fares_count,
            "duration": f"{duration}s",
            "error": res.error_message or "-"
        }
    except asyncio.TimeoutError:
        return {
            "source": name,
            "status": "TIMEOUT",
            "fares": 0,
            "duration": f"{round(time.time() - t0, 1)}s",
            "error": "Timed out after 35s"
        }
    except Exception as e:
        return {
            "source": name,
            "status": "ERROR",
            "fares": 0,
            "duration": f"{round(time.time() - t0, 1)}s",
            "error": str(e)[:60]
        }

async def main():
    settings.headless = True
    sources = get_enabled_sources()
    route = Route(origin="DEL", destination="BOM")
    advance_days = 7
    travel_date = date.today() + timedelta(days=advance_days)

    print(f"\n=======================================================")
    print(f"  DIAGNOSTIC TEST: ALL ENABLED SOURCES (DEL -> BOM, T+7d)")
    print(f"  Headless: True | Travel Date: {travel_date}")
    print(f"=======================================================\n")

    results = []
    for src in sources:
        res = await test_source(src, route, travel_date, advance_days)
        print(f"  -> {res['source']}: {res['status']} ({res['fares']} fares, {res['duration']})", flush=True)
        results.append(res)

    print("\n" + "="*70)
    print("FINAL SOURCE AUDIT SUMMARY:")
    print("="*70)
    table_data = [[r["source"], r["status"], r["fares"], r["duration"], r["error"]] for r in results]
    try:
        from tabulate import tabulate
        print(tabulate(table_data, headers=["Source", "Status", "Fares", "Duration", "Details"], tablefmt="grid"))
    except ImportError:
        for r in results:
            print(f"  {r['source']:<18} | {r['status']:<10} | {r['fares']:<6} | {r['duration']:<8} | {r['error']}")

if __name__ == "__main__":
    asyncio.run(main())
