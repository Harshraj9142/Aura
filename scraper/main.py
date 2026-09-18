"""
APIx Scraper — CLI Entry Point

Provides command-line interface for running the airfare scraper:

  # Run a single route/source
  python main.py --run-now --route DEL-BOM --source indigo

  # Run full batch (all routes × all sources × all windows)
  python main.py --run-now

  # Start the scheduled daemon
  python main.py --schedule

  # List configured routes and sources
  python main.py --list-routes
  python main.py --list-sources
"""

from __future__ import annotations

import argparse
import asyncio
import importlib
import sys
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path
import os
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

from loguru import logger

from config.settings import (
    LOGS_DIR,
    get_advance_windows,
    get_enabled_routes,
    get_enabled_sources,
    get_source_by_name,
    settings,
)
from db.models import ScrapeRun, ScrapeRunStatus
from db.session import create_all_tables, get_session
from pipeline.cleaner import FareCleaner
from pipeline.deduplicator import Deduplicator
from pipeline.models import FareRecord, Route, ScrapeResult, ScrapeStatus, SourceTypeEnum
from scrapers.base_scraper import BaseScraper


# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
def setup_logging() -> None:
    """Configure loguru with console + rotating file output."""
    # Remove default handler
    logger.remove()

    # Console output — colorful, human-readable
    logger.add(
        sys.stderr,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        level=settings.log_level,
        colorize=True,
    )

    # Rotating log file — JSON-formatted for structured log analysis
    logger.add(
        str(LOGS_DIR / "scraper_{time:YYYY-MM-DD}.log"),
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
        level="DEBUG",
        rotation="1 day",
        retention="30 days",
        compression="gz",
        enqueue=True,  # Thread-safe
    )


# ---------------------------------------------------------------------------
# Scraper loader
# ---------------------------------------------------------------------------
def load_scraper(source_config: dict) -> BaseScraper:
    """
    Dynamically load a scraper class from its config.

    The scraper_class field in sources.yaml specifies the full
    module path, e.g. "scrapers.airlines.indigo_scraper.IndiGoScraper".
    """
    class_path = source_config["scraper_class"]
    module_path, class_name = class_path.rsplit(".", 1)

    try:
        module = importlib.import_module(module_path)
        scraper_class = getattr(module, class_name)
        return scraper_class()
    except (ImportError, AttributeError) as e:
        logger.error(f"Failed to load scraper '{class_path}': {e}")
        raise


# ---------------------------------------------------------------------------
# Batch orchestration
# ---------------------------------------------------------------------------
async def run_single(
    route_str: str,
    source_name: str,
    advance_days: int | None = None,
) -> None:
    """
    Run a single (route, source, advance_days) scrape.

    If advance_days is None, runs all configured advance windows.
    """
    # Parse route
    parts = route_str.upper().split("-")
    if len(parts) != 2:
        logger.error(f"Invalid route format: '{route_str}' — expected 'DEL-BOM'")
        return

    route = Route(origin=parts[0], destination=parts[1])

    # Load source
    source_config = get_source_by_name(source_name.lower())
    if not source_config:
        logger.error(f"Source '{source_name}' not found in config")
        return

    scraper = load_scraper(source_config)
    cleaner = FareCleaner()

    # Determine advance windows
    windows = [advance_days] if advance_days else get_advance_windows()

    logger.info(
        f"🚀 Single scrape: {route.pair} via {source_name} | "
        f"windows: {windows}"
    )

    for window in windows:
        travel_date = date.today() + timedelta(days=window)

        result = await scraper.scrape(route, travel_date, window)

        if result.is_success and result.fares:
            # Clean and validate
            cleaned = cleaner.clean_batch(result.fares)

            # Deduplicate
            deduped = Deduplicator.deduplicate_in_memory(cleaned)

            # Insert into database
            try:
                with get_session() as session:
                    count = Deduplicator.upsert_fares(session, deduped)
                    logger.info(f"💾 Saved {count} fares to database")
            except Exception as e:
                logger.error(f"Database insert failed: {e}")

        logger.info(f"Result: {result}")


