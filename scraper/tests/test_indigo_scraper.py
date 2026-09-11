"""
Tests for scrapers/airlines/indigo_scraper.py — IndiGo scraper.

Uses mock Playwright page responses (no live site access).
Tests the parsing and extraction logic in isolation.
"""

from __future__ import annotations

from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from pipeline.models import Route, SourceTypeEnum
from scrapers.airlines.indigo_scraper import IndiGoScraper
from scrapers.base_scraper import NoFlightsFoundError


class TestIndiGoScraper:
    """Tests for the IndiGo scraper's parsing logic."""

    def setup_method(self):
        self.scraper = IndiGoScraper()
        self.route = Route(origin="DEL", destination="BOM", name="Delhi–Mumbai")
        self.travel_date = date(2026, 10, 1)
        self.advance_days = 7

    # -------------------------------------------------------------------
    # Class attributes
    # -------------------------------------------------------------------
    def test_source_name(self):
        assert self.scraper.source_name == "indigo"

    def test_source_type(self):
        assert self.scraper.source_type == SourceTypeEnum.AIRLINE

    def test_base_url(self):
        assert self.scraper.base_url == "https://www.goindigo.in"

    # -------------------------------------------------------------------
    # URL building
    # -------------------------------------------------------------------
    def test_build_search_url_contains_route(self):
        url = self.scraper._build_search_url(self.route, self.travel_date, self.advance_days)
        assert "DEL" in url
        assert "BOM" in url

    def test_build_search_url_contains_date(self):
        url = self.scraper._build_search_url(self.route, self.travel_date, self.advance_days)
        assert "01/10/2026" in url  # DD/MM/YYYY format

    def test_build_search_url_contains_base_url(self):
        url = self.scraper._build_search_url(self.route, self.travel_date, self.advance_days)
        assert url.startswith("https://www.goindigo.in")

    # -------------------------------------------------------------------
    # City name mapping
    # -------------------------------------------------------------------
    def test_city_name_mapping_del(self):
        assert self.scraper.CITY_NAMES["DEL"] == "New Delhi"

    def test_city_name_mapping_bom(self):
        assert self.scraper.CITY_NAMES["BOM"] == "Mumbai"

    def test_city_name_mapping_blr(self):
        assert self.scraper.CITY_NAMES["BLR"] == "Bengaluru"

    def test_city_name_mapping_all_routes_covered(self):
        """All routes in our config should have city name mappings."""
        required_codes = ["DEL", "BOM", "BLR", "CCU", "HYD", "MAA"]
        for code in required_codes:
            assert code in self.scraper.CITY_NAMES, f"Missing city name for {code}"

    # -------------------------------------------------------------------
    # Fare extraction — no flights
    # -------------------------------------------------------------------
    @pytest.mark.asyncio
    async def test_extract_fares_no_flights_detected(self):
        """When 'no flights' element is visible, should raise NoFlightsFoundError."""
        mock_page = AsyncMock()

        # Mock: no-flights selector is visible
        mock_no_flights = AsyncMock()
        mock_no_flights.is_visible = AsyncMock(return_value=True)

        async def mock_query_selector(selector):
            if "no-flight" in selector or "no-result" in selector:
                return mock_no_flights
            return None

        mock_page.query_selector = mock_query_selector
        mock_page.query_selector_all = AsyncMock(return_value=[])

        with pytest.raises(NoFlightsFoundError):
            await self.scraper._extract_fares(
                mock_page, self.route, self.travel_date, self.advance_days
            )

    # -------------------------------------------------------------------
    # Fare extraction — with flight cards
    # -------------------------------------------------------------------
    @pytest.mark.asyncio
    async def test_extract_fares_parses_cards(self):
        """Flight cards should be parsed into FareRecord objects."""
        mock_page = AsyncMock()

        # Mock: no "no flights" indicator
        mock_page.query_selector = AsyncMock(return_value=None)

        # Mock: flight cards with fare data
        mock_card = AsyncMock()

        async def card_query_selector(selector):
            el = AsyncMock()
            if "flight-number" in selector or "flight-no" in selector:
                el.inner_text = AsyncMock(return_value="6E-2341")
                return el
            elif "fare-amount" in selector or "price" in selector or "total-fare" in selector or "fare-value" in selector:
                el.inner_text = AsyncMock(return_value="₹4,300")
                return el
            elif "base-fare" in selector:
                el.inner_text = AsyncMock(return_value="₹3,500")
                return el
            elif "taxes" in selector:
                el.inner_text = AsyncMock(return_value="₹800")
                return el
            elif "fare-class" in selector or "cabin-class" in selector or "fare-type" in selector:
                el.inner_text = AsyncMock(return_value="Economy")
                return el
            return None

        mock_card.query_selector = card_query_selector

        # Return 1 flight card
        async def mock_query_all(selector):
            if "flight-card" in selector or "flight-row" in selector or "flight-list" in selector or "flight-item" in selector:
                return [mock_card]
            return []

        mock_page.query_selector_all = mock_query_all
        mock_page.inner_text = AsyncMock(return_value="")

        fares = await self.scraper._extract_fares(
            mock_page, self.route, self.travel_date, self.advance_days
        )

        assert len(fares) == 1
        assert fares[0].flight_number == "6E-2341"
        assert fares[0].total_fare == 4300.0
        assert fares[0].base_fare == 3500.0
        assert fares[0].taxes_and_fees == 800.0
        assert fares[0].source == "indigo"
        assert fares[0].carrier == "IndiGo"

    # -------------------------------------------------------------------
    # Fare extraction — text fallback
    # -------------------------------------------------------------------
    @pytest.mark.asyncio
    async def test_text_fallback_extracts_fares(self):
        """When no flight cards found, text fallback should extract fare patterns."""
        mock_page = AsyncMock()
        mock_page.query_selector = AsyncMock(return_value=None)
        mock_page.query_selector_all = AsyncMock(return_value=[])

        # Page text contains fare-like patterns
        mock_page.inner_text = AsyncMock(
            return_value="IndiGo 6E-123 DEL-BOM ₹4,500 ₹3,200 ₹6,800"
        )

        fares = await self.scraper._extract_fares_from_text(
            mock_page, self.route, self.travel_date, self.advance_days
        )

        # Should extract some fare-like values
        assert len(fares) > 0
        for fare in fares:
            assert 500 <= fare.total_fare <= 50000
            assert fare.source == "indigo"

    # -------------------------------------------------------------------
    # Selector registry
    # -------------------------------------------------------------------
    def test_selector_registry_has_required_selectors(self):
        """Ensure all required selectors are defined."""
        required = [
            "SEL_FLIGHT_CARD", "SEL_FLIGHT_NUMBER", "SEL_FARE_AMOUNT",
            "SEL_NO_FLIGHTS", "SEL_SEARCH_BUTTON", "SEL_ORIGIN_INPUT",
            "SEL_DESTINATION_INPUT",
        ]
        for attr in required:
            assert hasattr(self.scraper, attr), f"Missing selector: {attr}"
            assert getattr(self.scraper, attr), f"Empty selector: {attr}"
