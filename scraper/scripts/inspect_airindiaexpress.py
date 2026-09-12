import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            viewport={"width": 1440, "height": 900}
        )
        page = await context.new_page()

        print("Visiting Air India Express homepage...")
        await page.goto("https://www.airindiaexpress.com", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)

        url = "https://www.airindiaexpress.com/booking/search?from=DEL&to=BOM&date=18-09-2026&adults=1&trip=oneway"
        print("Navigating to search URL:", url)
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(6)

        print("Final URL:", page.url)
        print("Final Title:", await page.title())

        # Check flight cards or prices
        body_txt = await page.inner_text("body")
        import re
        prices = re.findall(r"₹\s*([\d,]+)", body_txt)
        print("Prices found:", prices[:10])

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
