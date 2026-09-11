"""
APIx Scraper — Browser Manager

Manages Playwright browser instances with stealth configuration,
User-Agent rotation, proxy support, and persistent contexts.

Usage:
    async with BrowserManager() as manager:
        page = await manager.new_page()
        await page.goto("https://example.com")
"""

from __future__ import annotations

import random
from typing import Optional

from loguru import logger
from playwright.async_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    async_playwright,
)

from config.settings import settings

# ---------------------------------------------------------------------------
# Pool of realistic, current User-Agent strings
# Rotated per session to avoid fingerprinting
# ---------------------------------------------------------------------------
USER_AGENTS: list[str] = [
    # Chrome on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    # Chrome on macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    # Firefox on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
    # Firefox on macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0",
    # Edge on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
    # Chrome on Linux
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    # Safari on macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    # Chrome on Android (mobile)
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
    # Safari on iOS (mobile)
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
]

# Common desktop viewport sizes (width, height)
VIEWPORT_SIZES: list[dict[str, int]] = [
    {"width": 1920, "height": 1080},
    {"width": 1366, "height": 768},
    {"width": 1536, "height": 864},
    {"width": 1440, "height": 900},
    {"width": 1280, "height": 720},
    {"width": 1600, "height": 900},
    {"width": 1280, "height": 800},
    {"width": 1680, "height": 1050},
]

# Stealth JavaScript — patches navigator.webdriver and other automation flags
STEALTH_SCRIPT = """
() => {
    // Override navigator.webdriver to return undefined
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
    });

    // Override navigator.plugins to have a realistic length
    Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
    });

    // Override navigator.languages
    Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'hi'],
    });

    // Override chrome.runtime to avoid detection
    if (!window.chrome) {
        window.chrome = {};
    }
    if (!window.chrome.runtime) {
        window.chrome.runtime = {};
    }

    // Override permissions query
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );

    // Override WebGL vendor/renderer for fingerprint masking
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // Spoof vendor and renderer
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.call(this, parameter);
    };
}
"""


class BrowserManager:
    """
    Manages Playwright browser lifecycle with stealth and anti-detection.

    Features:
    - Stealth mode (patches navigator.webdriver, plugins, etc.)
    - User-Agent rotation from a realistic pool
    - Proxy support (reads from config)
    - Randomized viewport sizes
    - Persistent browser context for cookie/session reuse
    - Indian locale and timezone for realistic behavior

    Usage as async context manager:
        async with BrowserManager() as manager:
            page = await manager.new_page()
            await page.goto("https://www.goindigo.in")
    """

    def __init__(
        self,
        proxy: Optional[str] = None,
        user_agent: Optional[str] = None,
        headless: Optional[bool] = None,
    ) -> None:
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None

        # Configuration
        self._headless = headless if headless is not None else settings.headless
        self._proxy = proxy or self._pick_proxy()
        self._user_agent = user_agent or random.choice(USER_AGENTS)
        self._viewport = random.choice(VIEWPORT_SIZES)

    # -----------------------------------------------------------------------
    # Async context manager
    # -----------------------------------------------------------------------
    async def __aenter__(self) -> "BrowserManager":
        """Start Playwright, launch browser, create stealth context."""
        self._playwright = await async_playwright().start()

        # Browser launch arguments for stealth
        launch_args = [
            "--disable-blink-features=AutomationControlled",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-infobars",
            "--no-first-run",
            "--no-default-browser-check",
        ]

        # Proxy configuration
        proxy_config = None
        if self._proxy:
            proxy_config = {"server": self._proxy}
            logger.debug(f"Using proxy: {self._proxy}")

        # Launch Chromium (most compatible with Indian airline sites)
        self._browser = await self._playwright.chromium.launch(
            headless=self._headless,
            args=launch_args,
            proxy=proxy_config,
        )

        # Create browser context with stealth settings
        self._context = await self._browser.new_context(
            viewport=self._viewport,
            user_agent=self._user_agent,
            locale="en-IN",
            timezone_id="Asia/Kolkata",
            # Permissions that a real browser would have
            permissions=["geolocation"],
            geolocation={"latitude": 28.6139, "longitude": 77.2090},  # New Delhi
            color_scheme="light",
            # Prevent download prompts
            accept_downloads=False,
        )

        # Inject stealth script into every new page/frame
        await self._context.add_init_script(STEALTH_SCRIPT)

        logger.info(
            f"Browser started | headless={self._headless} | "
            f"viewport={self._viewport['width']}x{self._viewport['height']} | "
            f"UA={self._user_agent[:60]}..."
        )

        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Gracefully close context, browser, and Playwright."""
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        logger.debug("Browser session closed")

    # -----------------------------------------------------------------------
    # Page management
    # -----------------------------------------------------------------------
    async def new_page(self) -> Page:
        """
        Create a new page in the current browser context.

        The stealth script is automatically injected via the context's
        add_init_script, so every new page inherits anti-detection.
        """
        if not self._context:
            raise RuntimeError("BrowserManager not initialized — use 'async with'")

        page = await self._context.new_page()
        page.set_default_timeout(settings.browser_timeout)

        # Block unnecessary resources to speed up page loads
        await page.route(
            "**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}",
            lambda route: route.abort(),
        )

        return page

    async def new_page_full(self) -> Page:
        """
        Create a new page WITHOUT blocking images/fonts.

        Use this when the scraper needs to interact with visual elements
        (e.g. clicking on image-based buttons) or when image loading
        is necessary for proper page rendering.
        """
        if not self._context:
            raise RuntimeError("BrowserManager not initialized — use 'async with'")

        page = await self._context.new_page()
        page.set_default_timeout(settings.browser_timeout)
        return page

    # -----------------------------------------------------------------------
    # Context access
    # -----------------------------------------------------------------------
    @property
    def context(self) -> BrowserContext:
        """Access the underlying browser context (for cookie management, etc.)."""
        if not self._context:
            raise RuntimeError("BrowserManager not initialized — use 'async with'")
        return self._context

    @property
    def browser(self) -> Browser:
        """Access the underlying browser instance."""
        if not self._browser:
            raise RuntimeError("BrowserManager not initialized — use 'async with'")
        return self._browser

    # -----------------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------------
    def _pick_proxy(self) -> Optional[str]:
        """Select a random proxy from the configured pool, or None."""
        proxies = settings.proxy_list
        if not proxies:
            return None
        return random.choice(proxies)
