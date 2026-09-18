"""
APIx Scraper — Goibibo Scraper

Scrapes fare data from https://www.goibibo.com for domestic flights.
Goibibo is part of the MakeMyTrip group. Uses URL-based search with
text-based fallback extraction.
"""

from __future__ import annotations

import asyncio
import re
from datetime import date, datetime
from typing import Optional

from loguru import logger
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout

from pipeline.models import FareRecord, Route, SourceTypeEnum
from scrapers.base_scraper import BaseScraper, NoFlightsFoundError


class GoibiboScraper(BaseScraper):
    """Scraper for Goibibo (goibibo.com) — OTA."""

    source_name = "goibibo"
    source_type = SourceTypeEnum.OTA
    base_url = "https://www.goibibo.com"

    SEL_FLIGHT_CARD = '.flt-card, .flight-row, [data-testid="flight-card"], .SRP_flight_card, [class*="flightCard"], [class*="flight-card"]'
    SEL_NO_FLIGHTS = '.no-flights, [data-testid="no-results"], .emptyResult'
    SEL_POPUP_CLOSE = '.modal-close, .loginClose, [data-testid="close"], .close-icon, .close-btn'

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%Y%m%d")
        return (
            f"{self.base_url}/flights/air-{route.origin}-{route.destination}-"
            f"{date_str}--1-0-0-E-D"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"Goibibo: Navigating to: {url}")

        try:
            await page.goto(url, wait_until="commit", timeout=25000)
        except PlaywrightTimeout:
            logger.debug("Goibibo: Page.goto timed out, continuing...")

        await asyncio.sleep(4)

        # Dismiss popups
        for sel in self.SEL_POPUP_CLOSE.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.3)
            except Exception:
                pass

        # Scroll to load content
        for _ in range(5):
            await page.evaluate("window.scrollBy(0, 1500)")
            await asyncio.sleep(0.8)
        await asyncio.sleep(2)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        for sel in self.SEL_NO_FLIGHTS.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    raise NoFlightsFoundError("Goibibo: No flights found")
            except NoFlightsFoundError:
                raise
            except Exception:
                continue

        # Strategy 1: DOM extraction
        fares = await self._extract_from_cards(page, route, travel_date, advance_days)

        # Strategy 2: Text-based fallback
        if len(fares) < 3:
            logger.debug(f"Goibibo: Only {len(fares)} from DOM, trying text fallback...")
            text_fares = await self._extract_fares_from_body_text(
                page, route, travel_date, advance_days,
                carrier_name="Unknown",
                flight_code_prefix="GI",
            )
            if len(text_fares) > len(fares):
                fares = text_fares

        return fares

    async def _extract_from_cards(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """DOM card extraction."""
        flight_cards = []
        for sel in self.SEL_FLIGHT_CARD.split(", "):
            cards = await page.query_selector_all(sel)
            if len(cards) >= 2:
                flight_cards = cards
                logger.debug(f"Goibibo: Found {len(cards)} cards with '{sel}'")
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

                # Carrier detection
                carrier = "Unknown"
                for kw, name in [("indigo", "IndiGo"), ("spicejet", "SpiceJet"), ("akasa", "Akasa Air"),
                                  ("air india express", "Air India Express"), ("air india", "Air India"),
                                  ("vistara", "Vistara")]:
                    if kw in txt.lower():
                        carrier = name
                        break

                # Flight code
                lines = [l.strip() for l in txt.split("\n") if l.strip()]
                flight_code = None
                dep_time = ""
                for line in lines[:8]:
                    if not dep_time and re.match(r"^\d{2}:\d{2}$", line):
                        dep_time = line
                    norm = re.sub(r"\s+", "", line)
                    m = re.search(r"((?:6E|SG|QP|AI|IX|I5|UK|G8)\s*-?\s*\d{3,4})", norm, re.I)
                    if m:
                        flight_code = re.sub(r"\s+", "", m.group(1)).upper()

                if not flight_code:
                    flight_code = f"GI-{i+1}"
                flight_num = f"{flight_code} ({dep_time})" if dep_time else flight_code

                base_fare = round(total_val * 0.85, 2)
                taxes = round(total_val * 0.15, 2)

                fare = FareRecord(
                    route_origin=route.origin, route_destination=route.destination,
                    travel_date=travel_date, advance_purchase_days=advance_days,
                    source=self.source_name, source_type=self.source_type,
                    carrier=carrier, flight_number=flight_num,
                    fare_class="Economy", base_fare=base_fare,
                    taxes_and_fees=taxes, total_fare=total_val,
                    currency="INR", scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.debug(f"Goibibo: Card #{i} error: {e}")

        return fares
