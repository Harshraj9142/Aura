"""
APIx Scraper — CAPTCHA & Bot-Detection Detector

Detects when a page is showing a CAPTCHA challenge, bot-detection wall,
or access-denied response. Does NOT attempt to solve or bypass CAPTCHAs —
only detects them so the scraper can fail fast and log the event.

Usage:
    detector = CaptchaDetector()
    result = await detector.check(page)
    if result.is_blocked:
        logger.warning(f"Blocked! Type: {result.block_type}, Details: {result.details}")
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from loguru import logger
from playwright.async_api import Page


# ---------------------------------------------------------------------------
# Detection result
# ---------------------------------------------------------------------------
@dataclass
class CaptchaDetectionResult:
    """Result of a CAPTCHA/bot-detection check on a page."""

    is_blocked: bool = False
    block_type: Optional[str] = None  # "captcha", "bot_check", "access_denied", "rate_limited"
    details: Optional[str] = None  # Human-readable description of what was detected
    indicators: list[str] = field(default_factory=list)  # All matched indicators


# ---------------------------------------------------------------------------
# Known selectors and patterns for CAPTCHA/bot detection pages
# ---------------------------------------------------------------------------

# CSS selectors that indicate a CAPTCHA or bot-check
CAPTCHA_SELECTORS: list[str] = [
    # Google reCAPTCHA
    ".g-recaptcha",
    "#g-recaptcha",
    'iframe[src*="recaptcha"]',
    'iframe[src*="google.com/recaptcha"]',
    "[data-sitekey]",
    # hCaptcha
    ".h-captcha",
    'iframe[src*="hcaptcha"]',
    # Generic CAPTCHA elements
    "#captcha",
    ".captcha",
    "#captcha-container",
    ".captcha-container",
    'img[alt*="captcha" i]',
    'img[alt*="CAPTCHA"]',
    # Cloudflare challenge
    "#challenge-form",
    "#cf-challenge-running",
    ".cf-browser-verification",
    "#cf-wrapper",
    "#challenge-running",
    # PerimeterX
    "#px-captcha",
    "#px-captcha-container",
    # DataDome
    'iframe[src*="datadome"]',
    "#datadome-captcha",
    # Akamai Bot Manager
    "#ak-challenge",
    ".ak-challenge-container",
    # Generic verification
    "#verification-container",
    ".bot-verification",
]

# Text patterns on the page that indicate a block (case-insensitive search)
BLOCK_TEXT_PATTERNS: list[str] = [
    "verify you are human",
    "are you a robot",
    "prove you're not a robot",
    "unusual traffic",
    "automated access",
    "bot detected",
    "access denied",
    "access blocked",
    "forbidden",
    "please complete the security check",
    "one more step",
    "checking your browser",
    "please verify",
    "human verification",
    "security challenge",
    "captcha",
    "too many requests",
    "rate limit exceeded",
    "your ip has been",
    "temporarily blocked",
    "please try again later",
    "suspicious activity",
    "automated queries",
]


class CaptchaDetector:
    """
    Detects CAPTCHA challenges and bot-detection walls on web pages.

    Checks for:
    1. Known CAPTCHA/bot-check CSS selectors
    2. Block-related text patterns in the page body
    3. HTTP status codes indicating rate limiting (429) or forbidden (403)

    Does NOT:
    - Solve CAPTCHAs
    - Bypass bot detection
    - Interact with challenge pages
    """

    def __init__(
        self,
        extra_selectors: Optional[list[str]] = None,
        extra_text_patterns: Optional[list[str]] = None,
    ) -> None:
        """
        Initialize with optional extra detection patterns.

        Args:
            extra_selectors: Additional CSS selectors to check for.
            extra_text_patterns: Additional text patterns to search for.
        """
        self._selectors = CAPTCHA_SELECTORS.copy()
        self._text_patterns = BLOCK_TEXT_PATTERNS.copy()

        if extra_selectors:
            self._selectors.extend(extra_selectors)
        if extra_text_patterns:
            self._text_patterns.extend(extra_text_patterns)

    async def check(self, page: Page) -> CaptchaDetectionResult:
        """
        Run all detection checks on the given page.

        Args:
            page: Playwright Page object to check.

        Returns:
            CaptchaDetectionResult with is_blocked=True if any indicator
            is detected, along with the type and details.
        """
        result = CaptchaDetectionResult()

        # Check 1: HTTP status code
        await self._check_status_code(page, result)

        # Check 2: CAPTCHA/bot-check selectors
        await self._check_selectors(page, result)

        # Check 3: Block-related text patterns
        await self._check_text_patterns(page, result)

        if result.is_blocked:
            logger.warning(
                f"🛑 Block detected on {page.url} | "
                f"type={result.block_type} | "
                f"indicators={result.indicators}"
            )
        else:
            logger.debug(f"✅ No block detected on {page.url}")

        return result

    async def _check_status_code(
        self, page: Page, result: CaptchaDetectionResult
    ) -> None:
        """Check if the page response indicates rate limiting or access denied."""
        try:
            response = page.url  # We check the last response if available
            # The page object doesn't directly expose status code after navigation,
            # so we rely on the title/content checks below. However, if we have
            # access to the response object, we'd check it there.
            #
            # In practice, the caller should pass the response status separately
            # or check it before calling this detector.
            pass
        except Exception:
            pass

    async def _check_selectors(
        self, page: Page, result: CaptchaDetectionResult
    ) -> None:
        """Check for known CAPTCHA/bot-check CSS selectors."""
        for selector in self._selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    is_visible = await element.is_visible()
                    if is_visible:
                        result.is_blocked = True
                        result.indicators.append(f"selector:{selector}")

                        # Classify the block type
                        if "captcha" in selector.lower() or "recaptcha" in selector.lower():
                            result.block_type = "captcha"
                        elif "challenge" in selector.lower() or "cf-" in selector:
                            result.block_type = "bot_check"
                        elif "datadome" in selector.lower() or "px-" in selector:
                            result.block_type = "bot_check"
                        else:
                            result.block_type = result.block_type or "captcha"

            except Exception:
                # Selector check failed (e.g. page navigated away) — skip silently
                continue

    async def _check_text_patterns(
        self, page: Page, result: CaptchaDetectionResult
    ) -> None:
        """Check for block-related text patterns in the page content."""
        try:
            # Get the visible text content of the page body
            body_text = await page.inner_text("body")
            body_lower = body_text.lower()

            for pattern in self._text_patterns:
                if pattern in body_lower:
                    result.is_blocked = True
                    result.indicators.append(f"text:{pattern}")

                    # Classify the block type based on the matched text
                    if any(
                        kw in pattern
                        for kw in ("captcha", "robot", "human", "verification")
                    ):
                        result.block_type = result.block_type or "captcha"
                    elif any(
                        kw in pattern
                        for kw in ("rate limit", "too many", "try again")
                    ):
                        result.block_type = "rate_limited"
                    elif any(
                        kw in pattern
                        for kw in ("denied", "blocked", "forbidden")
                    ):
                        result.block_type = "access_denied"
                    else:
                        result.block_type = result.block_type or "bot_check"

        except Exception as e:
            logger.debug(f"Could not read page body text: {e}")

        # Build a human-readable details string
        if result.is_blocked and not result.details:
            result.details = (
                f"Block detected on {page.url}: "
                f"matched {len(result.indicators)} indicator(s) — "
                f"{', '.join(result.indicators[:5])}"
            )

    async def check_response_status(
        self, status_code: int, headers: dict, domain: str
    ) -> CaptchaDetectionResult:
        """
        Check an HTTP response status code and headers for rate limiting.

        This is called separately from `check()` because Playwright's
        page.goto() returns a Response object with status info.

        Args:
            status_code: HTTP status code from the response.
            headers: Response headers dict.
            domain: The domain being scraped (for logging).

        Returns:
            CaptchaDetectionResult if blocked, otherwise a clean result.
        """
        result = CaptchaDetectionResult()

        if status_code == 429:
            result.is_blocked = True
            result.block_type = "rate_limited"
            result.details = f"HTTP 429 Too Many Requests from {domain}"
            result.indicators.append("http:429")

            # Check for Retry-After header
            retry_after = headers.get("retry-after")
            if retry_after:
                result.details += f" (Retry-After: {retry_after})"

        elif status_code == 403:
            result.is_blocked = True
            result.block_type = "access_denied"
            result.details = f"HTTP 403 Forbidden from {domain}"
            result.indicators.append("http:403")

        elif status_code == 503:
            # 503 could be maintenance or bot protection
            result.is_blocked = True
            result.block_type = "bot_check"
            result.details = f"HTTP 503 Service Unavailable from {domain} (possible bot protection)"
            result.indicators.append("http:503")

        if result.is_blocked:
            logger.warning(f"🛑 {result.details}")

        return result
