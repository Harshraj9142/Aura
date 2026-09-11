"""
APIx Index Calculation Module — CLI Entry Point

Usage:
  # Compute and persist base-period route values (P_i,0)
  python -m cli.run_index --base-period [--force]

  # Run index calculation for a specific frequency
  python -m cli.run_index --frequency daily
  python -m cli.run_index --frequency weekly
  python -m cli.run_index --frequency monthly
  python -m cli.run_index --frequency all

  # Run index for a specific date
  python -m cli.run_index --frequency daily --date 2026-09-11
"""

from __future__ import annotations

import argparse
import sys
from datetime import date, datetime
from loguru import logger

from index.base_period import BasePeriodManager
from index.aggregator import FareAggregator, FrequencyType
from index.calculator import IndexCalculator
from index.writer import IndexWriter


def run_base_period(force: bool = False) -> None:
    """Compute and store base period average fares."""
    manager = BasePeriodManager()
    try:
        base_values = manager.compute_and_store_base_values(force=force)
        print(f"Base Period Calculation Complete: {len(base_values)} route values established.")
        for route, val in base_values.items():
            print(f"  - {route}: ₹{val:,.2f}")
    except ValueError as e:
        logger.error(f"Base period error: {e}")
        sys.exit(1)


def run_index_calculation(frequency: str, target_date: date) -> None:
    """Run index calculation for a given frequency and date."""
    frequencies: list[FrequencyType] = (
        ["daily", "weekly", "monthly"] if frequency == "all" else [frequency]  # type: ignore
    )

    base_manager = BasePeriodManager()
    base_values = base_manager.get_base_values()

    if not base_values:
        logger.warning("No base values found in DB. Computing base values automatically...")
        base_values = base_manager.compute_and_store_base_values(force=False)

    if not base_values:
        logger.error("Cannot compute index: Base values (P_i,0) are missing.")
        sys.exit(1)

    calculator = IndexCalculator()

    for freq in frequencies:
        logger.info(f"Computing {freq} APIx index for target date {target_date}...")
        route_fares, period_start = FareAggregator.aggregate_route_fares_for_period(
            freq, target_date
        )

        result = calculator.calculate_index(route_fares, base_values)

        IndexWriter.write_index_value(
            frequency=freq,
            period_date=period_start,
            index_score=result.index_score,
            routes_included=result.routes_included,
            data_quality_note=result.data_quality_note,
        )

        print(
            f"[{freq.upper()}] Period: {period_start} | APIx Score: {result.index_score} | "
            f"Routes Included: {result.routes_included}/6"
        )
        if result.data_quality_note:
            print(f"  Note: {result.data_quality_note}")


def main() -> None:
    parser = argparse.ArgumentParser(description="APIx Airfare Price Index CLI Runner")

    parser.add_argument(
        "--base-period",
        action="store_true",
        help="Compute and persist fixed base-period values (P_i,0)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force overwrite existing base period values",
    )
    parser.add_argument(
        "--frequency",
        choices=["daily", "weekly", "monthly", "all"],
        help="Run index calculation for specified frequency",
    )
    parser.add_argument(
        "--date",
        type=lambda s: datetime.strptime(s, "%Y-%m-%d").date(),
        default=date.today(),
        help="Target date for calculation (YYYY-MM-DD, default: today)",
    )

    args = parser.parse_args()

    if args.base_period:
        run_base_period(force=args.force)
    elif args.frequency:
        run_index_calculation(frequency=args.frequency, target_date=args.date)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
