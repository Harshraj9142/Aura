import asyncio
import argparse
from playwright.async_api import async_playwright

async def inspect_url(url: str, headless: bool = True):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=headless,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1440, "height": 900}
        )
        page = await context.new_page()
        
        # Intercept network responses to catch flight APIs
        responses = []
        def handle_response(response):
            if any(k in response.url.lower() for k in ["flight", "search", "api", "fare", "result", "booking"]):
                responses.append(response.url)
        
        page.on("response", handle_response)
        
        print(f"Navigating to {url}...")
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception as e:
            print(f"Goto error / timeout: {e}")
        
        await asyncio.sleep(5)
        print(f"Final URL: {page.url}")
        print(f"Page Title: {await page.title()}")
        
        # Look for flight cards or prices in DOM
        content = await page.content()
        print(f"HTML length: {len(content)}")
        
        # Check matching elements for common patterns
        for sel in [
            ".flight-card", ".flt-list-row", ".row", ".card", "div[class*='flight']", 
            "div[class*='fare']", "div[class*='price']", "span[class*='price']",
            "[data-testid]", "input", "button"
        ]:
            count = len(await page.query_selector_all(sel))
            if count > 0:
                print(f"Selector '{sel}': {count} elements found")
        
        print("\nRelevant API responses caught:")
        for r in responses[:10]:
            print(f"  - {r}")
            
        await browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--headless", action="store_true", default=True)
    args = parser.parse_args()
    asyncio.run(inspect_url(args.url, args.headless))
