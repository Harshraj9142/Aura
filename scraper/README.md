# APIx — Real-time Airfare Price Index Scraper

A production-grade Python scraping engine that collects domestic Indian airfare data from 5 airlines and 6 OTAs across 6 city-pair routes. Data is stored in PostgreSQL for consumption by a separate analytics backend and dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLI / Scheduler                       │
│  main.py (--run-now / --schedule / --route / --source)  │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   Batch Orchestrator    │
          │  (routes × sources ×   │
          │   advance windows)     │
          └────────────┬───────────┘
                       │
     ┌─────────────────▼─────────────────┐
     │         Core Infrastructure        │
     │  ┌──────────┐ ┌───────────────┐   │
     │  │ Browser  │ │ Rate Limiter  │   │
     │  │ Manager  │ │ (per-domain)  │   │
     │  └──────────┘ └───────────────┘   │
     │  ┌──────────┐ ┌───────────────┐   │
     │  │ Robots   │ │ CAPTCHA       │   │
     │  │ Checker  │ │ Detector      │   │
     │  └──────────┘ └───────────────┘   │
     └─────────────────┬─────────────────┘
                       │
     ┌─────────────────▼─────────────────┐
     │     Scraper Layer (BaseScraper)    │
     │  ┌─────────┐  ┌────────────────┐  │
     │  │Airlines │  │    OTAs        │  │
     │  │ IndiGo  │  │ MakeMyTrip    │  │
     │  │ AirIndia│  │ Yatra         │  │
     │  │ AIX     │  │ EaseMyTrip    │  │
     │  │ Akasa   │  │ Cleartrip     │  │
     │  │ SpiceJet│  │ Ixigo/Goibibo │  │
     │  └─────────┘  └────────────────┘  │
     └─────────────────┬─────────────────┘
                       │
     ┌─────────────────▼─────────────────┐
     │        Data Pipeline               │
     │  Pydantic Validation → Cleaning   │
     │  → Outlier Detection → Dedup      │
     └─────────────────┬─────────────────┘
                       │
     ┌─────────────────▼─────────────────┐
     │        PostgreSQL Database         │
     │  fares │ scrape_runs              │
     └───────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL 14+
- Playwright browsers

### Setup

```bash
# 1. Clone and navigate to the scraper directory
cd scraper/

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Install Playwright browsers
playwright install chromium

# 5. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 6. Initialize the database
python main.py --init-db
# Or use Alembic for production:
alembic upgrade head
```

### Running

```bash
# Run a single route/source (for testing)
python main.py --run-now --route DEL-BOM --source indigo

# Run a single route against all sources
python main.py --run-now --route DEL-BOM

# Run all routes against a single source
python main.py --run-now --source makemytrip

# Run full batch (all routes × all sources × all windows)
python main.py --run-now

# Start the scheduled daemon (daily at configured time)
python main.py --schedule

# List configured routes and sources
python main.py --list-routes
python main.py --list-sources
```

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run specific test suites
pytest tests/test_cleaner.py -v
pytest tests/test_indigo_scraper.py -v
pytest tests/test_base_scraper.py -v

# With coverage
pytest tests/ -v --cov=. --cov-report=html
```

## Configuration

### Routes (`config/routes.yaml`)

Add or remove city-pairs without code changes:

```yaml
routes:
  - origin: DEL
    destination: BOM
    name: "Delhi–Mumbai"
    enabled: true  # Set to false to temporarily disable
```

### Sources (`config/sources.yaml`)

Enable/disable individual scrapers:

```yaml
airlines:
  - name: indigo
    display_name: "IndiGo"
    base_url: "https://www.goindigo.in"
    enabled: true  # Set to false to disable without removing
    scraper_class: "scrapers.airlines.indigo_scraper.IndiGoScraper"
