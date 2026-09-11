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
