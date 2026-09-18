# 🌟 Aura — Real-Time Airfare Price Index (APIx)
## Comprehensive Project Status, Architecture Decisions & SIH26056 Dossier

> **Problem Statement ID:** SIH26056  
> **Title:** Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI)  
> **Target Ministry:** Ministry of Statistics and Programme Implementation (MoSPI) / National Statistical Office (NSO) & Reserve Bank of India (RBI)  
> **Creators / Lead Engineers:** Harsh Sinha & Yogesh Kumar  
> **Status:** Fully Operational in Production (AWS EC2 Mumbai + Neon PostgreSQL + Next.js)  
> **Last Updated:** September 19, 2026  

---

## 1. Executive Summary & Objective

The **Consumer Price Index (CPI)** released monthly by MoSPI measures retail inflation in India and drives RBI's monetary policy under the flexible inflation-targeting framework. Currently, air travel fares in the *"Transport and Communication"* sub-group are collected primarily through manual price collection at select ticket offices. 

Because over **90% of Indian domestic air travel** is booked online through dynamic pricing engines where prices fluctuate by **200% to 400%** within a single day, manual collection fails to capture true consumer expenditures.

**Aura** solves this problem by providing an end-to-end, automated, and mathematically rigorous platform that:
1. **Scrapes live airfares 24/7** across major Indian OTAs and direct airlines from an Indian cloud node.
2. **Cleans, filters, and normalizes** price quotes (IQR outlier elimination, tax/base-fare breakdown, deduplication).
3. **Computes a Real-Time Fisher Ideal Airfare Price Index (APIx)** weighted by official DGCA domestic passenger traffic.
4. **Calculates CPI Headline Inflation Impact** using MoSPI's official domestic airfare CPI basket weight ($0.0042$).
5. **Serves institutional dashboards & REST APIs** for MoSPI, NSO, and RBI economists.

---

## 2. System Architecture & Live Deployment Status

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             AURA DEPLOYMENT TOPOLOGY                             │
└──────────────────────────────────────────────────────────────────────────────────┘

   [ AWS EC2 (Mumbai ap-south-1) ]           [ Neon Serverless PostgreSQL ]
   • Ubuntu 24.04 (t3.small: 2 vCPU, 2GB RAM) • Multi-AZ Serverless Engine
   • 2GB Dedicated SSD Swap File              • Tables: fares (10,368+ records),
   • systemd: aura-scraper.service            │  scrape_runs, route_base_values,
   • Playwright (Python 3.12) Headless Shell │  index_values, scrape_error_logs
   • Port 8080 Health & API Daemon            ▲
                     │                        │
                     │  SSL Upsert            │
                     └────────────────────────┘
                                 ▲
                                 │ Read / Analytics
                                 ▼
                   [ Next.js 15 Web Application ]
                   • Hosted on Cloud (Render / Vercel)
                   • Tailwind CSS, Glassmorphism, Framer Motion
                   • Public Views: Dashboard, Volatility, Heatmaps, Elasticity
                   • Institutional APIs: /api/v1/index, /api/v1/fares
                   • Observability: /health (Direct URL telemetry monitor)
