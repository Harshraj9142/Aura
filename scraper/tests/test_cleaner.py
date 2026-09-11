"""
Tests for pipeline/cleaner.py — FareCleaner.

Tests validation, outlier detection, fare consistency checking,
and summary stats generation.
"""

from __future__ import annotations

from datetime import date, datetime

import pytest

from pipeline.cleaner import FareCleaner
from pipeline.models import FareRecord, SourceTypeEnum


class TestFareCleaner:
    """Tests for the FareCleaner class."""

    def setup_method(self):
        """Create a cleaner with known thresholds for predictable tests."""
        self.cleaner = FareCleaner(
            min_fare=500.0,
            max_fare=50000.0,
            consistency_tolerance=0.05,
        )

    # -------------------------------------------------------------------
    # Basic validation
    # -------------------------------------------------------------------
    def test_clean_valid_fare(self, sample_fare_record: FareRecord):
        """A valid fare should pass through without outlier flag."""
        result = self.cleaner.clean_batch([sample_fare_record])
        assert len(result) == 1
        assert result[0].is_outlier is False

    def test_clean_empty_batch(self):
        """Cleaning an empty list should return empty."""
        result = self.cleaner.clean_batch([])
        assert result == []

    # -------------------------------------------------------------------
    # Outlier detection
    # -------------------------------------------------------------------
    def test_detects_too_cheap_fare(self):
        """Fares below min threshold should be flagged as outliers."""
        fare = FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=date(2026, 10, 1), advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            carrier="IndiGo", flight_number="6E-001",
            total_fare=200.0, currency="INR",
            scraped_at=datetime.utcnow(),
        )
        result = self.cleaner.clean_batch([fare])
        assert result[0].is_outlier is True
        assert any("below minimum" in w for w in result[0].validation_warnings)

    def test_detects_too_expensive_fare(self):
        """Fares above max threshold should be flagged as outliers."""
        fare = FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=date(2026, 10, 1), advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            carrier="IndiGo", flight_number="6E-999",
            total_fare=75000.0, currency="INR",
            scraped_at=datetime.utcnow(),
        )
        result = self.cleaner.clean_batch([fare])
        assert result[0].is_outlier is True
        assert any("above maximum" in w for w in result[0].validation_warnings)

    def test_detects_zero_fare(self):
        """Zero fare should be flagged as outlier."""
        fare = FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=date(2026, 10, 1), advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            total_fare=0.01,  # Near zero
            currency="INR", scraped_at=datetime.utcnow(),
        )
        result = self.cleaner.clean_batch([fare])
        assert result[0].is_outlier is True

    def test_fare_at_boundary_not_outlier(self):
        """Fares exactly at thresholds should not be flagged."""
        fare = FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=date(2026, 10, 1), advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            total_fare=500.0,  # Exactly at minimum
            currency="INR", scraped_at=datetime.utcnow(),
        )
        result = self.cleaner.clean_batch([fare])
        assert result[0].is_outlier is False

    # -------------------------------------------------------------------
    # Fare consistency
    # -------------------------------------------------------------------
    def test_detects_fare_inconsistency(self):
        """If base + taxes differs from total by > 5%, warn."""
        fare = FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=date(2026, 10, 1), advance_purchase_days=7,
            source="makemytrip", source_type=SourceTypeEnum.OTA,
            carrier="IndiGo", flight_number="6E-123",
            base_fare=3000.0, taxes_and_fees=500.0,
            total_fare=5000.0,  # 3000+500=3500 ≠ 5000 (30% off)
            currency="INR", scraped_at=datetime.utcnow(),
        )
        result = self.cleaner.clean_batch([fare])
        assert any("inconsistency" in w.lower() for w in result[0].validation_warnings)

    def test_consistent_fare_no_warning(self):
        """If base + taxes ≈ total (within 5%), no consistency warning."""
        fare = FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=date(2026, 10, 1), advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            carrier="IndiGo", flight_number="6E-123",
            base_fare=3500.0, taxes_and_fees=800.0,
            total_fare=4300.0,  # Exactly matches
            currency="INR", scraped_at=datetime.utcnow(),
        )
        result = self.cleaner.clean_batch([fare])
        # Should NOT have a consistency warning from the cleaner
        consistency_warnings = [
            w for w in result[0].validation_warnings
            if "inconsistency" in w.lower()
        ]
        assert len(consistency_warnings) == 0

    # -------------------------------------------------------------------
    # Missing fields
    # -------------------------------------------------------------------
    def test_warns_on_missing_flight_number(self):
        """Missing flight number should produce a warning."""
        fare = FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=date(2026, 10, 1), advance_purchase_days=7,
            source="yatra", source_type=SourceTypeEnum.OTA,
            flight_number=None, carrier=None,
            total_fare=4500.0, currency="INR",
            scraped_at=datetime.utcnow(),
        )
        result = self.cleaner.clean_batch([fare])
        assert any("flight number" in w.lower() for w in result[0].validation_warnings)
        assert any("carrier" in w.lower() for w in result[0].validation_warnings)

    def test_warns_on_non_inr_currency(self):
        """Non-INR currency should produce a warning."""
        fare = FareRecord(
            route_origin="DEL", route_destination="BOM",
            travel_date=date(2026, 10, 1), advance_purchase_days=7,
            source="indigo", source_type=SourceTypeEnum.AIRLINE,
            total_fare=4500.0, currency="USD",
            scraped_at=datetime.utcnow(),
        )
        result = self.cleaner.clean_batch([fare])
        assert any("non-inr" in w.lower() for w in result[0].validation_warnings)

    # -------------------------------------------------------------------
    # Batch processing
    # -------------------------------------------------------------------
    def test_clean_batch_preserves_all_records(self, sample_fares_batch):
        """Cleaning should never drop records — only flag them."""
        result = self.cleaner.clean_batch(sample_fares_batch)
        assert len(result) == len(sample_fares_batch)

    def test_batch_outlier_count(self, sample_fares_batch):
        """Check that the expected number of outliers are detected."""
        result = self.cleaner.clean_batch(sample_fares_batch)
        outliers = [f for f in result if f.is_outlier]
        # Expect: too-cheap (₹150) and too-expensive (₹75000)
        assert len(outliers) == 2

    # -------------------------------------------------------------------
    # Summary stats
    # -------------------------------------------------------------------
    def test_summary_stats_empty(self):
        """Summary of empty batch should return count=0."""
        stats = self.cleaner.get_summary_stats([])
        assert stats["count"] == 0

    def test_summary_stats_populated(self, sample_fares_batch):
        """Summary should contain expected fields."""
        cleaned = self.cleaner.clean_batch(sample_fares_batch)
        stats = self.cleaner.get_summary_stats(cleaned)
        assert stats["count"] == len(sample_fares_batch)
        assert "min_fare" in stats
        assert "max_fare" in stats
        assert "mean_fare" in stats
        assert "outlier_count" in stats
