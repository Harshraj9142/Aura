"""
APIx Index Calculation Module — Base Period Manager

Calculates and persists fixed base-period average fares (P_i,0) for each route.
Base values are calculated over the first N days of data collection and stored in
route_base_values table. Re-calculation requires explicit force=True flag.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path
import yaml
from loguru import logger
from sqlalchemy import func, select
from db.models import Fare, RouteBaseValue
from db.session import get_session

CONFIG_DIR = Path(__file__).parent / "config"


def load_index_settings() -> dict:
    """Load settings from config/index_settings.yaml."""
    config_path = CONFIG_DIR / "index_settings.yaml"
    if not config_path.exists():
        return {"base_period_days": 7, "min_routes_ratio": 0.5}
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


class BasePeriodManager:
    """Manages computation and persistence of route base values (P_i,0)."""

    def __init__(self) -> None:
        self.settings = load_index_settings()
        self.base_period_days = self.settings.get("base_period_days", 7)

    def get_base_values(self) -> dict[str, float]:
        """
        Fetch stored base values from route_base_values table.

        Returns:
            Dict mapping route pair string (e.g. "DEL-BOM") to base average fare (P_i,0).
        """
        with get_session() as session:
            stmt = select(RouteBaseValue)
            records = session.scalars(stmt).all()
            return {
                f"{r.route_origin}-{r.route_destination}": float(r.base_avg_fare)
                for r in records
            }

    def compute_and_store_base_values(self, force: bool = False) -> dict[str, float]:
        """
        Compute base-period average fare per route and store in DB.

        Args:
            force: If True, overwrite existing base values. Otherwise, raise ValueError if already set.

        Returns:
            Dict mapping route pair to base average fare.
        """
        existing = self.get_base_values()
        if existing and not force:
            logger.info("Base values already exist in route_base_values table. Use force=True to recompute.")
            return existing

        with get_session() as session:
            # Find earliest travel_date in fares table
            earliest_date_stmt = select(func.min(Fare.travel_date)).where(Fare.is_outlier == False)
            start_date = session.scalar(earliest_date_stmt)

            if not start_date:
                logger.warning("No fare records found in database to compute base values.")
                return {}

            end_date = start_date + timedelta(days=self.base_period_days - 1)

            logger.info(f"Computing base values for period {start_date} to {end_date} ({self.base_period_days} days)...")

            # Query average fare per route in base period
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

            if not results:
                logger.warning("No valid fare records found within base period window.")
                return {}

            base_values: dict[str, float] = {}

            if force:
                session.query(RouteBaseValue).delete()

            now = datetime.utcnow()
            for origin, destination, avg_fare in results:
                pair = f"{origin}-{destination}"
                fare_val = round(float(avg_fare), 2)
                base_values[pair] = fare_val

                record = RouteBaseValue(
                    route_origin=origin,
                    route_destination=destination,
                    base_avg_fare=fare_val,
                    base_period_start=start_date,
                    base_period_end=end_date,
                    computed_at=now,
                )
                session.add(record)

            session.commit()
            logger.info(f"Successfully saved base values for {len(base_values)} routes: {base_values}")
            return base_values
