"""
APIx Index Calculation Module — Core Calculator

Implements the weighted price-relative Laspeyres-type index formula using
DGCA passenger traffic shares as weights. Handles missing route data by weight
re-normalization and enforces >50% minimum data quality threshold.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import NamedTuple, Optional
import yaml
from loguru import logger

CONFIG_DIR = Path(__file__).parent / "config"


def load_dgca_weights() -> dict[str, float]:
    """Load route weights from config/dgca_route_weights.yaml."""
    config_path = CONFIG_DIR / "dgca_route_weights.yaml"
    if not config_path.exists():
        # Fallback equal weights across default 6 routes
        return {
            "DEL-BOM": 0.28,
            "DEL-BLR": 0.22,
            "BOM-BLR": 0.18,
            "DEL-CCU": 0.14,
            "BLR-HYD": 0.10,
            "MAA-DEL": 0.08,
        }
    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
        return data.get("weights", {})


class RouteBreakdownItem(NamedTuple):
    route: str
    base_price: float
    current_price: float
    price_relative: float
    weight: float
    normalized_weight: float
    weighted_contribution: float


class CalculationResult(NamedTuple):
    index_score: Optional[float]
    routes_included: int
    data_quality_note: Optional[str]
    laspeyres_score: Optional[float] = None
    paasche_score: Optional[float] = None
    breakdown: list[RouteBreakdownItem] = []


class IndexCalculator:
    """Calculates weighted price relative composite index (APIx)."""

    def __init__(
        self,
        weights: Optional[dict[str, float]] = None,
        min_routes_ratio: float = 0.5,
    ) -> None:
        self.weights = weights or load_dgca_weights()
        self.min_routes_ratio = min_routes_ratio
        self.total_routes_count = len(self.weights)

    def calculate_index(
        self,
        current_fares: dict[str, float],
        base_fares: dict[str, float],
    ) -> CalculationResult:
        """
        Compute the APIx composite index score for a period with full calculation breakdown.

        Args:
            current_fares: Dict mapping route (e.g. "DEL-BOM") to P_i,t.
            base_fares: Dict mapping route to P_i,0.

        Returns:
            CalculationResult(index_score, routes_included, data_quality_note, laspeyres_score, paasche_score, breakdown)
        """
        if not base_fares:
            return CalculationResult(
                index_score=None,
                routes_included=0,
                data_quality_note="Base period values not computed",
            )

        active_routes: list[str] = []
        missing_routes: list[str] = []
        price_relatives: dict[str, float] = {}

        for route in self.weights.keys():
            curr_price = current_fares.get(route)
            base_price = base_fares.get(route)

            if curr_price is not None and base_price is not None and base_price > 0:
                active_routes.append(route)
                relative = (curr_price / base_price) * 100.0
                price_relatives[route] = relative
            else:
                missing_routes.append(route)
                if curr_price is None:
                    logger.warning(f"Route '{route}' has missing fare data for this period")
                elif base_price is None or base_price <= 0:
                    logger.warning(f"Route '{route}' has invalid or missing base price: {base_price}")

        routes_included = len(active_routes)
        min_required = math.ceil(self.total_routes_count * self.min_routes_ratio)

        # >50% missing data fallback
        if routes_included < min_required:
            note = (
                f"Insufficient data: >50% routes missing ({routes_included}/{self.total_routes_count} available). "
                f"Missing: {', '.join(missing_routes)}"
            )
            logger.warning(note)
            return CalculationResult(
                index_score=None,
                routes_included=routes_included,
                data_quality_note=note,
            )

        # Re-normalize weights for active routes
        raw_active_weight_sum = sum(self.weights[r] for r in active_routes)
        if raw_active_weight_sum <= 0:
            return CalculationResult(
                index_score=None,
                routes_included=0,
                data_quality_note="Invalid weight sum for active routes",
            )

        normalized_weights = {
            r: self.weights[r] / raw_active_weight_sum for r in active_routes
        }

        # Build detailed breakdown items
        breakdown_items: list[RouteBreakdownItem] = []
        laspeyres_sum = 0.0

        for r in active_routes:
            rel = price_relatives[r]
            w_orig = self.weights[r]
            w_norm = normalized_weights[r]
            contrib = w_norm * rel
            laspeyres_sum += contrib

            breakdown_items.append(
                RouteBreakdownItem(
                    route=r,
                    base_price=round(base_fares[r], 2),
                    current_price=round(current_fares[r], 2),
                    price_relative=round(rel, 2),
                    weight=round(w_orig, 4),
                    normalized_weight=round(w_norm, 4),
                    weighted_contribution=round(contrib, 2),
                )
            )

        laspeyres_score = round(laspeyres_sum, 2)
        
        # Calculate Paasche index adjustment (using current price relative weighting)
        paasche_weighted_sum = sum(
            (current_fares[r] / base_fares[r]) * normalized_weights[r] for r in active_routes
        )
        paasche_score = round(paasche_weighted_sum * 100.0, 2)

        # Fisher Ideal Price Index = sqrt(Laspeyres * Paasche)
        fisher_score = round(math.sqrt(laspeyres_score * paasche_score), 2)

        data_quality_note: Optional[str] = None
        if missing_routes:
            data_quality_note = (
                f"{len(missing_routes)} of {self.total_routes_count} routes missing ({', '.join(missing_routes)}), "
                f"weights re-normalized across {routes_included} active routes"
            )
            logger.info(data_quality_note)

        return CalculationResult(
            index_score=fisher_score,
            routes_included=routes_included,
            data_quality_note=data_quality_note,
            laspeyres_score=laspeyres_score,
            paasche_score=paasche_score,
            breakdown=breakdown_items,
        )
