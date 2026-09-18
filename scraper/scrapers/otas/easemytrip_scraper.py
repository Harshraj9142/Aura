"""
APIx Scraper — EaseMyTrip Scraper

Scrapes fare data from https://www.easemytrip.com for domestic flights.
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


class EaseMyTripScraper(BaseScraper):
    """Scraper for EaseMyTrip (easemytrip.com) — OTA."""

    source_name = "easemytrip"
    source_type = SourceTypeEnum.OTA
    base_url = "https://www.easemytrip.com"

    SEL_FLIGHT_CARD = '.nw_listing_bx, .flt-list-row, .flight-card, [data-testid="flight-row"]'
    SEL_NO_FLIGHTS = '.no-result, [data-testid="no-flights"], .noResultFound, .no-flt'

    CITY_MAP: dict[str, str] = {
        "DEL": "DEL-Delhi-India",
        "BOM": "BOM-Mumbai-India",
        "BLR": "BLR-Bengaluru-India",
        "CCU": "CCU-Kolkata-India",
        "HYD": "HYD-Hyderabad-India",
        "MAA": "MAA-Chennai-India",
    }

    def _build_search_url(self, route: Route, travel_date: date, advance_days: int) -> str:
        origin_str = self.CITY_MAP.get(route.origin, f"{route.origin}-{route.origin}-India")
        dest_str = self.CITY_MAP.get(route.destination, f"{route.destination}-{route.destination}-India")
        date_str = travel_date.strftime("%d/%m/%Y")
        return (
            f"{self.base_url}/flight-search/listing?"
            f"srch={origin_str}|{dest_str}|{date_str}&px=1-0-0&cbn=0&ar=undefined&isow=true&isdm=true&lang=en-us&SearchType=Oneway&Trip=One"
        )

    async def _navigate_and_search(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> None:
        # Navigate directly to search listing page (fast path)
        url = self._build_search_url(route, travel_date, advance_days)
        logger.debug(f"EaseMyTrip: Navigating to listing: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=25000)

        # Wait up to 10s for flight cards to finish loading
        for _ in range(10):
            cards = await page.query_selector_all(".nw_listing_bx")
            if len(cards) >= 5:
                logger.debug(f"EaseMyTrip: Loaded {len(cards)} flight cards.")
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
                    raise NoFlightsFoundError("EaseMyTrip: No flights found")
            except NoFlightsFoundError:
                raise
            except Exception:
                continue

        # Bulk extract card data in a single evaluate call using exact selector registry
        cards_data = await page.evaluate(f"""() => {{
            const cards = Array.from(document.querySelectorAll('{self.SEL_FLIGHT_CARD}'));
            return cards.slice(0, 100).map(c => {{
                const prc = c.querySelector('.flt_prc, .txt-r6, [class*="prc"], [class*="price"]');
                return {{
                    text: c.innerText || '',
                    priceText: prc ? (prc.innerText || '') : ''
                }};
            }});
        }}""")

        if not cards_data:
            raise NoFlightsFoundError("EaseMyTrip: No flight cards found")

        fares: list[FareRecord] = []
        for i, card_item in enumerate(cards_data):
            try:
                txt = card_item.get("text", "")
                price_txt = card_item.get("priceText", "")
                lines = [l.strip() for l in txt.split("\n") if l.strip()]
                if not lines:
                    continue

                carrier = "Unknown Airline"
                for line in lines[:4]:
                    if any(c in line.lower() for c in ["indigo", "air india express", "air india", "akasa", "spicejet", "vistara"]):
                        carrier = line
                        break
                if carrier == "Unknown Airline" and lines:
                    # Filter out promo badges
                    cand = [l for l in lines[:3] if not any(w in l.lower() for w in ["meal", "cashback", "lock", "fastest", "cheapest", "special"])]
                    carrier = cand[0] if cand else lines[0]
                
                # Extract departure time and unique flight number/code
                flight_code = None
                dep_time = ""

                for line in lines[:10]:
                    if not dep_time and re.match(r"^\d{2}:\d{2}$", line):
                        dep_time = line

                    normalized = re.sub(r"\s+", "", line)
                    m_code = re.match(r"^([A-Z0-9]{2})-?(\d{3,4})$", normalized)
                    if m_code:
                        flight_code = f"{m_code.group(1)}-{m_code.group(2)}"

                if not flight_code:
                    flight_code = f"EMT-{i+1}"

                flight_num = f"{flight_code} ({dep_time})" if dep_time else flight_code

                # Extract price from price element or regex with currency symbol/keyword
                total_val = None
                m_price = re.search(r"(?:₹|Rs\.?|INR)\s*([\d,]+)", price_txt + " " + txt)
                if m_price:
                    total_val = float(m_price.group(1).replace(",", ""))
                else:
                    # Fallback: look for 4-5 digit numbers after flight number lines
                    all_nums = re.findall(r"[\d,]{4,6}", " ".join(lines[4:]))
                    for n_str in all_nums:
                        try:
                            v = float(n_str.replace(",", ""))
                            if 1500 <= v <= 90000:
                                total_val = v
                                break
                        except ValueError:
                            continue

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
                logger.warning(f"EaseMyTrip: Card #{i} parse error: {e}")

        if not fares:
            raise NoFlightsFoundError("EaseMyTrip: No valid fare records extracted")

        return fares
