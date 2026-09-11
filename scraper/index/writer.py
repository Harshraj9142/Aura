"""
APIx Index Calculation Module — Writer

Persists computed index records into the index_values database table.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from loguru import logger
from sqlalchemy import select
from db.models import IndexValueRecord
from db.session import get_session


class IndexWriter:
    """Persists calculated APIx index values to the database."""

    @staticmethod
    def write_index_value(
        frequency: str,
        period_date: date,
        index_score: Optional[float],
        routes_included: int,
        data_quality_note: Optional[str] = None,
    ) -> IndexValueRecord:
        """
        Upsert a computed index value into index_values table.

        Args:
            frequency: 'daily', 'weekly', or 'monthly'
            period_date: Start date of period
            index_score: Computed index value (base = 100) or None if quality insufficient
            routes_included: Number of routes included in calculation
            data_quality_note: Optional note on missing routes or weight re-normalization

        Returns:
            The saved IndexValueRecord instance.
        """
        now = datetime.utcnow()

        with get_session() as session:
            stmt = select(IndexValueRecord).where(
                IndexValueRecord.frequency == frequency,
                IndexValueRecord.period_date == period_date,
            )
            existing = session.scalar(stmt)

            if existing:
                existing.index_score = index_score
                existing.routes_included = routes_included
                existing.data_quality_note = data_quality_note
                existing.computed_at = now
                record = existing
                logger.info(
                    f"Updated index_values ({frequency}, {period_date}): score={index_score}, routes={routes_included}/6"
                )
            else:
                record = IndexValueRecord(
                    frequency=frequency,
                    period_date=period_date,
                    index_score=index_score,
                    routes_included=routes_included,
                    data_quality_note=data_quality_note,
                    computed_at=now,
                )
                session.add(record)
                logger.info(
                    f"Inserted index_values ({frequency}, {period_date}): score={index_score}, routes={routes_included}/6"
                )

            session.commit()
            return record
