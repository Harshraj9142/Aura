"""
APIx Scraper — Abstract Base Scraper

Every airline/OTA scraper must inherit from BaseScraper and implement
the `_extract_fares()` method. The base class handles the common flow:

  1. Check robots.txt compliance
  2. Apply rate limiting
  3. Launch browser & navigate
  4. Detect CAPTCHA/bot blocks
  5. Call the subclass's `_extract_fares()` for site-specific parsing
  6. Validate and return results

Retry logic is built-in via tenacity — transient errors (timeouts, network)
are retried with exponential backoff, but CAPTCHA blocks fail fast.

Usage:
    class IndiGoScraper(BaseScraper):
        source_name = "indigo"
        source_type = SourceTypeEnum.AIRLINE
        base_url = "https://www.goindigo.in"

        async def _extract_fares(self, page, route, travel_date, advance_days):
            # ... site-specific parsing logic ...
            return [FareRecord(...), ...]
"""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import Optional
from urllib.parse import urlparse

from loguru import logger
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout
from tenacity import (
    RetryError,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from config.settings import settings
from core.browser_manager import BrowserManager
from core.captcha_detector import CaptchaDetector, CaptchaDetectionResult
from core.rate_limiter import RateLimiter
from core.robots_checker import RobotsChecker
from pipeline.models import (
    FareRecord,
    Route,
    ScrapeResult,
    ScrapeStatus,
    SourceTypeEnum,
)


# ---------------------------------------------------------------------------
# Custom exceptions for retry control
# ---------------------------------------------------------------------------
class CaptchaBlockedError(Exception):
    """Raised when a CAPTCHA/bot-check is detected. Should NOT be retried."""
    pass


class ScrapingTransientError(Exception):
    """Raised for transient errors (timeout, network). Should be retried."""
    pass


class NoFlightsFoundError(Exception):
    """Raised when no flights are found (not an error, just no results)."""
    pass


class SoldOutError(Exception):
    """Raised when all flights are sold out."""
    pass


# ---------------------------------------------------------------------------
# Shared infrastructure instances (reused across all scrapers in a run)
# ---------------------------------------------------------------------------
# These are module-level singletons so all scrapers in a batch run
# share the same rate limiter and robots cache
_rate_limiter = RateLimiter()
_robots_checker = RobotsChecker()
_captcha_detector = CaptchaDetector()


class BaseScraper(ABC):
    """
    Abstract base class for all airline/OTA scrapers.

    Subclasses MUST define:
    - source_name: str (e.g. "indigo")
    - source_type: SourceTypeEnum (AIRLINE or OTA)
    - base_url: str (e.g. "https://www.goindigo.in")

    Subclasses MUST implement:
    - _build_search_url(route, travel_date, advance_days) -> str
    - _extract_fares(page, route, travel_date, advance_days) -> list[FareRecord]

    Optionally override:
    - _navigate_and_search(page, route, travel_date, advance_days) -> None
      (for sites that require a multi-step search flow instead of direct URL)
    """

    # Subclasses MUST set these
    source_name: str = ""
    source_type: SourceTypeEnum = SourceTypeEnum.AIRLINE
    base_url: str = ""

    def __init__(self) -> None:
        self.rate_limiter = _rate_limiter
        self.robots_checker = _robots_checker
        self.captcha_detector = _captcha_detector

    # -----------------------------------------------------------------------
    # Public API — the only method callers should use
    # -----------------------------------------------------------------------
    async def scrape(
        self,
        route: Route,
        travel_date: date,
        advance_days: int,
    ) -> ScrapeResult:
        """
        Scrape fares for a single (route, travel_date, advance_days) combination.

        This is the main entry point. It handles:
        1. robots.txt check
        2. Rate limiting
        3. Browser management
        4. CAPTCHA detection
        5. Retry logic for transient errors
        6. Result packaging

        Returns a ScrapeResult with status and any fares found.
        """
        started_at = datetime.utcnow()

        logger.info(
            f"🔍 Scraping {self.source_name} | "
            f"{route.pair} | T+{advance_days}d | {travel_date}"
        )

        # Step 1: Check robots.txt
        search_url = self._build_search_url(route, travel_date, advance_days)
        if not await self.robots_checker.is_allowed(search_url):
            logger.warning(
                f"🚫 {self.source_name}: robots.txt disallows {search_url} — skipping"
            )
            return self._make_result(
                route, travel_date, advance_days, started_at,
                status=ScrapeStatus.DISALLOWED,
                error_message=f"Disallowed by robots.txt: {search_url}",
            )

        # Step 2-5: Scrape with retry logic
        try:
            fares = await self._scrape_with_retry(
                route, travel_date, advance_days, search_url
            )
            completed_at = datetime.utcnow()

            logger.info(
                f"✅ {self.source_name} | {route.pair} | T+{advance_days}d | "
                f"{len(fares)} fares found | "
                f"{(completed_at - started_at).total_seconds():.1f}s"
            )

            return self._make_result(
                route, travel_date, advance_days, started_at,
                status=ScrapeStatus.SUCCESS,
                fares=fares,
            )

        except CaptchaBlockedError as e:
            logger.error(
                f"🛑 {self.source_name} | {route.pair} | BLOCKED: {e}"
            )
            return self._make_result(
                route, travel_date, advance_days, started_at,
                status=ScrapeStatus.BLOCKED,
                error_message=str(e),
                error_type="CaptchaBlocked",
            )

        except NoFlightsFoundError:
            logger.info(
                f"✈️ {self.source_name} | {route.pair} | T+{advance_days}d | "
                f"No flights found"
            )
            return self._make_result(
                route, travel_date, advance_days, started_at,
                status=ScrapeStatus.NO_FLIGHTS,
            )

        except SoldOutError:
            logger.info(
                f"🚫 {self.source_name} | {route.pair} | T+{advance_days}d | "
                f"All flights sold out"
            )
            return self._make_result(
                route, travel_date, advance_days, started_at,
                status=ScrapeStatus.SOLD_OUT,
            )

        except RetryError as e:
            # All retry attempts exhausted
            original = e.last_attempt.exception() if e.last_attempt else e
            logger.error(
                f"❌ {self.source_name} | {route.pair} | T+{advance_days}d | "
                f"All retries exhausted: {original}"
            )
            return self._make_result(
                route, travel_date, advance_days, started_at,
                status=ScrapeStatus.FAILED,
                error_message=str(original),
                error_type=type(original).__name__,
            )

        except Exception as e:
            logger.error(
                f"❌ {self.source_name} | {route.pair} | T+{advance_days}d | "
                f"Unexpected error: {e}"
            )
            return self._make_result(
                route, travel_date, advance_days, started_at,
                status=ScrapeStatus.FAILED,
                error_message=str(e),
                error_type=type(e).__name__,
            )

    # -----------------------------------------------------------------------
    # Retry-wrapped scraping logic
    # -----------------------------------------------------------------------
    @retry(
        retry=retry_if_exception_type(ScrapingTransientError),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        reraise=True,
    )
    async def _scrape_with_retry(
        self,
        route: Route,
        travel_date: date,
        advance_days: int,
        search_url: str,
    ) -> list[FareRecord]:
        """
        Core scraping logic wrapped with tenacity retry.

        Retries on ScrapingTransientError (timeouts, network).
        Does NOT retry on CaptchaBlockedError, NoFlightsFoundError,
        or SoldOutError — those fail/return immediately.
        """
        domain = urlparse(self.base_url).netloc

        async with self.rate_limiter.throttle(domain):
            async with BrowserManager() as browser:
                page = await browser.new_page_full()

                try:
                    # Navigate to the search page
                    await self._navigate_and_search(
                        page, route, travel_date, advance_days
                    )

                    # Check for CAPTCHA/bot detection
                    detection = await self.captcha_detector.check(page)
                    if detection.is_blocked:
                        raise CaptchaBlockedError(
                            f"{detection.block_type}: {detection.details}"
                        )

                    # Extract fares (subclass-specific logic)
                    fares = await self._extract_fares(
                        page, route, travel_date, advance_days
                    )
                    return fares

                except PlaywrightTimeout as e:
                    logger.warning(
                        f"⏱️ {self.source_name} | {route.pair} | Timeout: {e}"
                    )
                    raise ScrapingTransientError(f"Timeout: {e}") from e

                except CaptchaBlockedError:
                    raise  # Don't wrap — let it propagate without retry

                except NoFlightsFoundError:
                    raise  # Don't retry

                except SoldOutError:
                    raise  # Don't retry

                except ConnectionError as e:
                    logger.warning(
                        f"🌐 {self.source_name} | {route.pair} | Network error: {e}"
                    )
                    raise ScrapingTransientError(f"Network error: {e}") from e

                except Exception as e:
                    # Unknown errors are treated as transient for retry
                    if "net::" in str(e).lower() or "timeout" in str(e).lower():
                        raise ScrapingTransientError(str(e)) from e
                    raise

                finally:
                    await page.close()

    # -----------------------------------------------------------------------
    # Methods for subclasses to implement/override
    # -----------------------------------------------------------------------
    @abstractmethod
    def _build_search_url(
        self, route: Route, travel_date: date, advance_days: int
    ) -> str:
        """
        Build the search URL for the given route and date.

        Subclasses MUST implement this. The URL is used for:
        1. robots.txt compliance checks
        2. Direct navigation (if _navigate_and_search is not overridden)

        Returns:
            Full URL string for the flight search results page.
        """
        ...

    @abstractmethod
    async def _extract_fares(
        self,
        page: Page,
        route: Route,
        travel_date: date,
        advance_days: int,
    ) -> list[FareRecord]:
        """
        Extract fare records from the loaded search results page.

        Subclasses MUST implement this with site-specific DOM parsing.

        Args:
            page: Playwright Page with search results loaded.
            route: The route being scraped.
            travel_date: Date of travel.
            advance_days: Advance purchase window.

        Returns:
            List of FareRecord instances (may be empty if no fares found).

        Raises:
            NoFlightsFoundError: If the page explicitly says no flights found.
            SoldOutError: If all flights are sold out.
        """
        ...

    async def _navigate_and_search(
        self,
        page: Page,
        route: Route,
        travel_date: date,
        advance_days: int,
    ) -> None:
        """
        Navigate to the search page and trigger a search.

        Default implementation: go directly to the URL from _build_search_url().
        Override this for sites that require a multi-step search flow
        (fill form → click search → wait for results).

        Args:
            page: Playwright Page to navigate.
            route: The route to search.
            travel_date: Date of travel.
            advance_days: Advance purchase window.
        """
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"Navigating to: {url}")

        response = await page.goto(url, wait_until="domcontentloaded", timeout=settings.browser_timeout)

        # Check response status
        if response and response.status >= 400:
            headers = {k: v for k, v in response.headers.items()}
            status_check = await self.captcha_detector.check_response_status(
                response.status, headers, urlparse(self.base_url).netloc
            )
            if status_check.is_blocked:
                # Handle Retry-After for rate limiting
                retry_after = headers.get("retry-after")
                if retry_after:
                    self.rate_limiter.set_retry_after_from_header(
                        self.base_url, retry_after
                    )
                raise CaptchaBlockedError(
                    f"{status_check.block_type}: {status_check.details}"
                )

    # -----------------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------------
    def _make_result(
        self,
        route: Route,
        travel_date: date,
        advance_days: int,
        started_at: datetime,
        status: ScrapeStatus,
        fares: Optional[list[FareRecord]] = None,
        error_message: Optional[str] = None,
        error_type: Optional[str] = None,
    ) -> ScrapeResult:
        """Build a ScrapeResult with timing information."""
        completed_at = datetime.utcnow()
        return ScrapeResult(
            route=route,
            source=self.source_name,
            source_type=self.source_type,
            advance_days=advance_days,
            travel_date=travel_date,
            status=status,
            fares=fares or [],
            started_at=started_at,
            completed_at=completed_at,
            duration_seconds=(completed_at - started_at).total_seconds(),
            error_message=error_message,
            error_type=error_type,
        )
