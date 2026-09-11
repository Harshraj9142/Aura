"""
APIx Scraper — Air India Scraper

Scrapes fare data from https://www.airindia.com for domestic flights.

Air India uses a modern React SPA. This scraper navigates the search flow,
fills the booking form, and extracts fare information from flight cards.
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


class AirIndiaScraper(BaseScraper):
    """Scraper for Air India (airindia.com) domestic flights."""

    source_name = "air_india"
    source_type = SourceTypeEnum.AIRLINE
    base_url = "https://www.airindia.com"

    # ===================================================================
    # SELECTOR REGISTRY
    # ===================================================================
    SEL_ONEWAY_TAB = '[data-testid="oneway"], .one-way-tab, input[value="oneWay"], label:has-text("One Way")'
    SEL_ORIGIN_INPUT = '#origin, [data-testid="origin"], input[placeholder*="From"], .origin-field input'
    SEL_DESTINATION_INPUT = '#destination, [data-testid="destination"], input[placeholder*="To"], .destination-field input'
    SEL_DATE_INPUT = '[data-testid="departure-date"], .departure-date-input, input[placeholder*="Depart"]'
    SEL_SEARCH_BUTTON = '[data-testid="search-btn"], button:has-text("Search"), .search-flight-btn'
    SEL_AIRPORT_OPTION = '.airport-list-item, .search-suggestion, [data-testid="airport-suggestion"]'
    SEL_CALENDAR_NEXT = '.calendar-next-btn, .next-month-btn, button[aria-label="Next month"]'
    SEL_CALENDAR_DAY = '.calendar-day:not(.disabled), td[role="gridcell"]:not(.disabled)'
    SEL_FLIGHT_CARD = '.flight-card, .flight-list-row, [data-testid="flight-row"], .flight-result'
    SEL_FLIGHT_NUMBER = '.flight-number, .flight-no, [data-testid="flight-num"]'
    SEL_FARE_AMOUNT = '.fare-price, .price-amount, [data-testid="fare-amount"], .total-price'
    SEL_BASE_FARE = '.base-fare, [data-testid="base-fare"]'
    SEL_TAXES = '.taxes-amount, [data-testid="taxes"]'
    SEL_FARE_CLASS = '.fare-class, .cabin-type, [data-testid="cabin-class"]'
    SEL_NO_FLIGHTS = '.no-flights-msg, [data-testid="no-results"], .empty-state'
    SEL_SOLD_OUT = '.sold-out-msg, .unavailable, [data-testid="sold-out"]'
    SEL_COOKIE_ACCEPT = '#cookie-accept, .cookie-consent-accept, button:has-text("Accept")'
    SEL_POPUP_CLOSE = '.modal-close, .popup-dismiss, [aria-label="Close"]'

    CITY_NAMES: dict[str, str] = {
        "DEL": "New Delhi", "BOM": "Mumbai", "BLR": "Bengaluru",
        "CCU": "Kolkata", "HYD": "Hyderabad", "MAA": "Chennai",
        "GOI": "Goa", "PNQ": "Pune", "AMD": "Ahmedabad", "JAI": "Jaipur",
    }

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%d/%m/%Y")
        return (
            f"{self.base_url}/book/flights?"
            f"from={route.origin}&to={route.destination}"
            f"&departure={date_str}&pax=1&class=economy&triptype=O"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        logger.debug("Air India: Navigating to booking page...")
        await page.goto(self.base_url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)

        # Dismiss popups
        for sel in [self.SEL_COOKIE_ACCEPT, self.SEL_POPUP_CLOSE]:
            try:
                el = await page.query_selector(sel.split(", ")[0])
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.5)
            except Exception:
                pass

        # Select one-way
        for sel in self.SEL_ONEWAY_TAB.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.5)
                    break
            except Exception:
                continue

        # Enter origin
        origin_name = self.CITY_NAMES.get(route.origin, route.origin)
        await self._fill_airport_field(page, self.SEL_ORIGIN_INPUT, origin_name, route.origin)
        await asyncio.sleep(1)

        # Enter destination
        dest_name = self.CITY_NAMES.get(route.destination, route.destination)
        await self._fill_airport_field(page, self.SEL_DESTINATION_INPUT, dest_name, route.destination)
        await asyncio.sleep(1)

        # Select date
        for sel in self.SEL_DATE_INPUT.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(1)
                    break
            except Exception:
                continue

        # Navigate calendar and pick date
        await self._pick_calendar_date(page, travel_date)
        await asyncio.sleep(1)

        # Click search
        for sel in self.SEL_SEARCH_BUTTON.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    break
            except Exception:
                continue

        # Wait for results
        try:
            await page.wait_for_selector(
                f"{self.SEL_FLIGHT_CARD.split(', ')[0]}, {self.SEL_NO_FLIGHTS.split(', ')[0]}",
                timeout=20000, state="visible",
            )
        except PlaywrightTimeout:
            await asyncio.sleep(5)

        await asyncio.sleep(2)

    async def _fill_airport_field(self, page: Page, selector: str, city: str, code: str) -> None:
        for sel in selector.split(", "):
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.click()
                    await el.fill("")
                    await page.keyboard.type(city, delay=80)
                    await asyncio.sleep(1.5)
                    # Select from dropdown
                    for opt_sel in self.SEL_AIRPORT_OPTION.split(", "):
                        options = await page.query_selector_all(opt_sel)
                        for opt in options:
                            text = await opt.inner_text()
                            if code.lower() in text.lower() or city.lower() in text.lower():
                                await opt.click()
                                return
                    await page.keyboard.press("Enter")
                    return
            except Exception:
                continue

    async def _pick_calendar_date(self, page: Page, travel_date: date) -> None:
        target = travel_date.strftime("%B %Y")
        for _ in range(12):
            try:
                cal_text = await page.inner_text("body")
                if target.lower() in cal_text.lower():
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
        # Check no-flights
        for sel in self.SEL_NO_FLIGHTS.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    raise NoFlightsFoundError("Air India: No flights found")
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
                break

        if not flight_cards:
            raise NoFlightsFoundError("Air India: No flight cards found in DOM")

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards):
            try:
                flight_num = await self._get_text(card, self.SEL_FLIGHT_NUMBER) or f"AI-{1000 + i}"
                total_text = await self._get_text(card, self.SEL_FARE_AMOUNT)
                if not total_text:
                    continue

                base_text = await self._get_text(card, self.SEL_BASE_FARE)
                taxes_text = await self._get_text(card, self.SEL_TAXES)
                fare_class = await self._get_text(card, self.SEL_FARE_CLASS) or "Economy"

                fare = FareRecord(
                    route_origin=route.origin, route_destination=route.destination,
                    travel_date=travel_date, advance_purchase_days=advance_days,
                    source=self.source_name, source_type=self.source_type,
                    carrier="Air India", flight_number=flight_num.strip(),
                    fare_class=fare_class, base_fare=base_text,
                    taxes_and_fees=taxes_text, total_fare=total_text,
                    currency="INR", scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.warning(f"Air India: Failed to parse card #{i}: {e}")
                continue

        logger.info(f"Air India: Extracted {len(fares)} fares")
        return fares

    async def _get_text(self, parent, selectors: str) -> Optional[str]:
        for sel in selectors.split(", "):
            try:
                el = await parent.query_selector(sel)
                if el:
                    text = await el.inner_text()
                    return text.strip() if text else None
            except Exception:
                continue
        return None
