"""
APIx Scraper — Ixigo Scraper

Scrapes fare data from https://www.ixigo.com for domestic flights.
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


class IxigoScraper(BaseScraper):
    """Scraper for Ixigo (ixigo.com) — OTA."""

    source_name = "ixigo"
    source_type = SourceTypeEnum.OTA
    base_url = "https://www.ixigo.com"

    SEL_FLIGHT_CARD = 'div[class*="Listing_listItem"]'
    SEL_NO_FLIGHTS = '.no-results, [data-testid="no-flights"], .empty-result'
    SEL_POPUP_CLOSE = '.close-popup, .modal-close, [data-testid="close"], button:has-text("Close")'

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%d%m%Y")
        return (
            f"{self.base_url}/search/result/flight/"
            f"{route.origin}/{route.destination}/{date_str}/1/0/0/e"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        try:
            logger.debug("Ixigo: Initializing session at homepage...")
            await page.goto(self.base_url, wait_until="domcontentloaded", timeout=15000)
            await asyncio.sleep(1)
        except Exception as e:
            logger.debug(f"Ixigo: Homepage session notice: {e}")

        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"Ixigo: Navigating to: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)

        # Wait up to 12s for cards to render
        for _ in range(12):
            cards = await page.query_selector_all(self.SEL_FLIGHT_CARD)
            if len(cards) >= 3:
                logger.debug(f"Ixigo: Loaded {len(cards)} flight cards.")
                break
            await asyncio.sleep(1)
        await asyncio.sleep(2)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        for sel in self.SEL_NO_FLIGHTS.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    raise NoFlightsFoundError("Ixigo: No flights found")
            except NoFlightsFoundError:
                raise
            except Exception:
                continue

        flight_cards = await page.query_selector_all(self.SEL_FLIGHT_CARD)
        if not flight_cards:
            raise NoFlightsFoundError("Ixigo: No flight cards found")

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:40]):
            try:
                txt = await card.inner_text()
                lines = [l.strip() for l in txt.split("\n") if l.strip()]
                if not lines or "Price" in lines[0] or "Sort" in lines[0] and len(lines) < 4:
                    continue

                carrier = "Unknown"
                for line in lines[:4]:
                    if any(c in line.lower() for c in ["indigo", "air", "spice", "akasa", "vistara"]):
                        carrier = line
                        break

                flight_num = f"IXI-{i+1}"
                for line in lines[:5]:
                    m = re.search(r"([A-Z0-9]{2}-?\d{3,4})", line)
                    if m:
                        candidate = m.group(1)
                        if candidate not in ("DEL", "BOM", "BLR", "CCU", "HYD", "MAA"):
                            flight_num = candidate
                            break

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
                    carrier=carrier.strip(),
                    flight_number=flight_num.strip(),
                    fare_class="Economy",
                    base_fare=base_fare,
                    taxes_and_fees=taxes,
                    total_fare=total_val,
                    currency="INR",
                    scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.warning(f"Ixigo: Card #{i} error: {e}")

        if not fares:
            raise NoFlightsFoundError("Ixigo: No valid fare records extracted")

        return fares
