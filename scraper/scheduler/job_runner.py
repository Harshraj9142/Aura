"""
APIx Scraper — Job Runner / Scheduler

Uses APScheduler to run the full scraping batch on a configurable
daily schedule. Can also be triggered manually.

The scheduler runs as a long-lived daemon process:
  python main.py --schedule

Schedule configuration is read from settings:
  SCRAPE_HOUR (default: 6)
  SCRAPE_MINUTE (default: 0)
"""

from __future__ import annotations

import asyncio
import signal
import sys
from datetime import date, datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from config.settings import settings


async def scheduled_batch_job() -> None:
    """
    The actual job that runs on schedule.

    Runs the scraping batch first, then triggers the daily APIx index
    calculation post-scrape.
    """
    from main import run_batch
    from cli.run_index import run_index_calculation

    logger.info("⏰ Scheduled batch job triggered")
    started_at = datetime.utcnow()

    try:
        await run_batch()
        logger.info("📈 Triggering daily APIx index calculation post-scrape...")
        run_index_calculation(frequency="daily", target_date=date.today())
    except Exception as e:
        logger.error(f"Scheduled batch job failed: {e}")
    finally:
        duration = (datetime.utcnow() - started_at).total_seconds()
        logger.info(f"⏰ Scheduled batch job completed in {duration:.1f}s")


def start_scheduler() -> None:
    """
    Start the APScheduler daemon for daily automated scraping.

    Runs until interrupted (Ctrl+C or SIGTERM).
    """
    if settings.scrape_frequency.lower() == "hourly":
        trigger = CronTrigger(minute=settings.scrape_minute)
        logger.info(f"📅 Starting scheduler — HOURLY run at minute :{settings.scrape_minute:02d}")
    else:
        trigger = CronTrigger(hour=settings.scrape_hour, minute=settings.scrape_minute)
        logger.info(
            f"📅 Starting scheduler — DAILY run at "
            f"{settings.scrape_hour:02d}:{settings.scrape_minute:02d}"
        )

    # Create the async scheduler
    scheduler = AsyncIOScheduler()

    # Add the scraping job
    scheduler.add_job(
        scheduled_batch_job,
        trigger=trigger,
        id="automated_scrape",
        name=f"Automated Airfare Scrape ({settings.scrape_frequency})",
        replace_existing=True,
        max_instances=1,  # Don't run concurrent batch jobs
        misfire_grace_time=3600,  # Allow 1 hour grace period for misfires
    )

    # Event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Graceful shutdown
    def shutdown(signum, frame):
        logger.info("🛑 Shutdown signal received — stopping scheduler...")
        scheduler.shutdown(wait=False)
        loop.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Start
    scheduler.start()

    logger.info(
        "✅ Scheduler running. Next job: "
        f"{scheduler.get_job('automated_scrape').next_run_time}"
    )
    logger.info("Press Ctrl+C to stop.")

    try:
        loop.run_forever()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")
    finally:
        scheduler.shutdown()
        loop.close()
