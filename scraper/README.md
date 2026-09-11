# APIx — Real-time Airfare Price Index Scraper & Index Engine

A production-grade Python scraping engine and index calculation module that collects domestic Indian airfare data from 5 airlines and 6 OTAs across 6 city-pair routes, computes weighted price-relative composite Airfare Price Indices (APIx), and stores data in PostgreSQL for Next.js web dashboard consumption.

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
     │      Index Calculation Engine      │
     │  Base Period P_i,0 → Aggregator   │
     │  → Laspeyres Weighted Calculator  │
     └─────────────────┬─────────────────┘
                       │
     ┌─────────────────▼─────────────────┐
     │        PostgreSQL Database         │
     │  fares │ scrape_runs              │
     │  route_base_values │ index_values │
     └───────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL 14+

### Setup

```bash
# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies & Playwright browsers
pip install -r requirements.txt
playwright install chromium

# 3. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL database URL

# 4. Run migrations
alembic upgrade head
```

---

## APIx Index Calculation Engine

The `index/` subpackage implements a **Laspeyres-type weighted price-relative index** using DGCA passenger traffic shares:

$$\text{PriceRelative}_{i,t} = \left( \frac{P_{i,t}}{P_{i,0}} \right) \times 100$$

$$\text{APIx}_t = \sum w_i^{\text{normalized}} \times \text{PriceRelative}_{i,t}$$

### Key Index Features:
1. **Fixed Base Period ($P_{i,0}$)**: Computed once over the first 7 days of collection and stored in `route_base_values`.
2. **DGCA Route Weights**: Configured in `index/config/dgca_route_weights.yaml` derived from official DGCA sector traffic reports.
3. **Missing Data Handling**: Automatically excludes missing routes and scales active route weights proportionally ($\sum w_i = 1$). If $>50\%$ of routes are missing, index score defaults to `NULL` with a quality note.
4. **Frequencies**: Independently calculates `daily`, `weekly`, and `monthly` index values directly from raw fare records without compound rounding error.

### Running Index CLI Commands:

```bash
# Establish base period values once
python -m cli.run_index --base-period

# Force re-compute base period values
python -m cli.run_index --base-period --force

# Calculate daily index for today
python -m cli.run_index --frequency daily

# Calculate weekly, monthly, or all frequencies
python -m cli.run_index --frequency all

# Run backtest comparison against DGCA benchmark fares
python -m index.backtest --route DEL-BOM --month 2026-09
```

---

## Ethical Scraping

This scraper is built with responsible scraping practices:
- ✅ **robots.txt compliance** — checks and respects disallow rules
- ✅ **Rate limiting** — 3-8 second randomized delays, 1 request/domain at a time
- ✅ **User-Agent rotation** — pool of 16+ realistic browser UAs
- ✅ **CAPTCHA detection** — detects blocks and skips gracefully (never solves)
- ✅ **Retry-After respect** — honors 429/503 headers

---

## Project Structure

```
scraper/
├── cli/             # CLI entry points (run_index.py)
├── config/          # YAML configs + settings module
├── core/            # Shared infrastructure (browser, rate limit, robots, captcha)
├── db/              # SQLAlchemy models, session, Alembic migrations
├── index/           # APIx Index Calculation subpackage
│   ├── config/      # index_settings.yaml, dgca_route_weights.yaml, dgca_reference_fares.csv
│   ├── base_period.py  # Base period P_i,0 manager
│   ├── aggregator.py   # Fare period grouping
│   ├── calculator.py   # Laspeyres weighted index calculator
│   ├── writer.py       # DB persistence writer
│   └── backtest.py     # DGCA comparison validator
├── logs/            # Rotating log files
├── pipeline/        # Pydantic models, cleaning, deduplication
├── scheduler/       # APScheduler job runner (triggers daily index post-scrape)
├── scrapers/        # BaseScraper + airline/OTA implementations
├── tests/           # Pytest test suite (41 unit tests)
├── main.py          # Scraper CLI entry point
└── requirements.txt # Dependencies
```
