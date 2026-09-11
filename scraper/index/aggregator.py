"""
APIx Index Calculation Module — Fare Aggregator

Groups raw fare records by period (daily, weekly, monthly) and computes
average route prices P_i,t directly from raw rows without compound rounding error.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Literal
from sqlalchemy import func, select
from db.models import Fare
from db.session import get_session

FrequencyType = Literal["daily", "weekly", "monthly"]


class FareAggregator:
    """Aggregates fare records for a given period."""

    @staticmethod
    def get_period_range(frequency: FrequencyType, target_date: date) -> tuple[date, date]:
        """
        Compute start and end dates for a period given a frequency and target date.

        - daily: (target_date, target_date)
        - weekly: (start_of_ISO_week, end_of_ISO_week)
        - monthly: (1st_of_month, last_day_of_month)
        """
        if frequency == "daily":
            return target_date, target_date

        if frequency == "weekly":
            # Monday is 1, Sunday is 7
            start_date = target_date - timedelta(days=target_date.weekday())
            end_date = start_date + timedelta(days=6)
            return start_date, end_date

        if frequency == "monthly":
            start_date = date(target_date.year, target_date.month, 1)
            # Find last day of month
            if target_date.month == 12:
                next_month = date(target_date.year + 1, 1, 1)
            else:
                next_month = date(target_date.year, target_date.month + 1, 1)
            end_date = next_month - timedelta(days=1)
            return start_date, end_date

        raise ValueError(f"Unsupported frequency: {frequency}")

    @staticmethod
    def aggregate_route_fares_for_period(
        frequency: FrequencyType, target_date: date
    ) -> tuple[dict[str, float], date]:
        """
        Query database and compute average total_fare (P_i,t) per route for the period.

        Args:
            frequency: 'daily', 'weekly', or 'monthly'
            target_date: Target date within the period

        Returns:
            Tuple of (dict mapping "ORIGIN-DEST" to avg fare, period_start_date)
        """
        start_date, end_date = FareAggregator.get_period_range(frequency, target_date)

        with get_session() as session:
            stmt = (
                select(
                    Fare.route_origin,
                    Fare.route_destination,
                    func.avg(Fare.total_fare).label("avg_fare"),
                )
                .where(
                    Fare.travel_date >= start_date,
                    Fare.travel_date <= end_date,
                    Fare.is_outlier == False,
                )
                .group_by(Fare.route_origin, Fare.route_destination)
            )

            results = session.execute(stmt).all()

            route_fares: dict[str, float] = {
                f"{r.route_origin}-{r.route_destination}": round(float(r.avg_fare), 2)
                for r in results
            }

            return route_fares, start_date
