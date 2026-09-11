"""
Tests for scrapers/base_scraper.py — BaseScraper abstract class.

Tests the common scraping flow including robots.txt checks,
rate limiting hooks, CAPTCHA detection, and error handling.
"""

from __future__ import annotations

from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from pipeline.models import FareRecord, Route, ScrapeStatus, SourceTypeEnum
from scrapers.base_scraper import (
    BaseScraper,
    CaptchaBlockedError,
    NoFlightsFoundError,
    ScrapingTransientError,
    SoldOutError,
)


# ---------------------------------------------------------------------------
# Concrete test scraper (minimal implementation)
# ---------------------------------------------------------------------------
class FakeTestScraper(BaseScraper):
    """Minimal concrete scraper for testing base class behavior."""

    source_name = "test_scraper"
    source_type = SourceTypeEnum.AIRLINE
    base_url = "https://www.example.com"

    def __init__(self, fares_to_return=None, error_to_raise=None):
        super().__init__()
        self._fares = fares_to_return or []
        self._error = error_to_raise

    def _build_search_url(self, route, travel_date, advance_days) -> str:
        return f"{self.base_url}/search?from={route.origin}&to={route.destination}"

    async def _extract_fares(self, page, route, travel_date, advance_days):
        if self._error:
            raise self._error
        return self._fares


