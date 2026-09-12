"""
APIx Scraper — Full Sources Batch Probe

Runs ALL operational OTA and airline scrapers across all DGCA corridors
and all advance purchase windows. Saves everything to PostgreSQL.
"""

import sys
import asyncio
import time
from datetime import date, timedelta
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.settings import settings, get_source_by_name, get_enabled_routes, get_enabled_sources
from main import load_scraper
from pipeline.cleaner import FareCleaner
from pipeline.deduplicator import Deduplicator
from pipeline.models import Route
from db.session import get_session

# ── ALL OPERATIONAL SOURCES ──────────────────────────────────────────
# OTAs that work reliably
OTA_SOURCES = ["easemytrip", "ixigo", "cleartrip", "yatra", "makemytrip", "goibibo"]
# Airlines  
AIRLINE_SOURCES = ["indigo", "akasa", "spicejet", "air_india_express", "air_india"]
# Combined
ALL_SOURCES = OTA_SOURCES + AIRLINE_SOURCES

# Advance purchase windows to scrape
ADVANCE_DAYS = [1, 7, 15, 30]


async def scrape_source(source_name: str, routes, cleaner):
    """Scrape a single source across all routes and advance windows."""
    src_cfg = get_source_by_name(source_name)
    if not src_cfg:
        print(f"⚠️  Source '{source_name}' not found in config, skipping.")
        return 0, 0

    source_extracted = 0
    source_saved = 0

    try:
        scraper = load_scraper(src_cfg)
    except Exception as e:
        print(f"❌ Failed to load scraper for '{source_name}': {e}")
        return 0, 0

    for r_cfg in routes:
        route = Route(origin=r_cfg["origin"], destination=r_cfg["destination"])
        for adv in ADVANCE_DAYS:
            t0 = time.time()
            travel_date = date.today() + timedelta(days=adv)
            try:
                res = await scraper.scrape(route, travel_date, adv)
                dt = time.time() - t0
                if res.is_success and res.fares:
                    source_extracted += len(res.fares)
                    cleaned = cleaner.clean_batch(res.fares)
                    deduped = Deduplicator.deduplicate_in_memory(cleaned)
                    with get_session() as session:
                        saved_count = Deduplicator.upsert_fares(session, deduped)
                        source_saved += saved_count
                    print(f"  ✅ {source_name:<15} | {route.pair:<8} | T+{adv:>2}d | {len(res.fares):>3} extracted | {saved_count:>3} saved | {dt:.1f}s")
                    
                    # Print individual fare details
                    for fare in res.fares[:5]:  # Show first 5 per batch
                        carrier_str = fare.carrier or "Flight"
                        flight_str = fare.flight_number or "Direct"
                        total_str = f"₹{fare.total_fare:,.0f}"
                        print(f"     ↳ ✈️  {carrier_str[:20]:<20} ({flight_str:<12}) | {travel_date} | {total_str:>8}")
                    if len(res.fares) > 5:
                        print(f"     ↳ ... and {len(res.fares) - 5} more fares")
                else:
                    print(f"  ⚠️  {source_name:<15} | {route.pair:<8} | T+{adv:>2}d | Status: {res.status.value:<10} | {dt:.1f}s")
            except Exception as e:
                dt = time.time() - t0
                err_msg = str(e)[:80]
                print(f"  ❌ {source_name:<15} | {route.pair:<8} | T+{adv:>2}d | Error: {err_msg} | {dt:.1f}s")

    return source_extracted, source_saved


