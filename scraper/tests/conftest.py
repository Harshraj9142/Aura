"""
Shared test fixtures for APIx Scraper tests.

Provides mock objects for browser pages, database sessions,
and sample fare data that can be reused across test modules.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from pipeline.models import FareRecord, Route, SourceTypeEnum


# ---------------------------------------------------------------------------
# Route fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def route_del_bom() -> Route:
    """DEL-BOM test route."""
    return Route(origin="DEL", destination="BOM", name="Delhi–Mumbai")


@pytest.fixture
def route_del_blr() -> Route:
    """DEL-BLR test route."""
    return Route(origin="DEL", destination="BLR", name="Delhi–Bangalore")


# ---------------------------------------------------------------------------
# Sample fare data
# ---------------------------------------------------------------------------
@pytest.fixture
def sample_fare_record(route_del_bom: Route) -> FareRecord:
    """A valid sample fare record."""
    return FareRecord(
        route_origin="DEL",
        route_destination="BOM",
        travel_date=date(2026, 10, 1),
        advance_purchase_days=7,
        source="indigo",
        source_type=SourceTypeEnum.AIRLINE,
        carrier="IndiGo",
        flight_number="6E-2341",
        fare_class="Economy",
        base_fare=3500.0,
        taxes_and_fees=800.0,
        total_fare=4300.0,
        currency="INR",
        scraped_at=datetime(2026, 9, 24, 6, 0, 0),
    )


@pytest.fixture
def sample_fares_batch() -> list[FareRecord]:
    """A batch of sample fares with varying properties for testing."""
    base_date = date(2026, 10, 1)
    now = datetime(2026, 9, 24, 6, 0, 0)

    return [
        # Normal fare
        FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=base_date, advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            carrier="IndiGo", flight_number="6E-2341",
            fare_class="Economy", base_fare=3500.0,
            taxes_and_fees=800.0, total_fare=4300.0,
            currency="INR", scraped_at=now,
        ),
        # High fare (at threshold)
        FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=base_date, advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            carrier="IndiGo", flight_number="6E-5555",
            fare_class="Business", base_fare=40000.0,
            taxes_and_fees=8000.0, total_fare=48000.0,
            currency="INR", scraped_at=now,
        ),
        # Outlier — too cheap
        FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=base_date, advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            carrier="IndiGo", flight_number="6E-0001",
            fare_class="Economy", base_fare=100.0,
            taxes_and_fees=50.0, total_fare=150.0,
            currency="INR", scraped_at=now,
        ),
        # Outlier — too expensive
        FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=base_date, advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            carrier="IndiGo", flight_number="6E-9999",
            fare_class="Economy", base_fare=60000.0,
            taxes_and_fees=15000.0, total_fare=75000.0,
            currency="INR", scraped_at=now,
        ),
        # Inconsistent fare (base + taxes ≠ total)
        FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=base_date, advance_purchase_days=7,
            source="makemytrip", source_type=SourceTypeEnum.OTA,
            carrier="IndiGo", flight_number="6E-1234",
            fare_class="Economy", base_fare=3000.0,
            taxes_and_fees=500.0, total_fare=5000.0,
            currency="INR", scraped_at=now,
        ),
        # Missing carrier and flight number
        FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=base_date, advance_purchase_days=7,
            source="yatra", source_type=SourceTypeEnum.OTA,
            carrier=None, flight_number=None,
            fare_class="Economy",
            total_fare=4500.0, currency="INR", scraped_at=now,
        ),
        # Duplicate of first fare (same dedup key, later scraped_at)
        FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=base_date, advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            carrier="IndiGo", flight_number="6E-2341",
            fare_class="Economy", base_fare=3600.0,
            taxes_and_fees=850.0, total_fare=4450.0,
            currency="INR", scraped_at=datetime(2026, 9, 24, 7, 0, 0),  # 1 hour later
        ),
    ]


# ---------------------------------------------------------------------------
# Mock browser page
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_page() -> AsyncMock:
    """Mock Playwright page for testing scrapers without a real browser."""
    page = AsyncMock()
    page.url = "https://www.goindigo.in/flight/search"
    page.goto = AsyncMock()
    page.close = AsyncMock()
    page.inner_text = AsyncMock(return_value="")
    page.query_selector = AsyncMock(return_value=None)
    page.query_selector_all = AsyncMock(return_value=[])
    page.wait_for_selector = AsyncMock()
    page.keyboard = AsyncMock()
    page.route = AsyncMock()
    page.set_default_timeout = MagicMock()
    return page


# ---------------------------------------------------------------------------
# Mock DB session
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_session() -> MagicMock:
    """Mock SQLAlchemy session."""
    session = MagicMock()
    session.add = MagicMock()
    session.flush = MagicMock()
    session.commit = MagicMock()
    session.rollback = MagicMock()
    session.close = MagicMock()
    session.query = MagicMock()
    return session
