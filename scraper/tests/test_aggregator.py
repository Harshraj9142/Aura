"""
Unit tests for APIx FareAggregator period range calculation
"""

from datetime import date
import pytest
from index.aggregator import FareAggregator


def test_aggregator_daily_range():
    target = date(2026, 9, 15)
    start, end = FareAggregator.get_period_range("daily", target)
    assert start == date(2026, 9, 15)
    assert end == date(2026, 9, 15)


def test_aggregator_weekly_range():
    # 2026-09-15 is a Tuesday
    target = date(2026, 9, 15)
    start, end = FareAggregator.get_period_range("weekly", target)
    # ISO week Monday is 2026-09-14, Sunday is 2026-09-20
    assert start == date(2026, 9, 14)
    assert end == date(2026, 9, 20)


def test_aggregator_monthly_range():
    target = date(2026, 9, 15)
    start, end = FareAggregator.get_period_range("monthly", target)
    assert start == date(2026, 9, 1)
    assert end == date(2026, 9, 30)
