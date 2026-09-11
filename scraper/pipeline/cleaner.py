"""
APIx Scraper — Data Cleaner & Validator

Processes raw FareRecords through validation and cleaning:
  - Outlier detection (fares below/above configurable thresholds)
  - Fare consistency verification (base + taxes ≈ total)
  - Currency normalization
  - Zero/negative fare detection
  - Generates validation_warnings for flagged records

Records are NEVER silently dropped — they are flagged with is_outlier=True
and/or validation_warnings, then the caller decides how to handle them.
"""

from __future__ import annotations

from typing import Optional

import pandas as pd
from loguru import logger

from config.settings import settings
from pipeline.models import FareRecord


class FareCleaner:
    """
    Cleans and validates fare records before database insertion.

    All cleaning operations are non-destructive: records are flagged,
    not dropped. The caller can filter outliers if desired.
    """

    def __init__(
        self,
        min_fare: Optional[float] = None,
        max_fare: Optional[float] = None,
        consistency_tolerance: Optional[float] = None,
    ) -> None:
        self._min_fare = min_fare or settings.fare_min_threshold
        self._max_fare = max_fare or settings.fare_max_threshold
        self._tolerance = consistency_tolerance or settings.fare_consistency_tolerance

    def clean_batch(self, fares: list[FareRecord]) -> list[FareRecord]:
        """
        Clean and validate a batch of fare records.

        Args:
            fares: List of raw FareRecord instances to process.

        Returns:
            List of cleaned FareRecord instances (same length, with
            is_outlier and validation_warnings populated).
        """
        if not fares:
            return []

        cleaned = []
        outlier_count = 0
        warning_count = 0

        for fare in fares:
            fare = self._validate_record(fare)
            if fare.is_outlier:
                outlier_count += 1
            if fare.validation_warnings:
                warning_count += len(fare.validation_warnings)
            cleaned.append(fare)

        logger.info(
            f"Cleaned {len(cleaned)} fares | "
            f"{outlier_count} outliers | "
            f"{warning_count} warnings"
        )

        return cleaned

    def _validate_record(self, fare: FareRecord) -> FareRecord:
        """
        Run all validation checks on a single fare record.

        Modifies the record in-place (is_outlier, validation_warnings).
        """
        warnings: list[str] = list(fare.validation_warnings)  # Copy existing

        # Check 1: Zero or negative total fare
        if fare.total_fare <= 0:
            fare.is_outlier = True
            warnings.append(f"Zero/negative total fare: ₹{fare.total_fare}")

        # Check 2: Below minimum threshold
        elif fare.total_fare < self._min_fare:
            fare.is_outlier = True
            warnings.append(
                f"Fare below minimum threshold: ₹{fare.total_fare} < ₹{self._min_fare}"
            )

        # Check 3: Above maximum threshold
        elif fare.total_fare > self._max_fare:
            fare.is_outlier = True
            warnings.append(
                f"Fare above maximum threshold: ₹{fare.total_fare} > ₹{self._max_fare}"
            )

        # Check 4: Fare consistency (base + taxes ≈ total)
        if fare.base_fare is not None and fare.taxes_and_fees is not None:
            computed = fare.base_fare + fare.taxes_and_fees
            if fare.total_fare > 0:
                diff = abs(computed - fare.total_fare)
                tolerance = fare.total_fare * self._tolerance
                if diff > tolerance:
                    warnings.append(
                        f"Fare inconsistency: base(₹{fare.base_fare}) + "
                        f"taxes(₹{fare.taxes_and_fees}) = ₹{computed:.2f}, "
                        f"total = ₹{fare.total_fare} (diff: ₹{diff:.2f})"
                    )

        # Check 5: Missing important fields
        if not fare.flight_number:
            warnings.append("Missing flight number")

        if not fare.carrier:
            warnings.append("Missing carrier")

        # Check 6: Currency validation
        if fare.currency != "INR":
            warnings.append(f"Non-INR currency: {fare.currency}")

        # Update the record
        fare.validation_warnings = warnings
        return fare

    def get_summary_stats(self, fares: list[FareRecord]) -> dict:
        """
        Generate summary statistics for a batch of fares using pandas.

        Useful for logging and monitoring.
        """
        if not fares:
            return {"count": 0}

        df = pd.DataFrame([f.model_dump() for f in fares])

        stats = {
            "count": len(df),
            "outlier_count": int(df["is_outlier"].sum()),
            "min_fare": float(df["total_fare"].min()),
            "max_fare": float(df["total_fare"].max()),
            "mean_fare": float(df["total_fare"].mean()),
            "median_fare": float(df["total_fare"].median()),
            "sources": df["source"].nunique(),
            "carriers": df["carrier"].nunique(),
            "routes": df.apply(
                lambda r: f"{r['route_origin']}-{r['route_destination']}", axis=1
            ).nunique(),
            "records_with_warnings": int(
                df["validation_warnings"].apply(lambda w: len(w) > 0).sum()
            ),
        }

        return stats
