import sys
import asyncio
import time
from datetime import date, timedelta
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.settings import settings, get_source_by_name, get_enabled_routes
from main import load_scraper
from pipeline.cleaner import FareCleaner
from pipeline.deduplicator import Deduplicator
from pipeline.models import Route
from db.session import get_session

SOURCES_TO_RUN = ["easemytrip", "ixigo", "cleartrip"]
ADVANCE_DAYS = [7]

async def main():
    settings.headless = True
    routes = get_enabled_routes()
    cleaner = FareCleaner()
    
    total_extracted = 0
    total_saved = 0
    start_all = time.time()

    print(f"🚀 Running Fixed Sources Batch Probe ({len(SOURCES_TO_RUN)} sources × {len(routes)} routes)...")
    print("=" * 70)

    for source_name in SOURCES_TO_RUN:
        src_cfg = get_source_by_name(source_name)
        if not src_cfg:
            continue
        scraper = load_scraper(src_cfg)
        
        for r_cfg in routes:
            route = Route(origin=r_cfg["origin"], destination=r_cfg["destination"])
            for adv in ADVANCE_DAYS:
                t0 = time.time()
                travel_date = date.today() + timedelta(days=adv)
                try:
                    res = await scraper.scrape(route, travel_date, adv)
                    dt = time.time() - t0
                    if res.is_success and res.fares:
                        total_extracted += len(res.fares)
                        cleaned = cleaner.clean_batch(res.fares)
                        deduped = Deduplicator.deduplicate_in_memory(cleaned)
                        with get_session() as session:
                            saved_count = Deduplicator.upsert_fares(session, deduped)
                            total_saved += saved_count
                        print(f"✅ {source_name:<12} | {route.pair:<8} | T+{adv}d | {len(res.fares):>3} fares extracted | {saved_count:>3} saved | {dt:.1f}s")
                        
                        # Print sample individual fare quotes in console
                        for fare in res.fares[:3]:
                            carrier_str = fare.carrier or "Flight"
                            flight_str = fare.flight_number or "Direct"
                            base_str = f"₹{fare.base_fare:,.0f}" if fare.base_fare else "N/A"
                            tax_str = f"₹{fare.taxes_and_fees:,.0f}" if fare.taxes_and_fees else "N/A"
                            total_str = f"₹{fare.total_fare:,.0f}"
                            print(f"   ↳ ✈️ {carrier_str} ({flight_str:<7}) | Date: {travel_date} | Base: {base_str:>8} | Tax: {tax_str:>7} | Total: {total_str:>8}")
                    else:
                        print(f"⚠️ {source_name:<12} | {route.pair:<8} | T+{adv}d | Status: {res.status.value:<10} | {dt:.1f}s")
                except Exception as e:
                    dt = time.time() - t0
                    print(f"❌ {source_name:<12} | {route.pair:<8} | T+{adv}d | Error: {e} | {dt:.1f}s")

    print("=" * 70)
    print(f"🎉 Batch Probe Finished in {time.time() - start_all:.1f}s!")
    print(f"Total Fares Extracted: {total_extracted}")
    print(f"Total Fares Saved to DB: {total_saved}")

if __name__ == "__main__":
    asyncio.run(main())
