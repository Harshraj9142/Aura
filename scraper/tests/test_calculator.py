"""
Unit tests for APIx IndexCalculator module
Covering:
  1. Normal full dataset calculation (base = 100)
  2. Single missing route case (weight re-normalization)
  3. >50% missing routes case (null index score fallback)
"""

import pytest
from index.calculator import IndexCalculator, CalculationResult


@pytest.fixture
def mock_weights():
    return {
        "DEL-BOM": 0.40,
        "DEL-BLR": 0.30,
        "BOM-BLR": 0.30,
    }


@pytest.fixture
def mock_base_fares():
    return {
        "DEL-BOM": 5000.0,
        "DEL-BLR": 6000.0,
        "BOM-BLR": 4000.0,
    }


def test_calculator_normal_case(mock_weights, mock_base_fares):
    calculator = IndexCalculator(weights=mock_weights, min_routes_ratio=0.5)

    # Prices increased by 10% on all routes
    current_fares = {
        "DEL-BOM": 5500.0, # 110.0
        "DEL-BLR": 6600.0, # 110.0
        "BOM-BLR": 4400.0, # 110.0
    }

    result = calculator.calculate_index(current_fares, mock_base_fares)

    assert isinstance(result, CalculationResult)
    assert result.index_score == 110.0
    assert result.routes_included == 3
    assert result.data_quality_note is None


def test_calculator_single_missing_route_renormalization(mock_weights, mock_base_fares):
    calculator = IndexCalculator(weights=mock_weights, min_routes_ratio=0.5)

    # BOM-BLR is missing from current_fares
    current_fares = {
        "DEL-BOM": 5000.0, # 100.0
        "DEL-BLR": 7200.0, # 120.0
    }

    # DEL-BOM weight = 0.40 / 0.70 = 0.571428...
    # DEL-BLR weight = 0.30 / 0.70 = 0.428571...
    # Expected index = 0.571428 * 100 + 0.428571 * 120 = 57.1428 + 51.4285 = 108.57

    result = calculator.calculate_index(current_fares, mock_base_fares)

    assert result.index_score == 108.57
    assert result.routes_included == 2
    assert "1 of 3 routes missing (BOM-BLR)" in result.data_quality_note
    assert "re-normalized" in result.data_quality_note


def test_calculator_more_than_50_percent_missing(mock_weights, mock_base_fares):
    calculator = IndexCalculator(weights=mock_weights, min_routes_ratio=0.5)

    # 2 out of 3 routes missing (only 1 available = 33% < 50%)
    current_fares = {
        "DEL-BOM": 5500.0,
    }

    result = calculator.calculate_index(current_fares, mock_base_fares)

    assert result.index_score is None
    assert result.routes_included == 1
    assert "Insufficient data: >50% routes missing" in result.data_quality_note


def test_calculator_route_wise_and_overall_fisher(mock_weights, mock_base_fares):
    calculator = IndexCalculator(weights=mock_weights)

    # Different changes per route:
    # DEL-BOM: 5000 -> 6000 (+20%, index 120.0, weight 0.40)
    # DEL-BLR: 6000 -> 6300 (+5%, index 105.0, weight 0.30)
    # BOM-BLR: 4000 -> 3800 (-5%, index 95.0, weight 0.30)
    current_fares = {
        "DEL-BOM": 6000.0,
        "DEL-BLR": 6300.0,
        "BOM-BLR": 3800.0,
    }

    result = calculator.calculate_index(current_fares, mock_base_fares)

    # Route-wise Fisher verification
    assert result.route_fisher_indices["DEL-BOM"] == 120.0
    assert result.route_fisher_indices["DEL-BLR"] == 105.0
    assert result.route_fisher_indices["BOM-BLR"] == 95.0
    assert result.get_route_fisher("DEL-BOM") == 120.0

    # Overall Fisher verification: 0.4*120 + 0.3*105 + 0.3*95 = 48 + 31.5 + 28.5 = 108.0
    assert result.laspeyres_score == 108.0
    assert result.paasche_score == 108.0
    assert result.fisher_score == 108.0
    assert result.index_score == 108.0
    assert result.overall_change_pct == 8.0

    # Route breakdown item attributes
    del_bom_item = next(b for b in result.breakdown if b.route == "DEL-BOM")
    assert del_bom_item.price_change == 1000.0
    assert del_bom_item.percentage_change == 20.0
    assert del_bom_item.route_fisher == 120.0

    # Table and serialization methods
    summary_table = result.format_summary_table()
    assert "DEL-BOM" in summary_table
    assert "OVERALL FISHER INDEX (APIx)" in summary_table

    serialized = result.to_dict()
    assert serialized["fisher_score"] == 108.0
    assert "DEL-BOM" in serialized["route_fisher_indices"]

