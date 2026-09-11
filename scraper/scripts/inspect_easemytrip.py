import asyncio
from playwright.async_api import async_playwright

CITY_MAP = {
    "DEL": "DEL-Delhi-India",
    "BOM": "BOM-Mumbai-India",
    "BLR": "BLR-Bengaluru-India",
    "CCU": "CCU-Kolkata-India",
    "HYD": "HYD-Hyderabad-India",
    "MAA": "MAA-Chennai-India",
}

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1440, "height": 900}
        )
        page = await context.new_page()

        # Step 1: Visit homepage to set cookies
        print("Visiting homepage...")
        await page.goto("https://www.easemytrip.com", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)

        # Step 2: Navigate to search listing page
        origin_str = CITY_MAP.get("DEL", "DEL-Delhi-India")
        dest_str = CITY_MAP.get("BOM", "BOM-Mumbai-India")
        date_str = "18/09/2026"
        listing_url = (
            f"https://www.easemytrip.com/flight-search/listing?"
            f"srch={origin_str}|{dest_str}|{date_str}&px=1-0-0&cbn=0&ar=undefined&isow=true&isdm=true&lang=en-us&SearchType=Oneway&Trip=One"
        )
        print("Navigating to listing URL:", listing_url)
        await page.goto(listing_url, wait_until="domcontentloaded", timeout=30000)

        print("Waiting 10s for listing page to populate...")
        await asyncio.sleep(10)
        print("Final URL:", page.url)

        # Dump text from page to find prices & flight numbers
        body_text = await page.inner_text("body")
        print("Body text snippet (first 500 chars):")
        print(body_text[:500].replace('\n', ' '))

        # Save HTML for locator analysis
        html = await page.content()
        with open("easemytrip_listing_dump.html", "w") as f:
            f.write(html)
        print(f"Saved easemytrip_listing_dump.html ({len(html)} bytes)")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
