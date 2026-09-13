"""
APIx Scraper — Akasa Air Scraper

Scrapes fare data from https://www.akasaair.com for domestic flights.
Uses URL-based search with text-based extraction for resilience.
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


class AkasaScraper(BaseScraper):
    """Scraper for Akasa Air (akasaair.com) domestic flights."""

    source_name = "akasa"
    source_type = SourceTypeEnum.AIRLINE
    base_url = "https://www.akasaair.com"

    SEL_FLIGHT_CARD = '.flight-card, .flight-item, [data-testid="flight-card"], [class*="flightCard"], [class*="FlightCard"], [class*="flight-row"]'
    SEL_NO_FLIGHTS = '.no-flights, [data-testid="no-flights"], .empty-state'

    CITY_NAMES: dict[str, str] = {
        "DEL": "New Delhi", "BOM": "Mumbai", "BLR": "Bengaluru",
        "CCU": "Kolkata", "HYD": "Hyderabad", "MAA": "Chennai",
    }

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%Y-%m-%d")
        return (
            f"{self.base_url}/booking/flights?"
            f"origin={route.origin}&destination={route.destination}"
            f"&date={date_str}&paxCount=1&tripType=oneway"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        """URL-based navigation with homepage cookie warmup."""
        # Step 1: Visit homepage for cookies
        try:
            logger.debug("Akasa Air: Initializing session at homepage...")
            await page.goto(self.base_url, wait_until="commit", timeout=15000)
            await asyncio.sleep(2)
        except Exception as e:
            logger.debug(f"Akasa homepage init notice: {e}")

        # Step 2: Navigate to search URL
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"Akasa Air: Navigating to: {url}")

        try:
            await page.goto(url, wait_until="commit", timeout=30000)
        except PlaywrightTimeout:
            logger.debug("Akasa Air: Page.goto timed out, continuing with partial load...")

        # Wait for SPA to render
        await asyncio.sleep(8)

        # Scroll to load all content
        for _ in range(4):
            await page.evaluate("window.scrollBy(0, 1500)")
            await asyncio.sleep(1)
        await asyncio.sleep(2)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Extract fares with DOM + text-based fallback."""
        body_txt = await page.inner_text("body")
        if "no flights" in body_txt.lower() or "no results" in body_txt.lower():
            raise NoFlightsFoundError("Akasa Air: No flights found")

        # Strategy 1: DOM-based
        fares = await self._extract_from_dom(page, route, travel_date, advance_days)

        # Strategy 2: Text fallback
        if not fares:
            logger.debug("Akasa Air: DOM extraction returned 0, using text fallback...")
            fares = await self._extract_fares_from_body_text(
                page, route, travel_date, advance_days,
                carrier_name="Akasa Air",
                flight_code_prefix="QP",
            )

        if not fares:
            raise NoFlightsFoundError("Akasa Air: No valid fare records extracted")

        return fares

    async def _extract_from_dom(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Try DOM-based extraction."""
        flight_cards = []
        for sel in self.SEL_FLIGHT_CARD.split(", "):
            cards = await page.query_selector_all(sel)
            if len(cards) >= 2:
                flight_cards = cards
                logger.debug(f"Akasa Air: Found {len(cards)} cards with '{sel}'")
                break

        if not flight_cards:
            return []

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:100]):
            try:
                txt = await card.inner_text()

                m_price = re.search(r"₹\s*([\d,]+)", txt)
                if not m_price:
                    continue

                total_val = float(m_price.group(1).replace(",", ""))
                if total_val < 1000 or total_val > 50000:
                    continue

                m_code = re.search(r"(QP[-\s]?\d{3,4})", txt, re.I)
                flt_code = re.sub(r"\s+", "", m_code.group(1)).upper() if m_code else f"QP-{1000 + i}"

                m_time = re.search(r"\b(\d{2}:\d{2})\b", txt)
                dep_time = m_time.group(1) if m_time else ""
                flight_num = f"{flt_code} ({dep_time})" if dep_time else flt_code

                base_fare = round(total_val * 0.85, 2)
                taxes = round(total_val * 0.15, 2)

                fare = FareRecord(
                    route_origin=route.origin, route_destination=route.destination,
                    travel_date=travel_date, advance_purchase_days=advance_days,
                    source=self.source_name, source_type=self.source_type,
                    carrier="Akasa Air", flight_number=flight_num,
                    fare_class="Economy", base_fare=base_fare,
                    taxes_and_fees=taxes, total_fare=total_val,
                    currency="INR", scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.debug(f"Akasa Air: Card #{i} parse error: {e}")
                continue

        return fares
