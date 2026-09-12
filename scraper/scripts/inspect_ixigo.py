import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        print("Visiting homepage...")
        await page.goto("https://www.ixigo.com", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)

        url = "https://www.ixigo.com/search/result/flight/DEL/BOM/18092026/1/0/0/e"
        print("Navigating to:", url)
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(12)

        # Dump candidate card containers
        cards = await page.query_selector_all("div")
        print(f"Total divs: {len(cards)}")
        found = []
        for c in cards:
            try:
                txt = await c.inner_text()
                if "₹" in txt and len(txt) < 350 and ("DEL" in txt or "BOM" in txt or "IndiGo" in txt or "Air" in txt or "SpiceJet" in txt or "Akasa" in txt):
                    cls = await c.get_attribute("class")
                    if cls and cls not in found and len(cls.strip()) > 0:
                        found.append(cls)
                        print(f"IXIGO CARD CONTAINER CLASS: '{cls}'")
                        print("   Text:", txt.replace('\n', ' ')[:140])
                        if len(found) >= 6:
                            break
            except Exception:
                continue

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
