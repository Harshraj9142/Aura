"""
APIx Scraper — Cleartrip Scraper

Scrapes fare data from https://www.cleartrip.com for domestic flights.
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


class CleartripScraper(BaseScraper):
    """Scraper for Cleartrip (cleartrip.com) — OTA."""

    source_name = "cleartrip"
    source_type = SourceTypeEnum.OTA
    base_url = "https://www.cleartrip.com"

    SEL_FLIGHT_CARD = 'div[class*="ba-solid"], div[class*="br-12"], div.mb-2.bg-white, .flight-card, .result-row'
    SEL_NO_FLIGHTS = '.no-results, [data-testid="no-flights"], .emptyMsg'

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        date_str = travel_date.strftime("%d/%m/%Y")
        return (
            f"{self.base_url}/flights/results?"
            f"adults=1&childs=0&infants=0&class=Economy&depart_date={date_str}"
            f"&from={route.origin}&to={route.destination}&intl=n&sft=0"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        try:
            logger.debug("Cleartrip: Initializing session at homepage...")
            await page.goto(self.base_url, wait_until="domcontentloaded", timeout=15000)
            await asyncio.sleep(1)
        except Exception as e:
            logger.debug(f"Cleartrip: Homepage session notice: {e}")

        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"Cleartrip: Navigating to: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)

        # Wait up to 10s for cards to populate
        for _ in range(10):
            cards = await page.query_selector_all(self.SEL_FLIGHT_CARD)
            if len(cards) >= 3:
                logger.debug(f"Cleartrip: Loaded {len(cards)} flight cards.")
                break
            await asyncio.sleep(1)
        await asyncio.sleep(1.5)

    async def _extract_fares(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        for sel in self.SEL_NO_FLIGHTS.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    raise NoFlightsFoundError("Cleartrip: No flights found")
            except NoFlightsFoundError:
                raise
            except Exception:
                continue

        # Bulk extract card texts in a single evaluate call using selector registry
        cards_texts = await page.evaluate(f"""() => {{
            const cards = Array.from(document.querySelectorAll('{self.SEL_FLIGHT_CARD}'));
            return cards.slice(0, 100).map(c => c.innerText || '');
        }}""")

        if not cards_texts:
            raise NoFlightsFoundError("Cleartrip: No flight cards found")

        fares: list[FareRecord] = []
        for i, txt in enumerate(cards_texts):
            try:
                total_val = None
                lines = [l.strip() for l in txt.split("\n") if l.strip()]
                if not lines or "AIRLINES" in lines[0] or "Clear" in lines[0]:
                    continue

                carrier = "Unknown Airline"
                for line in lines[:5]:
                    if any(c in line.lower() for c in ["indigo", "air india", "air india express", "spicejet", "akasa"]):
                        carrier = line
                        break

                dep_time = ""
                flight_code = None
                for line in lines[:8]:
                    if not dep_time and re.match(r"^\d{2}:\d{2}$", line):
                        dep_time = line

                    norm = re.sub(r"\s+", "", line)
                    m = re.search(r"([A-Z0-9]{2}-?\d{3,4})", norm)
                    if m and m.group(1) not in ("DEL", "BOM", "BLR", "CCU", "HYD", "MAA"):
                        flight_code = m.group(1)

                if not flight_code:
                    flight_code = f"CT-{i+1}"

                flight_num = f"{flight_code} ({dep_time})" if dep_time else flight_code

                m_price = re.search(r"₹\s*([\d,]+)", txt)
                if not m_price:
                    all_nums = re.findall(r"[\d,]{4,6}", txt)
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
                logger.warning(f"Cleartrip: Card #{i} error: {e}")

        if not fares:
            raise NoFlightsFoundError("Cleartrip: No valid fare records extracted")

        return fares
