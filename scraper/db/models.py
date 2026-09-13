"""
APIx Scraper — SQLAlchemy ORM Models

Defines the database schema for:
  - fares: Individual fare records scraped from airline/OTA sites
  - scrape_runs: Metadata about each batch scraping run (for monitoring)
  - route_base_values: Fixed base-period average fare per route (P_i,0)
  - index_values: Aggregated APIx price index values (daily/weekly/monthly)
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
    UniqueConstraint,
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

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique record identifier",
    )
    route_origin: Mapped[str] = mapped_column(
        String(3), nullable=False, comment="IATA code of origin airport (e.g. DEL)"
    )
    route_destination: Mapped[str] = mapped_column(
        String(3), nullable=False, comment="IATA code of destination airport (e.g. BOM)"
    )
    travel_date: Mapped[date] = mapped_column(
        Date, nullable=False, comment="Date of travel for this fare"
    )
    advance_purchase_days: Mapped[int] = mapped_column(
        Integer, nullable=False, comment="Days between scrape date and travel date"
    )
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="Source name (e.g. 'indigo', 'makemytrip')"
    )
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, name="source_type_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        comment="Whether source is an airline or OTA",
    )
    carrier: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="Operating carrier (e.g. 'IndiGo', '6E')"
    )
    flight_number: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="Flight number (e.g. '6E-2341')"
    )
    fare_class: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="Fare class/cabin (e.g. 'Economy', 'Business')"
    )
    base_fare: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True, comment="Base fare excluding taxes (INR)"
    )
    taxes_and_fees: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True, comment="Taxes and fees (INR)"
    )
    total_fare: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, comment="Total fare including taxes (INR)"
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="INR", comment="Currency code"
    )
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
    is_outlier: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="Whether fare was flagged as an outlier"
    )
    validation_warnings: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="List of validation warnings (if any)"
    )

    __table_args__ = (
        Index(
            "ix_fares_route_source_date",
            "route_origin",
            "route_destination",
            "source",
            "travel_date",
        ),
        Index("ix_fares_scraped_at", "scraped_at"),
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





# ---------------------------------------------------------------------------
# Scrape Run model
# ---------------------------------------------------------------------------
class ScrapeRun(Base):
    """Tracks metadata for each batch scraping run."""

    __tablename__ = "scrape_runs"

    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique run identifier",
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="When this scraping run started",
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When this scraping run completed",
    )
    total_attempted: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Total scrape tasks attempted"
    )
    total_success: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Tasks completed successfully"
    )
    total_failed: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Tasks failed"
    )
    total_blocked: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Tasks blocked"
    )
    status: Mapped[ScrapeRunStatus] = mapped_column(
        Enum(ScrapeRunStatus, name="scrape_run_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ScrapeRunStatus.RUNNING,
        comment="Current run status",
    )
    summary: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="Detailed per-source summary"
    )

    __table_args__ = (
        Index("ix_scrape_runs_started_at", "started_at"),
    )


# ---------------------------------------------------------------------------
# Route Base Values model
# ---------------------------------------------------------------------------
class RouteBaseValue(Base):
    """
    Stores fixed base-period average fare (P_i,0) per route.

    Established once over base_period_days and reused in all index calculations.
    """

    __tablename__ = "route_base_values"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    route_origin: Mapped[str] = mapped_column(String(3), nullable=False)
    route_destination: Mapped[str] = mapped_column(String(3), nullable=False)
    base_avg_fare: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    base_period_start: Mapped[date] = mapped_column(Date, nullable=False)
    base_period_end: Mapped[date] = mapped_column(Date, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("route_origin", "route_destination", name="uq_route_base_values"),
    )


# ---------------------------------------------------------------------------
# Index Values model
# ---------------------------------------------------------------------------
class IndexValueRecord(Base):
    """
    Stores computed composite Airfare Price Index (APIx) values.

    Calculated at daily, weekly, or monthly frequency.
    """

    __tablename__ = "index_values"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    frequency: Mapped[str] = mapped_column(String(20), nullable=False, default="daily")
    period_date: Mapped[date] = mapped_column(Date, nullable=False)
    index_score: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    routes_included: Mapped[int] = mapped_column(Integer, nullable=False, default=6)
    data_quality_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        Index("ix_index_values_freq_period", "frequency", "period_date", unique=True),
    )
