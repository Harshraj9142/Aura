#!/usr/bin/env python3
"""
Aura Database & Scraper Diagnostics Utility
Quickly checks live database row counts, table storage size,
scrape runs status, and recent scraped fares.

Usage:
    python scripts/check_db_status.py
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Resolve project paths and load .env
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scraper"))

from dotenv import load_dotenv

# Try multiple env locations
load_dotenv(REPO_ROOT / "scraper" / ".env")
load_dotenv(REPO_ROOT / "web" / ".env.local")
load_dotenv(REPO_ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to default Neon connection if not explicitly loaded
    DATABASE_URL = "postgresql://neondb_owner:npg_2fJs9BIdQGLF@ep-quiet-dawn-a5axks35-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

try:
    from sqlalchemy import create_engine, text
except ImportError:
    print("❌ SQLAlchemy is required. Run: pip install sqlalchemy psycopg2-binary")
    sys.exit(1)


def format_time_diff(dt):
    if not dt:
        return "N/A"
    now = datetime.now(timezone.utc)
    diff = (now - dt).total_seconds()
    if diff < 60:
        return f"{int(diff)}s ago"
    elif diff < 3600:
        return f"{int(diff // 60)}m ago"
    elif diff < 86400:
        return f"{int(diff // 3600)}h {int((diff % 3600) // 60)}m ago"
    else:
        return f"{int(diff // 86400)}d ago"


def main():
    print("=" * 68)
    print(" ✈️   AURA — LIVE DATABASE & SCRAPER HEALTH MONITOR")
    print("=" * 68)
    
    clean_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "localhost"
    print(f"📡 Target DB: {clean_url}")
    print(f"🕒 Local Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 68)

    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            # 1. Total counts and sizes
            total_fares = conn.execute(text("SELECT count(*) FROM fares")).scalar() or 0
            total_runs = conn.execute(text("SELECT count(*) FROM scrape_runs")).scalar() or 0
            
            size_res = conn.execute(text("""
                SELECT 
                    pg_size_pretty(pg_total_relation_size('fares')) AS fares_size,
                    pg_size_pretty(pg_database_size(current_database())) AS db_size
            """)).fetchone()
            fares_size = size_res[0] if size_res else "N/A"
            db_size = size_res[1] if size_res else "N/A"

            print(f"📊 Fares Count:      {total_fares:,} rows")
            print(f"💾 Fares Table Size: {fares_size}")
            print(f"🗄️  Total DB Size:    {db_size} (Neon Free Tier: 512 MB)")
            print(f"🔄 Scrape Run Logs:  {total_runs} runs recorded")

            # 2. Today's breakdown
            print("\n" + "-" * 68)
            print("📅 TODAY'S SCRAPED FARES (BY SOURCE):")
            today_fares = conn.execute(text("""
                SELECT source, count(*), max(scraped_at) as last_seen
                FROM fares
                WHERE scraped_at >= CURRENT_DATE
                GROUP BY source
                ORDER BY 2 DESC
            """)).fetchall()

            if today_fares:
                for src, cnt, last_seen in today_fares:
                    print(f"  • {src:18} : {cnt:,} fares (last: {format_time_diff(last_seen)})")
            else:
                print("  (No fares scraped yet today)")

            # 3. Recent Scrape Runs
            print("\n" + "-" * 68)
            print("⏱️  RECENT SCRAPE RUNS:")
            runs = conn.execute(text("""
                SELECT run_id, started_at, completed_at, status, total_attempted, total_success, total_failed
                FROM scrape_runs
                ORDER BY started_at DESC
                LIMIT 4
            """)).fetchall()

            if runs:
                for r in runs:
                    started = r[1].strftime('%Y-%m-%d %H:%M') if r[1] else "N/A"
                    print(f"  • [{r[3].upper():9}] Started: {started} UTC ({format_time_diff(r[1])}) | Attempted: {r[4]} | Success: {r[5]} | Failed: {r[6]}")
            else:
                print("  (No scrape run history)")

            # 4. Latest 5 Fares
            print("\n" + "-" * 68)
            print("🚀 LATEST 5 LIVE FARES STORED:")
            latest_fares = conn.execute(text("""
                SELECT carrier, flight_number, route_origin, route_destination, total_fare, source, scraped_at
                FROM fares
                ORDER BY scraped_at DESC
                LIMIT 5
            """)).fetchall()

            if latest_fares:
                for f in latest_fares:
                    carrier = f[0] or "Unknown"
                    flight = f[1] or "N/A"
                    corridor = f"{f[2]} → {f[3]}"
                    fare = f"₹{float(f[4]):,.0f}" if f[4] else "N/A"
                    source = f[5] or "N/A"
                    time_ago = format_time_diff(f[6])
                    print(f"  • {carrier:16} {flight:16} {corridor:10} {fare:10} via {source:10} ({time_ago})")
            else:
                print("  (No fare records found)")

    except Exception as e:
        print(f"\n❌ Database query error: {e}")

    print("=" * 68 + "\n")


if __name__ == "__main__":
    main()
