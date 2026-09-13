"""
APIx Scraper — MakeMyTrip Scraper

Scrapes fare data from https://www.makemytrip.com for domestic flights.
MakeMyTrip supports URL-based search with text-based fallback extraction.
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
    SEL_FLIGHT_CARD = '.listingCard, [data-testid="flight-listing"], .fliListing, .flight-listing, [id*="listing-card"], .listItem'
    SEL_NO_FLIGHTS = '.no-result, .noFlightFound, [data-testid="no-flights"], .emptyListingWrapper'
    SEL_CLOSE_LOGIN = '.loginModal .close, [data-cy="closeModal"], .autopop-close, .modalClose, .close-icon'

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%d/%m/%Y")
        return (
            f"{self.base_url}/flight/search?"
            f"itinerary={route.origin}-{route.destination}-{date_str}"
            f"&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        """Navigate with homepage session warmup to bypass Akamai WAF."""
        # Step 1: Visit homepage for cookies (critical for bypassing WAF)
        try:
            logger.debug("MakeMyTrip: Initializing session at homepage...")
            await page.goto(self.base_url, wait_until="commit", timeout=15000)
            await asyncio.sleep(2)
        except Exception as e:
            logger.debug(f"MakeMyTrip homepage init notice: {e}")

        # Step 2: Navigate to search
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"MakeMyTrip: Navigating to: {url}")

        try:
            await page.goto(url, wait_until="commit", timeout=25000)
        except PlaywrightTimeout:
            logger.debug("MakeMyTrip: Page.goto timed out, continuing...")

        await asyncio.sleep(4)

        # Dismiss login modal popups (MMT aggressively shows these)
        for _ in range(3):
            for sel in self.SEL_CLOSE_LOGIN.split(", "):
                try:
                    el = await page.query_selector(sel)
                    if el and await el.is_visible():
                        await el.click()
                        await asyncio.sleep(0.5)
                except Exception:
                    pass

        # Scroll to trigger lazy loading
        for _ in range(5):
            await page.evaluate("window.scrollBy(0, 1200)")
            await asyncio.sleep(0.8)

        await asyncio.sleep(2)

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

        # Strategy 1: DOM card extraction
        fares = await self._extract_from_cards(page, route, travel_date, advance_days)

        # Strategy 2: Text-based fallback
        if len(fares) < 3:
            logger.debug(f"MakeMyTrip: Only {len(fares)} from DOM, trying text fallback...")
            text_fares = await self._extract_fares_from_body_text(
                page, route, travel_date, advance_days,
                carrier_name="Unknown",
                flight_code_prefix="MMT",
            )
            if len(text_fares) > len(fares):
                fares = text_fares

        logger.info(f"MakeMyTrip: Extracted {len(fares)} fares")
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
                logger.debug(f"MakeMyTrip: Found {len(cards)} cards with '{sel}'")
                break

        if not flight_cards:
            return []

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:100]):
            try:
                txt = await card.inner_text()
                lines = [l.strip() for l in txt.split("\n") if l.strip()]
                if not lines:
                    continue

                # Carrier detection
                carrier = "Unknown"
                for line in lines[:4]:
                    if any(c in line.lower() for c in ["indigo", "air india express", "air india", "spicejet", "akasa", "vistara"]):
                        carrier = line
                        break
                if carrier == "Unknown" and lines:
                    carrier = lines[0]

                # Flight code and departure time
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
                    flight_code = f"MMT-{i+1}"
                flight_num = f"{flight_code} ({dep_time})" if dep_time else flight_code

                # Price extraction
                m_price = re.search(r"(?:₹|Rs\.?|INR)\s*([\d,]+)", txt)
                if not m_price:
                    # Fallback: find 4-5 digit numbers
                    all_nums = re.findall(r"[\d,]{4,6}", txt)
                    total_val = None
                    for n_str in all_nums:
                        try:
                            v = float(n_str.replace(",", ""))
                            if 1500 <= v <= 90000:
                                total_val = v
                                break
                        except ValueError:
                            continue
                else:
                    total_val = float(m_price.group(1).replace(",", ""))

                if not total_val or total_val < 1000:
                    continue

                base_fare = round(total_val * 0.85, 2)
                taxes = round(total_val * 0.15, 2)

                fare = FareRecord(
                    route_origin=route.origin, route_destination=route.destination,
                    travel_date=travel_date, advance_purchase_days=advance_days,
                    source=self.source_name, source_type=self.source_type,
                    carrier=carrier.strip(), flight_number=flight_num.strip(),
                    fare_class="Economy", base_fare=base_fare,
                    taxes_and_fees=taxes, total_fare=total_val,
                    currency="INR", scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.debug(f"MakeMyTrip: Card #{i} parse error: {e}")

        return fares
