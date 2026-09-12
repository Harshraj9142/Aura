import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        await page.goto("https://www.cleartrip.com", wait_until="domcontentloaded", timeout=15000)
        await asyncio.sleep(2)

        url = "https://www.cleartrip.com/flights/results?adults=1&childs=0&infants=0&class=Economy&depart_date=18/09/2026&from=DEL&to=BOM&intl=n&sft=0"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(5)

        divs = await page.query_selector_all("div")
        found = []
        for d in divs:
            try:
                txt = await d.inner_text()
                if "₹" in txt and ("Non-stop" in txt or "1 stop" in txt or "Direct" in txt) and len(txt) < 300:
                    cls = await d.get_attribute("class") or ""
                    if cls and cls not in found:
                        found.append(cls)
                        print(f"CLEARTRIP CONTAINER CLASS: '{cls}'")
                        print("   Text:", txt.replace('\n', ' ')[:140])
                        if len(found) >= 5:
                            break
            except Exception:
                continue

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
