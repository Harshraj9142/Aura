"""
AURA / APIx — Executive Interactive CLI Runner
National Airfare Price Index System (MoSPI / NSO Problem Statement #26056)

Provides an executive-grade interactive terminal wizard with Rich panels,
calibrated tables, status spinners, and mathematical Fisher Ideal breakdowns.
"""

from __future__ import annotations

import asyncio
import sys
from datetime import date, timedelta
from pathlib import Path

SCRAPER_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRAPER_DIR))

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt
from rich.text import Text
from rich import box

from config.settings import settings, get_source_by_name, get_enabled_routes
from main import load_scraper
from pipeline.cleaner import FareCleaner
from pipeline.deduplicator import Deduplicator
from pipeline.models import Route
from db.session import get_session
from index.calculator import IndexCalculator
from index.base_period import BasePeriodManager
from cli.console_ui import print_index_table

console = Console()


def print_welcome_banner():
    header_content = (
        "[bold bright_white]✈️  AURA / APIx — NATIONAL AIRFARE PRICE INDEX SYSTEM[/bold bright_white]\n"
        "[cyan]Ministry of Statistics & Programme Implementation (MoSPI) • Problem Statement #26056[/cyan]\n"
        "[dim]● Live Playwright Multi-Source Ingestion & Probe Wizard[/dim]"
    )
    console.print(
        Panel(
            header_content,
            box=box.ROUNDED,
            border_style="bright_blue",
            padding=(1, 2),
        )
    )


