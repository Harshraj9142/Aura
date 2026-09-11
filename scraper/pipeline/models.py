"""
APIx Scraper — Pydantic Data Models

Defines the validated data schemas used throughout the pipeline:
  - FareRecord: A single scraped fare with validation
  - ScrapeResult: Wrapper around scraping output (fares + status)
  - Route: Typed route representation

These models enforce data quality BEFORE records touch the database.
"""

from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class SourceTypeEnum(str, Enum):
    """Whether the source is a direct airline site or an OTA."""
    AIRLINE = "airline"
    OTA = "ota"


class ScrapeStatus(str, Enum):
    """Outcome of a single scrape attempt."""
    SUCCESS = "success"
    FAILED = "failed"
    BLOCKED = "blocked"  # CAPTCHA or bot detection
    NO_FLIGHTS = "no_flights"  # No flights found (not an error)
    SOLD_OUT = "sold_out"  # Flights exist but all sold out
    DISALLOWED = "disallowed"  # Blocked by robots.txt


# ---------------------------------------------------------------------------
# Route model
# ---------------------------------------------------------------------------
class Route(BaseModel):
    """A city-pair route to scrape."""

    origin: str = Field(..., min_length=3, max_length=3, description="IATA code of origin")
    destination: str = Field(..., min_length=3, max_length=3, description="IATA code of destination")
    name: Optional[str] = Field(None, description="Human-readable route name")
    enabled: bool = Field(True, description="Whether this route is active")

    @field_validator("origin", "destination")
    @classmethod
    def validate_iata_code(cls, v: str) -> str:
        """Ensure IATA codes are uppercase 3-letter strings."""
        v = v.strip().upper()
        if not re.match(r"^[A-Z]{3}$", v):
            raise ValueError(f"Invalid IATA code: '{v}' — must be 3 uppercase letters")
        return v

    @property
    def pair(self) -> str:
        """Return the route as 'DEL-BOM' format."""
        return f"{self.origin}-{self.destination}"

    def __str__(self) -> str:
        return self.pair