async def main():
    settings.headless = True
    routes = get_enabled_routes()
    cleaner = FareCleaner()
    
    total_extracted = 0
    total_saved = 0
    start_all = time.time()
    source_results = {}

    print("╔" + "═" * 78 + "╗")
    print("║  🚀 APIx FULL SOURCES BATCH PROBE                                          ║")
    print(f"║  Sources: {len(ALL_SOURCES)} | Routes: {len(routes)} | Windows: {len(ADVANCE_DAYS)} | " + 
          f"Total Jobs: {len(ALL_SOURCES) * len(routes) * len(ADVANCE_DAYS):<5}        ║")
    print("╚" + "═" * 78 + "╝")
    print()

    # ── OTA SOURCES ──────────────────────────────────────────────────
    print("━" * 80)
    print("📡 PHASE 1: OTA PLATFORMS (Online Travel Agencies)")
    print("━" * 80)
    
    for source_name in OTA_SOURCES:
        print(f"\n🔍 Starting: {source_name.upper()}")
        extracted, saved = await scrape_source(source_name, routes, cleaner)
        total_extracted += extracted
        total_saved += saved
        source_results[source_name] = {"extracted": extracted, "saved": saved}
        print(f"   📊 {source_name}: {extracted} extracted, {saved} saved to DB")

    # ── AIRLINE SOURCES ──────────────────────────────────────────────
    print()
    print("━" * 80)
    print("✈️  PHASE 2: DIRECT AIRLINE WEBSITES")
    print("━" * 80)
    
    for source_name in AIRLINE_SOURCES:
        print(f"\n🔍 Starting: {source_name.upper()}")
        extracted, saved = await scrape_source(source_name, routes, cleaner)
        total_extracted += extracted
        total_saved += saved
        source_results[source_name] = {"extracted": extracted, "saved": saved}
        print(f"   📊 {source_name}: {extracted} extracted, {saved} saved to DB")

    # ── FINAL SUMMARY ────────────────────────────────────────────────
    elapsed = time.time() - start_all
    print()
    print("╔" + "═" * 78 + "╗")
    print("║  📊 INGESTION SUMMARY                                                       ║")
    print("╠" + "═" * 78 + "╣")
    print(f"║  Total Fares Extracted: {total_extracted:<54}║")
    print(f"║  Total Saved to PostgreSQL: {total_saved:<50}║")
    print(f"║  Elapsed Time: {elapsed:.1f}s{' ' * (62 - len(f'{elapsed:.1f}s'))}║")
    print("╠" + "═" * 78 + "╣")
    print("║  SOURCE BREAKDOWN:                                                          ║")
    
    for src, res in source_results.items():
        status = "✅" if res["extracted"] > 0 else "❌"
        line = f"║  {status} {src:<18} | Extracted: {res['extracted']:<5} | Saved: {res['saved']:<5}"
        print(f"{line}{' ' * (79 - len(line))}║")
    
    print("╚" + "═" * 78 + "╝")

    # ── COMPUTE INDEX ────────────────────────────────────────────────
    print("\n" + "━" * 80)
    print("🧮 COMPUTING AIRFARE PRICE INDEX (APIx) MATHEMATICAL BREAKDOWN...")
    print("━" * 80)
    try:
        from index.base_period import BasePeriodManager
        from index.calculator import IndexCalculator
        from sqlalchemy import func, select
        from db.models import Fare

        base_mgr = BasePeriodManager()
        base_values = base_mgr.get_base_values()
        if not base_values:
            base_values = base_mgr.compute_and_store_base_values(force=False)

        with get_session() as session:
            stmt = (
                select(
                    Fare.route_origin,
                    Fare.route_destination,
                    func.avg(Fare.total_fare).label("avg_fare"),
                )
                .where(Fare.is_outlier == False)
                .group_by(Fare.route_origin, Fare.route_destination)
            )
            res = session.execute(stmt).all()
            current_fares = {f"{r[0]}-{r[1]}": float(r[2]) for r in res}

        calculator = IndexCalculator()
        calc_res = calculator.calculate_index(current_fares, base_values)

        if calc_res.index_score and calc_res.breakdown:
            print("📐 METHODOLOGY & FORMULAS:")
            print("   • Laspeyres Index (L): L = ∑ [w'ᵢ × (Pᵢ,ₜ / Pᵢ,₀) × 100]")
            print("   • Paasche Index (P):   P = ∑ [w'ᵢ × (Pᵢ,ₜ / Pᵢ,₀) × 100]")
            print("   • Fisher Ideal (APIx): APIx = √(L × P)")
            print(f"\n📊 ROUTE-BY-ROUTE BREAKDOWN:")
            print(f"   {'Route':<10} | {'Base P0':<10} | {'Current Pt':<12} | {'Relative Ri':<12} | {'Weight wi':<10} | {'Contrib Ci':<10}")
            print("   " + "-" * 75)
            for b in calc_res.breakdown:
                print(f"   {b.route:<10} | ₹{b.base_price:<9,.2f} | ₹{b.current_price:<11,.2f} | {b.price_relative:<11.2f}% | {b.normalized_weight*100:<9.1f}% | {b.weighted_contribution:<10.2f}")
            print("   " + "-" * 75)

            cpi_impact = (calc_res.index_score - 100.0) * 0.0042
            print(f"\n🎉 INDEX COMPOSITE SCORE:")
            print(f"   • Laspeyres: {calc_res.laspeyres_score}")
            print(f"   • Paasche:   {calc_res.paasche_score}")
            print(f"   • Fisher APIx: {calc_res.index_score} (Base Jan 2026 = 100.0)")
            print(f"   • Routes:    {calc_res.routes_included}/6")
            print(f"   • CPI Impact: +{cpi_impact:.3f}pp (Basket: 0.42%)")
    except Exception as e:
        print(f"⚠️  Index Calculation Note: {e}")

if __name__ == "__main__":
    asyncio.run(main())