def display_rich_menu():
    print_welcome_banner()

    # STEP 1: Select Platform / Source
    source_table = Table(
        title="[bold cyan]STEP 1 OF 3[/bold cyan] [dim]•[/dim] [bold white]Select Target OTA or Airline Platform[/bold white]",
        box=box.ROUNDED,
        header_style="bold bright_white on blue",
        show_lines=True,
    )
    source_table.add_column("#", style="bold yellow", justify="center", width=4)
    source_table.add_column("Platform Name", style="bold white", width=22)
    source_table.add_column("Category", style="cyan", width=12)
    source_table.add_column("Engine Status", style="green", width=16)
    source_table.add_column("Ingestion Notes", style="dim white", width=34)

    platforms = [
        ("1", "EaseMyTrip", "OTA", "★ RECOMMENDED", "Ultra-fast multi-carrier (IndiGo, AI, SpiceJet, Akasa)"),
        ("2", "Cleartrip", "OTA", "● OPERATIONAL", "Direct fast grid (IndiGo, AI, Akasa)"),
        ("3", "Ixigo", "OTA", "● OPERATIONAL", "Aggregated multi-carrier fare matrix"),
        ("4", "SpiceJet", "AIRLINE", "● OPERATIONAL", "Direct portal (SG) with dynamic low-fare calendar"),
        ("5", "IndiGo", "AIRLINE", "● OPERATIONAL", "Largest Indian domestic carrier (6E)"),
        ("6", "Akasa Air", "AIRLINE", "● OPERATIONAL", "Next-gen domestic carrier (QP)"),
        ("7", "Air India Express", "AIRLINE", "● OPERATIONAL", "LCC subsidiary flights (IX)"),
        ("8", "MakeMyTrip", "OTA", "🛡️ SHIELDED", "Akamai Bot Manager protected"),
        ("9", "Goibibo", "OTA", "🛡️ SHIELDED", "WAF & challenge interstitial protected"),
        ("10", "Yatra", "OTA", "● ACTIVE", "Multi-hop domestic fare search"),
        ("11", "SpiceJet (Direct)", "AIRLINE", "● OPERATIONAL", "Alias to Option 4 (SG Portal)"),
        ("12", "All Operational OTAs", "COMBINED", "★ ALL AIRLINES", "Parallel extraction (EaseMyTrip + Cleartrip)"),
    ]

    for opt, name, ptype, status, notes in platforms:
        is_rec = opt in ("1", "12")
        opt_style = f"[bold bright_cyan]{opt}[/]" if is_rec else f"[yellow]{opt}[/]"
        name_style = f"[bold bright_white]{name}[/]" if is_rec else name
        status_style = "[bold green]" + status + "[/]" if "RECOMMENDED" in status or "ALL AIRLINES" in status else ("[green]" + status + "[/]" if "OPERATIONAL" in status or "ACTIVE" in status else "[red]" + status + "[/]")
        source_table.add_row(opt_style, name_style, ptype, status_style, notes)

    console.print(source_table)
    source_choice = Prompt.ask(
        "[bold cyan]aura[/][bold white]>[/] [bold yellow]Select Platform [1-12][/] [dim](Default: 1 - EaseMyTrip)[/]",
        default="1",
    )

    sources_map = {
        "1": ["easemytrip"],
        "2": ["cleartrip"],
        "3": ["ixigo"],
        "4": ["spicejet"],
        "5": ["indigo"],
        "6": ["akasa"],
        "7": ["air_india_express"],
        "8": ["makemytrip"],
        "9": ["goibibo"],
        "10": ["yatra"],
        "11": ["spicejet"],
        "12": ["easemytrip", "cleartrip"],
    }
    selected_sources = sources_map.get(source_choice.strip(), sources_map["1"])

    # STEP 2: Select DGCA Corridor / City-Pair Route
    route_table = Table(
        title="\n[bold cyan]STEP 2 OF 3[/bold cyan] [dim]•[/dim] [bold white]Select DGCA Aviation Corridor[/bold white]",
        box=box.ROUNDED,
        header_style="bold bright_white on blue",
        show_lines=True,
    )
    route_table.add_column("#", style="bold yellow", justify="center", width=4)
    route_table.add_column("Corridor Code", style="bold cyan", width=15)
    route_table.add_column("City-Pair Route", style="bold white", width=25)
    route_table.add_column("DGCA Weight", style="magenta", width=18)
    route_table.add_column("Traffic Role", style="dim white", width=26)

    routes_list = [
        ("1", "DEL-BOM", "Delhi – Mumbai", "28.0%", "Primary Metro Spine (Highest Traffic)"),
        ("2", "DEL-BLR", "Delhi – Bengaluru", "22.0%", "North-South Tech Corridor"),
        ("3", "BOM-BLR", "Mumbai – Bengaluru", "18.0%", "Commercial & Tech Business Corridor"),
        ("4", "DEL-CCU", "Delhi – Kolkata", "14.0%", "East-West Connecting Trunk"),
        ("5", "BLR-HYD", "Bengaluru – Hyderabad", "10.0%", "Southern High-Frequency Shuttle"),
        ("6", "MAA-DEL", "Chennai – Delhi", "8.0%", "Southern Coastal Trunk Route"),
        ("7", "ALL", "All 6 DGCA Corridors", "100.0%", "★ Complete National CPI Basket"),
    ]

    for opt, code, rname, weight, role in routes_list:
        is_rec = opt == "7"
        opt_style = "[bold bright_cyan]7[/]" if is_rec else f"[yellow]{opt}[/]"
        code_style = f"[bold bright_white]{code}[/]" if is_rec else f"[cyan]{code}[/]"
        route_table.add_row(opt_style, code_style, rname, f"[bold]{weight}[/]", role)

    console.print(route_table)
    route_choice = Prompt.ask(
        "[bold cyan]aura[/][bold white]>[/] [bold yellow]Select Route Corridor [1-7][/] [dim](Default: 7)[/]",
        default="7",
    )
    selected_route_pair = routes_list[int(route_choice) - 1][1] if route_choice.strip() in "123456" else "ALL"

    # STEP 3: Select Advance Purchase Booking Window
    window_table = Table(
        title="\n[bold cyan]STEP 3 OF 3[/bold cyan] [dim]•[/dim] [bold white]Select Advance Purchase Booking Window[/bold white]",
        box=box.ROUNDED,
        header_style="bold bright_white on blue",
        show_lines=True,
    )
    window_table.add_column("#", style="bold yellow", justify="center", width=4)
    window_table.add_column("Window", style="bold cyan", width=10)
    window_table.add_column("Timeline Description", style="bold white", width=24)
    window_table.add_column("Price Dynamics", style="yellow", width=28)
    window_table.add_column("MoSPI Category", style="dim white", width=22)

    windows_list = [
        ("1", "T+0", "Same Day (Today)", "🔥 Emergency Peak Surge", "Last-Minute High"),
        ("2", "T+1", "Tomorrow (1 Day Out)", "⚡ Dynamic Yield Escalation", "Immediate Departure"),
        ("3", "T+7", "1 Week Out (7 Days)", "📊 Standard Lead Benchmark", "★ Standard Window"),
        ("4", "T+15", "2 Weeks Out (15 Days)", "📈 Stable Domestic Fares", "Pre-Planned Travel"),
        ("5", "T+30", "1 Month Out (30 Days)", "💡 Normal Advance Purchase", "Advance Booking"),
        ("6", "T+45", "1.5 Months Out (45 Days)", "💎 Early-Bird Lowest Fares", "Long Horizon Floor"),
        ("7", "ALL", "All Booking Windows", "🌐 Complete Elasticity Matrix", "Comprehensive Horizon"),
    ]

    for opt, win, desc, dyn, cat in windows_list:
        is_rec = opt == "3"
        opt_style = "[bold bright_cyan]3[/]" if is_rec else f"[yellow]{opt}[/]"
        window_table.add_row(opt_style, f"[bold]{win}[/]", desc, dyn, cat)

    console.print(window_table)
    window_choice = Prompt.ask(
        "[bold cyan]aura[/][bold white]>[/] [bold yellow]Select Booking Window [1-7][/] [dim](Default: 3)[/]",
        default="3",
    )
    windows_map = {
        "1": [0],
        "2": [1],
        "3": [7],
        "4": [15],
        "5": [30],
        "6": [45],
        "7": [0, 1, 7, 15, 30, 45],
    }
    selected_windows = windows_map.get(window_choice.strip(), [7])

    # SPECIFICATION CONFIRMATION PANEL
    console.print(
        Panel(
            Text.from_markup(
                f"[bold white]Target Platforms:[/bold white]   [cyan]{', '.join(selected_sources)}[/cyan]\n"
                f"[bold white]Corridor Selection:[/bold white] [green]{selected_route_pair}[/green]\n"
                f"[bold white]Booking Horizons:[/bold white]   [magenta]{', '.join(f'T+{w}d' for w in selected_windows)}[/magenta]\n"
                f"[bold white]Database Target:[/bold white]    [yellow]Neon PostgreSQL (ep-quiet-dawn) • Active Pool[/yellow]\n"
                f"[bold white]Index Standard:[/bold white]     [bold bright_white]MoSPI Fisher Ideal Formula √(Laspeyres × Paasche)[/bold bright_white]"
            ),
            title="[bold bright_green]🚀 EXECUTING AUTOMATED PROBE SPECIFICATION[/bold bright_green]",
            box=box.ROUNDED,
            border_style="bright_green",
            padding=(1, 2),
        )
    )

    return selected_sources, selected_route_pair, selected_windows


