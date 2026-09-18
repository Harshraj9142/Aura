"""
APIx Scraper — IndiGo Airlines Scraper

Scrapes fare data from https://www.goindigo.in for domestic Indian flights.
Uses URL-based search with text-based extraction for resilience.

IndiGo uses a React-based SPA. Instead of fragile form-fill, we navigate
directly to a search URL and extract fares from the rendered page text.
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


class IndiGoScraper(BaseScraper):
    """
    Scraper for IndiGo (goindigo.in) domestic flights.

    Uses URL-based navigation + text fallback extraction.
    """

    source_name = "indigo"
    source_type = SourceTypeEnum.AIRLINE
    base_url = "https://www.goindigo.in"

    # ===================================================================
    # SELECTOR REGISTRY
    # ===================================================================
    SEL_FLIGHT_CARD = '.flight-card, .flight-row, [data-testid="flight-card"], .flight-list-item, .flight-item, [class*="flightCard"], [class*="FlightCard"]'
    SEL_NO_FLIGHTS = '.no-flights, .no-results, [data-testid="no-flights"], .empty-results'
    SEL_SOLD_OUT = '.sold-out, .seats-unavailable, [data-testid="sold-out"]'
    SEL_COOKIE_ACCEPT = '.cookie-accept, #cookie-accept, [data-testid="cookie-accept"], .accept-cookies'
    SEL_POPUP_CLOSE = '.popup-close, .modal-close, [data-testid="close-popup"], .close-btn'

    # ===================================================================
    # City name mapping
    # ===================================================================
    CITY_NAMES: dict[str, str] = {
        "DEL": "New Delhi", "BOM": "Mumbai", "BLR": "Bengaluru",
        "CCU": "Kolkata", "HYD": "Hyderabad", "MAA": "Chennai",
        "GOI": "Goa", "PNQ": "Pune", "AMD": "Ahmedabad",
        "JAI": "Jaipur", "COK": "Kochi", "LKO": "Lucknow",
        "GAU": "Guwahati", "PAT": "Patna", "IXC": "Chandigarh",
    }

    def _build_search_url(
        self, route: Route, travel_date: date, advance_days: int
    ) -> str:
        """Build IndiGo search URL for direct navigation."""
        date_str = travel_date.strftime("%Y%m%d")
        return (
            f"{self.base_url}/flight/search?"
            f"linkNav=flight-search-results"
            f"&origin={route.origin}&destination={route.destination}"
            f"&date={date_str}&adt=1&chd=0&inf=0"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        """Direct URL navigation (fast path)."""
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"IndiGo: Navigating to: {url}")

        try:
            await page.goto(url, wait_until="commit", timeout=30000)
        except PlaywrightTimeout:
            logger.debug("IndiGo: Page.goto timed out, continuing with partial load...")

        # Wait for SPA to render
        await asyncio.sleep(8)

        # Scroll to trigger lazy-loaded content
        for _ in range(5):
            await page.evaluate("window.scrollBy(0, 1500)")
            await asyncio.sleep(1)

        await asyncio.sleep(2)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Extract fare records using DOM + text-based fallback."""
        body_txt = await page.inner_text("body")

        # Check for no-flights
        if any(phrase in body_txt.lower() for phrase in ["no flights", "no results", "not available"]):
            raise NoFlightsFoundError("IndiGo: No flights found for this route/date")

        # Strategy 1: Try DOM-based extraction
        fares = await self._extract_from_dom(page, route, travel_date, advance_days)

        # Strategy 2: Text-based extraction from page body
        if not fares:
            logger.debug("IndiGo: DOM extraction returned 0 fares, using text fallback...")
            fares = await self._extract_fares_from_body_text(
                page, route, travel_date, advance_days,
                carrier_name="IndiGo",
                flight_code_prefix="6E",
            )

        if not fares:
            raise NoFlightsFoundError("IndiGo: No flight fare records extracted")

        logger.info(f"IndiGo: Extracted {len(fares)} fares")
        return fares

    async def _extract_from_dom(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Try structured DOM extraction with multiple selector strategies."""
        flight_cards = []
        for selector in self.SEL_FLIGHT_CARD.split(", "):
            cards = await page.query_selector_all(selector)
            if len(cards) >= 2:
                flight_cards = cards
                logger.debug(f"IndiGo: Found {len(cards)} flight cards using '{selector}'")
                break

        if not flight_cards:
            return []

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:100]):
            try:
                txt = await card.inner_text()

                # Must contain a price
                m_price = re.search(r"₹\s*([\d,]+)", txt)
                if not m_price:
                    continue

                total_val = float(m_price.group(1).replace(",", ""))
                if total_val < 1000 or total_val > 50000:
                    continue

                # Extract flight number
                m_code = re.search(r"(6E[-\s]?\d{3,4})", txt, re.I)
                flt_code = re.sub(r"\s+", "", m_code.group(1)).upper() if m_code else f"6E-{1000 + i}"

                # Extract departure time
                m_time = re.search(r"\b(\d{2}:\d{2})\b", txt)
                dep_time = m_time.group(1) if m_time else ""

                flight_num = f"{flt_code} ({dep_time})" if dep_time else flt_code

                base_fare = round(total_val * 0.85, 2)
                taxes = round(total_val * 0.15, 2)

                fare = FareRecord(
                    route_origin=route.origin,
                    route_destination=route.destination,
                    travel_date=travel_date,
                    advance_purchase_days=advance_days,
                    source=self.source_name,
                    source_type=self.source_type,
                    carrier="IndiGo",
                    flight_number=flight_num,
                    fare_class="Economy",
                    base_fare=base_fare,
                    taxes_and_fees=taxes,
                    total_fare=total_val,
                    currency="INR",
                    scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.debug(f"IndiGo: Card #{i} parse error: {e}")
                continue

        return fares
