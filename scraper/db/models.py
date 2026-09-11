"""
APIx Scraper — SQLAlchemy ORM Models

Defines the database schema for:
  - fares: Individual fare records scraped from airline/OTA sites
  - scrape_runs: Metadata about each batch scraping run (for monitoring)
"""

from __future__ import annotations

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# ---------------------------------------------------------------------------
# Base class for all models
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class SourceType(str, enum.Enum):
    """Whether the fare source is a direct airline site or an OTA."""
    AIRLINE = "airline"
    OTA = "ota"


class ScrapeRunStatus(str, enum.Enum):
    """Status of a batch scraping run."""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


# ---------------------------------------------------------------------------
# Fare model
# ---------------------------------------------------------------------------
class Fare(Base):
    """
    Represents a single scraped fare record.

    Each row = one fare option for a specific (route, source, date, flight) combination.
    """

    __tablename__ = "fares"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique record identifier",
    )

    # Route information
    route_origin: Mapped[str] = mapped_column(
        String(3), nullable=False, comment="IATA code of origin airport (e.g. DEL)"
    )
    route_destination: Mapped[str] = mapped_column(
        String(3), nullable=False, comment="IATA code of destination airport (e.g. BOM)"
    )

    # Travel date and advance-purchase context
    travel_date: Mapped[date] = mapped_column(
        Date, nullable=False, comment="Date of travel for this fare"
    )
    advance_purchase_days: Mapped[int] = mapped_column(
        Integer, nullable=False, comment="Days between scrape date and travel date"
    )

    # Source information
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="Source name (e.g. 'indigo', 'makemytrip')"
    )
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, name="source_type_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        comment="Whether source is an airline or OTA",
    )

    # Flight details
    carrier: Mapped[str] = mapped_column(
        String(50), nullable=True, comment="Operating carrier (e.g. 'IndiGo', '6E')"
    )
    flight_number: Mapped[str] = mapped_column(
        String(20), nullable=True, comment="Flight number (e.g. '6E-2341')"
    )
    fare_class: Mapped[str] = mapped_column(
        String(50), nullable=True, comment="Fare class/cabin (e.g. 'Economy', 'Business')"
    )

    # Pricing (stored as Numeric for precision)
    base_fare: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=True, comment="Base fare excluding taxes (INR)"
    )
    taxes_and_fees: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=True, comment="Taxes and fees (INR)"
    )
    total_fare: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, comment="Total fare including taxes (INR)"
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="INR", comment="Currency code"
    )

    # Scraping metadata
    scraped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Timestamp when this fare was scraped",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Record creation timestamp",
    )

    # Validation flags
    is_outlier: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="Whether fare was flagged as an outlier"
    )
    validation_warnings: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="List of validation warnings (if any)"
    )

    # -----------------------------------------------------------------------
    # Indexes for common query patterns
    # -----------------------------------------------------------------------
    __table_args__ = (
        # Primary query pattern: fares for a route + source + date range
        Index(
            "ix_fares_route_source_date",
            "route_origin",
            "route_destination",
            "source",
            "travel_date",
        ),
        # Time-series queries: fares by scrape timestamp
        Index("ix_fares_scraped_at", "scraped_at"),
        # Deduplication lookups
        Index(
            "ix_fares_dedup",
            "route_origin",
            "route_destination",
            "source",
            "travel_date",
            "advance_purchase_days",
            "flight_number",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Fare {self.route_origin}-{self.route_destination} "
            f"{self.source} {self.flight_number} ₹{self.total_fare}>"
        )


# ---------------------------------------------------------------------------
# Scrape Run model
# ---------------------------------------------------------------------------
class ScrapeRun(Base):
    """
    Tracks metadata for each batch scraping run.

    Used for monitoring whether scraping is working day-to-day,
    and for diagnosing failures or blocks.
    """

    __tablename__ = "scrape_runs"

    # Primary key
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique run identifier",
    )

    # Timing
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="When this scraping run started",
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When this scraping run completed (null if still running)",
    )

    # Counters
    total_attempted: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Total scrape tasks attempted"
    )
    total_success: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Tasks that completed successfully"
    )
    total_failed: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Tasks that failed (errors/timeouts)"
    )
    total_blocked: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Tasks blocked by CAPTCHA/bot detection"
    )

    # Status
    status: Mapped[ScrapeRunStatus] = mapped_column(
        Enum(ScrapeRunStatus, name="scrape_run_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ScrapeRunStatus.RUNNING,
        comment="Current run status",
    )

    # Detailed summary (JSON blob with per-source breakdown)
    summary: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Detailed per-source summary of the run",
    )

    # -----------------------------------------------------------------------
    # Indexes
    # -----------------------------------------------------------------------
    __table_args__ = (
        Index("ix_scrape_runs_started_at", "started_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<ScrapeRun {self.run_id} status={self.status.value} "
            f"success={self.total_success} failed={self.total_failed} "
            f"blocked={self.total_blocked}>"
        )
