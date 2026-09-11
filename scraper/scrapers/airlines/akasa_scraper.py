"""
APIx Scraper — Akasa Air Scraper

Scrapes fare data from https://www.akasaair.com for domestic flights.
"""

from __future__ import annotations

import asyncio
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

    SEL_ONEWAY_TAB = '.one-way, [data-testid="one-way"], label:has-text("One Way")'
    SEL_ORIGIN_INPUT = '#departure, [data-testid="from"], input[placeholder*="From"]'
    SEL_DESTINATION_INPUT = '#arrival, [data-testid="to"], input[placeholder*="To"]'
    SEL_DATE_INPUT = '[data-testid="departure-date"], .depart-date, input[placeholder*="Depart"]'
    SEL_SEARCH_BUTTON = '[data-testid="search"], button:has-text("Search"), .search-btn'
    SEL_AIRPORT_OPTION = '.city-list-item, .airport-suggestion, [data-testid="city-item"]'
    SEL_CALENDAR_NEXT = '.next-month, [data-testid="next-month"], button[aria-label*="Next"]'
    SEL_CALENDAR_DAY = '.day-cell:not(.disabled), [data-testid="calendar-day"]:not(.disabled)'
    SEL_FLIGHT_CARD = '.flight-card, .flight-item, [data-testid="flight-card"]'
    SEL_FLIGHT_NUMBER = '.flight-number, [data-testid="flight-no"]'
    SEL_FARE_AMOUNT = '.fare-price, .price, [data-testid="fare"]'
    SEL_BASE_FARE = '.base-fare, [data-testid="base-fare"]'
    SEL_TAXES = '.taxes, [data-testid="taxes"]'
    SEL_FARE_CLASS = '.fare-type, [data-testid="fare-type"]'
    SEL_NO_FLIGHTS = '.no-flights, [data-testid="no-flights"], .empty-state'

    CITY_NAMES: dict[str, str] = {
        "DEL": "New Delhi", "BOM": "Mumbai", "BLR": "Bengaluru",
        "CCU": "Kolkata", "HYD": "Hyderabad", "MAA": "Chennai",
    }

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%Y-%m-%d")
        return (
            f"{self.base_url}/booking/search?"
            f"origin={route.origin}&destination={route.destination}"
            f"&date={date_str}&passengers=1&type=oneway"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        logger.debug("Akasa Air: Navigating to booking page...")
        await page.goto(self.base_url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)

        for sel in self.SEL_ONEWAY_TAB.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.5)
                    break
            except Exception:
                continue

        origin = self.CITY_NAMES.get(route.origin, route.origin)
        await self._fill_field(page, self.SEL_ORIGIN_INPUT, origin, route.origin)
        await asyncio.sleep(1)

        dest = self.CITY_NAMES.get(route.destination, route.destination)
        await self._fill_field(page, self.SEL_DESTINATION_INPUT, dest, route.destination)
        await asyncio.sleep(1)

        for sel in self.SEL_DATE_INPUT.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(1)
                    break
            except Exception:
                continue

        await self._select_calendar_date(page, travel_date)

        for sel in self.SEL_SEARCH_BUTTON.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    break
            except Exception:
                continue

        try:
            await page.wait_for_selector(
                self.SEL_FLIGHT_CARD.split(", ")[0], timeout=20000, state="visible"
            )
        except PlaywrightTimeout:
            await asyncio.sleep(5)
        await asyncio.sleep(2)

    async def _fill_field(self, page: Page, selector: str, city: str, code: str) -> None:
        for sel in selector.split(", "):
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.click()
                    await el.fill("")
                    await page.keyboard.type(city, delay=80)
                    await asyncio.sleep(1.5)
                    for opt_sel in self.SEL_AIRPORT_OPTION.split(", "):
                        options = await page.query_selector_all(opt_sel)
                        for opt in options:
                            text = await opt.inner_text()
                            if code.lower() in text.lower():
                                await opt.click()
                                return
                    await page.keyboard.press("Enter")
                    return
            except Exception:
                continue

    async def _select_calendar_date(self, page: Page, travel_date: date) -> None:
        target = travel_date.strftime("%B %Y")
        for _ in range(12):
            try:
                text = await page.inner_text("body")
                if target.lower() in text.lower():
                    break
                for sel in self.SEL_CALENDAR_NEXT.split(", "):
                    btn = await page.query_selector(sel)
                    if btn:
                        await btn.click()
                        await asyncio.sleep(0.5)
                        break
            except Exception:
                break

        day_str = str(travel_date.day)
        for sel in self.SEL_CALENDAR_DAY.split(", "):
            try:
                days = await page.query_selector_all(sel)
                for d in days:
                    if (await d.inner_text()).strip() == day_str:
                        await d.click()
                        return
            except Exception:
                continue

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        for sel in self.SEL_NO_FLIGHTS.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    raise NoFlightsFoundError("Akasa Air: No flights found")
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
            raise NoFlightsFoundError("Akasa Air: No flight cards found")

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards):
            try:
                flight_num = await self._text(card, self.SEL_FLIGHT_NUMBER) or f"QP-{1000 + i}"
                total = await self._text(card, self.SEL_FARE_AMOUNT)
                if not total:
                    continue
                fare = FareRecord(
                    route_origin=route.origin, route_destination=route.destination,
                    travel_date=travel_date, advance_purchase_days=advance_days,
                    source=self.source_name, source_type=self.source_type,
                    carrier="Akasa Air", flight_number=flight_num.strip(),
                    fare_class=await self._text(card, self.SEL_FARE_CLASS) or "Economy",
                    base_fare=await self._text(card, self.SEL_BASE_FARE),
                    taxes_and_fees=await self._text(card, self.SEL_TAXES),
                    total_fare=total, currency="INR", scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.warning(f"Akasa Air: Card #{i} parse error: {e}")
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