```

### Environment Variables (`.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/apix` | PostgreSQL connection string |
| `PROXY_URLS` | _(empty)_ | Comma-separated proxy URLs |
| `LOG_LEVEL` | `INFO` | Logging level |
| `SCRAPE_HOUR` | `6` | Daily scrape hour (24h) |
| `SCRAPE_MINUTE` | `0` | Daily scrape minute |
| `MIN_DELAY` | `3` | Minimum delay between requests (seconds) |
| `MAX_DELAY` | `8` | Maximum delay between requests (seconds) |
| `MAX_RETRIES` | `3` | Max retry attempts per scrape task |
| `FARE_MIN_THRESHOLD` | `500` | Minimum valid fare (INR) |
| `FARE_MAX_THRESHOLD` | `50000` | Maximum valid fare (INR) |
| `HEADLESS` | `true` | Run browser in headless mode |
| `BROWSER_TIMEOUT` | `30000` | Browser operation timeout (ms) |

## How to Add a New Scraper Source

1. **Create the scraper file**

   For an airline: `scrapers/airlines/my_airline_scraper.py`
   For an OTA: `scrapers/otas/my_ota_scraper.py`

2. **Implement the `BaseScraper` interface**

   ```python
   from scrapers.base_scraper import BaseScraper, NoFlightsFoundError
   from pipeline.models import FareRecord, Route, SourceTypeEnum

   class MyAirlineScraper(BaseScraper):
       source_name = "my_airline"
       source_type = SourceTypeEnum.AIRLINE  # or SourceTypeEnum.OTA
       base_url = "https://www.myairline.com"

       def _build_search_url(self, route, travel_date, advance_days) -> str:
           # Build the search URL for robots.txt checks
           return f"{self.base_url}/search?..."

       async def _extract_fares(self, page, route, travel_date, advance_days):
           # Parse flight cards from the loaded page
           # Return list[FareRecord]
           ...

       # Optional: override for multi-step search flows
       async def _navigate_and_search(self, page, route, travel_date, advance_days):
           # Custom navigation logic (form fill, etc.)
           ...
   ```

3. **Add to `config/sources.yaml`**

   ```yaml
   airlines:
     - name: my_airline
       display_name: "My Airline"
       base_url: "https://www.myairline.com"
       enabled: true
       scraper_class: "scrapers.airlines.my_airline_scraper.MyAirlineScraper"
   ```

4. **Test it**

   ```bash
   python main.py --run-now --route DEL-BOM --source my_airline
   ```

That's it! The base class handles rate limiting, robots.txt, CAPTCHA detection, retry logic, and database insertion automatically.

## Ethical Scraping

This scraper is built with responsible scraping practices:

- ✅ **robots.txt compliance** — checks and respects disallow rules
- ✅ **Rate limiting** — 3-8 second randomized delays, 1 request/domain at a time
- ✅ **User-Agent rotation** — pool of 16+ realistic browser UAs
- ✅ **CAPTCHA detection** — detects blocks and skips gracefully (never solves)
- ✅ **Retry-After respect** — honors 429/503 headers
- ✅ **Proxy support** — ready for proxy rotation (configure via `PROXY_URLS`)
- ✅ **Session reuse** — persistent browser contexts within runs

## Database Schema

### `fares` table

Stores individual scraped fare records with:
- Route info (origin/destination IATA codes)
- Travel date and advance-purchase window
- Source identification (name, type)
- Flight details (carrier, number, fare class)
- Pricing (base fare, taxes, total fare in INR)
- Validation metadata (outlier flag, warnings)

### `scrape_runs` table

Tracks batch run metadata for monitoring:
- Timing (start/end timestamps)
- Counters (attempted, success, failed, blocked)
- Per-source summary (JSON)

## Monitoring

- **Logs**: Rotating daily log files in `logs/` directory
- **Scrape runs**: Query `scrape_runs` table for daily success rates
- **Validation warnings**: Check `validation_warnings` column in `fares` for data quality issues
- **Batch summaries**: Printed to console after each batch run

## Project Structure

```
scraper/
├── config/          # YAML configs + settings module
├── core/            # Shared infrastructure (browser, rate limit, robots, captcha)
├── scrapers/        # BaseScraper + airline/OTA implementations
├── pipeline/        # Pydantic models, cleaning, deduplication
├── db/              # SQLAlchemy models, session, Alembic migrations
├── scheduler/       # APScheduler job runner
├── tests/           # Pytest tests with mock fixtures
├── logs/            # Rotating log files
├── main.py          # CLI entry point
└── requirements.txt # Dependencies
```
