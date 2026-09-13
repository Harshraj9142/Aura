"""
APIx Scraper — Rich Interactive Menu CLI Runner

Provides a stunning, interactive terminal UI using Rich panels,
colored tables, progress spinners, and live score cards.
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
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
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

console = Console()


def print_welcome_banner():
    banner_text = r"""
       _   ___ ___ _  __    ___  ___ ___ ___  ___ ___ 
      /_\ | _ \_ _| \/ /   / __|/ __| _ \/ _ \/ __| _ \
     / _ \|  _/| |>  <    \__ \ (__|   / (_) \__ \   /
    /_/ \_\_| |___/_/\_\   |___/\___|_|_\\___/|___|_|_\ 
    """
    console.print(Panel(Text(banner_text, style="bold cyan"), title="[bold yellow]AIRFARE PRICE INDEX SYSTEM[/bold yellow]", subtitle="[dim]MoSPI / NSO Problem Statement #26056[/dim]", border_style="bright_blue"))


def display_rich_menu():
    print_welcome_banner()

    # Step 1: Select Platform / Source
    source_table = Table(title="[bold green]STEP 1: Select OTA or Airline Target Platform[/bold green]", box=box.ROUNDED)
    source_table.add_column("Option", style="bold yellow", justify="center")
    source_table.add_column("Platform Name", style="bold cyan")
    source_table.add_column("Type", style="magenta")
    source_table.add_column("Status", style="green")

    platforms = [
        ("1", "EaseMyTrip", "OTA", "✅ Operational"),
        ("2", "Ixigo", "OTA", "✅ Operational"),
        ("3", "Cleartrip", "OTA", "✅ Operational"),
        ("4", "MakeMyTrip", "OTA", "🛡️ Bot Protected"),
        ("5", "Goibibo", "OTA", "🛡️ Bot Protected"),
        ("6", "Yatra", "OTA", "⚡ Active"),
        ("7", "IndiGo", "Airline", "✅ Operational"),
        ("8", "Air India", "Airline", "🛡️ Bot Protected"),
        ("9", "Air India Express", "Airline", "✅ Operational"),
        ("10", "Akasa Air", "Airline", "✅ Operational"),
        ("11", "SpiceJet", "Airline", "✅ Operational"),
        ("12", "All Operational Sources", "Combined", "🌟 RECOMMENDED (DEFAULT)"),
    ]

    for opt, name, ptype, status in platforms:
        source_table.add_row(opt, name, ptype, status)

    console.print(source_table)
    source_choice = Prompt.ask("[bold yellow]👉 Select Platform (1-12)[/bold yellow]", default="12")

    sources_map = {
        "1": ["easemytrip"],
        "2": ["ixigo"],
        "3": ["cleartrip"],
        "4": ["makemytrip"],
        "5": ["goibibo"],
        "6": ["yatra"],
        "7": ["indigo"],
        "8": ["air_india"],
        "9": ["air_india_express"],
        "10": ["akasa"],
        "11": ["spicejet"],
        "12": ["easemytrip", "ixigo", "cleartrip", "indigo", "air_india_express", "akasa", "spicejet"],
    }
    selected_sources = sources_map.get(source_choice, sources_map["12"])

    # Step 2: Select Route Corridor
    route_table = Table(title="\n[bold green]STEP 2: Select DGCA Corridor / City-Pair Route[/bold green]", box=box.ROUNDED)
    route_table.add_column("Option", style="bold yellow", justify="center")
    route_table.add_column("Corridor Code", style="bold cyan")
    route_table.add_column("Route Name", style="white")
    route_table.add_column("DGCA Weight", style="magenta")

    routes_list = [
        ("1", "DEL-BOM", "Delhi – Mumbai", "28.0% (Highest Traffic)"),
        ("2", "DEL-BLR", "Delhi – Bengaluru", "22.0%"),
        ("3", "BOM-BLR", "Mumbai – Bengaluru", "18.0%"),
        ("4", "DEL-CCU", "Delhi – Kolkata", "14.0%"),
        ("5", "BLR-HYD", "Bengaluru – Hyderabad", "10.0%"),
        ("6", "MAA-DEL", "Chennai – Delhi", "8.0%"),
        ("7", "ALL", "All 6 DGCA Corridors", "100.0% 🌟 (DEFAULT)"),
    ]

    for opt, code, rname, weight in routes_list:
        route_table.add_row(opt, code, rname, weight)

    console.print(route_table)
    route_choice = Prompt.ask("[bold yellow]👉 Select Route Corridor (1-7)[/bold yellow]", default="7")
    selected_route_pair = routes_list[int(route_choice) - 1][1] if route_choice in "123456" else "ALL"

    # Step 3: Select Advance Booking Window
    window_table = Table(title="\n[bold green]STEP 3: Select Advance Purchase Booking Window[/bold green]", box=box.ROUNDED)
    window_table.add_column("Option", style="bold yellow", justify="center")
    window_table.add_column("Booking Window", style="bold cyan")
    window_table.add_column("Description", style="white")
    window_table.add_column("Price Dynamics", style="red")

    windows_list = [
        ("1", "T+0", "Same Day (Today)", "🔥 Emergency Highest Surge"),
        ("2", "T+1", "Tomorrow (1 Day Out)", "⚡ Last-Minute Dynamic Spike"),
        ("3", "T+7", "1 Week Out", "📊 Moderate Window (DEFAULT)"),
        ("4", "T+15", "2 Weeks Out", "📈 Standard Domestic Window"),
        ("5", "T+30", "1 Month Out", "💡 Normal Advance Booking"),
        ("6", "T+45", "1.5 Months Out", "💎 Early-Bird Cheapest Fares"),
        ("7", "ALL", "All Booking Windows", "🌐 Complete Elasticity Window"),
    ]

    for opt, win, desc, dyn in windows_list:
        window_table.add_row(opt, win, desc, dyn)

    console.print(window_table)
    window_choice = Prompt.ask("[bold yellow]👉 Select Booking Window (1-7)[/bold yellow]", default="3")
    windows_map = {
        "1": [0],
        "2": [1],
        "3": [7],
        "4": [15],
        "5": [30],
        "6": [45],
        "7": [0, 1, 7, 15, 30, 45],
    }
    selected_windows = windows_map.get(window_choice, [7])

    console.print(Panel(
        f"[bold white]Target Platforms:[/bold white] [cyan]{', '.join(selected_sources)}[/cyan]\n"
        f"[bold white]Target Corridors:[/bold white] [green]{selected_route_pair}[/green]\n"
        f"[bold white]Booking Windows:[/bold white] [magenta]{selected_windows}[/magenta]",
        title="[bold yellow]🚀 INITIALIZING LIVE PROBE SCRAPE[/bold yellow]",
        border_style="cyan"
    ))

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

    results_table = Table(title="[bold cyan]✈️ LIVE SCRAPED AIRFARE QUOTES & INGESTION RESULTS[/bold cyan]", box=box.ROUNDED)
    results_table.add_column("Source", style="bold green")
    results_table.add_column("Route", style="bold cyan", justify="center")
    results_table.add_column("Window", style="magenta", justify="center")
    results_table.add_column("Carrier", style="bold yellow")
    results_table.add_column("Flight #", style="white")
    results_table.add_column("Travel Date", style="blue")
    results_table.add_column("Base Fare", style="dim white", justify="right")
    results_table.add_column("Tax & Fees", style="dim white", justify="right")
    results_table.add_column("Total Fare", style="bold green", justify="right")

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

                        for fare in res.fares:
                            carrier_str = fare.carrier or "Flight"
                            flight_str = fare.flight_number or "Direct"
                            base_str = f"₹{fare.base_fare:,.0f}" if fare.base_fare else "N/A"
                            tax_str = f"₹{fare.taxes_and_fees:,.0f}" if fare.taxes_and_fees else "N/A"
                            total_str = f"₹{fare.total_fare:,.0f}"
                            
                            results_table.add_row(
                                source_name,
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
                        results_table.add_row(
                            source_name, route.pair, f"T+{adv}d", "-", "-", str(travel_date), "-", "-", "[yellow]No Fares[/yellow]"
                        )
                except Exception as e:
                    results_table.add_row(
                        source_name, route.pair, f"T+{adv}d", "-", "-", str(travel_date), "-", "-", f"[red]Error: {e}[/red]"
                    )

    console.print(results_table)

    # Ingestion Summary Panel
    console.print(Panel(
        f"[bold white]Total Fares Extracted:[/bold white] [green]{total_extracted}[/green]\n"
        f"[bold white]Total Saved to PostgreSQL:[/bold white] [cyan]{total_saved}[/cyan]",
        title="[bold green]📊 INGESTION SUMMARY[/bold green]",
        border_style="green"
    ))

    # Compute Airfare Price Index with detailed mathematical breakdown
    console.print("\n[bold yellow]🧮 COMPUTING AIRFARE PRICE INDEX (APIx)...[/bold yellow]")
    try:
        base_mgr = BasePeriodManager()
        base_values = base_mgr.get_base_values()
        if not base_values:
            base_values = base_mgr.compute_and_store_base_values(force=False)
        
        with get_session() as session:
            from sqlalchemy import func, select
            from db.models import Fare
            # Query recent fare averages per route from PostgreSQL
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
        calc_result = calculator.calculate_index(current_fares, base_values)

        if calc_result.index_score and calc_result.breakdown:
            # Print Formula Header
            console.print("\n[bold underline cyan]📐 FISHER IDEAL PRICE INDEX MATHEMATICAL FORMULA:[/bold underline cyan]")
            console.print("  [dim]• Laspeyres Index (L):[/dim]  [cyan]L = ∑ [w'ᵢ × (Pᵢ,ₜ / Pᵢ,₀) × 100][/cyan]")
            console.print("  [dim]• Paasche Index (P):[/dim]    [cyan]P = ∑ [w'ᵢ × (Pᵢ,ₜ / Pᵢ,₀) × 100][/cyan]")
            console.print("  [dim]• Fisher Ideal (APIx):[/dim]  [bold yellow]APIx = √(L × P)[/bold yellow]\n")

            # Route Breakdown Table
            breakdown_table = Table(
                title="[bold green]📊 ROUTE-BY-ROUTE INDEX CALCULATION BREAKDOWN[/bold green]",
                box=box.ROUNDED,
                header_style="bold magenta",
                show_footer=True,
            )
            breakdown_table.add_column("Route Corridor", style="bold cyan", footer="NATIONAL TOTAL / WEIGHTED")
            breakdown_table.add_column("Base Fare (P₀)", justify="right", style="white", footer="-")
            breakdown_table.add_column("Current Fare (Pₜ)", justify="right", style="green", footer="-")
            breakdown_table.add_column("Price Relative (Rᵢ)", justify="right", style="bold yellow", footer="-")
            breakdown_table.add_column("Route Fisher (Fᵢ)", justify="right", style="bold magenta", footer=f"{calc_result.index_score:.2f}")
            breakdown_table.add_column("DGCA Weight (wᵢ)", justify="right", style="blue", footer="100.0%")
            breakdown_table.add_column("Weighted Contrib (Cᵢ)", justify="right", style="bold green", footer=f"{calc_result.laspeyres_score:.2f}")

            for b in calc_result.breakdown:
                breakdown_table.add_row(
                    f"[bold white]{b.route}[/bold white]",
                    f"₹{b.base_price:,.2f}",
                    f"₹{b.current_price:,.2f}",
                    f"{b.price_relative:.2f}%",
                    f"{b.route_fisher:.2f}",
                    f"{b.normalized_weight * 100:.1f}%",
                    f"{b.weighted_contribution:.2f}",
                )

            console.print(breakdown_table)

            cpi_impact = (calc_result.index_score - 100.0) * 0.0042
            score_panel = Panel(
                f"[bold yellow]Laspeyres Index (Base-Weighted L):[/bold yellow] [bold white]{calc_result.laspeyres_score}[/bold white]\n"
                f"[bold yellow]Paasche Index (Current-Weighted P):[/bold yellow] [bold white]{calc_result.paasche_score}[/bold white]\n"
                f"[bold green]Fisher Ideal Index Score (APIx):[/bold green] [bold bright_green]{calc_result.index_score}[/bold bright_green] [dim](Base Period Jan 2026 = 100.0)[/dim]\n"
                f"[bold white]Active DGCA Routes Included:[/bold white] [cyan]{calc_result.routes_included}/6[/cyan]\n"
                f"[bold white]CPI Headline Inflation Impact:[/bold white] [magenta]+{cpi_impact:.3f} percentage points[/magenta] [dim](MoSPI Basket Weight: 0.42%)[/dim]",
                title="[bold cyan]🎉 REAL-TIME AIRFARE PRICE INDEX SCORE (APIx)[/bold cyan]",
                border_style="bright_green",
            )
            console.print(score_panel)
        else:
            console.print(f"[yellow]Index Note: {calc_result.data_quality_note}[/yellow]")
    except Exception as e:
        console.print(f"[dim]Index Note: {e}[/dim]")


if __name__ == "__main__":
    try:
        sources, route_pair, windows = display_rich_menu()
        asyncio.run(execute_rich_scrape(sources, route_pair, windows))
    except (KeyboardInterrupt, SystemExit, asyncio.CancelledError):
        console.print("\n[bold yellow]👋 Scraping session interrupted by user. Exiting cleanly...[/bold yellow]")
