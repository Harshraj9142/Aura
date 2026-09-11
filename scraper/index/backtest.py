"""
APIx Index Calculation Module — Backtest Validator

Compares APIx-implied average monthly fares computed from the raw fares table
against published DGCA domestic average reference figures in dgca_reference_fares.csv.
"""

from __future__ import annotations

import csv
from datetime import date, timedelta
from pathlib import Path
from typing import NamedTuple, Optional
from loguru import logger
from sqlalchemy import func, select
from db.models import Fare
from db.session import get_session

CONFIG_DIR = Path(__file__).parent / "config"


class BacktestComparison(NamedTuple):
    route: str
    month: str
    computed_avg_fare: Optional[float]
    dgca_ref_fare: Optional[float]
    pct_difference: Optional[float]
    sample_count: int


class Backtester:
    """Validates APIx scraped fare averages against official DGCA benchmarks."""

    def __init__(self, csv_path: Optional[Path] = None) -> None:
        self.csv_path = csv_path or (CONFIG_DIR / "dgca_reference_fares.csv")
        self.reference_fares = self._load_reference_fares()

    def _load_reference_fares(self) -> dict[tuple[str, str], float]:
        """Load DGCA benchmark fares from CSV."""
        if not self.csv_path.exists():
            logger.warning(f"Reference CSV not found at {self.csv_path}")
            return {}

        ref_dict: dict[tuple[str, str], float] = {}
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                route = row["route"].strip().upper()
                month = row["month"].strip()
                try:
                    ref_dict[(route, month)] = float(row["dgca_avg_fare"])
                except (ValueError, KeyError):
                    continue
        return ref_dict

    def get_computed_monthly_average(self, route: str, month: str) -> tuple[Optional[float], int]:
        """
        Query DB for average total_fare on a route during a specific month (YYYY-MM).

        Args:
            route: 'DEL-BOM'
            month: '2026-09'

        Returns:
            Tuple of (avg_fare, record_count)
        """
        try:
            year, m = map(int, month.split("-"))
            start_date = date(year, m, 1)
            if m == 12:
                end_date = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = date(year, m + 1, 1) - timedelta(days=1)
        except ValueError:
            logger.error(f"Invalid month format: '{month}' (expected YYYY-MM)")
            return None, 0

        parts = route.split("-")
        if len(parts) != 2:
            return None, 0
        origin, destination = parts[0], parts[1]

        with get_session() as session:
            stmt = (
                select(
                    func.avg(Fare.total_fare).label("avg_fare"),
                    func.count(Fare.id).label("cnt"),
                )
                .where(
                    Fare.route_origin == origin,
                    Fare.route_destination == destination,
                    Fare.travel_date >= start_date,
                    Fare.travel_date <= end_date,
                    Fare.is_outlier == False,
                )
            )

            result = session.execute(stmt).first()
            if result and result.avg_fare is not None:
                return round(float(result.avg_fare), 2), int(result.cnt)
            return None, 0

    def run_backtest_comparison(self, route: str, month: str) -> BacktestComparison:
        """
        Compare computed scraped monthly average against DGCA benchmark.

        Args:
            route: 'DEL-BOM'
            month: '2026-09'
        """
        computed_avg, count = self.get_computed_monthly_average(route, month)
        ref_fare = self.reference_fares.get((route, month))

        pct_diff: Optional[float] = None
        if computed_avg is not None and ref_fare is not None and ref_fare > 0:
            pct_diff = round(((computed_avg - ref_fare) / ref_fare) * 100.0, 2)

        return BacktestComparison(
            route=route,
            month=month,
            computed_avg_fare=computed_avg,
            dgca_ref_fare=ref_fare,
            pct_difference=pct_diff,
            sample_count=count,
        )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="APIx vs DGCA Reference Backtest CLI")
    parser.add_argument("--route", default="DEL-BOM", help="Route pair (e.g. DEL-BOM)")
    parser.add_argument("--month", default="2026-09", help="Month (YYYY-MM)")

    args = parser.parse_args()

    backtester = Backtester()
    res = backtester.run_backtest_comparison(args.route, args.month)

    print("\n" + "=" * 50)
    print(f"APIx Backtest Report — Route: {res.route} | Month: {res.month}")
    print("=" * 50)
    print(f"  - Scraped Samples:     {res.sample_count}")
    print(f"  - Computed Avg Fare:  ₹{res.computed_avg_fare:,.2f}" if res.computed_avg_fare else "  - Computed Avg Fare:  N/A")
    print(f"  - DGCA Ref Benchmark:  ₹{res.dgca_ref_fare:,.2f}" if res.dgca_ref_fare else "  - DGCA Ref Benchmark:  N/A")
    if res.pct_difference is not None:
        sign = "+" if res.pct_difference > 0 else ""
        print(f"  - Variance:            {sign}{res.pct_difference}%")
    print("=" * 50 + "\n")
