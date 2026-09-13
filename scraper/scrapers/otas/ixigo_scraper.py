"""
APIx Scraper — Ixigo Scraper

Scrapes fare data from https://www.ixigo.com for domestic flights.
Uses URL-based search with aggressive scrolling + text fallback extraction.
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

    # Ixigo uses virtualized list — multiple possible selectors
    SEL_FLIGHT_CARD = 'div[class*="Listing_listItem"], div[class*="listing-item"], div[class*="flight-card"], [data-testid="flight-card"]'
    SEL_NO_FLIGHTS = '.no-results, [data-testid="no-flights"], .empty-result'
    SEL_POPUP_CLOSE = '.close-popup, .modal-close, [data-testid="close"], button:has-text("Close")'
    SEL_SHOW_MORE = 'button:has-text("Show More"), button:has-text("Load More"), button:has-text("View More"), [class*="showMore"], [class*="loadMore"]'

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

        # Dismiss popups
        for sel in self.SEL_POPUP_CLOSE.split(", "):
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await asyncio.sleep(0.3)
            except Exception:
                pass

        # Wait for initial cards to render
        for _ in range(15):
            cards = await page.query_selector_all(self.SEL_FLIGHT_CARD.split(", ")[0])
            if len(cards) >= 3:
                logger.debug(f"Ixigo: Loaded {len(cards)} initial flight cards.")
                break
            await asyncio.sleep(1)

        # Aggressive scrolling to trigger virtualized lazy-loading
        # Ixigo uses a virtualized list that only renders visible items
        for scroll_round in range(10):
            await page.evaluate("window.scrollBy(0, 2000)")
            await asyncio.sleep(0.6)

        # Try clicking "Show More" / "Load More" buttons
        for _ in range(5):
            for sel in self.SEL_SHOW_MORE.split(", "):
                try:
                    btn = await page.query_selector(sel)
                    if btn and await btn.is_visible():
                        await btn.click()
                        logger.debug(f"Ixigo: Clicked '{sel}' to load more results")
                        await asyncio.sleep(2)
                except Exception:
                    pass

        # Final scroll pass
        for _ in range(5):
            await page.evaluate("window.scrollBy(0, 2000)")
            await asyncio.sleep(0.5)

        await asyncio.sleep(1.5)

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

        # Strategy 1: DOM card extraction
        fares = await self._extract_from_cards(page, route, travel_date, advance_days)

        # Strategy 2: Bulk JS text extraction (captures virtualized items too)
        if len(fares) < 5:
            logger.debug(f"Ixigo: Only {len(fares)} from DOM cards, trying bulk JS text...")
            text_fares = await self._extract_fares_from_body_text(
                page, route, travel_date, advance_days,
                carrier_name="Unknown",
                flight_code_prefix="IXI",
            )
            if len(text_fares) > len(fares):
                fares = text_fares

        if not fares:
            raise NoFlightsFoundError("Ixigo: No valid fare records extracted")

        return fares

    async def _extract_from_cards(
        self, page: Page, route: Route, travel_date: date, advance_days: int
    ) -> list[FareRecord]:
        """Extract from DOM flight cards."""
        flight_cards = []
        for sel in self.SEL_FLIGHT_CARD.split(", "):
            cards = await page.query_selector_all(sel)
            if cards:
                flight_cards = cards
                logger.debug(f"Ixigo: Found {len(cards)} cards with '{sel}'")
                break

        if not flight_cards:
            return []

        fares: list[FareRecord] = []
        for i, card in enumerate(flight_cards[:100]):
            try:
                txt = await card.inner_text()
                lines = [l.strip() for l in txt.split("\n") if l.strip()]
                if not lines or len(lines) < 3:
                    continue
                if "Price" in lines[0] or "Sort" in lines[0]:
                    continue

                carrier = "Unknown"
                for line in lines[:4]:
                    if any(c in line.lower() for c in ["indigo", "air india", "spice", "akasa", "vistara", "go first"]):
                        carrier = line
                        break

                dep_time = ""
                flight_code = None
                for line in lines[:8]:
                    if not dep_time and re.match(r"^\d{2}:\d{2}$", line):
                        dep_time = line
                    norm = re.sub(r"\s+", "", line)
                    m = re.search(r"((?:6E|SG|QP|AI|IX|I5|UK|G8)\s*-?\s*\d{3,4})", norm, re.I)
                    if m:
                        candidate = re.sub(r"\s+", "", m.group(1)).upper()
                        if candidate not in ("DEL", "BOM", "BLR", "CCU", "HYD", "MAA"):
                            flight_code = candidate

                if not flight_code:
                    flight_code = f"IXI-{i+1}"

                flight_num = f"{flight_code} ({dep_time})" if dep_time else flight_code

                m_price = re.search(r"₹\s*([\d,]+)", txt)
                if not m_price:
                    continue

                total_val = float(m_price.group(1).replace(",", ""))
                if total_val < 1000:
                    continue

                base_fare = round(total_val * 0.85, 2)
                taxes = round(total_val * 0.15, 2)

                fare = FareRecord(
                    route_origin=route.origin, route_destination=route.destination,
                    travel_date=travel_date, advance_purchase_days=advance_days,
                    source=self.source_name, source_type=self.source_type,
                    carrier=carrier.strip(), flight_number=flight_num.strip(),
                    fare_class="Economy", base_fare=base_fare,
                    taxes_and_fees=taxes, total_fare=total_val,
                    currency="INR", scraped_at=datetime.utcnow(),
                )
                fares.append(fare)
            except Exception as e:
                logger.debug(f"Ixigo: Card #{i} error: {e}")

        return fares