async def run_batch(
    route_filter: str | None = None,
    source_filter: str | None = None,
    advance_days: int | None = None,
) -> None:
    """
    Run a full batch: all active routes × all active sources × all windows.

    Optionally filter by a specific route or source.
    """
    routes_config = get_enabled_routes()
    sources_config = get_enabled_sources()
    windows = [advance_days] if advance_days else get_advance_windows()

    # Apply filters
    if route_filter:
        parts = route_filter.upper().split("-")
        routes_config = [
            r for r in routes_config
            if r["origin"] == parts[0] and r["destination"] == parts[1]
        ]

    if source_filter:
        sources_config = [
            s for s in sources_config if s["name"] == source_filter.lower()
        ]

    if not routes_config:
        logger.error("No routes to scrape (check filter or config)")
        return

    if not sources_config:
        logger.error("No sources to scrape (check filter or config)")
        return

    total_tasks = len(routes_config) * len(sources_config) * len(windows)

    logger.info(
        f"🚀 Batch scrape starting | "
        f"{len(routes_config)} routes × {len(sources_config)} sources × "
        f"{len(windows)} windows = {total_tasks} tasks"
    )

    # Create scrape run record
    run_id = uuid.uuid4()
    started_at = datetime.utcnow()

    try:
        with get_session() as session:
            scrape_run = ScrapeRun(
                run_id=run_id,
                started_at=started_at,
                total_attempted=total_tasks,
                status=ScrapeRunStatus.RUNNING,
            )
            session.add(scrape_run)
    except Exception as e:
        logger.warning(f"Could not create scrape_run record: {e}")

    # Counters
    success_count = 0
    failed_count = 0
    blocked_count = 0
    total_fares = 0
    completed_tasks = 0
    source_summary: dict[str, dict] = {}

    cleaner = FareCleaner()

    # Iterate: sources → routes → windows
    for source_config in sources_config:
        source_name = source_config["name"]
        source_summary[source_name] = {"success": 0, "failed": 0, "blocked": 0, "fares": 0}

        try:
            scraper = load_scraper(source_config)
        except Exception as e:
            logger.error(f"Cannot load scraper for {source_name}: {e}")
            failed_count += len(routes_config) * len(windows)
            source_summary[source_name]["failed"] = len(routes_config) * len(windows)
            continue

        route_objs = [
            Route(
                origin=route_config["origin"],
                destination=route_config["destination"],
                name=route_config.get("name"),
            )
            for route_config in routes_config
        ]

        # Process with safe concurrency = 2 (optimal for EC2 2GB RAM)
        semaphore = asyncio.Semaphore(2)

        async def _scrape_single(route: Route, window: int):
            nonlocal success_count, failed_count, blocked_count, total_fares, completed_tasks
            travel_date = date.today() + timedelta(days=window)
            async with semaphore:
                try:
                    result = await asyncio.wait_for(
                        scraper.scrape(route, travel_date, window),
                        timeout=120.0,
                    )

                    completed_tasks += 1
                    pct = (completed_tasks / total_tasks) * 100

                    if result.is_success:
                        success_count += 1
                        source_summary[source_name]["success"] += 1

                        if result.fares:
                            cleaned = cleaner.clean_batch(result.fares)
                            deduped = Deduplicator.deduplicate_in_memory(cleaned)

                            try:
                                with get_session() as session:
                                    count = Deduplicator.upsert_fares(session, deduped)
                                    total_fares += count
                                    source_summary[source_name]["fares"] += count
                                logger.info(
                                    f"📊 [{completed_tasks}/{total_tasks}] ({pct:.1f}%) | "
                                    f"✅ {route.pair}/{source_name}/T+{window}d: "
                                    f"+{count} fares saved | Total DB: {total_fares} | "
                                    f"Remaining: {total_tasks - completed_tasks}"
                                )
                            except Exception as e:
                                logger.error(f"❌ DB insert failed for {route.pair}/{source_name}: {e}")
                        else:
                            logger.info(
                                f"📊 [{completed_tasks}/{total_tasks}] ({pct:.1f}%) | "
                                f"✈️ {route.pair}/{source_name}/T+{window}d: 0 flights found | "
                                f"Remaining: {total_tasks - completed_tasks}"
                            )

                    elif result.is_blocked:
                        blocked_count += 1
                        source_summary[source_name]["blocked"] += 1
                        logger.warning(
                            f"📊 [{completed_tasks}/{total_tasks}] ({pct:.1f}%) | "
                            f"🛑 BLOCKED: {route.pair}/{source_name}/T+{window}d | "
                            f"Remaining: {total_tasks - completed_tasks}"
                        )

                    else:
                        # FAILED, NO_FLIGHTS, SOLD_OUT, DISALLOWED
                        if result.status in (ScrapeStatus.NO_FLIGHTS, ScrapeStatus.SOLD_OUT):
                            success_count += 1
                            source_summary[source_name]["success"] += 1
                        else:
                            failed_count += 1
                            source_summary[source_name]["failed"] += 1
                        logger.info(
                            f"📊 [{completed_tasks}/{total_tasks}] ({pct:.1f}%) | "
                            f"⚠️ {route.pair}/{source_name}/T+{window}d: {result.status.value} | "
                            f"Remaining: {total_tasks - completed_tasks}"
                        )

                except asyncio.TimeoutError:
                    completed_tasks += 1
                    pct = (completed_tasks / total_tasks) * 100
                    failed_count += 1
                    source_summary[source_name]["failed"] += 1
                    logger.warning(
                        f"📊 [{completed_tasks}/{total_tasks}] ({pct:.1f}%) | "
                        f"⏱️ TIMEOUT (120s): {route.pair}/{source_name}/T+{window}d | "
                        f"Remaining: {total_tasks - completed_tasks}"
                    )

                except Exception as e:
                    completed_tasks += 1
                    pct = (completed_tasks / total_tasks) * 100
                    failed_count += 1
                    source_summary[source_name]["failed"] += 1
                    logger.error(
                        f"📊 [{completed_tasks}/{total_tasks}] ({pct:.1f}%) | "
                        f"❌ ERROR: {route.pair}/{source_name}/T+{window}d: {e} | "
                        f"Remaining: {total_tasks - completed_tasks}"
                    )

        coros = [
            _scrape_single(route, window)
            for route in route_objs
            for window in windows
        ]
        await asyncio.gather(*coros)

    # Update scrape run record
    completed_at = datetime.utcnow()
    try:
        with get_session() as session:
            run = session.query(ScrapeRun).filter_by(run_id=run_id).first()
            if run:
                run.completed_at = completed_at
                run.total_success = success_count
                run.total_failed = failed_count
                run.total_blocked = blocked_count
                run.status = ScrapeRunStatus.COMPLETED
                run.summary = source_summary
    except Exception as e:
        logger.warning(f"Could not update scrape_run record: {e}")

    # Print summary table
    duration = (completed_at - started_at).total_seconds()
    _print_summary(source_summary, success_count, failed_count, blocked_count, total_fares, duration)


