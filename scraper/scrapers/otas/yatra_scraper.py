"""
APIx Scraper — Yatra Scraper

Scrapes fare data from https://www.yatra.com for domestic flights.
Yatra supports URL-based search results.
"""

from __future__ import annotations

import asyncio
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

    SEL_FLIGHT_CARD = '.flight-row, .result-card, [data-testid="flight-card"], .flightItem'
    SEL_FLIGHT_NUMBER = '.flight-number, .flt-num, [data-testid="flt-no"]'
    SEL_CARRIER_NAME = '.airline-name, .carrier, [data-testid="airline"]'
    SEL_FARE_AMOUNT = '.price, .fare, [data-testid="fare-amount"], .total-fare'
    SEL_BASE_FARE = '.base-fare, [data-testid="base-fare"]'
    SEL_TAXES = '.taxes, [data-testid="taxes"]'
    SEL_FARE_CLASS = '.fare-type, [data-testid="cabin"]'
    SEL_NO_FLIGHTS = '.no-result, [data-testid="no-flights"], .noResult'
    SEL_POPUP_CLOSE = '.modal-close, .popup-close, [data-testid="close"]'

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
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"Yatra: Navigating to: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)

        for sel in self.SEL_POPUP_CLOSE.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
            except Exception:
                pass

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
                    raise NoFlightsFoundError("Yatra: No flights found")
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
            raise NoFlightsFoundError("Yatra: No flight cards found")

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:30]):
            try:
                carrier = await self._text(card, self.SEL_CARRIER_NAME) or "Unknown"
                flight_num = await self._text(card, self.SEL_FLIGHT_NUMBER) or f"YT-{i}"
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
                logger.warning(f"Yatra: Card #{i} error: {e}")
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
