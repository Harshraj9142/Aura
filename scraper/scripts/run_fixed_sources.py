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
                        for fare in res.fares:
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

    # Compute and log detailed index score calculation
    print("\n" + "=" * 70)
    print("🧮 COMPUTING AIRFARE PRICE INDEX (APIx) MATHEMATICAL BREAKDOWN...")
    print("=" * 70)
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
            print("\n📊 ROUTE-BY-ROUTE CALCULATED BREAKDOWN:")
            print(f"   {'Route':<10} | {'Base P0':<10} | {'Current Pt':<12} | {'Relative Ri':<12} | {'Weight wi':<10} | {'Contrib Ci':<10}")
            print("   " + "-" * 75)
            for b in calc_res.breakdown:
                print(f"   {b.route:<10} | ₹{b.base_price:<9,.2f} | ₹{b.current_price:<11,.2f} | {b.price_relative:<11.2f}% | {b.normalized_weight*100:<9.1f}% | {b.weighted_contribution:<10.2f}")
            print("   " + "-" * 75)

            cpi_impact = (calc_res.index_score - 100.0) * 0.0042
            print(f"\n🎉 INDEX COMPOSITE SCORE SUMMARY:")
            print(f"   • Laspeyres Index Score (L): {calc_res.laspeyres_score}")
            print(f"   • Paasche Index Score (P):   {calc_res.paasche_score}")
            print(f"   • Fisher Ideal APIx Score:  {calc_res.index_score} (Base Jan 2026 = 100.0)")
            print(f"   • Active DGCA Routes:       {calc_res.routes_included}/6")
            print(f"   • CPI Inflation Impact:     +{cpi_impact:.3f} percentage points (Basket weight: 0.42%)")
    except Exception as e:
        print(f"⚠️ Index Calculation Note: {e}")

if __name__ == "__main__":
    asyncio.run(main())
