"""
APIx Scraper — Yatra Scraper

Scrapes fare data from https://www.yatra.com for domestic flights.
Yatra supports URL-based search with text-based fallback extraction.
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


class YatraScraper(BaseScraper):
    """Scraper for Yatra (yatra.com) — OTA."""

    source_name = "yatra"
    source_type = SourceTypeEnum.OTA
    base_url = "https://www.yatra.com"

    SEL_FLIGHT_CARD = '.flight-row, .result-card, [data-testid="flight-card"], .flightItem, [class*="flightCard"], [class*="flight-row"], [class*="resultCard"]'
    SEL_NO_FLIGHTS = '.no-result, [data-testid="no-flights"], .noResult'
    SEL_POPUP_CLOSE = '.modal-close, .popup-close, [data-testid="close"], .close-icon, .close-btn'

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%d/%m/%Y")
        return (
            f"{self.base_url}/air-search-ui/dom2/trigger?"
            f"type=O&origin={route.origin}&destination={route.destination}"
            f"&depart_date={date_str}&ADT=1&CHD=0&INF=0&class=Economy&flexi=0"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        # Step 1: Visit homepage for session
        try:
            logger.debug("Yatra: Initializing session at homepage...")
            await page.goto(self.base_url, wait_until="commit", timeout=15000)
            await asyncio.sleep(2)
        except Exception as e:
            logger.debug(f"Yatra homepage init notice: {e}")

        # Step 2: Navigate to search results
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"Yatra: Navigating to: {url}")

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        except PlaywrightTimeout:
            logger.debug("Yatra: Page.goto timed out, continuing with partial load...")

        await asyncio.sleep(5)

        # Dismiss popups
        for sel in self.SEL_POPUP_CLOSE.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.3)
            except Exception:
                pass

        # Wait for cards to appear
        for _ in range(10):
            body_text = await page.inner_text("body")
            if "₹" in body_text and any(c in body_text.lower() for c in ["indigo", "spicejet", "air india", "akasa"]):
                break
            await asyncio.sleep(1)

        # Scroll to load all content
        for _ in range(5):
            await page.evaluate("window.scrollBy(0, 2000)")
            await asyncio.sleep(0.8)

        await asyncio.sleep(2)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        for sel in self.SEL_NO_FLIGHTS.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    raise NoFlightsFoundError("Yatra: No flights found")
            except NoFlightsFoundError:
                raise
            except Exception:
                continue

        # Strategy 1: DOM card extraction
        fares = await self._extract_from_cards(page, route, travel_date, advance_days)

        # Strategy 2: Text-based fallback
        if len(fares) < 3:
            logger.debug(f"Yatra: Only {len(fares)} from DOM, trying text fallback...")
            text_fares = await self._extract_fares_from_body_text(
                page, route, travel_date, advance_days,
                carrier_name="Unknown",
                flight_code_prefix="YT",
            )
            if len(text_fares) > len(fares):
                fares = text_fares

        return fares

    async def _extract_from_cards(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Extract from DOM cards."""
        flight_cards = []
        for sel in self.SEL_FLIGHT_CARD.split(", "):
            cards = await page.query_selector_all(sel)
            if len(cards) >= 2:
                flight_cards = cards
                logger.debug(f"Yatra: Found {len(cards)} cards with '{sel}'")
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

                # Detect carrier
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
                    flight_code = f"YT-{i+1}"
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
                logger.debug(f"Yatra: Card #{i} error: {e}")

        return fares
