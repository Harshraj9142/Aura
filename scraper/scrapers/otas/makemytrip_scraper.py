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
        """Navigate directly to search results via URL (MMT supports this)."""
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"MakeMyTrip: Navigating to: {url}")

        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)

        # Dismiss login popup (MMT shows this aggressively)
        for sel in self.SEL_CLOSE_LOGIN.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.5)
            except Exception:
                pass

        # Wait for flight listings to load
        try:
            await page.wait_for_selector(
                f"{self.SEL_FLIGHT_CARD.split(', ')[0]}, {self.SEL_NO_FLIGHTS.split(', ')[0]}",
                timeout=20000, state="visible",
            )
        except PlaywrightTimeout:
            # Check if still loading
            await asyncio.sleep(8)

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

        # Find flight cards
        flight_cards = []
        for sel in self.SEL_FLIGHT_CARD.split(", "):
            cards = await page.query_selector_all(sel)
            if cards:
                flight_cards = cards
                logger.debug(f"MakeMyTrip: Found {len(cards)} flight cards")
                break

        if not flight_cards:
            raise NoFlightsFoundError("MakeMyTrip: No flight cards in DOM")

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:30]):  # Cap at 30 results
            try:
                carrier = await self._text(card, self.SEL_CARRIER_NAME) or "Unknown"
                flight_num = await self._text(card, self.SEL_FLIGHT_NUMBER) or f"MMT-{i}"
                total = await self._text(card, self.SEL_FARE_AMOUNT)
                if not total:
                    continue

                fare = FareRecord(
                    route_origin=route.origin, route_destination=route.destination,
                    travel_date=travel_date, advance_purchase_days=advance_days,
                    source=self.source_name, source_type=self.source_type,
                    carrier=carrier.strip(), flight_number=flight_num.strip(),
                    fare_class=await self._text(card, self.SEL_FARE_CLASS) or "Economy",
                    base_fare=await self._text(card, self.SEL_BASE_FARE),
                    taxes_and_fees=await self._text(card, self.SEL_TAXES),
                    total_fare=total, currency="INR", scraped_at=datetime.utcnow(),
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