def _print_summary(
    source_summary: dict,
    success: int,
    failed: int,
    blocked: int,
    total_fares: int,
    duration: float,
) -> None:
    """Print a formatted summary table at the end of a batch run."""
    logger.info("=" * 70)
    logger.info("📊 BATCH SCRAPE SUMMARY")
    logger.info("=" * 70)
    logger.info(f"{'Source':<20} {'Success':>8} {'Failed':>8} {'Blocked':>8} {'Fares':>8}")
    logger.info("-" * 70)

    for source, stats in source_summary.items():
        logger.info(
            f"{source:<20} {stats['success']:>8} {stats['failed']:>8} "
            f"{stats['blocked']:>8} {stats['fares']:>8}"
        )

    logger.info("-" * 70)
    logger.info(
        f"{'TOTAL':<20} {success:>8} {failed:>8} {blocked:>8} {total_fares:>8}"
    )
    logger.info(f"Duration: {duration:.1f}s")
    logger.info("=" * 70)


# ---------------------------------------------------------------------------
# CLI argument parser
# ---------------------------------------------------------------------------
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="apix-scraper",
        description="APIx — Real-time Airfare Price Index Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run single route/source
  python main.py --run-now --route DEL-BOM --source indigo

  # Run all configured routes/sources
  python main.py --run-now

  # Start scheduled daemon (daily at configured time)
  python main.py --schedule

  # List configured routes and sources
  python main.py --list-routes
  python main.py --list-sources

  # Initialize the database
  python main.py --init-db
        """,
    )

    parser.add_argument(
        "--run-now",
        action="store_true",
        help="Run scraping immediately (batch or filtered)",
    )
    parser.add_argument(
        "--schedule",
        action="store_true",
        help="Start APScheduler daemon for daily automated runs",
    )
    parser.add_argument(
        "--route",
        type=str,
        default=None,
        help="Filter by route (e.g. DEL-BOM). If omitted, runs all routes.",
    )
    parser.add_argument(
        "--source",
        type=str,
        default=None,
        help="Filter by source (e.g. indigo). If omitted, runs all sources.",
    )
    parser.add_argument(
        "--advance-days",
        type=int,
        default=None,
        help="Specific advance-purchase window (e.g. 7). If omitted, runs all windows.",
    )
    parser.add_argument(
        "--list-routes",
        action="store_true",
        help="List all configured routes",
    )
    parser.add_argument(
        "--list-sources",
        action="store_true",
        help="List all configured sources",
    )
    parser.add_argument(
        "--init-db",
        action="store_true",
        help="Initialize database tables (development only — use Alembic in production)",
    )
    return parser


def cmd_list_routes() -> None:
    """Print all configured routes using Rich formatting."""
    from rich.console import Console
    from rich.table import Table
    from rich.box import ROUNDED
    console = Console()
    routes = get_enabled_routes()

    table = Table(title="✈️  Configured DGCA Aviation Corridors (AURA)", box=ROUNDED, border_style="cyan", header_style="bold cyan")
    table.add_column("Corridor Code", style="bold cyan", width=14)
    table.add_column("City Pair Name", style="bold white", width=28)
    table.add_column("Traffic Weight", justify="right", style="yellow", width=16)
    table.add_column("Status", justify="center", width=12)

    weights = {"DEL-BOM": "28%", "DEL-BLR": "22%", "BOM-BLR": "18%", "DEL-CCU": "14%", "BLR-HYD": "10%", "MAA-DEL": "8%"}

    for r in routes:
        pair = f"{r['origin']}-{r['destination']}"
        name = r.get("name", "")
        weight = weights.get(pair, "N/A")
        status = "[bold green]✓ ACTIVE[/]" if r.get("enabled", True) else "[bold red]DISABLED[/]"
        table.add_row(pair, name, weight, status)

    console.print(table)
    console.print(f"Total: [bold cyan]{len(routes)} primary routes[/] tracked.\n")


def cmd_list_sources() -> None:
    """Print all configured sources using Rich formatting."""
    from rich.console import Console
    from rich.table import Table
    from rich.box import ROUNDED
    console = Console()
    sources = get_enabled_sources()

    table = Table(title="📡 Configured Airfare Scraping Sources (APIx)", box=ROUNDED, border_style="green", header_style="bold green")
    table.add_column("Source Identifier", style="bold cyan", width=20)
    table.add_column("Platform / Brand", style="bold white", width=24)
    table.add_column("Category", style="magenta", width=14)
    table.add_column("Engine Status", justify="center", width=14)

    for s in sources:
        status = "[bold green]● LIVE[/]" if s.get("enabled", True) else "[bold red]DISABLED[/]"
        table.add_row(s["name"], s["display_name"], s["source_type"].upper(), status)

    console.print(table)
    console.print(f"Total: [bold green]{len(sources)} operational platforms[/] monitored.\n")


def cmd_init_db() -> None:
    """Initialize database tables."""
    logger.info("Initializing database...")
    create_all_tables()
    logger.info("Database initialized successfully")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"healthy","service":"aura-scraper-and-twitter"}')

    def do_POST(self):
        if self.path in ("/tweet", "/api/tweet"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                import json
                data = json.loads(body) if body else {}
                text = data.get("text") or data.get("tweetText")
                auth_token = data.get("authToken") or data.get("auth_token")

                if not text:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "Missing tweet text"}).encode("utf-8"))
                    return

                # Invoke Twitter Playwright bot
                try:
                    from twitter_bot import publish_tweet
                except ImportError:
                    from scraper.twitter_bot import publish_tweet

                res = publish_tweet(text, custom_auth_token=auth_token)

                self.send_response(200 if res.get("success") else 500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(res).encode("utf-8"))
            except Exception as e:
                import json
                logger.error(f"Error handling /tweet request: {e}")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
        elif self.path in ("/scrape", "/api/scrape"):
            try:
                # Trigger batch scraping run in background thread
                def run_in_bg():
                    asyncio.run(run_batch())
                threading.Thread(target=run_in_bg, daemon=True).start()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"success": true, "message": "Airfare scraping batch triggered successfully in background"}')
            except Exception as e:
                logger.error(f"Error triggering scrape batch: {e}")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(f'{{"success": false, "error": "{str(e)}"}}'.encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()
        
def start_health_server():
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("0.0.0.0", port), HealthCheckHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    logger.info(f"Health check and API server started on port {port}")

def main() -> None:
    """Main entry point for the APIx scraper CLI."""
    start_health_server()
    setup_logging()
    parser = build_parser()
    args = parser.parse_args()

    logger.info("🔧 APIx Scraper starting...")

    # Handle non-scraping commands
    if args.list_routes:
        cmd_list_routes()
        return

    if args.list_sources:
        cmd_list_sources()
        return

    if args.init_db:
        cmd_init_db()
        return

    # Handle scraping commands
    if args.run_now:
        if args.route and args.source:
            # Single route/source
            asyncio.run(
                run_single(
                    args.route,
                    args.source,
                    advance_days=args.advance_days,
                )
            )
        else:
            asyncio.run(
                run_batch(args.route, args.source, advance_days=args.advance_days)
            )

    elif args.schedule:
        # Import scheduler here to avoid circular imports
        from scheduler.job_runner import start_scheduler
        start_scheduler()

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
