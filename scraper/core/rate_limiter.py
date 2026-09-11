"""
APIx Scraper — Rate Limiter

Enforces per-domain rate limiting to be a respectful scraper:
  - Max 1 concurrent request per domain
  - Minimum interval between requests to the same domain
  - Randomized delays (3–8s by default)
  - Respects Retry-After headers on 429/503 responses

Usage:
    rate_limiter = RateLimiter()
    async with rate_limiter.throttle("www.goindigo.in"):
        # ... make request ...
        pass
"""

from __future__ import annotations

import asyncio
import random
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from urllib.parse import urlparse

from loguru import logger

from config.settings import settings


class RateLimiter:
    """
    Per-domain rate limiter using asyncio locks and timestamp tracking.

    Ensures:
    1. Only 1 concurrent request per domain at a time
    2. Minimum interval between consecutive requests to the same domain
    3. Random jitter to look more human-like
    4. Retry-After header compliance
    """

    def __init__(
        self,
        min_delay: Optional[float] = None,
        max_delay: Optional[float] = None,
    ) -> None:
        self._min_delay = min_delay or settings.min_delay
        self._max_delay = max_delay or settings.max_delay

        # Per-domain state
        self._locks: dict[str, asyncio.Lock] = {}
        self._last_request_time: dict[str, float] = {}
        self._retry_after: dict[str, float] = {}  # domain -> earliest next allowed time

    @asynccontextmanager
    async def throttle(self, domain_or_url: str) -> AsyncGenerator[None, None]:
        """
        Async context manager that acquires a per-domain lock and
        enforces the minimum delay between requests.

        Args:
            domain_or_url: Either a bare domain (e.g. "www.goindigo.in")
                           or a full URL (domain will be extracted).

        Usage:
            async with rate_limiter.throttle("www.goindigo.in"):
                await page.goto("https://www.goindigo.in/...")
        """
        domain = self._extract_domain(domain_or_url)

        # Get or create a lock for this domain
        if domain not in self._locks:
            self._locks[domain] = asyncio.Lock()

        async with self._locks[domain]:
            # Wait for any mandatory delay
            await self._wait_for_delay(domain)

            try:
                yield
            finally:
                # Record this request's timestamp
                self._last_request_time[domain] = time.monotonic()

    async def _wait_for_delay(self, domain: str) -> None:
        """
        Wait the required time before making the next request to this domain.

        Considers:
        1. The randomized minimum delay since the last request
        2. Any Retry-After directive that was set
        """
        now = time.monotonic()
        wait_until = 0.0

        # Check Retry-After constraint
        if domain in self._retry_after:
            retry_after_time = self._retry_after[domain]
            if retry_after_time > now:
                wait_until = max(wait_until, retry_after_time)
                logger.info(
                    f"Rate limit: Retry-After active for {domain}, "
                    f"waiting {retry_after_time - now:.1f}s"
                )
            else:
                # Retry-After has expired, clean it up
                del self._retry_after[domain]

        # Check minimum delay since last request
        if domain in self._last_request_time:
            last_time = self._last_request_time[domain]
            # Random delay within the configured range
            delay = random.uniform(self._min_delay, self._max_delay)
            next_allowed = last_time + delay
            wait_until = max(wait_until, next_allowed)

        # Actually wait
        if wait_until > now:
            sleep_time = wait_until - now
            logger.debug(f"Rate limit: sleeping {sleep_time:.1f}s before request to {domain}")
            await asyncio.sleep(sleep_time)

    def set_retry_after(self, domain_or_url: str, seconds: float) -> None:
        """
        Set a Retry-After constraint for a domain.

        Called when a 429/503 response is received with a Retry-After header.

        Args:
            domain_or_url: The domain or URL that returned the Retry-After.
            seconds: Number of seconds to wait before the next request.
        """
        domain = self._extract_domain(domain_or_url)
        self._retry_after[domain] = time.monotonic() + seconds
        logger.warning(
            f"Rate limit: Retry-After set for {domain} — waiting {seconds:.0f}s"
        )

    def set_retry_after_from_header(
        self, domain_or_url: str, header_value: Optional[str]
    ) -> None:
        """
        Parse a Retry-After header value and set the constraint.

        Handles both:
        - Numeric values (seconds): "120"
        - HTTP-date values: "Thu, 01 Dec 2025 16:00:00 GMT"
          (for simplicity, we only handle numeric values robustly)
        """
        if not header_value:
            return

        domain = self._extract_domain(domain_or_url)

        try:
            seconds = float(header_value)
            self.set_retry_after(domain, seconds)
        except ValueError:
            # Could be an HTTP-date; default to a conservative 60s wait
            logger.warning(
                f"Rate limit: Unparsable Retry-After '{header_value}' "
                f"for {domain} — defaulting to 60s"
            )
            self.set_retry_after(domain, 60.0)

    def reset(self, domain_or_url: Optional[str] = None) -> None:
        """
        Reset rate limiting state.

        Args:
            domain_or_url: If provided, reset only for this domain.
                           If None, reset all state.
        """
        if domain_or_url:
            domain = self._extract_domain(domain_or_url)
            self._last_request_time.pop(domain, None)
            self._retry_after.pop(domain, None)
            self._locks.pop(domain, None)
        else:
            self._last_request_time.clear()
            self._retry_after.clear()
            self._locks.clear()

    @staticmethod
    def _extract_domain(domain_or_url: str) -> str:
        """Extract the domain from a URL, or return as-is if already a domain."""
        if "://" in domain_or_url:
            return urlparse(domain_or_url).netloc
        return domain_or_url