class TestBaseScraper:
    """Tests for the BaseScraper abstract class."""

    # -------------------------------------------------------------------
    # Scrape result structure
    # -------------------------------------------------------------------
    @pytest.mark.asyncio
    async def test_successful_scrape_returns_success_status(self, route_del_bom):
        """A scrape with valid fares should return SUCCESS status."""
        fare = FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=date(2026, 10, 1), advance_purchase_days=7,
            source="test_scraper", source_type=SourceTypeEnum.AIRLINE,
            carrier="Test", flight_number="TS-001",
            total_fare=4500.0, currency="INR",
            scraped_at=datetime.utcnow(),
        )
        scraper = FakeTestScraper(fares_to_return=[fare])

        # Mock the browser and infrastructure
        with (
            patch("scrapers.base_scraper._robots_checker") as mock_robots,
            patch("scrapers.base_scraper._rate_limiter") as mock_limiter,
            patch("scrapers.base_scraper._captcha_detector") as mock_captcha,
            patch("scrapers.base_scraper.BrowserManager") as mock_browser_cls,
        ):
            mock_robots.is_allowed = AsyncMock(return_value=True)

            # Mock rate limiter context manager
            mock_limiter.throttle = MagicMock()
            mock_limiter.throttle.return_value.__aenter__ = AsyncMock()
            mock_limiter.throttle.return_value.__aexit__ = AsyncMock(return_value=False)

            # Mock captcha detector
            mock_captcha_result = MagicMock()
            mock_captcha_result.is_blocked = False
            mock_captcha.check = AsyncMock(return_value=mock_captcha_result)

            # Mock browser
            mock_browser = AsyncMock()
            mock_page = AsyncMock()
            mock_page.goto = AsyncMock(return_value=MagicMock(status=200, headers={}))
            mock_page.close = AsyncMock()
            mock_page.set_default_timeout = MagicMock()
            mock_page.route = AsyncMock()
            mock_browser.new_page_full = AsyncMock(return_value=mock_page)
            mock_browser_cls.return_value.__aenter__ = AsyncMock(return_value=mock_browser)
            mock_browser_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            # Update scraper's references to use mocked instances
            scraper.robots_checker = mock_robots
            scraper.rate_limiter = mock_limiter
            scraper.captcha_detector = mock_captcha

            result = await scraper.scrape(route_del_bom, date(2026, 10, 1), 7)

            assert result.status == ScrapeStatus.SUCCESS
            assert len(result.fares) == 1
            assert result.fares[0].total_fare == 4500.0
            assert result.duration_seconds is not None

    # -------------------------------------------------------------------
    # robots.txt blocking
    # -------------------------------------------------------------------
    @pytest.mark.asyncio
    async def test_robots_txt_disallowed(self, route_del_bom):
        """If robots.txt disallows the URL, status should be DISALLOWED."""
        scraper = FakeTestScraper()

        with patch("scrapers.base_scraper._robots_checker") as mock_robots:
            mock_robots.is_allowed = AsyncMock(return_value=False)
            scraper.robots_checker = mock_robots

            result = await scraper.scrape(route_del_bom, date(2026, 10, 1), 7)
            assert result.status == ScrapeStatus.DISALLOWED

    # -------------------------------------------------------------------
    # CAPTCHA / block handling
    # -------------------------------------------------------------------
    @pytest.mark.asyncio
    async def test_captcha_detected_returns_blocked(self, route_del_bom):
        """CAPTCHA detection should result in BLOCKED status."""
        scraper = FakeTestScraper(error_to_raise=CaptchaBlockedError("CAPTCHA found"))

        with (
            patch("scrapers.base_scraper._robots_checker") as mock_robots,
            patch("scrapers.base_scraper._rate_limiter") as mock_limiter,
            patch("scrapers.base_scraper._captcha_detector") as mock_captcha,
            patch("scrapers.base_scraper.BrowserManager") as mock_browser_cls,
        ):
            mock_robots.is_allowed = AsyncMock(return_value=True)
            mock_limiter.throttle = MagicMock()
            mock_limiter.throttle.return_value.__aenter__ = AsyncMock()
            mock_limiter.throttle.return_value.__aexit__ = AsyncMock(return_value=False)

            mock_captcha_result = MagicMock()
            mock_captcha_result.is_blocked = False
            mock_captcha.check = AsyncMock(return_value=mock_captcha_result)

            mock_browser = AsyncMock()
            mock_page = AsyncMock()
            mock_page.goto = AsyncMock(return_value=MagicMock(status=200, headers={}))
            mock_page.close = AsyncMock()
            mock_page.set_default_timeout = MagicMock()
            mock_page.route = AsyncMock()
            mock_browser.new_page_full = AsyncMock(return_value=mock_page)
            mock_browser_cls.return_value.__aenter__ = AsyncMock(return_value=mock_browser)
            mock_browser_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            scraper.robots_checker = mock_robots
            scraper.rate_limiter = mock_limiter
            scraper.captcha_detector = mock_captcha

            result = await scraper.scrape(route_del_bom, date(2026, 10, 1), 7)
            assert result.status == ScrapeStatus.BLOCKED

    # -------------------------------------------------------------------
    # No flights found
    # -------------------------------------------------------------------
    @pytest.mark.asyncio
    async def test_no_flights_returns_no_flights_status(self, route_del_bom):
        """NoFlightsFoundError should result in NO_FLIGHTS status."""
        scraper = FakeTestScraper(error_to_raise=NoFlightsFoundError("No flights"))

        with (
            patch("scrapers.base_scraper._robots_checker") as mock_robots,
            patch("scrapers.base_scraper._rate_limiter") as mock_limiter,
            patch("scrapers.base_scraper._captcha_detector") as mock_captcha,
            patch("scrapers.base_scraper.BrowserManager") as mock_browser_cls,
        ):
            mock_robots.is_allowed = AsyncMock(return_value=True)
            mock_limiter.throttle = MagicMock()
            mock_limiter.throttle.return_value.__aenter__ = AsyncMock()
            mock_limiter.throttle.return_value.__aexit__ = AsyncMock(return_value=False)

            mock_captcha_result = MagicMock()
            mock_captcha_result.is_blocked = False
            mock_captcha.check = AsyncMock(return_value=mock_captcha_result)

            mock_browser = AsyncMock()
            mock_page = AsyncMock()
            mock_page.goto = AsyncMock(return_value=MagicMock(status=200, headers={}))
            mock_page.close = AsyncMock()
            mock_page.set_default_timeout = MagicMock()
            mock_page.route = AsyncMock()
            mock_browser.new_page_full = AsyncMock(return_value=mock_page)
            mock_browser_cls.return_value.__aenter__ = AsyncMock(return_value=mock_browser)
            mock_browser_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            scraper.robots_checker = mock_robots
            scraper.rate_limiter = mock_limiter
            scraper.captcha_detector = mock_captcha

            result = await scraper.scrape(route_del_bom, date(2026, 10, 1), 7)
            assert result.status == ScrapeStatus.NO_FLIGHTS

    # -------------------------------------------------------------------
    # URL building
    # -------------------------------------------------------------------
    def test_build_search_url(self, route_del_bom):
        """Verify URL is correctly constructed."""
        scraper = FakeTestScraper()
        url = scraper._build_search_url(route_del_bom, date(2026, 10, 1), 7)
        assert "example.com" in url
        assert "DEL" in url
        assert "BOM" in url
