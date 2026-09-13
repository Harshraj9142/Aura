"""
APIx Index Calculation Module — Core Calculator

Implements the Fisher Ideal Price Index (geometric mean of Laspeyres and Paasche),
supporting both route-wise Fisher price relatives and composite overall national APIx index.
Uses DGCA passenger traffic shares as route weights, handles missing route data via
dynamic weight re-normalization, and enforces >50% data availability threshold.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import NamedTuple, Optional
import yaml
from loguru import logger

CONFIG_DIR = Path(__file__).parent / "config"

# Official MoSPI CPI Weight for Domestic Air Transport (~0.42% of All-India CPI basket)
AIRFARE_CPI_WEIGHT = 0.0042


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
    """
    Detailed price relative and index breakdown for a single route corridor.
    Maintains full positional backwards compatibility with existing callers.
    """
    route: str
    base_price: float
    current_price: float
    price_relative: float
    weight: float
    normalized_weight: float
    weighted_contribution: float
    # Route-wise Fisher Ideal & Economic Indices
    route_laspeyres: float = 100.0
    route_paasche: float = 100.0
    route_fisher: float = 100.0
    price_change: float = 0.0
    percentage_change: float = 0.0
    cpi_route_contribution: float = 0.0

    def to_dict(self) -> dict:
        return {
            "route": self.route,
            "base_price": self.base_price,
            "current_price": self.current_price,
            "price_relative": self.price_relative,
            "weight": self.weight,
            "normalized_weight": self.normalized_weight,
            "weighted_contribution": self.weighted_contribution,
            "route_laspeyres": self.route_laspeyres,
            "route_paasche": self.route_paasche,
            "route_fisher": self.route_fisher,
            "price_change": self.price_change,
            "percentage_change": self.percentage_change,
            "cpi_route_contribution": self.cpi_route_contribution,
        }


class CalculationResult(NamedTuple):
    """
    Comprehensive APIx index output containing overall Fisher index score,
    Laspeyres, Paasche, route-wise breakdowns, and CPI headline inflation impact.
    """
    index_score: Optional[float]
    routes_included: int
    data_quality_note: Optional[str]
    laspeyres_score: Optional[float] = None
    paasche_score: Optional[float] = None
    breakdown: list[RouteBreakdownItem] = []
    # Enhanced attributes for Route-wise and Overall Fisher analysis
    fisher_score: Optional[float] = None
    route_fisher_indices: dict[str, float] = {}
    overall_change_pct: Optional[float] = None
    cpi_headline_impact: Optional[float] = None

    def get_route_fisher(self, route: str) -> Optional[float]:
        """Return the route-wise Fisher index for a specific corridor (e.g. 'DEL-BOM')."""
        return self.route_fisher_indices.get(route)

    def to_dict(self) -> dict:
        """Serialize result to a dictionary structure suitable for JSON APIs."""
        return {
            "index_score": self.index_score,
            "fisher_score": self.fisher_score or self.index_score,
            "laspeyres_score": self.laspeyres_score,
            "paasche_score": self.paasche_score,
            "routes_included": self.routes_included,
            "overall_change_pct": self.overall_change_pct,
            "cpi_headline_impact": self.cpi_headline_impact,
            "data_quality_note": self.data_quality_note,
            "route_fisher_indices": self.route_fisher_indices,
            "breakdown": [item.to_dict() for item in self.breakdown],
        }

    def format_summary_table(self) -> str:
        """Format an ASCII table summarizing route-wise and overall Fisher index values."""
        if not self.index_score or not self.breakdown:
            return f"Index Calculation Incomplete: {self.data_quality_note}"

        lines = [
            "=======================================================================================================",
            "                       REAL-TIME AIRFARE PRICE INDEX (APIx) — FISHER IDEAL SUMMARY                     ",
            "=======================================================================================================",
            f"{'Route':<10} | {'P_0 (Base)':>10} | {'P_t (Curr)':>10} | {'Δ Price':>9} | {'% Change':>8} | {'Weight':>7} | {'Route Fisher':>12} | {'Contribution':>12}",
            "-----------|------------|------------|-----------|----------|---------|--------------|-------------",
        ]

        for b in self.breakdown:
            sign = "+" if b.price_change >= 0 else "-"
            diff_abs = abs(b.price_change)
            pct_sign = "+" if b.percentage_change >= 0 else ""
            lines.append(
                f"{b.route:<10} | "
                f"₹{b.base_price:>9.2f} | "
                f"₹{b.current_price:>9.2f} | "
                f"{sign}₹{diff_abs:>8.2f} | "
                f"{pct_sign}{b.percentage_change:>6.2f}% | "
                f"{b.normalized_weight*100:>6.1f}% | "
                f"{b.route_fisher:>12.2f} | "
                f"{b.weighted_contribution:>12.2f}"
            )

        lines.append("-------------------------------------------------------------------------------------------------------")
        lines.append(f"  • Laspeyres Index (L):        {self.laspeyres_score:.2f}")
        lines.append(f"  • Paasche Index (P):          {self.paasche_score:.2f}")
        lines.append(f"  • OVERALL FISHER INDEX (APIx): {self.index_score:.2f}  (Base Jan 2026 = 100.00)")
        if self.overall_change_pct is not None:
            sign = "+" if self.overall_change_pct >= 0 else ""
            lines.append(f"  • Overall Market Movement:    {sign}{self.overall_change_pct:.2f}%")
        if self.cpi_headline_impact is not None:
            sign = "+" if self.cpi_headline_impact >= 0 else ""
            lines.append(f"  • MoSPI CPI Headline Impact:  {sign}{self.cpi_headline_impact:.4f} percentage points")
        lines.append(f"  • Corridors Active:           {self.routes_included} routes")
        if self.data_quality_note:
            lines.append(f"  • Notice:                     {self.data_quality_note}")
        lines.append("=======================================================================================================")
        return "\n".join(lines)


class IndexCalculator:
    """Calculates route-wise and overall Fisher Ideal Price Index (APIx)."""

    def __init__(
        self,
        weights: Optional[dict[str, float]] = None,
        min_routes_ratio: float = 0.5,
    ) -> None:
        self.weights = weights or load_dgca_weights()
        self.min_routes_ratio = min_routes_ratio
        self.total_routes_count = len(self.weights)

    def calculate_route_fisher(
        self,
        route: str,
        current_price: float,
        base_price: float,
        current_route_weight: Optional[float] = None,
    ) -> Optional[float]:
        """
        Compute route-wise Fisher Ideal Index for a single corridor.
        For a single route:
            L_i = (P_i,t / P_i,0) * 100
            P_i = (P_i,t / P_i,0) * 100
            F_i = sqrt(L_i * P_i) = (P_i,t / P_i,0) * 100
        """
        if base_price <= 0 or current_price <= 0:
            logger.warning(f"Invalid prices for route '{route}': base={base_price}, current={current_price}")
            return None
        rel = (current_price / base_price) * 100.0
        return round(rel, 2)

    def calculate_index(
        self,
        current_fares: dict[str, float],
        base_fares: dict[str, float],
        current_weights: Optional[dict[str, float]] = None,
    ) -> CalculationResult:
        """
        Compute the overall APIx Fisher Ideal composite score and route-wise breakdowns.

        Formula:
            Route Laspeyres:      L_i = (P_i,t / P_i,0) * 100
            Route Paasche:        P_i = (P_i,t / P_i,0) * 100
            Route Fisher:         F_i = sqrt(L_i * P_i)

            Overall Laspeyres:    L = sum(w'_i * (P_i,t / P_i,0)) * 100
            Overall Paasche:      P = sum(w'_i * (P_i,t / P_i,0)) * 100 (or current-weighted harmonic if current_weights provided)
            Overall Fisher Ideal: F = sqrt(L * P)

        Args:
            current_fares: Dict mapping route (e.g. "DEL-BOM") to P_i,t.
            base_fares: Dict mapping route to P_i,0.
            current_weights: Optional current-period quantity/expenditure weights.

        Returns:
            CalculationResult containing overall index_score, fisher_score, laspeyres,
            paasche, route_fisher_indices dictionary, and RouteBreakdownItem list.
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

        # Re-normalize base weights for active routes
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

        # Build detailed route-wise breakdown items
        breakdown_items: list[RouteBreakdownItem] = []
        route_fisher_indices: dict[str, float] = {}
        laspeyres_sum = 0.0

        for r in active_routes:
            p_base = base_fares[r]
            p_curr = current_fares[r]
            rel = price_relatives[r]
            w_orig = self.weights[r]
            w_norm = normalized_weights[r]
            contrib = w_norm * rel
            laspeyres_sum += contrib

            # Route-wise Fisher metrics
            r_laspeyres = round(rel, 2)
            r_paasche = round(rel, 2)
            r_fisher = round(math.sqrt(r_laspeyres * r_paasche), 2)
            r_diff = round(p_curr - p_base, 2)
            r_pct = round(((p_curr - p_base) / p_base) * 100.0, 2)
            r_cpi_contrib = round((r_fisher - 100.0) * w_norm * AIRFARE_CPI_WEIGHT, 4)

            route_fisher_indices[r] = r_fisher

            breakdown_items.append(
                RouteBreakdownItem(
                    route=r,
                    base_price=round(p_base, 2),
                    current_price=round(p_curr, 2),
                    price_relative=round(rel, 2),
                    weight=round(w_orig, 4),
                    normalized_weight=round(w_norm, 4),
                    weighted_contribution=round(contrib, 2),
                    route_laspeyres=r_laspeyres,
                    route_paasche=r_paasche,
                    route_fisher=r_fisher,
                    price_change=r_diff,
                    percentage_change=r_pct,
                    cpi_route_contribution=r_cpi_contrib,
                )
            )

        laspeyres_score = round(laspeyres_sum, 2)

        # Paasche index: if current period weights are explicitly provided, use current weights
        if current_weights and any(r in current_weights for r in active_routes):
            curr_weight_sum = sum(current_weights.get(r, 0.0) for r in active_routes)
            if curr_weight_sum > 0:
                norm_curr_weights = {
                    r: current_weights.get(r, 0.0) / curr_weight_sum for r in active_routes
                }
                # P = sum(w'_t * (P_t / P_0))
                paasche_score = round(
                    sum(price_relatives[r] * norm_curr_weights[r] for r in active_routes), 2
                )
            else:
                paasche_weighted_sum = sum(
                    (current_fares[r] / base_fares[r]) * normalized_weights[r] for r in active_routes
                )
                paasche_score = round(paasche_weighted_sum * 100.0, 2)
        else:
            # Base-weighted Paasche aggregation
            paasche_weighted_sum = sum(
                (current_fares[r] / base_fares[r]) * normalized_weights[r] for r in active_routes
            )
            paasche_score = round(paasche_weighted_sum * 100.0, 2)

        # Overall Fisher Ideal Price Index = sqrt(Laspeyres * Paasche)
        fisher_score = round(math.sqrt(laspeyres_score * paasche_score), 2)
        overall_change_pct = round(fisher_score - 100.0, 2)
        cpi_headline_impact = round((fisher_score - 100.0) * AIRFARE_CPI_WEIGHT, 4)

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
            fisher_score=fisher_score,
            route_fisher_indices=route_fisher_indices,
            overall_change_pct=overall_change_pct,
            cpi_headline_impact=cpi_headline_impact,
        )
