#!/usr/bin/env python3
"""
Render Live Logs Utility
Fetches and displays live container logs directly from Render API.

Usage:
    python scripts/fetch_render_logs.py
    python scripts/fetch_render_logs.py --lines 50
    python scripts/fetch_render_logs.py --service Aura-scrape-tweet
"""

import os
import sys
import argparse
import urllib.request
import urllib.parse
import json
import re
from pathlib import Path

# Ensure UTF-8 console output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Load environment variables
REPO_ROOT = Path(__file__).resolve().parent.parent
from dotenv import load_dotenv
load_dotenv(REPO_ROOT / ".env")
load_dotenv(REPO_ROOT / "scraper" / ".env")
load_dotenv(REPO_ROOT / "web" / ".env.local")

RENDER_API_KEY = os.getenv("RENDER_API_KEY", "rnd_P0F66KKdTysRBLTZ6CjZpzrI7aSD")
RENDER_API_BASE = "https://api.render.com/v1"


def get_headers():
    return {
        "Authorization": f"Bearer {RENDER_API_KEY}",
        "Accept": "application/json",
        "User-Agent": "Aura-Log-Monitor/1.0",
    }


def fetch_services():
    url = f"{RENDER_API_BASE}/services"
    req = urllib.request.Request(url, headers=get_headers())
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return [item["service"] for item in data if "service" in item]
    except Exception as e:
        print(f"❌ Failed to fetch Render services: {e}")
        return []


def fetch_logs(owner_id: str, service_id: str, limit: int = 40):
    params = urllib.parse.urlencode({
        "ownerId": owner_id,
        "resource": service_id,
        "limit": limit,
    })
    url = f"{RENDER_API_BASE}/logs?{params}"
    req = urllib.request.Request(url, headers=get_headers())
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"❌ Failed to fetch logs for {service_id}: {e}")
        return None


def clean_ansi(text: str) -> str:
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)


def main():
    parser = argparse.ArgumentParser(description="Fetch live Render service logs")
    parser.add_argument("-n", "--lines", type=int, default=35, help="Number of log lines to retrieve (default: 35)")
    parser.add_argument("-s", "--service", type=str, default="Aura-scrape-tweet", help="Service name substring (default: Aura-scrape-tweet)")
    parser.add_argument("--raw", action="store_true", help="Keep ANSI color codes")
    args = parser.parse_args()

    print("=" * 72)
    print(" ☁️   RENDER LIVE LOG MONITOR")
    print("=" * 72)

    services = fetch_services()
    if not services:
        print("❌ No services found or invalid API key.")
        return

    # Find matching service
    target = None
    for s in services:
        if args.service.lower() in s.get("name", "").lower():
            target = s
            break

    if not target:
        print(f"❌ Service matching '{args.service}' not found. Available services:")
        for s in services:
            print(f"  • {s.get('name')} (ID: {s.get('id')})")
        return

    service_id = target["id"]
    service_name = target["name"]
    owner_id = target.get("ownerId")
    status = target.get("suspended", "active")

    print(f"📡 Service: {service_name} ({service_id})")
    print(f"🌐 URL:     {target.get('serviceDetails', {}).get('url', 'N/A')}")
    print(f"⚡ Status:  {'ACTIVE' if status == 'not_suspended' else 'SUSPENDED'}")
    print("-" * 72)

    data = fetch_logs(owner_id, service_id, limit=args.lines)
    if not data or "logs" not in data or not data["logs"]:
        print("ℹ️  No log lines returned.")
        return

    logs = data["logs"]
    # Reverse so oldest prints first and latest is at the bottom
    logs.reverse()

    for entry in logs:
        msg = entry.get("message", "")
        ts = entry.get("timestamp", "")[:19].replace("T", " ")
        if not args.raw:
            msg = clean_ansi(msg)
        print(f"[{ts}] {msg}")

    print("=" * 72)
    print(f"✅ Displayed {len(logs)} most recent log lines.")


if __name__ == "__main__":
    main()
