import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        await page.goto("https://www.spicejet.com", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2.5)

        # Origin
        await page.click("[data-testid='to-testID-origin']", force=True)
        await asyncio.sleep(0.5)
        await page.keyboard.type("DEL", delay=100)
        await asyncio.sleep(1)
        await page.click("text='Delhi Indira Gandhi International Airport'", force=True)
        await asyncio.sleep(1)

        # Destination
        await page.click("[data-testid='to-testID-destination']", force=True)
        await asyncio.sleep(0.5)
        await page.keyboard.type("BOM", delay=100)
        await asyncio.sleep(1)

        # Find BOM item text
        els = await page.query_selector_all("div")
        for el in els:
            try:
                if await el.is_visible():
                    txt = await el.inner_text()
                    if "mumbai" in txt.lower() and len(txt) < 80:
                        print("BOM ITEM:", txt.replace("\n", " "))
            except Exception:
                pass

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
