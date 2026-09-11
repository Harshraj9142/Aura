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

        await page.goto("https://www.airindiaexpress.com", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(4)

        # Dump div/span elements containing From/To/Origin/Destination
        for keyword in ["From", "To", "Where from", "Where to", "Delhi", "Mumbai", "DEL", "BOM"]:
            els = await page.query_selector_all(f"div:has-text('{keyword}'), span:has-text('{keyword}')")
            print(f"Keyword '{keyword}': {len(els)} elements found")
            for el in els[:3]:
                txt = (await el.inner_text()).replace('\n', ' ').strip()
                if len(txt) < 80:
                    cls = await el.get_attribute("class") or ""
                    tag = await el.evaluate("e => e.tagName")
                    print(f"   <{tag} class='{cls[:40]}'> {txt}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
