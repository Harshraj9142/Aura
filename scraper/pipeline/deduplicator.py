"""
APIx Scraper — Deduplicator

Handles deduplication of fare records before database insertion.

Dedup key: (route_origin, route_destination, source, travel_date,
            advance_purchase_days, flight_number, DATE(scraped_at))

When duplicates are found:
- In-memory: keep the latest scraped_at
- Database: use ON CONFLICT DO UPDATE (upsert) to keep the latest
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from loguru import logger
from sqlalchemy import and_, cast, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from db.models import Fare, SourceType
from pipeline.models import FareRecord


class Deduplicator:
    """
    Deduplicates fare records both in-memory and during database insertion.
    """

    @staticmethod
    def deduplicate_in_memory(fares: list[FareRecord]) -> list[FareRecord]:
        """
        Deduplicate fare records in memory before database insertion.

        For records with the same dedup key, keeps the one with the
        latest scraped_at timestamp.

        Args:
            fares: List of FareRecord instances to deduplicate.

        Returns:
            Deduplicated list of FareRecord instances.
        """
        if not fares:
            return []

        seen: dict[str, FareRecord] = {}

        for fare in fares:
            key = Deduplicator._make_dedup_key(fare)

            if key in seen:
                existing = seen[key]
                # Keep the one with the later scraped_at
                if fare.scraped_at > existing.scraped_at:
                    seen[key] = fare
            else:
                seen[key] = fare

        original_count = len(fares)
        deduped_count = len(seen)
        removed = original_count - deduped_count

        if removed > 0:
            logger.info(
                f"Deduplication: {original_count} → {deduped_count} "
                f"({removed} duplicates removed)"
            )

        return list(seen.values())

    @staticmethod
    def upsert_fares(session: Session, fares: list[FareRecord]) -> int:
        """
        Insert fare records into the database with upsert logic.

        Uses PostgreSQL's ON CONFLICT DO UPDATE to handle duplicates:
        if a record with the same dedup key exists for the same day,
        update it with the newer data.

        Args:
            session: SQLAlchemy session.
            fares: Cleaned and deduplicated FareRecord instances.

        Returns:
            Number of records inserted/updated.
        """
        if not fares:
            return 0

        inserted = 0

        for fare in fares:
            try:
                # Check for existing record with the same dedup key on the same day
                scraped_date = fare.scraped_at.date()

                existing = (
                    session.query(Fare)
                    .filter(
                        and_(
                            Fare.route_origin == fare.route_origin,
                            Fare.route_destination == fare.route_destination,
                            Fare.source == fare.source,
                            Fare.travel_date == fare.travel_date,
                            Fare.advance_purchase_days == fare.advance_purchase_days,
                            Fare.flight_number == fare.flight_number,
                            func.date(Fare.scraped_at) == scraped_date,
                        )
                    )
                    .first()
                )

                if existing:
                    # Update existing record with newer data
                    existing.base_fare = fare.base_fare
                    existing.taxes_and_fees = fare.taxes_and_fees
                    existing.total_fare = fare.total_fare
                    existing.fare_class = fare.fare_class
                    existing.carrier = fare.carrier
                    existing.currency = fare.currency
                    existing.scraped_at = fare.scraped_at
                    existing.is_outlier = fare.is_outlier
                    existing.validation_warnings = fare.validation_warnings
                    logger.debug(
                        f"Updated existing fare: {fare.route_origin}-{fare.route_destination} "
                        f"{fare.source} {fare.flight_number}"
                    )
                else:
                    # Insert new record
                    db_fare = Fare(
                        route_origin=fare.route_origin,
                        route_destination=fare.route_destination,
                        travel_date=fare.travel_date,
                        advance_purchase_days=fare.advance_purchase_days,
                        source=fare.source,
                        source_type=SourceType(fare.source_type.value),
                        carrier=fare.carrier,
                        flight_number=fare.flight_number,
                        fare_class=fare.fare_class,
                        base_fare=fare.base_fare,
                        taxes_and_fees=fare.taxes_and_fees,
                        total_fare=fare.total_fare,
                        currency=fare.currency,
                        scraped_at=fare.scraped_at,
                        is_outlier=fare.is_outlier,
                        validation_warnings=fare.validation_warnings,
                    )
                    session.add(db_fare)

                inserted += 1

            except Exception as e:
                logger.error(f"Error upserting fare record: {e}")
                continue

        # Flush to send to DB (commit handled by caller/context manager)
        session.flush()

        logger.info(f"Upserted {inserted} fare records to database")
        return inserted

    @staticmethod
    def _make_dedup_key(fare: FareRecord) -> str:
        """
        Build a deduplication key string from a FareRecord.

        Key: route_origin|route_destination|source|travel_date|advance_days|
             flight_number|scraped_date
        """
        scraped_date = fare.scraped_at.date().isoformat()
        flight = fare.flight_number or "UNKNOWN"

        return (
            f"{fare.route_origin}|{fare.route_destination}|"
            f"{fare.source}|{fare.travel_date.isoformat()}|"
            f"{fare.advance_purchase_days}|{flight}|{scraped_date}"
        )
