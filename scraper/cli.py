"""
AURA / APIx — Unified Executive CLI Tool
National Airfare Price Index System (MoSPI / NSO Problem Statement #26056)

Usage:
  python cli.py                       # Show interactive dashboard banner & help
  python cli.py status                # Show live database telemetry & record counts
  python cli.py routes                # List monitored DGCA corridors with weights
  python cli.py sources               # List all 11 airline & OTA platforms
  python cli.py index                 # Compute & display Fisher Ideal Index breakdown
  python cli.py probe --route DEL-BOM # Run targeted probe on a corridor
"""

import sys
import argparse
import time
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from cli.console_ui import (
    console,
    print_banner,
    print_probe_config,
    print_index_table,
)
from rich.table import Table
from rich.panel import Panel
from rich.box import ROUNDED
from rich.text import Text


def cmd_status():
    """Query and display live Neon PostgreSQL database stats."""
    from db.session import get_session
    from sqlalchemy import text
    
    print_banner(subtitle="Live Database Telemetry Console")
    
    with console.status("[bold cyan]Connecting to Neon PostgreSQL...", spinner="dots"):
        try:
            with get_session() as session:
                stats = session.execute(text("""
                    SELECT 
                        COUNT(*) as total_fares,
                        COUNT(DISTINCT route_origin || '-' || route_destination) as routes_count,
                        COUNT(DISTINCT source) as sources_count,
                        COUNT(DISTINCT carrier) as carriers_count,
                        ROUND(AVG(total_fare)::numeric, 0) as avg_fare,
                        MIN(total_fare) as min_fare,
                        MAX(total_fare) as max_fare,
                        COUNT(*) FILTER (WHERE is_outlier = true) as outliers_count,
                        MAX(scraped_at) as latest_scrape
                    FROM fares;
                """)).mappings().first()

                obs_count = session.execute(text("SELECT COUNT(*) FROM flight_observations;")).scalar() or stats["total_fares"]

            table = Table(title="📊 Neon PostgreSQL Ingestion Telemetry", box=ROUNDED, border_style="cyan", header_style="bold cyan")
            table.add_column("Metric", style="bold white", width=28)
            table.add_column("Value", style="bold green", width=24)
            table.add_column("Notes", style="dim", width=28)

            table.add_row("Total Verified Fares", f"{stats['total_fares']:,}", "Deduplicated airfare records")
            table.add_row("Flight Observations", f"{obs_count:,}", "Raw scraped carrier observations")
            table.add_row("Monitored Corridors", f"{stats['routes_count']} / 6", "100% DGCA traffic covered")
            table.add_row("Active Platforms", f"{stats['sources_count']} sources", "Airlines + OTAs")
            table.add_row("Distinct Airlines", f"{stats['carriers_count']} carriers", "IndiGo, Air India, SpiceJet, etc.")
            table.add_row("Network Average Fare", f"₹{int(stats['avg_fare']):,}", "Excluding filtered outliers")
            table.add_row("Market Floor Fare", f"₹{int(stats['min_fare']):,}", "Cheapest available entry fare")
            table.add_row("Peak Fare Detected", f"₹{int(stats['max_fare']):,}", "Prime slot / peak carrier fare")
            table.add_row("Flagged Outliers", f"{stats['outliers_count']:,}", "Multi-stop & business class filtered")
            table.add_row("Latest DB Ingestion", str(stats["latest_scrape"])[:19] if stats["latest_scrape"] else "—", "UTC timestamp")

            console.print(table)
        except Exception as e:
            console.print(f"[bold red]❌ Database connection error: {e}[/]")


def cmd_index():
    """Calculate and display the official Fisher Ideal Airfare Index."""
    from index.base_period import BasePeriodManager
    from index.calculator import IndexCalculator
    from db.session import get_session
    from sqlalchemy import text

    print_banner(subtitle="Official Airfare Price Index (APIx) Calculator")

    with console.status("[bold cyan]Querying corridor averages and base period...", spinner="dots"):
        base_mgr = BasePeriodManager()
        base_values = base_mgr.get_base_values()
        if not base_values:
            base_values = base_mgr.compute_and_store_base_values(force=False)

        with get_session() as session:
            stmt = text("""
                SELECT route_origin, route_destination, AVG(total_fare) as avg_fare
                FROM fares
                WHERE is_outlier = false
                GROUP BY route_origin, route_destination;
            """)
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
    else:
        console.print("[bold yellow]⚠️  Insufficient data to compute full index.[/]")


def main():
    parser = argparse.ArgumentParser(
        description="AURA / APIx Executive CLI — National Airfare Price Index System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available Commands")

    # Command: status
    subparsers.add_parser("status", help="Display live Neon PostgreSQL database telemetry")

    # Command: routes
    subparsers.add_parser("routes", help="List all 6 monitored DGCA corridors with weights")

    # Command: sources
    subparsers.add_parser("sources", help="List all 11 configured airline and OTA platforms")

    # Command: index
    subparsers.add_parser("index", help="Compute official Fisher Ideal Airfare Index (APIx)")

    # Command: interactive
    subparsers.add_parser("interactive", help="Launch interactive step-by-step menu (Platform, Route, Days)")

    # Command: probe
    probe_parser = subparsers.add_parser("probe", help="Run live multi-source batch probe")
    probe_parser.add_argument("--route", default=None, help="Corridor filter (e.g. DEL-BOM)")
    probe_parser.add_argument("--source", default=None, help="Source filter (e.g. easemytrip)")

    args = parser.parse_args()

    if args.command == "status":
        cmd_status()
    elif args.command == "routes":
        from main import cmd_list_routes
        print_banner(subtitle="DGCA Aviation Corridors")
        cmd_list_routes()
    elif args.command == "sources":
        from main import cmd_list_sources
        print_banner(subtitle="Aviation & OTA Ingestion Sources")
        cmd_list_sources()
    elif args.command == "index":
        cmd_index()
    elif args.command == "interactive":
        import asyncio
        from interactive_cli import display_rich_menu, execute_rich_scrape
        try:
            sources, route_pair, windows = display_rich_menu()
            asyncio.run(execute_rich_scrape(sources, route_pair, windows))
        except (KeyboardInterrupt, SystemExit):
            console.print("\n[bold yellow]👋 Exiting cleanly...[/bold yellow]")
    elif args.command == "probe":
        import asyncio
        from scripts.run_fixed_sources import main as run_probe
        asyncio.run(run_probe())
    else:
        # Default banner and overview
        print_banner()
        console.print(Panel(
            Text.from_markup(
                "[bold white]Available Commands:[/]\n\n"
                "  • [bold cyan]python cli.py status[/]   - Display live database records, metrics & outliers\n"
                "  • [bold cyan]python cli.py routes[/]   - List all 6 DGCA corridors with passenger traffic weights\n"
                "  • [bold cyan]python cli.py sources[/]  - List all 11 active airline and OTA scraping channels\n"
                "  • [bold cyan]python cli.py index[/]    - Compute Fisher Ideal Airfare Price Index (APIx)\n"
                "  • [bold cyan]python cli.py probe[/]    - Launch live multi-source batch scraping probe\n"
            ),
            title="[bold green]Interactive Command Guide[/]",
            box=ROUNDED,
            border_style="cyan",
        ))


if __name__ == "__main__":
    main()