async def execute_rich_scrape(selected_sources, route_pair_filter, selected_windows):
    settings.headless = True
    all_routes = get_enabled_routes()

    if route_pair_filter != "ALL":
        orig, dest = route_pair_filter.split("-")
        routes_to_run = [r for r in all_routes if r["origin"] == orig and r["destination"] == dest]
    else:
        routes_to_run = all_routes

    cleaner = FareCleaner()
    total_extracted = 0
    total_saved = 0

    results_table = Table(
        title="[bold bright_white]✈️ LIVE SCRAPED FLIGHT OBSERVATIONS & INGESTION RESULTS[/bold bright_white]",
        box=box.ROUNDED,
        header_style="bold bright_white on blue",
        show_lines=True,
    )
    results_table.add_column("Source", style="bold green", width=14)
    results_table.add_column("Route", style="bold cyan", justify="center", width=10)
    results_table.add_column("Window", style="magenta", justify="center", width=8)
    results_table.add_column("Carrier", style="bold yellow", width=18)
    results_table.add_column("Flight #", style="white", width=10)
    results_table.add_column("Travel Date", style="blue", width=12)
    results_table.add_column("Base Fare", style="dim white", justify="right", width=11)
    results_table.add_column("Taxes & Fees", style="dim white", justify="right", width=12)
    results_table.add_column("Total Fare", style="bold bright_green", justify="right", width=13)

    with console.status("[bold cyan]Executing Playwright automated browser probes...", spinner="dots"):
        for source_name in selected_sources:
            src_cfg = get_source_by_name(source_name)
            if not src_cfg:
                continue

            try:
                scraper = load_scraper(src_cfg)
            except Exception as e:
                console.print(f"[bold red]❌ Failed to load scraper for {source_name}: {e}[/bold red]")
                continue

            for r_cfg in routes_to_run:
                route = Route(origin=r_cfg["origin"], destination=r_cfg["destination"])
                for adv in selected_windows:
                    travel_date = date.today() + timedelta(days=adv)
                    try:
                        res = await scraper.scrape(route, travel_date, adv)
                        if res.is_success and res.fares:
                            total_extracted += len(res.fares)
                            cleaned = cleaner.clean_batch(res.fares)
                            deduped = Deduplicator.deduplicate_in_memory(cleaned)

                            with get_session() as session:
                                saved_count = Deduplicator.upsert_fares(session, deduped)
                                total_saved += saved_count

                            for fare in res.fares[:8]:  # Display top 8 per batch cleanly
                                carrier_str = fare.carrier or "Carrier"
                                flight_str = fare.flight_number or "Direct"
                                base_str = f"₹{fare.base_fare:,.0f}" if fare.base_fare else "—"
                                tax_str = f"₹{fare.taxes_and_fees:,.0f}" if fare.taxes_and_fees else "—"
                                total_str = f"₹{fare.total_fare:,.0f}"

                                results_table.add_row(
                                    source_name.title(),
                                    route.pair,
                                    f"T+{adv}d",
                                    carrier_str,
                                    flight_str,
                                    str(travel_date),
                                    base_str,
                                    tax_str,
                                    total_str,
                                )
                        else:
                            status_note = "[yellow]No Carrier Flights[/yellow]"
                            if res.error_message and "timeout" in res.error_message.lower():
                                status_note = "[dim yellow]Portal Timed Out[/dim yellow]"
                            elif res.error_message and "disallowed" in res.error_message.lower():
                                status_note = "[dim red]robots.txt Restricted[/dim red]"
                            results_table.add_row(
                                source_name.title(), route.pair, f"T+{adv}d", "—", "—", str(travel_date), "—", "—", status_note
                            )
                    except Exception as e:
                        results_table.add_row(
                            source_name.title(), route.pair, f"T+{adv}d", "—", "—", str(travel_date), "—", "—", f"[red]Error: {e}[/red]"
                        )

    console.print(results_table)

    # Ingestion Summary Panel
    advise_str = ""
    if total_extracted == 0:
        advise_str = "\n\n[bold yellow]💡 Pro-Tip:[/bold yellow] [dim white]Single-carrier portals (SpiceJet, IndiGo) only fly select routes.\nFor guaranteed complete coverage across all 6 corridors with 100+ flights, choose Option 1 (EaseMyTrip) or Option 2 (Cleartrip).[/dim white]"

    console.print(
        Panel(
            f"[bold white]Total Raw Flight Observations:[/bold white] [green]{total_extracted:,}[/green]\n"
            f"[bold white]Deduplicated Records Ingested to PostgreSQL:[/bold white] [cyan]{total_saved:,}[/cyan]\n"
            f"[bold white]Database Sync Status:[/bold white] [bold bright_green]Active (ep-quiet-dawn)[/bold bright_green]{advise_str}",
            title="[bold green]📊 INGESTION TELEMETRY SUMMARY[/bold green]",
            box=box.ROUNDED,
            border_style="green",
            padding=(1, 2),
        )
    )

    # Calculate Fisher Ideal Index
    try:
        from sqlalchemy import text
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
        if calc_res and calc_res.index_score and calc_res.breakdown:
            print_index_table(
                breakdown=calc_res.breakdown,
                index_score=calc_res.index_score,
                laspeyres=calc_res.laspeyres_score,
                paasche=calc_res.paasche_score,
            )
        else:
            console.print(f"[yellow]Index Notice: {calc_res.data_quality_note}[/yellow]")
    except Exception as e:
        console.print(f"[dim]Index Calculation Note: {e}[/dim]")


if __name__ == "__main__":
    try:
        sources, route_pair, windows = display_rich_menu()
        asyncio.run(execute_rich_scrape(sources, route_pair, windows))
    except (KeyboardInterrupt, SystemExit, asyncio.CancelledError):
        console.print("\n[bold yellow]👋 Interactive session terminated. Exiting cleanly...[/bold yellow]")
