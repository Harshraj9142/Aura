import asyncio
import time
from core.robots_checker import RobotsChecker

DOMAINS = [
    "https://www.spicejet.com/flights/search",
    "https://www.easemytrip.com/flight/search",
    "https://www.airindiaexpress.com/booking/search",
    "https://www.akasaair.com/booking/search",
    "https://www.ixigo.com/search/result/flight",
    "https://www.cleartrip.com/flights/results",
]

async def test_robots():
    checker = RobotsChecker()
    start_total = time.time()
    for url in DOMAINS:
        t0 = time.time()
        allowed = await checker.is_allowed(url)
        dt = time.time() - t0
        print(f"URL: {url:<50} | Allowed: {str(allowed):<5} | Elapsed: {dt:.2f}s")
    print(f"\nTOTAL TIME across {len(DOMAINS)} domains: {time.time() - start_total:.2f}s")

if __name__ == "__main__":
    asyncio.run(test_robots())
