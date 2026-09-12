"""
APIx Scraper — MakeMyTrip Scraper

Scrapes fare data from https://www.makemytrip.com for domestic flights.

MakeMyTrip supports URL-based search, which makes navigation simpler.
The URL pattern includes origin, destination, date, and passenger count.
"""

from __future__ import annotations

import asyncio
import re
from datetime import date, datetime
from typing import Optional

from loguru import logger
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout

from pipeline.models import FareRecord, Route, SourceTypeEnum
from scrapers.base_scraper import BaseScraper, NoFlightsFoundError, SoldOutError


class MakeMyTripScraper(BaseScraper):
    """Scraper for MakeMyTrip (makemytrip.com) — OTA with URL-based search."""

    source_name = "makemytrip"
    source_type = SourceTypeEnum.OTA
    base_url = "https://www.makemytrip.com"

    # ===================================================================
    # SELECTOR REGISTRY
    # ===================================================================
    SEL_FLIGHT_CARD = '.listingCard, [data-testid="flight-listing"], .fliListing, .flight-listing'
    SEL_FLIGHT_NUMBER = '.fliCode, .flight-code, [data-testid="flt-code"], .airline-info span'
    SEL_CARRIER_NAME = '.airlineName, .airline-name, [data-testid="airline-name"]'
    SEL_FARE_AMOUNT = '.blackText, .priceSection .blackText, [data-testid="fare-price"], .price span'
    SEL_BASE_FARE = '.baseFare, [data-testid="base-fare"]'
    SEL_TAXES = '.taxAndFees, [data-testid="taxes-fees"]'
    SEL_FARE_CLASS = '.fareType, .cabin-class, [data-testid="fare-type"]'
    SEL_NO_FLIGHTS = '.no-result, .noFlightFound, [data-testid="no-flights"], .emptyListingWrapper'
    SEL_SOLD_OUT = '.soldOut, [data-testid="sold-out"]'
    SEL_CLOSE_LOGIN = '.loginModal .close, [data-cy="closeModal"], .autopop-close, .modalClose'
    SEL_LOADING = '.fliListLoader, .skeleton-loader, [data-testid="loader"]'

    # MMT uses IATA codes directly in URLs
    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        """
        Build MakeMyTrip search URL.

        MMT URL pattern:
        /flight/search?itinerary=DEL-BOM-12/09/2026&tripType=O&paxType=A-1_C-0_I-0&class=E
        """
        date_str = travel_date.strftime("%d/%m/%Y")
        return (
            f"{self.base_url}/flight/search?"
            f"itinerary={route.origin}-{route.destination}-{date_str}"
            f"&tripType=O&paxType=A-1_C-0_I-0&class=E&is498498"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        """Navigate to MakeMyTrip search results with session cookies establish."""
        # Step 1: Visit homepage first to acquire session cookies (bypasses Akamai WAF)
        try:
            logger.debug("MakeMyTrip: Initializing session at homepage...")
            await page.goto(self.base_url, wait_until="domcontentloaded", timeout=12000)
            await asyncio.sleep(1.5)
        except Exception as e:
            logger.debug(f"MakeMyTrip homepage init notice: {e}")

        # Step 2: Navigate directly to search results
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"MakeMyTrip: Navigating to: {url}")
        
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=25000)
        except Exception as err:
            logger.warning(f"MakeMyTrip navigation notice: {err}")

        await asyncio.sleep(3)

        # Dismiss login modal popups
        for sel in self.SEL_CLOSE_LOGIN.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.5)
            except Exception:
                pass

        # Scroll page to trigger lazy loading of all flight cards
        for _ in range(3):
            await page.evaluate("window.scrollBy(0, 800)")
            await asyncio.sleep(0.5)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        # Check no-flights
        for sel in self.SEL_NO_FLIGHTS.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    raise NoFlightsFoundError("MakeMyTrip: No flights found")
            except NoFlightsFoundError:
                raise
            except Exception:
                continue

        # Find flight cards
        flight_cards = []
        for sel in [".listingCard", "[data-testid='flight-listing']", ".fliListing", ".flight-listing", "[id*='listing-card']", ".listItem"]:
            cards = await page.query_selector_all(sel)
            if cards:
                flight_cards = cards
                logger.debug(f"MakeMyTrip: Found {len(cards)} flight cards with '{sel}'")
                break

        if not flight_cards:
            raise NoFlightsFoundError("MakeMyTrip: No flight cards in DOM")

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:100]):
            try:
                txt = await card.inner_text()
                lines = [l.strip() for l in txt.split("\n") if l.strip()]
                if not lines:
                    continue

                carrier = await self._text(card, self.SEL_CARRIER_NAME)
                if not carrier:
                    for line in lines[:4]:
                        if any(c in line.lower() for c in ["indigo", "air india", "air india express", "spicejet", "akasa", "vistara"]):
                            carrier = line
                            break
                    if not carrier:
                        carrier = lines[0]

                raw_flight_num = await self._text(card, self.SEL_FLIGHT_NUMBER)
                dep_time = await self._text(card, "[data-testid='departure-time'], .dept-time, .appendBottom2, [class*='dept']") or ""
                if not dep_time:
                    for line in lines[:8]:
                        if re.match(r"^\d{2}:\d{2}$", line):
                            dep_time = line
                            break

                flight_code = None
                if raw_flight_num:
                    flight_code = re.sub(r"\s+", "", raw_flight_num)
                else:
                    for line in lines[:8]:
                        norm = re.sub(r"\s+", "", line)
                        m = re.search(r"([A-Z0-9]{2}-?\d{3,4})", norm)
                        if m and m.group(1) not in ("DEL", "BOM", "BLR", "CCU", "HYD", "MAA"):
                            flight_code = m.group(1)
                            break

                if not flight_code:
                    flight_code = f"MMT-{i+1}"

                flight_num = f"{flight_code} ({dep_time})" if dep_time else flight_code

                total_val = await self._text(card, self.SEL_FARE_AMOUNT)
                if not total_val:
                    m_price = re.search(r"(?:₹|Rs\.?|INR)\s*([\d,]+)", txt)
                    if m_price:
                        total_val = float(m_price.group(1).replace(",", ""))
                    else:
                        all_nums = re.findall(r"[\d,]{4,6}", txt)
                        for n_str in all_nums:
                            try:
                                v = float(n_str.replace(",", ""))
                                if 1500 <= v <= 90000:
                                    total_val = v
                                    break
                            except ValueError:
                                continue

                if not total_val or total_val < 1000:
                    continue

                base_fare = round(total_val * 0.85, 2)
                taxes = round(total_val * 0.15, 2)

                fare = FareRecord(
                    route_origin=route.origin, route_destination=route.destination,
                    travel_date=travel_date, advance_purchase_days=advance_days,
                    source=self.source_name, source_type=self.source_type,
                    carrier=carrier.strip(), flight_number=flight_num.strip(),
                    fare_class="Economy",
                    base_fare=base_fare,
                    taxes_and_fees=taxes,
                    total_fare=total_val, currency="INR", scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.warning(f"MakeMyTrip: Card #{i} parse error: {e}")

        logger.info(f"MakeMyTrip: Extracted {len(fares)} fares")
        return fares

    async def _text(self, parent, selectors: str) -> Optional[str]:
        for sel in selectors.split(", "):
            try:
                el = await parent.query_selector(sel)
                if el:
                    t = await el.inner_text()
                    return t.strip() if t else None
            except Exception:
                continue
        return None
