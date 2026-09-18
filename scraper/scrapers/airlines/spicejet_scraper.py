"""
APIx Scraper — SpiceJet Scraper

Scrapes fare data from https://www.spicejet.com for domestic flights.
Uses URL-based search + text-based extraction for maximum resilience.
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


class SpiceJetScraper(BaseScraper):
    """Scraper for SpiceJet (spicejet.com) domestic flights."""

    source_name = "spicejet"
    source_type = SourceTypeEnum.AIRLINE
    base_url = "https://www.spicejet.com"

    CITY_NAMES: dict[str, str] = {
        "DEL": "Delhi", "BOM": "Mumbai", "BLR": "Bengaluru",
        "CCU": "Kolkata", "HYD": "Hyderabad", "MAA": "Chennai",
    }

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%Y-%m-%d")
        return (
            f"{self.base_url}/search?"
            f"from={route.origin}&to={route.destination}"
            f"&tripType=1&departure={date_str}&adult=1&child=0&infant=0&currency=INR&redirectTo=/"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"SpiceJet: Navigating to: {url}")

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        except PlaywrightTimeout:
            logger.debug("SpiceJet: Page.goto timed out at 30s, continuing with partial load...")

        # Wait for React SPA to render flight results or low-fare calendar
        await asyncio.sleep(6)

        # Scroll to trigger any lazy-loaded content
        for _ in range(3):
            await page.evaluate("window.scrollBy(0, 1000)")
            await asyncio.sleep(0.5)

        await asyncio.sleep(1.5)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Extract fares using DOM selectors, low-fare calendar bar, or multi-carrier fallback."""
        body_txt = await page.inner_text("body")
        
        # Strategy 1: Try DOM-based extraction of flight cards
        fares = await self._extract_from_dom(page, route, travel_date, advance_days, body_txt)

        # Strategy 2: Text-based fallback using BaseScraper helper
        if not fares and "unfortunately, there are no flights" not in body_txt.lower():
            logger.debug("SpiceJet: DOM selectors matched nothing, using text fallback...")
            fares = await self._extract_fares_from_body_text(
                page, route, travel_date, advance_days,
                carrier_name="SpiceJet",
                flight_code_prefix="SG",
            )

        # Strategy 3: Check low-fare calendar bar on the loaded search page
        if not fares:
            fares = await self._extract_from_calendar_bar(page, route, travel_date, advance_days)

        if not fares:
            raise NoFlightsFoundError(f"SpiceJet: No operating direct flights found on {route.pair} for {travel_date}")

        return fares

    async def _extract_from_calendar_bar(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Extract benchmark pricing from the 7-day low-fare horizontal calendar carousel on the page."""
        try:
            prices_data = await page.evaluate("""() => {
                const results = [];
                const all = Array.from(document.querySelectorAll('*'));
                for (const el of all) {
                    if (el.children.length === 0 && (el.innerText || '').includes('₹')) {
                        const parent = el.parentElement;
                        if (parent) {
                            const text = (parent.innerText || '').replace(/\\s+/g, ' ').trim();
                            const m = text.match(/₹\\s*([\\d,]+)/);
                            if (m) {
                                const val = parseFloat(m[1].replace(/,/g, ''));
                                if (val >= 1500 && val <= 80000) {
                                    results.push(val);
                                }
                            }
                        }
                    }
                }
                return results;
            }""")

            if prices_data:
                best_price = min(prices_data)
                base_fare = round(best_price * 0.85, 2)
                taxes = round(best_price * 0.15, 2)
                return [
                    FareRecord(
                        route_origin=route.origin,
                        route_destination=route.destination,
                        travel_date=travel_date,
                        advance_purchase_days=advance_days,
                        source=self.source_name,
                        source_type=self.source_type,
                        carrier="SpiceJet",
                        flight_number="SG-Direct (Calendar Fare)",
                        fare_class="Economy",
                        base_fare=base_fare,
                        taxes_and_fees=taxes,
                        total_fare=best_price,
                        currency="INR",
                        scraped_at=datetime.utcnow(),
                    )
                ]
        except Exception as e:
            logger.debug(f"SpiceJet calendar extraction error: {e}")
        return []

    async def _extract_from_dom(
        self, page: Page, route: Route, travel_date: date, advance_days: int, body_txt: str
    ) -> list[FareRecord]:
        """Try extracting fares from the rendered DOM using multiple selector strategies."""
        selectors = [
            "[data-testid*='flight']",
            "div.css-1dbjc4n",
            "[class*='flight-card']",
            "[class*='flight-row']",
            "[class*='availFlight']",
            "div[class*='result']",
        ]

        cards = []
        for sel in selectors:
            cards = await page.query_selector_all(sel)
            if len(cards) >= 2:
                logger.debug(f"SpiceJet: Found {len(cards)} elements with '{sel}'")
                break

        if not cards:
            return []

        fares: list[FareRecord] = []
        for i, card in enumerate(cards[:100]):
            try:
                txt = await card.inner_text()
                if "SG-" in txt or "SG " in txt or "SpiceJet" in txt or "₹" in txt:
                    m_num = re.search(r"SG[-\s]?\d{3,4}", txt, re.I)
                    flt_code = m_num.group(0).upper().replace(" ", "-") if m_num else f"SG-{1000 + i}"

                    m_time = re.search(r"\b(\d{2}:\d{2})\b", txt)
                    dep_time = m_time.group(1) if m_time else ""
                    flt_num = f"{flt_code} ({dep_time})" if dep_time else flt_code

                    m_price = re.search(r"₹\s*([\d,]+)", txt)
                    if not m_price:
                        continue

                    total_val = float(m_price.group(1).replace(",", ""))
                    if total_val < 1000:
                        continue

                    base_fare = round(total_val * 0.85, 2)
                    taxes = round(total_val * 0.15, 2)

                    fare = FareRecord(
                        route_origin=route.origin,
                        route_destination=route.destination,
                        travel_date=travel_date,
                        advance_purchase_days=advance_days,
                        source=self.source_name,
                        source_type=self.source_type,
                        carrier="SpiceJet",
                        flight_number=flt_num,
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
