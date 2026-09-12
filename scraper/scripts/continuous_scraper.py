"""
APIx Scraper — 24/7 Interleaved Round-Robin Scraper & Live Database Feeder

Features:
- Interleaved Round-Robin: Rotates sources on EVERY single job:
  (EaseMyTrip -> Cleartrip -> Ixigo -> IndiGo -> Akasa -> Air India Express -> SpiceJet)
  so the DB gets multi-platform data immediately within minutes!
- Persistent Checkpoint: Remembers exact position in `logs/scraper_checkpoint.json`.
  If stopped or restarted, resumes right where it left off!
- Automatic continuous loop (every 1-2 hours) until stopped.
- Directly feeds every single fare record to PostgreSQL.

Usage:
    python scripts/continuous_scraper.py
    python scripts/continuous_scraper.py --interval-minutes 60
    python scripts/continuous_scraper.py --reset-checkpoint
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import signal
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import settings, get_source_by_name, get_enabled_routes
from main import load_scraper
from pipeline.cleaner import FareCleaner
from pipeline.deduplicator import Deduplicator
from pipeline.models import Route
from db.session import get_session, engine
from sqlalchemy import text

# ── OPERATIONAL SOURCES ──────────────────────────────────────────────
DEFAULT_SOURCES = [
    "easemytrip",
    "cleartrip",
    "ixigo",
    "indigo",
    "akasa",
    "air_india_express",
    "spicejet",
]

DEFAULT_ADVANCE_DAYS = [1, 7, 15, 30]

CHECKPOINT_FILE = PROJECT_ROOT / "logs" / "scraper_checkpoint.json"
CHECKPOINT_FILE.parent.mkdir(exist_ok=True)

STOP_REQUESTED = False


def signal_handler(signum, frame):
    global STOP_REQUESTED
    print("\n🛑 Stop signal received (Ctrl+C). Finishing current job and exiting gracefully...")
    STOP_REQUESTED = True


def get_current_db_count() -> int:
    """Get real-time total fare count directly from PostgreSQL."""
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT COUNT(*) FROM fares;"))
            return res.scalar() or 0
    except Exception as e:
        return 0


def load_checkpoint() -> dict:
    """Load the last completed job index and round."""
    if CHECKPOINT_FILE.exists():
        try:
            with open(CHECKPOINT_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"round": 1, "job_index": 0}


def save_checkpoint(round_num: int, job_index: int, total_jobs: int, source: str, route_str: str, adv: int):
    """Save progress so it can resume after restart."""
    try:
        data = {
            "round": round_num,
            "job_index": job_index,
            "total_jobs": total_jobs,
            "last_source": source,
            "last_route": route_str,
            "last_adv": adv,
            "updated_at": datetime.now().isoformat(),
        }
        with open(CHECKPOINT_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        pass


def build_interleaved_jobs(routes: list[dict], advance_days: list[int], sources: list[str]) -> list[dict]:
    """
    Build an interleaved queue of jobs so sources rotate continuously!
    Order:
      For each route:
        For each advance window:
          Cycle through ALL sources (EMT, Cleartrip, Ixigo, IndiGo, Akasa, etc.)
    """
    jobs = []
    for r_cfg in routes:
        origin = r_cfg["origin"]
        dest = r_cfg["destination"]
        for adv in advance_days:
            for src in sources:
                jobs.append({
                    "source": src,
                    "origin": origin,
                    "destination": dest,
                    "advance_days": adv,
                })
    return jobs


async def scrape_job(job: dict, cleaner: FareCleaner, deduplicator: Deduplicator, scrapers_cache: dict) -> tuple[int, int]:
    """Execute a single scrape job and immediately feed records to PostgreSQL."""
    src_name = job["source"]
    route = Route(origin=job["origin"], destination=job["destination"])
    adv = job["advance_days"]
    travel_date = date.today() + timedelta(days=adv)

    # Get cached scraper or initialize
    if src_name not in scrapers_cache:
        src_cfg = get_source_by_name(src_name)
        if not src_cfg:
            return 0, 0
        try:
            scrapers_cache[src_name] = load_scraper(src_cfg)
        except Exception as e:
            print(f"  ❌ [{src_name.upper()}] Failed to load scraper: {e}")
            return 0, 0

    scraper = scrapers_cache[src_name]

    try:
        t0 = time.time()
        res = await scraper.scrape(route, travel_date, adv)
        duration = round(time.time() - t0, 1)

        if not res.is_success or not res.fares:
            print(f"  ⚠️  {src_name:<18} | {route.pair} | T+{adv:>2}d | No fares found | {duration}s")
            return 0, 0

        # Step 1: Clean
        cleaned = cleaner.clean_batch(res.fares)
        if not cleaned:
            return len(res.fares), 0

        # Step 2: Deduplicate in memory
        unique = deduplicator.deduplicate_in_memory(cleaned)

        # Step 3: Immediately feed to PostgreSQL
        with get_session() as session:
            saved = deduplicator.upsert_fares(session, unique)

        print(
            f"  ✅ {src_name:<18} | {route.pair} | T+{adv:>2}d | "
            f"{len(res.fares):>3} found → {saved:>3} saved to DB | {duration}s"
        )
        return len(res.fares), saved

    except Exception as e:
        print(f"  ⚠️  {src_name:<18} | {route.pair} | T+{adv:>2}d | Notice: {e}")
        return 0, 0


async def run_round_robin_loop(interval_minutes: int, sources: list[str], reset_checkpoint: bool = False):
    cleaner = FareCleaner()
    deduplicator = Deduplicator()
    routes = get_enabled_routes()
    scrapers_cache: dict = {}

    if reset_checkpoint and CHECKPOINT_FILE.exists():
        CHECKPOINT_FILE.unlink()
        print("🔄 Checkpoint reset by user. Starting fresh from Round #1, Job #1.")

    checkpoint = load_checkpoint()
    round_num = checkpoint.get("round", 1)
    resume_index = checkpoint.get("job_index", 0)

    # Build the full interleaved job queue
    jobs = build_interleaved_jobs(routes, DEFAULT_ADVANCE_DAYS, sources)
    total_jobs = len(jobs)

    print("\n" + "╔" + "═" * 78 + "╗")
    print("║  ✈️  APIx 24/7 INTERLEAVED MULTI-SOURCE SCRAPER & LIVE FEEDER                ║")
    print(f"║  Database: Neon PostgreSQL (Connected & Real-Time Sync)                     ║")
    print(f"║  Strategy: Round-Robin Interleaved (Cycles Sources on Every Single Job)      ║")
    print(f"║  Total Jobs Per Round: {total_jobs} (Rotates across {len(sources)} sources)                     ║")
    print(f"║  Sleep Between Rounds: {interval_minutes} minutes                                           ║")
    print("╚" + "═" * 78 + "╝")

    if resume_index > 0 and resume_index < total_jobs:
        last_s = checkpoint.get('last_source', 'unknown')
        last_r = checkpoint.get('last_route', 'unknown')
        last_a = checkpoint.get('last_adv', 0)
        print(f"\n📍 RESUMING from checkpoint: Round #{round_num} at Job #{resume_index + 1}/{total_jobs}")
        print(f"   (Last completed: {last_s} | {last_r} | T+{last_a}d)\n")
    else:
        resume_index = 0

    while not STOP_REQUESTED:
        db_start = get_current_db_count()
        print("\n" + "═" * 80)
        print(f"🚀 ROUND #{round_num} IN PROGRESS | {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}")
        print(f"📊 PostgreSQL Total Fares at Start: {db_start:,}")
        print("═" * 80 + "\n")

        round_extracted = 0
        round_saved = 0
        t_start = time.time()

        for idx in range(resume_index, total_jobs):
            if STOP_REQUESTED:
                break

            job = jobs[idx]
            job_num = idx + 1
            progress_pct = round((job_num / total_jobs) * 100, 1)

            print(f"[{job_num:>3}/{total_jobs} | {progress_pct:>5}%]", end="")
            found, saved = await scrape_job(job, cleaner, deduplicator, scrapers_cache)
            round_extracted += found
            round_saved += saved

            # Save checkpoint after every job
            save_checkpoint(round_num, job_num, total_jobs, job["source"], f"{job['origin']}-{job['destination']}", job["advance_days"])

            # Small polite pause
            await asyncio.sleep(1.2)

        if STOP_REQUESTED:
            break

        # Round complete
        elapsed_min = round((time.time() - t_start) / 60, 1)
        db_end = get_current_db_count()
        print("\n" + "─" * 80)
        print(f"🏁 ROUND #{round_num} FINISHED in {elapsed_min} min")
        print(f"  • Extracted this round: {round_extracted:,} fares")
        print(f"  • Newly fed to DB:      {round_saved:,} records")
        print(f"  • Total in PostgreSQL:  {db_end:,} records (+{db_end - db_start:,})")
        print("─" * 80 + "\n")

        # Prepare for next round
        round_num += 1
        resume_index = 0
        save_checkpoint(round_num, 0, total_jobs, "none", "none", 0)

        sleep_seconds = interval_minutes * 60
        next_run = datetime.now() + timedelta(seconds=sleep_seconds)
        print(f"⏳ Sleeping for {interval_minutes} minutes until Round #{round_num} at {next_run.strftime('%H:%M:%S IST')}...")
        print("💡 The database remains live and continuously viewable at http://localhost:3000/console")
        print("   (Press Ctrl+C anytime to stop gracefully — progress is saved!)\n")

        for _ in range(sleep_seconds):
            if STOP_REQUESTED:
                break
            await asyncio.sleep(1)

    print("\n👋 Scraper stopped safely. Checkpoint saved — you can resume anytime from this exact point!")


if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    parser = argparse.ArgumentParser(description="24/7 Interleaved Multi-Source Flight Scraper")
    parser.add_argument(
        "--interval-minutes",
        "-i",
        type=int,
        default=60,
        help="Interval between full scrape rounds in minutes (default: 60)",
    )
    parser.add_argument(
        "--sources",
        "-s",
        nargs="+",
        default=DEFAULT_SOURCES,
        help="List of sources to interleave (default: easemytrip cleartrip ixigo indigo akasa air_india_express spicejet)",
    )
    parser.add_argument(
        "--reset-checkpoint",
        action="store_true",
        help="Reset checkpoint and start from Round 1 Job 1",
    )
    args = parser.parse_args()

    asyncio.run(
        run_round_robin_loop(
            interval_minutes=args.interval_minutes,
            sources=args.sources,
            reset_checkpoint=args.reset_checkpoint,
        )
    )