# ---------------------------------------------------------------------------
# Fare Record model
# ---------------------------------------------------------------------------
class FareRecord(BaseModel):
    """
    A single fare record scraped from an airline or OTA.

    Validates and normalizes fare data before database insertion:
    - Strips currency symbols and commas from fare strings
    - Converts fares to Decimal
    - Validates IATA codes
    - Checks fare consistency (base + taxes ≈ total)
    """

    # Route
    route_origin: str = Field(..., min_length=3, max_length=3)
    route_destination: str = Field(..., min_length=3, max_length=3)

    # Travel context
    travel_date: date
    advance_purchase_days: int = Field(..., ge=0)

    # Source
    source: str = Field(..., description="Source identifier (e.g. 'indigo', 'makemytrip')")
    source_type: SourceTypeEnum

    # Flight details
    carrier: Optional[str] = Field(None, description="Operating carrier name or code")
    flight_number: Optional[str] = Field(None, description="Flight number (e.g. '6E-2341')")
    fare_class: Optional[str] = Field(None, description="Fare class (e.g. 'Economy', 'Business')")

    # Pricing
    base_fare: Optional[float] = Field(None, ge=0, description="Base fare in INR")
    taxes_and_fees: Optional[float] = Field(None, ge=0, description="Taxes and fees in INR")
    total_fare: float = Field(..., gt=0, description="Total fare in INR")
    currency: str = Field("INR", max_length=3)

    # Timestamp
    scraped_at: datetime = Field(default_factory=datetime.utcnow)

    # Validation metadata (populated during cleaning)
    is_outlier: bool = Field(False)
    validation_warnings: list[str] = Field(default_factory=list)

    # -----------------------------------------------------------------------
    # Validators
    # -----------------------------------------------------------------------
    @field_validator("route_origin", "route_destination")
    @classmethod
    def validate_iata(cls, v: str) -> str:
        """Uppercase and validate IATA codes."""
        v = v.strip().upper()
        if not re.match(r"^[A-Z]{3}$", v):
            raise ValueError(f"Invalid IATA code: '{v}'")
        return v

    @field_validator("base_fare", "taxes_and_fees", "total_fare", mode="before")
    @classmethod
    def clean_fare_value(cls, v: Any) -> Optional[float]:
        """
        Clean fare values by stripping currency symbols, commas, and whitespace.

        Handles inputs like:
          "₹4,500", "Rs. 4500.00", "4,500.50", "INR 3200", 4500, 4500.0
        """
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, Decimal):
            return float(v)
        if isinstance(v, str):
            # Strip common currency symbols, text, and formatting
            cleaned = v.strip()
            cleaned = re.sub(r"[₹$€£]", "", cleaned)  # Currency symbols
            cleaned = re.sub(r"(Rs\.?|INR|USD)\s*", "", cleaned, flags=re.IGNORECASE)  # Text codes
            cleaned = cleaned.replace(",", "")  # Comma separators
            cleaned = cleaned.strip()

            if not cleaned:
                return None

            try:
                return float(cleaned)
            except ValueError:
                raise ValueError(f"Cannot parse fare value: '{v}'")

        raise ValueError(f"Unexpected fare type: {type(v)}")

    @field_validator("source")
    @classmethod
    def normalize_source(cls, v: str) -> str:
        """Lowercase and strip source names for consistency."""
        return v.strip().lower()

    @field_validator("flight_number")
    @classmethod
    def normalize_flight_number(cls, v: Optional[str]) -> Optional[str]:
        """Clean up flight numbers."""
        if v is None:
            return None
        return v.strip().upper()

    @field_validator("fare_class")
    @classmethod
    def normalize_fare_class(cls, v: Optional[str]) -> Optional[str]:
        """Capitalize fare class names."""
        if v is None:
            return None
        return v.strip().title()

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, v: str) -> str:
        """Uppercase currency codes."""
        return v.strip().upper()

    @model_validator(mode="after")
    def check_fare_consistency(self) -> "FareRecord":
        """
        Validate that base_fare + taxes_and_fees ≈ total_fare.

        If both components are present, checks they sum to within 5% of total.
        Adds a validation warning if mismatched (does not reject the record).
        """
        if self.base_fare is not None and self.taxes_and_fees is not None:
            computed_total = self.base_fare + self.taxes_and_fees
            if self.total_fare > 0:
                difference = abs(computed_total - self.total_fare)
                tolerance = self.total_fare * 0.05  # 5% tolerance
                if difference > tolerance:
                    self.validation_warnings.append(
                        f"Fare inconsistency: base({self.base_fare}) + "
                        f"taxes({self.taxes_and_fees}) = {computed_total}, "
                        f"but total = {self.total_fare} "
                        f"(difference: {difference:.2f}, tolerance: {tolerance:.2f})"
                    )
        return self


# ---------------------------------------------------------------------------
# Scrape Result wrapper
# ---------------------------------------------------------------------------
class ScrapeResult(BaseModel):
    """
    Result of a single scrape attempt for one (route, source, advance_window).

    Wraps the fare records along with status information for logging
    and monitoring.
    """

    # Context
    route: Route
    source: str
    source_type: SourceTypeEnum
    advance_days: int
    travel_date: date

    # Outcome
    status: ScrapeStatus = ScrapeStatus.SUCCESS
    fares: list[FareRecord] = Field(default_factory=list)
    fare_count: int = 0

    # Error information
    error_message: Optional[str] = None
    error_type: Optional[str] = None  # e.g. "TimeoutError", "CaptchaDetected"

    # Timing
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None

    @model_validator(mode="after")
    def set_fare_count(self) -> "ScrapeResult":
        """Auto-populate fare_count from the fares list."""
        self.fare_count = len(self.fares)
        return self

    @property
    def is_success(self) -> bool:
        """Whether this scrape was successful."""
        return self.status == ScrapeStatus.SUCCESS

    @property
    def is_blocked(self) -> bool:
        """Whether this scrape was blocked by CAPTCHA/bot detection."""
        return self.status == ScrapeStatus.BLOCKED

    def __str__(self) -> str:
        return (
            f"ScrapeResult({self.route.pair} via {self.source} "
            f"T+{self.advance_days}d → {self.status.value}, "
            f"{self.fare_count} fares)"
        )
