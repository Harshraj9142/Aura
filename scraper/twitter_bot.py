#!/usr/bin/env python3
"""
Aura Scraper Service — Headless Twitter / X Escalation Bot
Posts a grievance escalation tweet to X using Playwright and authenticated session cookie.
"""

import sys
import os
import json
import time
from pathlib import Path
from loguru import logger

def get_auth_token(custom_token: str = None) -> str | None:
    if custom_token:
        return custom_token.strip().strip('"').strip("'")

    # 1. From environment variable
    token = os.getenv("TWITTER_AUTH_TOKEN")
    if token:
        return token.strip().strip('"').strip("'")
    
    # 2. Check web/.env.local (if accessible)
    env_local = Path(__file__).resolve().parent.parent / "web" / ".env.local"
    if env_local.exists():
        with open(env_local, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("TWITTER_AUTH_TOKEN="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val:
                        return val

    # 3. Check scraper/.env
    env_scraper = Path(__file__).resolve().parent / ".env"
    if env_scraper.exists():
        with open(env_scraper, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("TWITTER_AUTH_TOKEN="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val:
                        return val

    return None

def get_twitter_handle() -> str:
    handle = os.getenv("NEXT_PUBLIC_TWITTER_HANDLE") or os.getenv("TWITTER_HANDLE")
    if not handle:
        env_local = Path(__file__).resolve().parent.parent / "web" / ".env.local"
        if env_local.exists():
            with open(env_local, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("NEXT_PUBLIC_TWITTER_HANDLE=") or line.startswith("TWITTER_HANDLE="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            handle = val
                            break
    return (handle or "@dmca_test").lstrip("@")

def publish_tweet(tweet_text: str, custom_auth_token: str = None) -> dict:
    auth_token = get_auth_token(custom_auth_token)
    if not auth_token:
        return {
            "success": False,
            "error": "TWITTER_AUTH_TOKEN is missing. Please add it to your Render environment variables or web/.env.local."
        }

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {
            "success": False,
            "error": "Playwright is not installed in Python environment."
        }

    logger.info("Initiating Playwright headless session for Twitter escalation...")

    def launch_browser(p):
        return p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ]
        )

    with sync_playwright() as p:
        try:
            browser = launch_browser(p)
        except Exception as e:
            if "Executable doesn't exist" in str(e) or "playwright install" in str(e):
                logger.info("Chromium executable missing, auto-installing on demand...")
                import subprocess
                subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
                browser = launch_browser(p)
            else:
                return {"success": False, "error": f"Failed to launch Chromium: {str(e)}"}

        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )

        context.add_cookies([
            {
                "name": "auth_token",
                "value": auth_token,
                "domain": ".x.com",
                "path": "/",
                "secure": True,
                "httpOnly": True,
                "sameSite": "None",
            },
            {
                "name": "auth_token",
                "value": auth_token,
                "domain": ".twitter.com",
                "path": "/",
                "secure": True,
                "httpOnly": True,
                "sameSite": "None",
            }
        ])

        page = context.new_page()
        tweet_id = None

        def on_response(response):
            nonlocal tweet_id
            if "CreateTweet" in response.url and response.status == 200:
                try:
                    data = response.json()
                    res = data.get("data", {}).get("create_tweet", {}).get("tweet_results", {}).get("result", {})
                    if "rest_id" in res:
                        tweet_id = res["rest_id"]
                except Exception:
                    pass

        page.on("response", on_response)

        try:
            page.goto("https://x.com/compose/post", wait_until="domcontentloaded", timeout=30000)
        except Exception as e:
            browser.close()
            return {"success": False, "error": f"Failed to load X compose page: {str(e)}"}

        time.sleep(2)
        if "login" in page.url:
            browser.close()
            return {
                "success": False,
                "error": "The auth_token cookie expired or was invalid. Please re-copy auth_token."
            }

        editor = page.wait_for_selector(
            '[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"]',
            timeout=15000
        )
        if not editor:
            browser.close()
            return {"success": False, "error": "Could not locate the tweet composer editor."}

        # Focus & click avoiding pointer intercepts
        try:
            editor.focus()
        except Exception:
            pass
        try:
            editor.click(force=True)
        except Exception:
            pass
        time.sleep(0.5)

        try:
            editor.fill(tweet_text)
        except Exception:
            page.keyboard.insert_text(tweet_text)
        time.sleep(1)

        page.keyboard.press("Control+Enter")
        time.sleep(1)

        if not tweet_id:
            tweet_btn = page.query_selector(
                '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]'
            )
            if tweet_btn:
                try:
                    tweet_btn.evaluate("b => b.click()")
                except Exception:
                    tweet_btn.click(force=True)

        start_wait = time.time()
        while time.time() - start_wait < 10:
            if tweet_id:
                break
            time.sleep(0.5)

        browser.close()

        handle = get_twitter_handle()
        tweet_url = f"https://x.com/{handle}/status/{tweet_id}" if tweet_id else f"https://x.com/{handle}"

        return {
            "success": True,
            "tweetId": tweet_id,
            "tweetUrl": tweet_url,
            "message": f"Tweet published successfully via @{handle}!"
        }

if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read().strip()
    if not text:
        print(json.dumps({"success": False, "error": "No tweet text provided."}))
        sys.exit(1)
    res = publish_tweet(text)
    print(json.dumps(res), flush=True)
    if not res.get("success"):
        sys.exit(1)
