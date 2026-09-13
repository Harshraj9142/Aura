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

    async def _extract_fares_from_body_text(
        self,
        page: Page,
        route: Route,
        travel_date: date,
        advance_days: int,
        carrier_name: str = "Unknown",
        flight_code_prefix: str = "",
    ) -> list[FareRecord]:
        """
        Universal fallback: extract fare data from page DOM elements or body text.

        Uses a multi-tier strategy:
        1. Query selector probe for common flight card classes/attributes across OTAs & airlines.
        2. Ancestor container discovery from leaf elements containing '₹' or currency symbols.
        3. Line-by-line textual stream partitioning on price/action boundaries.

        Operates safely without throwing, returning all valid FareRecords found.
        """
        import re as _re

        # Run multi-tier card extractor directly inside the browser context
        card_texts: list[str] = []
        try:
            card_texts = await page.evaluate("""() => {
                const results = [];

                // Tier 1: Search standard flight card selector patterns
                const selectors = [
                    '.nw_listing_bx',
                    '[data-testid*="flight"]',
                    '[data-testid*="Flight"]',
                    '[class*="flight-card"]',
                    '[class*="flightCard"]',
                    '[class*="FlightCard"]',
                    '[class*="flight_card"]',
                    '[class*="flight-item"]',
                    '[class*="flightItem"]',
                    '[class*="FlightItem"]',
                    '[class*="flight-row"]',
                    '[class*="flightRow"]',
                    '[class*="listing-card"]',
                    '[class*="listingCard"]',
                    '[class*="result-card"]',
                    '[class*="result-row"]',
                    '[class*="itinerary"]',
                    'div[class*="listing"]',
                    'div[class*="Listing"]',
                    'div.mb-2.bg-white',
                    'div[class*="ba-solid"]'
                ];

                for (const sel of selectors) {
                    try {
                        const els = Array.from(document.querySelectorAll(sel));
                        if (els.length >= 2) {
                            const valid = els
                                .map(e => (e.innerText || '').trim())
                                .filter(t => t.length > 20 && (t.includes('₹') || /INR|Rs\.?|\\b\\d{4,5}\\b/.test(t)));
                            if (valid.length >= 2) {
                                return valid.slice(0, 150);
                            }
                        }
                    } catch(e) {}
                }

                // Tier 2: Find all leaf elements containing '₹' and grab card-like parent container
                const priceElements = Array.from(document.querySelectorAll('*')).filter(el => {
                    return el.children.length === 0 && (el.innerText || '').includes('₹');
                });

                const seenContainers = new Set();
                for (const pEl of priceElements) {
                    let curr = pEl.parentElement;
                    let candidate = null;
                    while (curr && curr !== document.body) {
                        const rect = curr.getBoundingClientRect();
                        if (rect.height >= 40 && rect.height <= 600 && rect.width >= 200) {
                            candidate = curr;
                            if (curr.parentElement) {
                                const pRect = curr.parentElement.getBoundingClientRect();
                                if (pRect.height > 600) {
                                    break;
                                }
                            }
                        }
                        curr = curr.parentElement;
                    }
                    if (candidate && !seenContainers.has(candidate)) {
                        seenContainers.add(candidate);
                        const txt = (candidate.innerText || '').trim();
                        if (txt.length > 20) {
                            results.push(txt);
                        }
                    }
                }

                if (results.length >= 2) {
                    return results.slice(0, 150);
                }

                // Tier 3: Partition document.body.innerText on price or button boundaries
                const bodyText = document.body ? document.body.innerText : '';
                const lines = bodyText.split('\\n').map(l => l.trim()).filter(Boolean);
                const groups = [];
                let current = [];
                for (const line of lines) {
                    current.push(line);
                    if (line.includes('₹') || /^(Book|Select|View Fares|Lock Fare)/i.test(line)) {
                        if (current.length >= 3) {
                            groups.push(current.join('\\n'));
                            current = [];
                        }
                    }
                }
                if (current.length >= 3) {
                    groups.push(current.join('\\n'));
                }
                return groups.slice(0, 150);
            }""")
        except Exception as e:
            logger.debug(f"Body text extraction evaluate error: {e}")

        if not card_texts:
            try:
                body = await page.evaluate("() => document.body.innerText")
                if body:
                    card_texts = _re.split(r"\\n{2,}", body)
            except Exception:
                return []

        # Known carrier keywords for auto-detection
        CARRIER_KEYWORDS = {
            "indigo": "IndiGo", "6e": "IndiGo",
            "air india express": "Air India Express", "ix": "Air India Express",
            "air india": "Air India", "ai": "Air India",
            "spicejet": "SpiceJet", "sg": "SpiceJet",
            "akasa": "Akasa Air", "qp": "Akasa Air",
            "vistara": "Vistara", "uk": "Vistara",
            "alliance air": "Alliance Air", "9i": "Alliance Air",
            "fly91": "FLY91", "star air": "Star Air",
        }

        fares: list[FareRecord] = []
        seen_keys: set[str] = set()

        for i, chunk in enumerate(card_texts):
            if not chunk or len(chunk.strip()) < 10:
                continue

            # Price extraction: try ₹ first, then Rs./INR, then 4-5 digit numbers
            m_price = _re.search(r"₹\s*([\d,]+)", chunk)
            total_val: float | None = None
            if m_price:
                try:
                    total_val = float(m_price.group(1).replace(",", ""))
                except ValueError:
                    pass
            
            if not total_val:
                m_rs = _re.search(r"(?:Rs\.?|INR)\s*([\d,]+)", chunk, _re.I)
                if m_rs:
                    try:
                        total_val = float(m_rs.group(1).replace(",", ""))
                    except ValueError:
                        pass

            if not total_val:
                # Search 4-5 digit numbers matching typical domestic fares
                candidates = _re.findall(r"\b(\d{1,2},\d{3}|\d{4,5})\b", chunk)
                for cand in candidates:
                    try:
                        v = float(cand.replace(",", ""))
                        if 1500 <= v <= 90000:
                            total_val = v
                            break
                    except ValueError:
                        continue

            if not total_val or total_val < 1000 or total_val > 90000:
                continue

            lines = [l.strip() for l in chunk.split("\n") if l.strip()]

            # Detect carrier
            detected_carrier = carrier_name
            for line in lines[:5]:
                low = line.lower()
                matched = False
                for kw, name in CARRIER_KEYWORDS.items():
                    if kw in low:
                        detected_carrier = name
                        matched = True
                        break
                if matched:
                    break

            # Detect flight code & departure time
            flight_code = None
            dep_time = ""
            for line in lines[:10]:
                norm = _re.sub(r"\s+", "", line)
                m_code = _re.search(r"((?:6E|SG|QP|AI|IX|I5|UK|G8|S5|9I|2T)\s*-?\s*\d{3,4})", norm, _re.I)
                if m_code:
                    flight_code = _re.sub(r"\s+", "", m_code.group(1)).upper()

                if not dep_time and _re.match(r"^\d{2}:\d{2}$", line):
                    dep_time = line

            if not flight_code:
                if flight_code_prefix:
                    flight_code = f"{flight_code_prefix}-{1000 + i}"
                else:
                    flight_code = f"FLT-{i+1}"

            flight_num = f"{flight_code} ({dep_time})" if dep_time else flight_code

            # Dedup key
            dedup_key = f"{flight_code}|{dep_time}|{total_val}"
            if dedup_key in seen_keys:
                continue
            seen_keys.add(dedup_key)

            base_fare = round(total_val * 0.85, 2)
            taxes = round(total_val * 0.15, 2)

            try:
                fare = FareRecord(
                    route_origin=route.origin,
                    route_destination=route.destination,
                    travel_date=travel_date,
                    advance_purchase_days=advance_days,
                    source=self.source_name,
                    source_type=self.source_type,
                    carrier=detected_carrier,
                    flight_number=flight_num,
                    fare_class="Economy",
                    base_fare=base_fare,
                    taxes_and_fees=taxes,
                    total_fare=total_val,
                    currency="INR",
                    scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception:
                continue

        return fares

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
