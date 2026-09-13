"""
AURA / APIx — Rich Terminal Console UI Helper
Provides executive-grade, Bloomberg/DevOps-style terminal formatting for CLI operations.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.columns import Columns
from rich.box import ROUNDED, DOUBLE, SIMPLE_HEAVY

console = Console()


def print_banner(subtitle: str = "Multi-Source Playwright Engine • Neon PostgreSQL Sync") -> None:
    """Print executive CLI banner."""
    header_text = Text()
    header_text.append("✈️  AURA / APIx ", style="bold cyan")
    header_text.append("— NATIONAL AIRFARE PRICE INDEX SYSTEM\n", style="bold white")
    header_text.append("Ministry of Statistics & Programme Implementation (MoSPI) • Problem Statement #26056\n", style="italic grey70")
    header_text.append(f"● {subtitle}", style="dim green")

    panel = Panel(
        header_text,
        border_style="cyan",
        box=ROUNDED,
        padding=(1, 2),
    )
    console.print(panel)


def print_probe_config(
    sources: List[str],
    routes: List[Dict[str, Any]],
    advance_days: List[int],
    headless: bool = True,
    db_target: str = "Neon PostgreSQL (Pooled)",
) -> None:
    """Print batch probe configuration card."""
    table = Table(box=ROUNDED, border_style="blue", show_header=False)
    table.add_column("Key", style="bold cyan", width=22)
    table.add_column("Value", style="white")

    table.add_row("📡 Operational Sources", f"[bold green]{len(sources)}[/] ({', '.join(sources[:6])}...)")
    table.add_row("🛣️  Monitored Corridors", f"[bold green]{len(routes)}[/] primary corridors (100% DGCA traffic weight)")
    table.add_row("📅 Advance Windows", f"{', '.join(f'T+{d}d' for d in advance_days)} ({len(advance_days)} horizons)")
    table.add_row("🌐 Browser Engine", f"Playwright (Headless={headless}) + Browserbase Cloud Bypass")
    table.add_row("💾 Database Pipeline", f"[bold magenta]{db_target}[/]")

    console.print(Panel(table, title="[bold white]🚀 Batch Probe Configuration[/]", border_style="blue", box=ROUNDED))


def print_flight_batch(
    source_name: str,
    route_pair: str,
    advance_day: int,
    extracted_count: int,
    saved_count: int,
    elapsed_seconds: float,
    sample_fares: Optional[List[Any]] = None,
) -> None:
    """Print real-time flight ingestion status."""
    status_color = "green" if extracted_count > 0 else "yellow"
    icon = "✅" if extracted_count > 0 else "⚠️"

    msg = Text()
    msg.append(f"{icon} ", style="bold")
    msg.append(f"{source_name:<16}", style="bold cyan")
    msg.append(" | ", style="dim")
    msg.append(f"{route_pair:<8}", style="bold yellow")
    msg.append(" | ", style="dim")
    msg.append(f"T+{advance_day:>2}d", style="magenta")
    msg.append(" | ", style="dim")
    msg.append(f"{extracted_count:>3} extracted", style=status_color)
    msg.append(" | ", style="dim")
    msg.append(f"{saved_count:>3} upserted", style="bold green")
    msg.append(" | ", style="dim")
    msg.append(f"{elapsed_seconds:.1f}s", style="dim white")

    console.print(msg)

    if sample_fares and len(sample_fares) > 0:
        for f in sample_fares[:3]:
            carrier = getattr(f, "carrier", None) or "Carrier"
            flight = getattr(f, "flight_number", None) or "Direct"
            fare = getattr(f, "total_fare", 0)
            console.print(f"     [dim]↳[/] ✈️  [bold white]{carrier[:18]:<18}[/] [dim]({flight:<10})[/] [green]₹{fare:,.0f}[/]")


def print_ingestion_summary_table(source_results: Dict[str, Dict[str, int]], elapsed: float) -> None:
    """Print clean summary table of results."""
    table = Table(
        title="[bold white]📊 INGESTION TELEMETRY SUMMARY[/]",
        box=ROUNDED,
        border_style="green",
        header_style="bold cyan",
    )

    table.add_column("Source / OTA", style="bold white", width=22)
    table.add_column("Status", justify="center", width=12)
    table.add_column("Fares Extracted", justify="right", style="cyan", width=16)
    table.add_column("Saved to DB", justify="right", style="bold green", width=14)
    table.add_column("Ingestion Rate", justify="right", style="magenta", width=16)

    total_ext = 0
    total_sav = 0

    for src, data in source_results.items():
        ext = data.get("extracted", 0)
        sav = data.get("saved", 0)
        total_ext += ext
        total_sav += sav
        rate = f"{(sav / ext * 100):.0f}%" if ext > 0 else "0%"
        status = "[bold green]✓ SUCCESS[/]" if ext > 0 else "[bold yellow]⚠️ PROTECTED[/]"
        table.add_row(src.capitalize(), status, f"{ext:,}", f"{sav:,}", rate)

    table.add_section()
    table.add_row(
        "[bold white]TOTAL[/]",
        "[bold green]COMPLETE[/]",
        f"[bold cyan]{total_ext:,}[/]",
        f"[bold green]{total_sav:,}[/]",
        f"{(total_sav / (total_ext or 1) * 100):.1f}%",
    )

    console.print(table)
    console.print(f"⏱️  [bold white]Total Batch Execution Time:[/] [cyan]{elapsed:.2f} seconds[/]\n")


def print_index_table(breakdown: List[Any], index_score: float, laspeyres: float, paasche: float) -> None:
    """Print Fisher Ideal Price Index breakdown."""
    table = Table(
        title="[bold white]🧮 AIRFARE PRICE INDEX (APIx) — MATHEMATICAL BREAKDOWN[/]",
        box=ROUNDED,
        border_style="cyan",
        header_style="bold white on dark_blue",
    )

    table.add_column("Corridor Route", style="bold white", width=12)
    table.add_column("Base Price (P₀)", justify="right", style="cyan", width=14)
    table.add_column("Current Price (Pₜ)", justify="right", style="yellow", width=16)
    table.add_column("Price Relative (Rᵢ)", justify="right", style="magenta", width=16)
    table.add_column("DGCA Weight (wᵢ)", justify="right", style="white", width=16)
    table.add_column("Contribution (Cᵢ)", justify="right", style="bold green", width=16)

    for b in breakdown:
        table.add_row(
            b.route,
            f"₹{b.base_price:,.2f}",
            f"₹{b.current_price:,.2f}",
            f"{b.price_relative:.2f}%",
            f"{b.normalized_weight * 100:.1f}%",
            f"{b.weighted_contribution:.2f}",
        )

    console.print(table)

    summary_panel = Panel(
        Text.from_markup(
            f"[bold white]INDEX COMPOSITE RESULTS (Base Jan 2026 = 100.0):[/]\n\n"
            f"  • [bold cyan]Laspeyres Index (L):[/]  [bold]{laspeyres:.2f}[/]\n"
            f"  • [bold cyan]Paasche Index (P):[/]    [bold]{paasche:.2f}[/]\n"
            f"  • [bold green]Fisher Ideal (APIx):[/]   [bold green]{index_score:.2f}[/] [dim](Geometric Mean: √(L × P))[/]\n"
            f"  • [bold yellow]Macroeconomic CPI Impact:[/] [bold]+{(index_score - 100.0) * 0.0042:.3f} pp[/] (0.42% Transport Basket)\n"
        ),
        border_style="green",
        box=ROUNDED,
        title="[bold green]🏆 OFFICIAL INDEX VERDICT[/]",
    )
    console.print(summary_panel)
