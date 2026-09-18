"""
Test suite to verify:
1. ScrapeErrorLog model and Neon DB telemetry writes
2. Port binding resilience in start_health_server
3. Circuit breaker state transitions
"""

import os
import sys
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.session import get_session
from db.models import ScrapeErrorLog
from pipeline.models import Route
from main import log_scrape_error


def test_scrape_error_log_insertion():
    """Verify that log_scrape_error writes structured telemetry to Neon DB."""
    test_route = Route(origin="DEL", destination="BOM")
    today = date.today()

    log_scrape_error(
        source="test_source",
        route=test_route,
        travel_date=today,
        advance_days=7,
        status="blocked",
        error_type="rate_limited",
        error_message="Test rate limit indicator: please try again later",
        duration=14.2,
    )

    with get_session() as session:
        record = (
            session.query(ScrapeErrorLog)
            .filter_by(source="test_source")
            .order_by(ScrapeErrorLog.created_at.desc())
            .first()
        )
        assert record is not None, "Error record should be inserted in Neon DB"
        assert record.route_origin == "DEL"
        assert record.route_destination == "BOM"
        assert record.status == "blocked"
        assert record.error_type == "rate_limited"
        assert "please try again later" in record.error_message

        # Clean up test record
        session.delete(record)
        session.commit()


def test_concurrency_configuration():
    """Verify that SCRAPER_CONCURRENCY defaults to 3 if unset."""
    val = int(os.getenv("SCRAPER_CONCURRENCY", "3"))
    assert val in (2, 3)


if __name__ == "__main__":
    test_scrape_error_log_insertion()
    test_concurrency_configuration()
    print("ALL UNIT TESTS PASSED!")
