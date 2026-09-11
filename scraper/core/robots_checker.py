"""
APIx Scraper — Robots.txt Compliance Checker

Fetches and caches robots.txt for each domain, and checks whether
a given URL path is allowed for scraping. Respects Crawl-delay if set.

This ensures we comply with site owners' crawling preferences before
making any requests.

Usage:
    checker = RobotsChecker()
    allowed = await checker.is_allowed("https://www.goindigo.in/flight/search")
    if not allowed:
        logger.warning("Path disallowed by robots.txt — skipping")
"""

from __future__ import annotations

import time
from typing import Optional
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx
from loguru import logger

from config.settings import settings


class RobotsChecker:
    """
    Checks robots.txt compliance for target URLs.

    Features:
    - Fetches and caches robots.txt per domain (24h TTL by default)
    - Uses Python's standard RobotFileParser
    - Extracts Crawl-delay directive if present
    - Gracefully handles missing/unreachable robots.txt (allows by default)
    """

    def __init__(self, cache_ttl: Optional[int] = None) -> None:
        self._cache_ttl = cache_ttl or settings.robots_cache_ttl
        # Cache: domain -> (RobotFileParser, fetch_timestamp)
        self._cache: dict[str, tuple[RobotFileParser, float]] = {}

    async def is_allowed(
        self,
        url: str,
        user_agent: str = "*",
    ) -> bool:
        """
        Check if the given URL path is allowed by robots.txt.

        Args:
            url: Full URL to check (e.g. "https://www.goindigo.in/flight/search").
            user_agent: User-Agent to check against (default: "*" for all bots).

        Returns:
            True if the path is allowed (or if robots.txt is unavailable).
            False if the path is explicitly disallowed.
        """
        parsed = urlparse(url)
        domain = parsed.netloc
        robots_url = f"{parsed.scheme}://{domain}/robots.txt"

        # Get or fetch the parser
        parser = await self._get_parser(domain, robots_url)
        if parser is None:
            # Could not fetch robots.txt — be permissive
            logger.debug(f"robots.txt unavailable for {domain} — allowing by default")
            return True

        allowed = parser.can_fetch(user_agent, url)
        if not allowed:
            logger.warning(
                f"🚫 robots.txt DISALLOWS: {url} for user-agent '{user_agent}'"
            )
        else:
            logger.debug(f"✅ robots.txt allows: {url}")

        return allowed

    async def get_crawl_delay(
        self,
        domain: str,
        user_agent: str = "*",
    ) -> Optional[float]:
        """
        Get the Crawl-delay directive from robots.txt, if any.

        Returns:
            Crawl delay in seconds, or None if not specified.
        """
        parsed_domain = domain if "://" not in domain else urlparse(domain).netloc
        robots_url = f"https://{parsed_domain}/robots.txt"

        parser = await self._get_parser(parsed_domain, robots_url)
        if parser is None:
            return None

        delay = parser.crawl_delay(user_agent)
        if delay:
            logger.info(f"Crawl-delay for {parsed_domain}: {delay}s")
        return delay

    async def _get_parser(
        self,
        domain: str,
        robots_url: str,
    ) -> Optional[RobotFileParser]:
        """
        Get a cached RobotFileParser or fetch a fresh one.

        Returns None if robots.txt cannot be fetched.
        """
        now = time.time()

        # Check cache
        if domain in self._cache:
            parser, fetch_time = self._cache[domain]
            if (now - fetch_time) < self._cache_ttl:
                return parser
            else:
                logger.debug(f"robots.txt cache expired for {domain} — re-fetching")

        # Fetch robots.txt
        parser = await self._fetch_robots(robots_url)
        if parser is not None:
            self._cache[domain] = (parser, now)

        return parser

    async def _fetch_robots(self, robots_url: str) -> Optional[RobotFileParser]:
        """
        Fetch and parse robots.txt from the given URL.

        Returns None on any error (network, timeout, server error).
        """
        try:
            async with httpx.AsyncClient(
                timeout=10.0,
                follow_redirects=True,
            ) as client:
                response = await client.get(robots_url)

                if response.status_code == 200:
                    parser = RobotFileParser()
                    parser.parse(response.text.splitlines())
                    logger.debug(f"Fetched robots.txt from {robots_url}")
                    return parser
                elif response.status_code in (404, 403):
                    # No robots.txt or forbidden — assume everything is allowed
                    logger.debug(
                        f"robots.txt returned {response.status_code} for {robots_url} "
                        f"— assuming all paths allowed"
                    )
                    # Return a permissive parser
                    parser = RobotFileParser()
                    parser.parse(["User-agent: *", "Allow: /"])
                    return parser
                else:
                    logger.warning(
                        f"Unexpected status {response.status_code} fetching {robots_url}"
                    )
                    return None

        except httpx.TimeoutException:
            logger.warning(f"Timeout fetching robots.txt from {robots_url}")
            return None
        except httpx.HTTPError as e:
            logger.warning(f"HTTP error fetching robots.txt from {robots_url}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching robots.txt from {robots_url}: {e}")
            return None

    def clear_cache(self, domain: Optional[str] = None) -> None:
        """Clear the robots.txt cache (all or for a specific domain)."""
        if domain:
            self._cache.pop(domain, None)
        else:
            self._cache.clear()
        logger.debug(f"robots.txt cache cleared: {domain or 'all'}")
