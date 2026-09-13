"""
APIx Scraper — Full Sources Batch Probe

Runs ALL operational OTA and airline scrapers across all DGCA corridors
and all advance purchase windows with an executive Rich CLI interface.
Saves all deduplicated and validated airfares directly to Neon PostgreSQL.
"""

import sys
import asyncio
import time
from datetime import date, timedelta
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import settings, get_source_by_name, get_enabled_routes
from main import load_scraper
from pipeline.cleaner import FareCleaner
from pipeline.deduplicator import Deduplicator
from pipeline.models import Route
from db.session import get_session
from cli.console_ui import (
    console,
    print_banner,
    print_probe_config,
    print_flight_batch,
    print_ingestion_summary_table,
    print_index_table,
)

# ── ALL OPERATIONAL SOURCES ──────────────────────────────────────────
OTA_SOURCES = ["easemytrip", "ixigo", "cleartrip", "yatra", "makemytrip", "goibibo"]
AIRLINE_SOURCES = ["indigo", "akasa", "spicejet", "air_india_express", "air_india"]
ALL_SOURCES = OTA_SOURCES + AIRLINE_SOURCES

# Advance purchase windows to scrape
ADVANCE_DAYS = [1, 7, 15, 30]


async def scrape_source(source_name: str, routes, cleaner):
    """Scrape a single source across all routes and advance windows."""
    src_cfg = get_source_by_name(source_name)
    if not src_cfg:
        console.print(f"[bold yellow]⚠️  Source '{source_name}' not found in config, skipping.[/]")
        return 0, 0

    source_extracted = 0
    source_saved = 0

    try:
        scraper = load_scraper(src_cfg)
    except Exception as e:
        console.print(f"[bold red]❌ Failed to load scraper for '{source_name}': {e}[/]")
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

                    print_flight_batch(
                        source_name=source_name,
                        route_pair=route.pair,
                        advance_day=adv,
                        extracted_count=len(res.fares),
                        saved_count=saved_count,
                        elapsed_seconds=dt,
                        sample_fares=res.fares,
                    )
                else:
                    status_text = getattr(res.status, "value", str(res.status))
                    console.print(
                        f"[yellow]⚠️  {source_name:<16} | {route.pair:<8} | T+{adv:>2}d | Status: {status_text:<10} | {dt:.1f}s[/]"
                    )
            except Exception as e:
                dt = time.time() - t0
                err_msg = str(e)[:70]
                console.print(
                    f"[red]❌ {source_name:<16} | {route.pair:<8} | T+{adv:>2}d | Error: {err_msg} | {dt:.1f}s[/]"
                )

    return source_extracted, source_saved


async def main():
    settings.headless = True
    routes = get_enabled_routes()
    cleaner = FareCleaner()

    start_all = time.time()
    source_results = {}

    # Executive Banner & Probe Configuration
    print_banner()
    print_probe_config(ALL_SOURCES, routes, ADVANCE_DAYS, headless=settings.headless)

    # ── PHASE 1: OTA PLATFORMS ──────────────────────────────────────
    console.print("\n[bold cyan]📡 PHASE 1: ONLINE TRAVEL AGENCIES (OTAs)[/]")
    console.rule(style="dim cyan")

    for source_name in OTA_SOURCES:
        console.print(f"\n[bold white]🔍 Launching Probe: [cyan]{source_name.upper()}[/][/]")
        extracted, saved = await scrape_source(source_name, routes, cleaner)
        source_results[source_name] = {"extracted": extracted, "saved": saved}

    # ── PHASE 2: DIRECT AIRLINE SITES ───────────────────────────────
    console.print("\n[bold cyan]✈️  PHASE 2: DIRECT AIRLINE PLATFORMS[/]")
    console.rule(style="dim cyan")

    for source_name in AIRLINE_SOURCES:
        console.print(f"\n[bold white]🔍 Launching Probe: [cyan]{source_name.upper()}[/][/]")
        extracted, saved = await scrape_source(source_name, routes, cleaner)
        source_results[source_name] = {"extracted": extracted, "saved": saved}

    # ── FINAL INGESTION SUMMARY TABLE ───────────────────────────────
    elapsed = time.time() - start_all
    console.print()
    print_ingestion_summary_table(source_results, elapsed)

    # ── COMPUTE AIRFARE PRICE INDEX (APIx) ──────────────────────────
    console.print("\n[bold cyan]🧮 COMPUTING AIRFARE PRICE INDEX (APIx) MATHEMATICAL FORMULAS...[/]")
    console.rule(style="dim cyan")
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
            print_index_table(
                breakdown=calc_res.breakdown,
                index_score=calc_res.index_score,
                laspeyres=calc_res.laspeyres_score,
                paasche=calc_res.paasche_score,
            )
    except Exception as e:
        console.print(f"[bold yellow]⚠️  Index Computation Note: {e}[/]")


if __name__ == "__main__":
    asyncio.run(main())
