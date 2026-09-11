import asyncio
import sys
import argparse
from datetime import date, timedelta
from loguru import logger

from config.settings import settings, get_source_by_name
from main import load_scraper
from pipeline.models import Route, ScrapeStatus
from pipeline.cleaner import FareCleaner
from pipeline.deduplicator import Deduplicator
from db.session import get_session

async def debug_source(source_name: str, origin: str, destination: str, advance_days: int, headless: bool):
    settings.headless = headless
    source_cfg = get_source_by_name(source_name)
    if not source_cfg:
        logger.error(f"Source '{source_name}' not found in configuration!")
        return

    logger.info(f"--- DEBUGGING {source_name.upper()} (Headless={headless}) ---")
    scraper = load_scraper(source_cfg)
    route = Route(origin=origin, destination=destination)
    travel_date = date.today() + timedelta(days=advance_days)

    res = await scraper.scrape(route, travel_date, advance_days)
    logger.info(f"Status: {res.status.value}")
    logger.info(f"Fares Count: {len(res.fares)}")
    logger.info(f"Error Message: {res.error_message}")
    logger.info(f"Duration: {res.duration_seconds:.2f}s")

    if res.fares:
        print("\nFIRST 3 EXTRACTED FARES:")
        for f in res.fares[:3]:
            print(f"  Carrier: {f.carrier} | Flight: {f.flight_number} | Total: ₹{f.total_fare} | Base: {f.base_fare} | Taxes: {f.taxes_and_fees}")
        
        # Clean and save to DB
        cleaner = FareCleaner()
        cleaned = cleaner.clean_batch(res.fares)
        deduped = Deduplicator.deduplicate_in_memory(cleaned)
        with get_session() as session:
            count = Deduplicator.upsert_fares(session, deduped)
            print(f"\nSaved {count} records to database 'fares' table.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Name of source, e.g. spicejet, easemytrip")
    parser.add_argument("--origin", default="DEL")
    parser.add_argument("--destination", default="BOM")
    parser.add_argument("--advance", type=int, default=7)
    parser.add_argument("--headless", action="store_true", default=False)
    args = parser.parse_args()

    asyncio.run(debug_source(args.source, args.origin, args.destination, args.advance, args.headless))