```

### Live Infrastructure Inventory:
* **EC2 Instance:** `ip-172-31-1-137` in AWS Mumbai (`ap-south-1`).
* **Active Daemon:** `aura-scraper.service` running `python main.py --schedule`.
* **Execution Interval:** Hourly at `:00` minutes past the hour (`CronTrigger(minute=0)`).
* **Database:** Neon PostgreSQL (`neondb` on AWS `us-east-2`).
* **Active Fares in Database:** **10,368+ records** live.
* **Telemetry Table:** `scrape_error_logs` (captures rate limits, CAPTCHAs, and timeouts).

---

## 3. Representative Route Basket & DGCA Passenger Weights

As mandated by MoSPI SIH26056, the representative basket mirrors the **Directorate General of Civil Aviation (DGCA)** domestic passenger volume statistics:

| Route Code | Corridor Pair | Direction | Market Category | Advance Windows ($T+N$) |
| :--- | :--- | :---: | :--- | :--- |
| `DEL-BOM` | Delhi ↔ Mumbai | Outbound | #1 National Trunk Corridor | $T+1, T+7, T+15, T+30, T+45$ |
| `BOM-DEL` | Mumbai ↔ Delhi | Return | #1 National Trunk Corridor | $T+1, T+7, T+15, T+30, T+45$ |
| `DEL-BLR` | Delhi ↔ Bengaluru | Outbound | Tech / Metro Corridor | $T+1, T+7, T+15, T+30, T+45$ |
| `BLR-DEL` | Bengaluru ↔ Delhi | Return | Tech / Metro Corridor | $T+1, T+7, T+15, T+30, T+45$ |
| `BOM-BLR` | Mumbai ↔ Bengaluru | Commercial | Inter-Metro Corridor | $T+1, T+7, T+15, T+30, T+45$ |
| `DEL-CCU` | Delhi ↔ Kolkata | Outbound | Eastern Metro Corridor | $T+1, T+7, T+15, T+30, T+45$ |
| `BLR-HYD` | Bengaluru ↔ Hyderabad | Regional | Southern Tech Hub Connector | $T+1, T+7, T+15, T+30, T+45$ |
| `MAA-DEL` | Chennai ↔ Delhi | Trunk | Southern Trunk Corridor | $T+1, T+7, T+15, T+30, T+45$ |
| `DEL-HYD` | Delhi ↔ Hyderabad | Outbound | High-Density Metro Corridor | $T+1, T+7, T+15, T+30, T+45$ |
| `BOM-GOI` | Mumbai ↔ Goa | Leisure | High Dynamic Pricing Volatility | $T+1, T+7, T+15, T+30, T+45$ |

* **Total Tasks per Batch:** 10 routes × 5 advance windows × 3 sources = **150 tasks**.
* **Batch Duration:** **~5.5 to 6.5 minutes**.
* **Duty Cycle:** **~90% idle time** every hour to prevent AWS CPU credit exhaustion and maintain IP reputation.

---

## 4. Key Architectural Decisions & Engineering Solutions

### Decision 1: Calibrated Concurrency = 3
* **Rationale:** Direct scraping from an AWS data center IP against Indian OTAs/airlines carries a risk of Cloudflare/Akamai WAF rate-limiting if too many parallel connections originate simultaneously. Setting concurrency to 3 yields ~26 searches/minute, finishing the batch in ~5 minutes with only **34% RAM usage (~657 MB / 1.9 GB)** and **0 bytes of swap used**.

### Decision 2: Elimination of Hidden Fallbacks & Artificial Delays
* **The Bug:** Direct airline scrapers (`spicejet`, `air_india_express`, `akasa`) had an internal fallback pattern that spawned an extra `EaseMyTripScraper` instance upon failure, multiplying Chromium processes and triggering 60-second timeouts. Furthermore, scrapers were sleeping 15 seconds on initial homepages.
* **The Solution:** We eliminated the 15-second delay (searches navigate immediately in ~1.5s) and removed the nested fallback pattern so direct sites fail cleanly in 1–2 seconds.

### Decision 3: 2GB Dedicated SSD Swap File
* **Problem:** On `t3.small` (2.0 GB RAM), running 3 concurrent headless browsers caused memory spikes near 1.8 GB, triggering Linux Out-Of-Memory (OOM) freezing and SSH drops.
* **Solution:** Provisioned `/swapfile` (2.0 GB) with `swappiness=10`, permanently attached in `/etc/fstab`.

### Decision 4: Self-Healing Circuit Breaker & Telemetry Logging
* **Problem:** SpiceJet began rate-limiting rapid consecutive searches with `"Please try again later"`.
* **Solution:** Implemented `core.captcha_detector` and a 3-strike circuit breaker in `main.py`. Once rate-limited, the scraper skips remaining queries for that source, logs structured metadata into `scrape_error_logs`, and immediately proceeds with the rest of the batch.

### Decision 5: Non-Intrusive Frontend Health Observability
* **Requirement:** Telemetry dashboard needed to inspect system health, database latency, and rate-limit breakdowns without adding buttons or links to the public navigation.
* **Solution:** Created `/health` in Next.js (`web/app/health/page.tsx`) with dark-mode glassmorphism and real-time refresh, accessible **strictly by typing the direct URL**.

### Decision 6: Interleaved Round-Robin Source Scheduling (Domain Jittering)
* **Problem:** Running all routes sequentially on a single platform (e.g. 50 consecutive queries to `spicejet.com`) caused Akamai/Cloudflare WAFs to detect an automated burst from our EC2 IP and trigger rate-limits (`"please try again later"`).
* **Solution:** Refactored `run_batch()` to schedule tasks in an **interleaved round-robin sequence** (`Route 1: EaseMyTrip ➔ Ixigo ➔ SpiceJet`, `Route 2: EaseMyTrip ➔ Ixigo ➔ SpiceJet`). With concurrency = 3, at any single second at most **1 browser** connects to any single website, providing a natural 20–30s breathing room between queries to the same domain. Total batch runtime remains ~5 minutes while WAF rate-limiting drops to near zero.

---

## 5. WOW Factors for MoSPI / SIH Evaluators

1. **Live Indian Cloud Infrastructure, Not Synthetic Data**:
   Evaluators can verify live queries entering Neon PostgreSQL from an active AWS Mumbai instance running 24/7.
2. **Economic Rigor (Fisher Ideal Index $F = \sqrt{L \times P}$)**:
   Aura implements the internationally recognized Fisher Ideal Price Index (geometric mean of Laspeyres and Paasche), satisfying both time-reversal and factor-reversal tests under UN/IMF CPI manual guidelines.
3. **Headline CPI Inflation Translation**:
   Aura converts airfare percentage changes into direct Consumer Price Index basis point impact using MoSPI's exact $0.0042$ weighting coefficient ($\Delta \text{CPI} = \Delta \text{APIx} \times 0.0042$).
4. **Lead-Time Price Elasticity Analysis**:
   Visualizes how dynamic pricing surges exponentially from $T+45$ to $T+1$, proving why single-point manual price collection is obsolete.
5. **Government & Central Bank API**:
   Dedicated endpoints (`/api/v1/index`, `/api/v1/fares`) structured specifically for automated ingestion by RBI monetary policy teams and MoSPI statistical pipelines.
6. **Transparent Data Quality & Telemetry Audit**:
   The `/health` portal tracks data collection yield, WAF blocks, and latency, giving government statisticians full auditability.

---

## 6. Quick Operation Cheatsheet

### EC2 Terminal Commands:
```bash
# Pull latest code and restart background daemon
cd ~/Aura && git pull origin main && sudo systemctl restart aura-scraper

# Check service status
sudo systemctl status aura-scraper

# Follow live scraping logs
tail -f /var/log/aura-scraper.log

# Check RAM and swap usage
free -h && ps aux --sort=-%mem | head -n 10

# Trigger manual batch run in background
curl -X POST http://localhost:8080/scrape
```

### Institutional URLs:
* **Web Portal:** Accessible at your deployed web domain.
* **System Telemetry Dashboard:** `/health` (direct browser URL).
* **Institution Index API:** `/api/v1/index`
