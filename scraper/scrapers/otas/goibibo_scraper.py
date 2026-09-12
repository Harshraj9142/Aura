"""
APIx Scraper — Goibibo Scraper

Scrapes fare data from https://www.goibibo.com for domestic flights.
Goibibo is part of the MakeMyTrip group and shares similar patterns.
"""

from __future__ import annotations

import asyncio
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

    SEL_FLIGHT_CARD = '.flt-card, .flight-row, [data-testid="flight-card"], .SRP_flight_card'
    SEL_FLIGHT_NUMBER = '.flt-num, .flight-number, [data-testid="flt-code"]'
    SEL_CARRIER_NAME = '.airline-name, .carrier, [data-testid="airline"]'
    SEL_FARE_AMOUNT = '.price, .fare-amount, [data-testid="fare"], .SRP_fare'
    SEL_BASE_FARE = '.base-fare, [data-testid="base-fare"]'
    SEL_TAXES = '.taxes, [data-testid="taxes"]'
    SEL_FARE_CLASS = '.cabin-class, [data-testid="class"]'
    SEL_NO_FLIGHTS = '.no-flights, [data-testid="no-results"], .emptyResult'
    SEL_POPUP_CLOSE = '.modal-close, .loginClose, [data-testid="close"]'

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
            await page.goto(url, wait_until="commit", timeout=12000)
        except Exception as err:
            logger.warning(f"Goibibo navigation notice: {err}")
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
                    raise NoFlightsFoundError("Goibibo: No flights found")
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
            raise NoFlightsFoundError("Goibibo: No flight cards found")

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:100]):
            try:
                carrier = await self._text(card, self.SEL_CARRIER_NAME) or "Unknown"
                raw_flight_num = await self._text(card, self.SEL_FLIGHT_NUMBER)
                dep_time = await self._text(card, ".dept-time, [class*='dept'], [class*='time']") or ""

                if raw_flight_num:
                    clean_code = re.sub(r"\s+", "", raw_flight_num)
                    flight_num = f"{clean_code} ({dep_time})" if dep_time else clean_code
                else:
                    flight_num = f"GI-{i+1} ({dep_time})" if dep_time else f"GI-{i+1}"

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
                logger.warning(f"Goibibo: Card #{i} error: {e}")
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
