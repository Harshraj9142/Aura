"""
APIx Scraper — IndiGo Airlines Scraper

Scrapes fare data from https://www.goindigo.in for domestic Indian flights.

IndiGo uses a React-based SPA with dynamic rendering. This scraper:
1. Navigates to the booking page
2. Fills in the search form (origin, destination, date, passengers)
3. Clicks search and waits for results
4. Parses fare cards from the rendered DOM

Selector Registry:
All DOM selectors are defined as class constants at the top of the class
for easy maintenance when the site layout changes.
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


class IndiGoScraper(BaseScraper):
    """
    Scraper for IndiGo (goindigo.in) domestic flights.

    Uses a form-fill approach since IndiGo's SPA doesn't support
    direct URL-based search (the search state is managed client-side).
    """

    source_name = "indigo"
    source_type = SourceTypeEnum.AIRLINE
    base_url = "https://www.goindigo.in"

    # ===================================================================
    # SELECTOR REGISTRY
    # Update these when IndiGo changes their DOM structure.
    # All selectors are CSS selectors unless noted otherwise.
    # ===================================================================

    # Search form
    SEL_ONEWAY_TAB = '[data-testid="one-way-tab"], .trip-type-one-way, label[for="oneWay"], .one-way'
    SEL_ORIGIN_INPUT = '[data-testid="origin-input"], #origin, input[placeholder*="From"], .origin-input input'
    SEL_DESTINATION_INPUT = '[data-testid="destination-input"], #destination, input[placeholder*="To"], .destination-input input'
    SEL_DATE_INPUT = '[data-testid="departure-date"], .departure-date, input[placeholder*="Depart"]'
    SEL_SEARCH_BUTTON = '[data-testid="search-flights"], button[type="submit"], .search-btn, .search-flights-btn'

    # Airport dropdown suggestions
    SEL_AIRPORT_OPTION = '.airport-option, .city-option, [data-testid="airport-option"], .dropdown-item'

    # Calendar
    SEL_CALENDAR = '.calendar, .date-picker, [data-testid="calendar"]'
    SEL_CALENDAR_NEXT = '.calendar-next, .next-month, [data-testid="calendar-next"]'
    SEL_CALENDAR_DAY = '.calendar-day:not(.disabled), .day-cell:not(.disabled)'

    # Flight results
    SEL_FLIGHT_CARD = '.flight-card, .flight-row, [data-testid="flight-card"], .flight-list-item, .flight-item'
    SEL_FLIGHT_NUMBER = '.flight-number, [data-testid="flight-number"], .flight-no'
    SEL_DEPARTURE_TIME = '.departure-time, [data-testid="departure-time"], .dep-time'
    SEL_ARRIVAL_TIME = '.arrival-time, [data-testid="arrival-time"], .arr-time'
    SEL_FARE_AMOUNT = '.fare-amount, .price, [data-testid="fare"], .total-fare, .fare-value'
    SEL_BASE_FARE = '.base-fare, [data-testid="base-fare"]'
    SEL_TAXES = '.taxes, .taxes-fees, [data-testid="taxes"]'
    SEL_FARE_CLASS = '.fare-class, .cabin-class, [data-testid="fare-class"], .fare-type'

    # Status indicators
    SEL_NO_FLIGHTS = '.no-flights, .no-results, [data-testid="no-flights"], .empty-results'
    SEL_SOLD_OUT = '.sold-out, .seats-unavailable, [data-testid="sold-out"]'
    SEL_LOADING = '.loading, .spinner, [data-testid="loading"], .skeleton-loader'

    # Cookie/popup dismissal
    SEL_COOKIE_ACCEPT = '.cookie-accept, #cookie-accept, [data-testid="cookie-accept"], .accept-cookies'
    SEL_POPUP_CLOSE = '.popup-close, .modal-close, [data-testid="close-popup"], .close-btn'

    # ===================================================================
    # City name mapping (IndiGo's search uses city names, not IATA codes)
    # ===================================================================
    CITY_NAMES: dict[str, str] = {
        "DEL": "New Delhi",
        "BOM": "Mumbai",
        "BLR": "Bengaluru",
        "CCU": "Kolkata",
        "HYD": "Hyderabad",
        "MAA": "Chennai",
        "GOI": "Goa",
        "PNQ": "Pune",
        "AMD": "Ahmedabad",
        "JAI": "Jaipur",
        "COK": "Kochi",
        "LKO": "Lucknow",
        "GAU": "Guwahati",
        "PAT": "Patna",
        "IXC": "Chandigarh",
    }

    # ===================================================================
    # Implementation
    # ===================================================================

    def _build_search_url(
        self, route: Route, travel_date: date, advance_days: int
    ) -> str:
        """
        Build the IndiGo search URL.

        Note: IndiGo's actual search is form-based (SPA), so this URL
        is primarily used for robots.txt checks. The actual navigation
        happens in _navigate_and_search().
        """
        date_str = travel_date.strftime("%d/%m/%Y")
        return (
            f"{self.base_url}/flight/search?"
            f"origin={route.origin}&destination={route.destination}"
            f"&date={date_str}&adults=1&children=0&infants=0"
        )

    async def _navigate_and_search(
        self,
        page: Page,
        route: Route,
        travel_date: date,
        advance_days: int,
    ) -> None:
        """
        Navigate to IndiGo's booking page and perform a flight search.

        Flow:
        1. Go to the main booking page
        2. Dismiss any popups/cookie banners
        3. Select one-way trip
        4. Enter origin city
        5. Enter destination city
        6. Select travel date from calendar
        7. Click search
        8. Wait for results to load
        """
        # Step 1: Navigate to the booking page
        logger.debug("IndiGo: Navigating to booking page...")
        await page.goto(
            self.base_url,
            wait_until="domcontentloaded",
            timeout=30000,
        )

        # Wait for the page to fully render
        await asyncio.sleep(3)

        # Step 2: Dismiss popups/cookies
        await self._dismiss_popups(page)

        # Step 3: Select one-way trip
        await self._select_oneway(page)

        # Step 4: Enter origin
        origin_name = self.CITY_NAMES.get(route.origin, route.origin)
        await self._enter_airport(page, self.SEL_ORIGIN_INPUT, origin_name, route.origin)

        await asyncio.sleep(1)

        # Step 5: Enter destination
        dest_name = self.CITY_NAMES.get(route.destination, route.destination)
        await self._enter_airport(page, self.SEL_DESTINATION_INPUT, dest_name, route.destination)

        await asyncio.sleep(1)

        # Step 6: Select date
        await self._select_date(page, travel_date)

        await asyncio.sleep(1)

        # Step 7: Click search
        await self._click_search(page)

        # Step 8: Wait for results
        await self._wait_for_results(page)

    async def _dismiss_popups(self, page: Page) -> None:
        """Dismiss any cookie banners or promotional popups."""
        for selector in [self.SEL_COOKIE_ACCEPT, self.SEL_POPUP_CLOSE]:
            try:
                element = await page.query_selector(selector)
                if element and await element.is_visible():
                    await element.click()
                    logger.debug(f"IndiGo: Dismissed popup ({selector})")
                    await asyncio.sleep(0.5)
            except Exception:
                pass  # No popup to dismiss

    async def _select_oneway(self, page: Page) -> None:
        """Select the one-way trip type."""
        try:
            for selector in self.SEL_ONEWAY_TAB.split(", "):
                element = await page.query_selector(selector)
                if element and await element.is_visible():
                    await element.click()
                    logger.debug("IndiGo: Selected one-way trip")
                    await asyncio.sleep(0.5)
                    return
        except Exception as e:
            logger.debug(f"IndiGo: Could not select one-way (may already be default): {e}")

    async def _enter_airport(
        self, page: Page, input_selector: str, city_name: str, iata_code: str
    ) -> None:
        """
        Enter an airport/city into the origin or destination field.

        Tries multiple strategies:
        1. Click the field, type the city name, select from dropdown
        2. Click the field, type the IATA code, select from dropdown
        """
        logger.debug(f"IndiGo: Entering airport: {city_name} ({iata_code})")

        # Try each selector variant
        for selector in input_selector.split(", "):
            try:
                element = await page.query_selector(selector)
                if element:
                    await element.click()
                    await asyncio.sleep(0.5)

                    # Clear and type the city name
                    await element.fill("")
                    await page.keyboard.type(city_name, delay=100)
                    await asyncio.sleep(1.5)

                    # Try to select from the dropdown
                    selected = await self._select_from_dropdown(page, city_name, iata_code)
                    if selected:
                        return

                    # Fallback: try with IATA code
                    await element.fill("")
                    await page.keyboard.type(iata_code, delay=100)
                    await asyncio.sleep(1.5)

                    selected = await self._select_from_dropdown(page, city_name, iata_code)
                    if selected:
                        return
            except Exception:
                continue

        logger.warning(f"IndiGo: Could not enter airport {city_name} ({iata_code})")

    async def _select_from_dropdown(
        self, page: Page, city_name: str, iata_code: str
    ) -> bool:
        """
        Select an airport from the search dropdown.

        Returns True if an option was selected, False otherwise.
        """
        try:
            # Look for dropdown options
            for option_selector in self.SEL_AIRPORT_OPTION.split(", "):
                options = await page.query_selector_all(option_selector)
                for option in options:
                    text = await option.inner_text()
                    if (
                        iata_code.lower() in text.lower()
                        or city_name.lower() in text.lower()
                    ):
                        await option.click()
                        logger.debug(f"IndiGo: Selected airport: {text.strip()}")
                        return True

            # Fallback: just press Enter to select the first suggestion
            await page.keyboard.press("Enter")
            await asyncio.sleep(0.5)
            return True

        except Exception as e:
            logger.debug(f"IndiGo: Dropdown selection failed: {e}")
            return False

    async def _select_date(self, page: Page, travel_date: date) -> None:
        """
        Select the travel date from the calendar widget.

        Strategy:
        1. Click the date input to open the calendar
        2. Navigate to the correct month
        3. Click the target day
        """
        logger.debug(f"IndiGo: Selecting date: {travel_date}")

        # Click date input to open calendar
        for selector in self.SEL_DATE_INPUT.split(", "):
            try:
                element = await page.query_selector(selector)
                if element and await element.is_visible():
                    await element.click()
                    await asyncio.sleep(1)
                    break
            except Exception:
                continue

        # Navigate to the correct month
        # IndiGo's calendar typically shows the current month
        # We need to click "next" until we reach the target month
        target_month_year = travel_date.strftime("%B %Y")  # e.g. "October 2026"

        for _ in range(12):  # Max 12 months ahead
            try:
                # Check if current month matches target
                calendar_text = ""
                calendar = await page.query_selector(self.SEL_CALENDAR)
                if calendar:
                    calendar_text = await calendar.inner_text()

                if target_month_year.lower() in calendar_text.lower():
                    break

                # Click next month
                for next_sel in self.SEL_CALENDAR_NEXT.split(", "):
                    next_btn = await page.query_selector(next_sel)
                    if next_btn:
                        await next_btn.click()
                        await asyncio.sleep(0.5)
                        break
            except Exception:
                break

        # Click the target day
        day_str = str(travel_date.day)
        try:
            # Try to find the exact day element
            day_elements = await page.query_selector_all(
                self.SEL_CALENDAR_DAY
            )
            for day_el in day_elements:
                text = (await day_el.inner_text()).strip()
                if text == day_str:
                    await day_el.click()
                    logger.debug(f"IndiGo: Selected date: {travel_date}")
                    await asyncio.sleep(0.5)
                    return

            # Fallback: click by text content
            await page.click(f'text="{day_str}"')
            await asyncio.sleep(0.5)
        except Exception as e:
            logger.warning(f"IndiGo: Date selection may have failed: {e}")

    async def _click_search(self, page: Page) -> None:
        """Click the search flights button."""
        for selector in self.SEL_SEARCH_BUTTON.split(", "):
            try:
                btn = await page.query_selector(selector)
                if btn and await btn.is_visible():
                    await btn.click()
                    logger.debug("IndiGo: Clicked search button")
                    return
            except Exception:
                continue

        # Fallback: try pressing Enter
        await page.keyboard.press("Enter")
        logger.debug("IndiGo: Pressed Enter as search fallback")

    async def _wait_for_results(self, page: Page) -> None:
        """
        Wait for flight results to load.

        Waits for either:
        - Flight cards to appear
        - "No flights" message to appear
        - Loading spinner to disappear
        """
        logger.debug("IndiGo: Waiting for results to load...")

        try:
            # Wait for either results or no-results indicator
            await page.wait_for_selector(
                f"{self.SEL_FLIGHT_CARD}, {self.SEL_NO_FLIGHTS}, {self.SEL_SOLD_OUT}",
                timeout=20000,
                state="visible",
            )
        except PlaywrightTimeout:
            # Check if still loading
            try:
                loading = await page.query_selector(self.SEL_LOADING)
                if loading and await loading.is_visible():
                    # Give extra time for slow loads
                    await asyncio.sleep(10)
            except Exception:
                pass

        # Final wait for dynamic content to settle
        await asyncio.sleep(2)

    async def _extract_fares(
        self,
        page: Page,
        route: Route,
        travel_date: date,
        advance_days: int,
    ) -> list[FareRecord]:
        """
        Extract fare records from IndiGo's search results page.

        Parses flight cards from the rendered DOM and creates
        FareRecord instances for each fare option found.
        """
        # Check for "no flights" indicator
        for selector in self.SEL_NO_FLIGHTS.split(", "):
            try:
                no_flights = await page.query_selector(selector)
                if no_flights and await no_flights.is_visible():
                    raise NoFlightsFoundError("IndiGo: No flights found for this route/date")
            except NoFlightsFoundError:
                raise
            except Exception:
                continue

        # Check for "sold out" indicator
        for selector in self.SEL_SOLD_OUT.split(", "):
            try:
                sold_out = await page.query_selector(selector)
                if sold_out and await sold_out.is_visible():
                    raise SoldOutError("IndiGo: All flights sold out for this route/date")
            except SoldOutError:
                raise
            except Exception:
                continue

        # Find all flight cards
        flight_cards = []
        for selector in self.SEL_FLIGHT_CARD.split(", "):
            cards = await page.query_selector_all(selector)
            if cards:
                flight_cards = cards
                logger.debug(f"IndiGo: Found {len(cards)} flight cards using '{selector}'")
                break

        if not flight_cards:
            # Try to extract from page content as a fallback
            fares = await self._extract_fares_from_text(page, route, travel_date, advance_days)
            if fares:
                return fares
            raise NoFlightsFoundError(
                "IndiGo: No flight cards found in DOM — page may have changed"
            )

        # Parse each flight card
        fares: list[FareRecord] = []

        for i, card in enumerate(flight_cards):
            try:
                fare = await self._parse_flight_card(
                    card, route, travel_date, advance_days, index=i
                )
                if fare:
                    fares.append(fare)
            except Exception as e:
                logger.warning(f"IndiGo: Failed to parse flight card #{i}: {e}")
                continue

        logger.info(f"IndiGo: Extracted {len(fares)} fares from {len(flight_cards)} cards")
        return fares

    async def _parse_flight_card(
        self,
        card,
        route: Route,
        travel_date: date,
        advance_days: int,
        index: int = 0,
    ) -> Optional[FareRecord]:
        """
        Parse a single flight card element into a FareRecord.

        Extracts: flight number, times, fare class, base fare, taxes, total.
        """
        # Extract flight number
        flight_number = await self._extract_text(card, self.SEL_FLIGHT_NUMBER)
        if not flight_number:
            flight_number = f"6E-{1000 + index}"  # Placeholder if not found

        # Clean flight number
        flight_number = flight_number.strip()
        if not flight_number.startswith("6E"):
            # IndiGo flights always start with 6E
            flight_number = f"6E-{flight_number}" if flight_number.isdigit() else flight_number

        # Extract fare amount (total fare)
        total_fare_text = await self._extract_text(card, self.SEL_FARE_AMOUNT)
        if not total_fare_text:
            logger.debug(f"IndiGo: No fare found for card #{index}")
            return None

        # Extract base fare and taxes (may not always be visible)
        base_fare_text = await self._extract_text(card, self.SEL_BASE_FARE)
        taxes_text = await self._extract_text(card, self.SEL_TAXES)

        # Extract fare class
        fare_class = await self._extract_text(card, self.SEL_FARE_CLASS)
        if not fare_class:
            fare_class = "Economy"  # IndiGo default

        # Build the FareRecord (Pydantic handles cleaning/validation)
        try:
            fare = FareRecord(
                route_origin=route.origin,
                route_destination=route.destination,
                travel_date=travel_date,
                advance_purchase_days=advance_days,
                source=self.source_name,
                source_type=self.source_type,
                carrier="IndiGo",
                flight_number=flight_number,
                fare_class=fare_class,
                base_fare=base_fare_text,
                taxes_and_fees=taxes_text,
                total_fare=total_fare_text,
                currency="INR",
                scraped_at=datetime.utcnow(),
            )
            return fare

        except Exception as e:
            logger.warning(
                f"IndiGo: Validation failed for card #{index}: {e} "
                f"(total={total_fare_text}, base={base_fare_text}, taxes={taxes_text})"
            )
            return None

    async def _extract_fares_from_text(
        self,
        page: Page,
        route: Route,
        travel_date: date,
        advance_days: int,
    ) -> list[FareRecord]:
        """
        Fallback: extract fare data from raw page text content.

        Used when DOM selectors don't match (site layout changed).
        Looks for patterns like "₹4,500" or "INR 4500" in the page.
        """
        try:
            body_text = await page.inner_text("body")

            # Find all fare-like patterns
            fare_pattern = re.compile(r"[₹Rs\.INR\s]*(\d{1,2}[,.]?\d{3,}(?:\.\d{2})?)")
            matches = fare_pattern.findall(body_text)

            if not matches:
                return []

            fares = []
            for i, match in enumerate(matches[:20]):  # Cap at 20 to avoid noise
                try:
                    fare = FareRecord(
                        route_origin=route.origin,
                        route_destination=route.destination,
                        travel_date=travel_date,
                        advance_purchase_days=advance_days,
                        source=self.source_name,
                        source_type=self.source_type,
                        carrier="IndiGo",
                        flight_number=f"6E-TEXT-{i}",
                        fare_class="Economy",
                        total_fare=match.replace(",", ""),
                        currency="INR",
                        scraped_at=datetime.utcnow(),
                    )
                    # Only keep if it looks like a valid domestic fare
                    if 500 <= fare.total_fare <= 50000:
                        fare.validation_warnings.append("Extracted from text fallback (selectors may need updating)")
                        fares.append(fare)
                except Exception:
                    continue

            if fares:
                logger.warning(
                    f"IndiGo: Used text fallback — extracted {len(fares)} fares. "
                    f"DOM selectors may need updating."
                )

            return fares

        except Exception as e:
            logger.debug(f"IndiGo: Text fallback extraction failed: {e}")
            return []

    async def _extract_text(self, parent, selectors: str) -> Optional[str]:
        """
        Extract text from the first matching selector within a parent element.

        Tries each selector variant (comma-separated) until one matches.
        """
        for selector in selectors.split(", "):
            try:
                element = await parent.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    return text.strip() if text else None
            except Exception:
                continue
        return None
