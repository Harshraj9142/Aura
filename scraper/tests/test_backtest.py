"""
Unit tests for APIx Backtester module
"""

from pathlib import Path
import pytest
from index.backtest import Backtester, BacktestComparison


def test_backtest_load_reference_fares(tmp_path):
    csv_file = tmp_path / "test_ref.csv"
    csv_file.write_text("route,month,dgca_avg_fare\nDEL-BOM,2026-09,5280.00\n")

    backtester = Backtester(csv_path=csv_file)
    assert ("DEL-BOM", "2026-09") in backtester.reference_fares
    assert backtester.reference_fares[("DEL-BOM", "2026-09")] == 5280.00


def test_backtest_pct_difference(tmp_path):
    csv_file = tmp_path / "test_ref.csv"
    csv_file.write_text("route,month,dgca_avg_fare\nDEL-BOM,2026-09,5000.00\n")

    backtester = Backtester(csv_path=csv_file)

    # Monkeypatch computed average
    backtester.get_computed_monthly_average = lambda r, m: (5500.00, 42)

    res = backtester.run_backtest_comparison("DEL-BOM", "2026-09")
    assert isinstance(res, BacktestComparison)
    assert res.computed_avg_fare == 5500.00
    assert res.dgca_ref_fare == 5000.00
    assert res.pct_difference == 10.0  # +10% difference
    assert res.sample_count == 42
