"""
APIx Scraper — SpiceJet Scraper

Scrapes fare data from https://www.spicejet.com for domestic flights.
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


class SpiceJetScraper(BaseScraper):
    """Scraper for SpiceJet (spicejet.com) domestic flights."""

    source_name = "spicejet"
    source_type = SourceTypeEnum.AIRLINE
    base_url = "https://www.spicejet.com"

    CITY_NAMES: dict[str, str] = {
        "DEL": "Delhi", "BOM": "Mumbai", "BLR": "Bengaluru",
        "CCU": "Kolkata", "HYD": "Hyderabad", "MAA": "Chennai",
    }

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%d/%m/%Y")
        return (
            f"{self.base_url}/flights/search?"
            f"from={route.origin}&to={route.destination}"
            f"&date={date_str}&adults=1&type=oneway"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        logger.debug("SpiceJet: Navigating to booking homepage...")
        await page.goto(self.base_url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)

        # Step 1: Select One-Way
        try:
            btn_oneway = await page.query_selector("[data-testid='one-way-radio-button'], #oneWay, label:has-text('One Way')")
            if btn_oneway:
                await btn_oneway.click(force=True)
                await asyncio.sleep(0.5)
        except Exception:
            pass

        # Step 2: Fill Origin
        origin_name = self.CITY_NAMES.get(route.origin, route.origin)
        try:
            await page.click("[data-testid='to-testID-origin'], input[placeholder*='From']", force=True)
            await asyncio.sleep(0.5)
            await page.keyboard.type(route.origin, delay=80)
            await asyncio.sleep(1)

            opt = await page.query_selector(f"div:has-text('{origin_name}')")
            if opt:
                await opt.click(force=True)
            else:
                await page.keyboard.press("Enter")
        except Exception as e:
            logger.debug(f"SpiceJet origin fill notice: {e}")

        await asyncio.sleep(0.5)

        # Step 3: Fill Destination
        dest_name = self.CITY_NAMES.get(route.destination, route.destination)
        try:
            await page.click("[data-testid='to-testID-destination'], input[placeholder*='To']", force=True)
            await asyncio.sleep(0.5)
            await page.keyboard.type(route.destination, delay=80)
            await asyncio.sleep(1)

            opt = await page.query_selector(f"div:has-text('{dest_name}')")
            if opt:
                await opt.click(force=True)
            else:
                await page.keyboard.press("Enter")
        except Exception as e:
            logger.debug(f"SpiceJet destination fill notice: {e}")

        await asyncio.sleep(0.5)

        # Step 4: Click Search Flight CTA
        try:
            await page.click("[data-testid='home-page-flight-cta'], button:has-text('Search')", force=True)
        except Exception as e:
            logger.warning(f"SpiceJet Search CTA click error: {e}")

        # Wait for results or URL transition
        await asyncio.sleep(8)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        body_txt = await page.inner_text("body")
        if "no flights" in body_txt.lower() or "no results" in body_txt.lower():
            raise NoFlightsFoundError("SpiceJet: No flights found")

        # Find elements containing fare amounts
        cards = await page.query_selector_all("[data-testid*='flight-card'], [class*='flight-row'], [class*='availFlight'], div.css-1dbjc4n")
        
        fares: list[FareRecord] = []
        for i, card in enumerate(cards):
            try:
                txt = await card.inner_text()
                if "SG-" in txt or "SG " in txt or "SpiceJet" in txt or "₹" in txt:
                    m_num = re.search(r"SG[-\s]?\d{3,4}", txt, re.I)
                    flt_num = m_num.group(0).upper().replace(" ", "-") if m_num else f"SG-{1000 + i}"

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
                        carrier="SpiceJet",
                        flight_number=flt_num,
                        fare_class="Economy",
                        base_fare=base_fare,
                        taxes_and_fees=taxes,
                        total_fare=total_val,
                        currency="INR",
                        scraped_at=datetime.utcnow(),
                    )
                    fares.append(fare)
            except Exception:
                continue

        if not fares:
            raise NoFlightsFoundError("SpiceJet: No valid flight fare records extracted")

        return fares
