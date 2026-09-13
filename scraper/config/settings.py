"""
APIx Scraper — Settings Module

Loads environment variables from .env and exposes typed configuration
via Pydantic BaseSettings. All scraper-wide constants live here.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import yaml
from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

# ---------------------------------------------------------------------------
# Resolve project paths
# ---------------------------------------------------------------------------
# This file lives at scraper/config/settings.py
# PROJECT_ROOT = scraper/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
LOGS_DIR = PROJECT_ROOT / "logs"

# Ensure logs directory exists
LOGS_DIR.mkdir(exist_ok=True)

# Load .env from project root
load_dotenv(PROJECT_ROOT / ".env")


# ---------------------------------------------------------------------------
# Pydantic settings (auto-reads from env vars)
# ---------------------------------------------------------------------------
class Settings(BaseSettings):
    """Central configuration loaded from environment variables."""

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/apix"

    # Proxy URLs (comma-separated list, optional)
    proxy_urls: Optional[str] = None

    # Logging
    log_level: str = "INFO"

    # Scheduling (24h format)
    scrape_hour: int = 6
    scrape_minute: int = 0

    # Scraping delays (seconds)
    min_delay: float = 3.0
    max_delay: float = 8.0

    # Retry configuration
    max_retries: int = 3

    # Fare validation thresholds (INR)
    fare_min_threshold: float = 500.0
    fare_max_threshold: float = 50000.0

    # Fare consistency tolerance (fraction, e.g. 0.05 = 5%)
    fare_consistency_tolerance: float = 0.05

    # Browser settings
    headless: bool = True
    browser_timeout: int = 30000  # milliseconds

    # Browserbase Cloud Browser integration
    browserbase_api_key: Optional[str] = None
    browserbase_project_id: Optional[str] = "92c0385a-1030-4cba-8694-efbc2285bb2c"
    use_browserbase: bool = True

    # robots.txt cache TTL (seconds)
    robots_cache_ttl: int = 86400  # 24 hours

    @field_validator("proxy_urls", mode="before")
    @classmethod
    def parse_proxy_urls(cls, v: Optional[str]) -> Optional[str]:
        """Keep raw string; parsed into a list via the property below."""
        if v is not None and isinstance(v, str) and v.strip() == "":
            return None
        return v

    @property
    def proxy_list(self) -> list[str]:
        """Return proxy URLs as a list (empty list if none configured)."""
        if not self.proxy_urls:
            return []
        return [p.strip() for p in self.proxy_urls.split(",") if p.strip()]

    class Config:
        env_file = str(PROJECT_ROOT / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


# ---------------------------------------------------------------------------
# Singleton instance
# ---------------------------------------------------------------------------
settings = Settings()


# ---------------------------------------------------------------------------
# YAML config loaders
# ---------------------------------------------------------------------------
def load_routes_config() -> dict:
    """Load route definitions from config/routes.yaml."""
    routes_path = CONFIG_DIR / "routes.yaml"
    if not routes_path.exists():
        raise FileNotFoundError(f"Routes config not found: {routes_path}")
    with open(routes_path, "r") as f:
        return yaml.safe_load(f)


def load_sources_config() -> dict:
    """Load source definitions from config/sources.yaml."""
    sources_path = CONFIG_DIR / "sources.yaml"
    if not sources_path.exists():
        raise FileNotFoundError(f"Sources config not found: {sources_path}")
    with open(sources_path, "r") as f:
        return yaml.safe_load(f)


def get_enabled_routes() -> list[dict]:
    """Return only enabled routes from the config."""
    config = load_routes_config()
    return [r for r in config.get("routes", []) if r.get("enabled", True)]


def get_advance_windows() -> list[int]:
    """Return advance-purchase windows from the config."""
    config = load_routes_config()
    return config.get("advance_purchase_windows", [1, 7, 15, 30, 45])


def get_enabled_sources() -> list[dict]:
    """Return all enabled sources (airlines + OTAs) from the config."""
    config = load_sources_config()
    sources = []

    for airline in config.get("airlines", []):
        if airline.get("enabled", True):
            airline["source_type"] = "airline"
            sources.append(airline)

    for ota in config.get("otas", []):
        if ota.get("enabled", True):
            ota["source_type"] = "ota"
            sources.append(ota)

    return sources


def get_source_by_name(name: str) -> Optional[dict]:
    """Look up a single source by its short name (e.g. 'indigo')."""
    all_sources = get_enabled_sources()
    for src in all_sources:
        if src["name"] == name:
            return src
    # Also check disabled sources
    config = load_sources_config()
    for group in ("airlines", "otas"):
        for src in config.get(group, []):
            if src["name"] == name:
                src["source_type"] = "airline" if group == "airlines" else "ota"
                return src
    return None
