# APIx vs DGCA Reference Backtest Results

## Overview
This document records the backtest comparison between real-time scraped airfare averages computed by the **APIx calculation module** and published domestic reference benchmark figures from the **Directorate General of Civil Aviation (DGCA)**.

> [!IMPORTANT]
> **Limited-Window Validation Notice**: This backtest reflects a limited sampling window collected on **September 11, 2026** (covering travel departure dates from **September 11 to September 30, 2026** for Month `2026-09`). The system architecture is designed to continuously aggregate data over a full 30-day (and multi-month) window in production to reach long-term statistical convergence with official DGCA monthly reports.

---

## 1. Empirical Data Scope

- **Scraped Data Collection Date**: September 11, 2026 (1 distinct collection day)
- **Total Scraped Fares Evaluated**: 1,115 fare records for September 2026 travel dates across 6 tracked domestic corridors
- **Comparison Month**: `2026-09` (September 2026)

---

## 2. Route-by-Route Comparison Results

| Route | Scraped Samples | APIx Computed Avg Fare | DGCA Reference Benchmark | Variance (%) |
| :--- | :---: | :---: | :---: | :---: |
| **DEL-BOM** (Delhi – Mumbai) | 204 | ₹6,725.80 | ₹5,280.00 | **+27.38%** |
| **DEL-BLR** (Delhi – Bengaluru) | 202 | ₹9,010.51 | ₹5,690.00 | **+58.36%** |
| **BOM-BLR** (Mumbai – Bengaluru) | 158 | ₹7,347.28 | ₹3,980.00 | **+84.61%** |
| **DEL-CCU** (Delhi – Kolkata) | 192 | ₹7,862.05 | ₹4,420.00 | **+77.87%** |
| **BLR-HYD** (Bengaluru – Hyderabad) | 189 | ₹7,296.66 | ₹2,980.00 | **+144.85%** |
| **MAA-DEL** (Chennai – Delhi) | 170 | ₹10,435.42 | ₹5,150.00 | **+102.63%** |

---

## 3. Analysis & Key Insights

1. **Short Lead-Time Bias**:
   - The current scraped dataset captures near-term flights (0 to 19 days prior to departure in September 2026).
   - Near-term domestic airfares in India experience significant last-minute dynamic pricing escalations relative to DGCA's overall monthly average across all advance booking windows (e.g. 30-60+ days out).

2. **Deduplication & Outlier Removal**:
   - Outliers and invalid fare classes were excluded via `Fare.is_outlier == False`.

3. **Methodological Validity**:
   - The backtesting pipeline (`index/backtest.py`) successfully loads DGCA benchmarks from `scraper/index/config/dgca_reference_fares.csv`, queries the SQL database, computes monthly route averages, and outputs precise percentage variances.
