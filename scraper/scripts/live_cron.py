"""
APIx Scraper — 1-Minute Continuous Live Daemon

Runs live probe scraping every 60 seconds, updating the database
and triggering real-time index recalculation.
"""

import time
import subprocess
import sys
from pathlib import Path
from loguru import logger

SCRAPER_DIR = Path(__file__).parent.parent

def run_live_loop(interval_seconds: int = 60):
    logger.info(f"Starting 1-Minute Live Scraper Loop (Interval: {interval_seconds}s)... Press Ctrl+C to stop.")
    run_count = 0

    while True:
        try:
            run_count += 1
            logger.info(f"=== Live Scrape Run #{run_count} Started at {time.strftime('%Y-%m-%d %H:%M:%S')} ===")
            
            # 1. Run live probe scrapers
            subprocess.run(
                [sys.executable, "scripts/run_fixed_sources.py"],
                cwd=SCRAPER_DIR,
                check=True
            )
            
            # 2. Run live index calculation
            subprocess.run(
                [sys.executable, "-m", "cli.run_index", "--frequency", "daily"],
                cwd=SCRAPER_DIR,
                check=True
            )
            
            logger.info(f"=== Live Scrape Run #{run_count} Completed. Sleeping for {interval_seconds}s... ===")
            time.sleep(interval_seconds)

        except KeyboardInterrupt:
            logger.info("Stopping Live Scraper Loop.")
            break
        except Exception as e:
            logger.error(f"Error in Live Scrape Run #{run_count}: {e}")
            logger.info(f"Retrying in {interval_seconds}s...")
            time.sleep(interval_seconds)

if __name__ == "__main__":
    interval = 60
    if len(sys.argv) > 1:
        try:
            interval = int(sys.argv[1])
        except ValueError:
            pass
    run_live_loop(interval)
