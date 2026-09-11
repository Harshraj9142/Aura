"""
APIx Scraper — EaseMyTrip Scraper

Scrapes fare data from https://www.easemytrip.com for domestic flights.
"""

from __future__ import annotations

import asyncio
from datetime import date, datetime
from typing import Optional

from loguru import logger
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout

from pipeline.models import FareRecord, Route, SourceTypeEnum
from scrapers.base_scraper import BaseScraper, NoFlightsFoundError


class EaseMyTripScraper(BaseScraper):
    """Scraper for EaseMyTrip (easemytrip.com) — OTA."""

    source_name = "easemytrip"
    source_type = SourceTypeEnum.OTA
    base_url = "https://www.easemytrip.com"

    SEL_FLIGHT_CARD = '.flt-list-row, .flight-card, [data-testid="flight-row"]'
    SEL_FLIGHT_NUMBER = '.flt-no, .flight-number, [data-testid="flt-num"]'
    SEL_CARRIER_NAME = '.airline-nm, .airline-name, [data-testid="airline"]'
    SEL_FARE_AMOUNT = '.prc-amt, .fare-price, [data-testid="price"]'
    SEL_BASE_FARE = '.base-fare, [data-testid="base-fare"]'
    SEL_TAXES = '.tax-amt, [data-testid="taxes"]'
    SEL_FARE_CLASS = '.cls-type, [data-testid="class"]'
    SEL_NO_FLIGHTS = '.no-result, [data-testid="no-flights"], .noResultFound'

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%d-%m-%Y")
        return (
            f"{self.base_url}/flight/search?"
            f"from={route.origin}&to={route.destination}"
            f"&depart={date_str}&adult=1&child=0&infant=0&class=E&way=oneway"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"EaseMyTrip: Navigating to: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)

        try:
            await page.wait_for_selector(
                self.SEL_FLIGHT_CARD.split(", ")[0], timeout=20000, state="visible"
            )
        except PlaywrightTimeout:
            await asyncio.sleep(5)
        await asyncio.sleep(2)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        for sel in self.SEL_NO_FLIGHTS.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    raise NoFlightsFoundError("EaseMyTrip: No flights found")
            except NoFlightsFoundError:
                raise
            except Exception:
                continue

        flight_cards = []
        for sel in self.SEL_FLIGHT_CARD.split(", "):
            cards = await page.query_selector_all(sel)
            if cards:
                flight_cards = cards
                break
        if not flight_cards:
            raise NoFlightsFoundError("EaseMyTrip: No flight cards found")

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:30]):
            try:
                carrier = await self._text(card, self.SEL_CARRIER_NAME) or "Unknown"
                flight_num = await self._text(card, self.SEL_FLIGHT_NUMBER) or f"EMT-{i}"
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
                logger.warning(f"EaseMyTrip: Card #{i} error: {e}")
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
