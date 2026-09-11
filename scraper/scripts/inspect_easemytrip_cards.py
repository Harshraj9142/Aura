import asyncio
import json
from playwright.async_api import async_playwright

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        api_urls = []
        async def on_response(response):
            url = response.url
            if any(k in url.lower() for k in ["search", "flight", "getflight", "fareresult", "result", "list"]):
                api_urls.append((url, response.status))
                try:
                    if "json" in response.headers.get("content-type", "").lower():
                        data = await response.json()
                        print(f"Captured JSON API response from: {url[:80]}")
                        print(f"  Keys: {list(data.keys()) if isinstance(data, dict) else 'list len ' + str(len(data))}")
                except Exception:
                    pass

        page.on("response", on_response)

        url = "https://www.easemytrip.com/flight-search/listing?srch=DEL-Delhi-India%7CBOM-Mumbai-India%7C18%2F09%2F2026&px=1-0-0&cbn=0&ar=undefined&isow=true&isdm=true&lang=en-us&SearchType=Oneway&Trip=One"
        print("Navigating to listing URL...")
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await asyncio.sleep(5)

        print("\nAll captured matching URLs:")
        for u, status in api_urls:
            print(f"  [{status}] {u}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect())
