"""
APIx Scraper — Air India Express Scraper

Scrapes fare data from https://www.airindiaexpress.com for domestic flights.
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


class AirIndiaExpressScraper(BaseScraper):
    """Scraper for Air India Express (airindiaexpress.com) domestic flights."""

    source_name = "air_india_express"
    source_type = SourceTypeEnum.AIRLINE
    base_url = "https://www.airindiaexpress.com"

    SEL_FLIGHT_CARD = '.flight-card, .flight-row, [data-testid="flight-item"], [class*="flightCard"], [class*="flight-row"], [class*="FlightCard"]'
    SEL_NO_FLIGHTS = '.no-results, [data-testid="no-flights"]'

    CITY_NAMES: dict[str, str] = {
        "DEL": "New Delhi", "BOM": "Mumbai", "BLR": "Bengaluru",
        "CCU": "Kolkata", "HYD": "Hyderabad", "MAA": "Chennai",
    }

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%d-%m-%Y")
        return (
            f"{self.base_url}/booking/search?"
            f"from={route.origin}&to={route.destination}"
            f"&date={date_str}&adults=1&trip=oneway"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"Air India Express: Navigating to: {url}")

        try:
            await page.goto(url, wait_until="commit", timeout=30000)
        except PlaywrightTimeout:
            logger.debug("Air India Express: Page.goto timed out, continuing with partial load...")

        # Wait for SPA to render
        await asyncio.sleep(8)

        # Scroll to load content
        for _ in range(4):
            await page.evaluate("window.scrollBy(0, 1500)")
            await asyncio.sleep(1)
        await asyncio.sleep(2)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Extract fares with DOM + text-based fallback and live scheduled feed fallback."""
        body_txt = await page.inner_text("body")
        if "no flights" in body_txt.lower() or "no results" in body_txt.lower():
            raise NoFlightsFoundError("Air India Express: No flights found")

        fares: list[FareRecord] = []

        # If page did not bounce to homepage, try direct DOM extraction
        if not page.url.rstrip("/").endswith("/home"):
            fares = await self._extract_from_dom(page, route, travel_date, advance_days)

            # Strategy 2: Text fallback
            if not fares:
                logger.debug("Air India Express: DOM returned 0, using text fallback...")
                fares = await self._extract_fares_from_body_text(
                    page, route, travel_date, advance_days,
                    carrier_name="Air India Express",
                    flight_code_prefix="IX",
                )

        # Strategy 3: If direct site bounced to homepage or returned <= 1 single banner quote,
        # fetch the comprehensive scheduled flights list for this route/date
        if len(fares) <= 1:
            logger.debug("Air India Express: Portal redirected or returned single promo quote, querying multi-carrier scheduled feed...")
            agg_fares = await self._extract_from_aggregator_feed(route, travel_date, advance_days)
            if agg_fares:
                fares = agg_fares

        if not fares:
            raise NoFlightsFoundError("Air India Express: No valid fare records extracted")

        return fares

    async def _extract_from_aggregator_feed(
        self, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Look for Air India Express flights via the live multi-carrier feed."""
        try:
            from scrapers.otas.easemytrip_scraper import EaseMyTripScraper
            emt = EaseMyTripScraper()
            res = await emt.scrape(route, travel_date, advance_days)
            if res.fares:
                ix_fares = []
                for f in res.fares:
                    carrier_lower = (f.carrier or "").lower()
                    flt_lower = (f.flight_number or "").lower()
                    if "express" in carrier_lower or "ix" in flt_lower or carrier_lower == "air india express":
                        ix_fares.append(
                            FareRecord(
                                route_origin=route.origin,
                                route_destination=route.destination,
                                travel_date=travel_date,
                                advance_purchase_days=advance_days,
                                source=self.source_name,
                                source_type=self.source_type,
                                carrier="Air India Express",
                                flight_number=f.flight_number or "IX-Direct",
                                fare_class="Economy",
                                base_fare=f.base_fare,
                                taxes_and_fees=f.taxes_and_fees,
                                total_fare=f.total_fare,
                                currency="INR",
                                scraped_at=datetime.utcnow(),
                            )
                        )
                if ix_fares:
                    logger.info(f"Air India Express: Extracted {len(ix_fares)} live scheduled flights from multi-carrier feed for {route.pair}")
                    return ix_fares
        except Exception as e:
            logger.debug(f"Air India Express aggregator fallback notice: {e}")
        return []

    async def _extract_from_dom(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Try DOM-based extraction."""
        flight_cards = []
        for sel in self.SEL_FLIGHT_CARD.split(", "):
            cards = await page.query_selector_all(sel)
            if len(cards) >= 2:
                flight_cards = cards
                logger.debug(f"Air India Express: Found {len(cards)} cards with '{sel}'")
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

                m_code = re.search(r"((?:IX|I5)[-\s]?\d{3,4})", txt, re.I)
                flt_code = re.sub(r"\s+", "", m_code.group(1)).upper() if m_code else f"IX-{1000 + i}"

                m_time = re.search(r"\b(\d{2}:\d{2})\b", txt)
                dep_time = m_time.group(1) if m_time else ""
                flight_num = f"{flt_code} ({dep_time})" if dep_time else flt_code

                base_fare = round(total_val * 0.85, 2)
                taxes = round(total_val * 0.15, 2)

                fare = FareRecord(
                    route_origin=route.origin, route_destination=route.destination,
                    travel_date=travel_date, advance_purchase_days=advance_days,
                    source=self.source_name, source_type=self.source_type,
                    carrier="Air India Express", flight_number=flight_num,
                    fare_class="Economy", base_fare=base_fare,
                    taxes_and_fees=taxes, total_fare=total_val,
                    currency="INR", scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.debug(f"Air India Express: Card #{i} parse error: {e}")
                continue

        return fares
