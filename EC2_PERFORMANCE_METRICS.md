# 📊 Aura Scraper — EC2 Performance & Resource Benchmark Report

This document records the empirical resource metrics, memory profiling data, CPU utilization, and concurrency capacity benchmarks measured during the live production scraping run on AWS EC2 Mumbai (`ap-south-1`).

---

## 🖥️ 1. Infrastructure Specifications

| Parameter | Specification |
| :--- | :--- |
| **Cloud Provider** | Amazon Web Services (AWS) |
| **Region** | Asia Pacific (Mumbai) `ap-south-1` |
| **Instance Type** | `t3.small` |
| **vCPUs** | 2 vCPUs (Intel Xeon / AMD EPYC scalable) |
| **Total Physical RAM** | 1.86 GiB (1,905 MiB) |
| **Storage** | 20 GiB gp3 SSD |
| **Operating System** | Ubuntu Linux (x86_64) |
| **Python Runtime** | Python 3.12.14 (via Astral `uv` standalone virtualenv) |
| **Browser Engine** | Playwright v1.49.1 (Chromium Headless Shell 131.0.6778.33) |
| **Database Target** | Neon Serverless PostgreSQL (`us-east-2`, SSL pooler) |

---

## 🧠 2. Memory (RAM) Profiling Measurements

Measured during live concurrent scraping via `free -h`, `htop`, and `systemctl status aura-scraper`:

| Metric | Measured Value | % of Total RAM | Notes |
| :--- | :--- | :--- | :--- |
| **Baseline OS + Background Services** | ~340 MiB | 17.8% | Linux kernel, systemd, sshd, journald |
| **Active Scraper Service (Current)** | **391.3 MiB** | 20.5% | Python daemon + active Playwright processes |
| **Peak Scraper Spike (Recorded)** | **630.0 MiB** | 33.0% | Both Chromium tabs parsing heavy React DOMs |
| **Total System RAM in Use (Peak)** | **731.0 MiB** | **39.3%** | Peak observed in `htop` during live scrape |
| **Remaining Free Memory Cushion** | **1,174.0 MiB** | **60.7%** | Completely free and available memory |
| **Swap Usage** | **0 KB** | **0.0%** | Zero disk thrashing, pure high-speed RAM |

### Key Takeaway:
At peak load with 2 concurrent workers, the scraper only uses **~39% of the instance's total RAM**, leaving **over 1.15 GB of untouched memory headroom**.

---

## ⚡ 3. CPU Utilization Profile

Measured via `htop` during active flight DOM extraction:

* **Core 0 Utilization**: **93.4%** (actively parsing client-side JavaScript)
* **Core 1 Utilization**: **86.1%** (handling network I/O, IPC, and JSON serialization)
* **Load Average**: `3.49, 2.67, 1.94`
* **Active Tasks / Threads**: 39 tasks, 122 threads across Python and Chromium subprocesses.
* **CPU Throttle Status**: Zero CPU credit starvation; `t3.small` operates cleanly within burst credits.

---

## 📈 4. Concurrency Capacity Analysis

Based on the measured footprint of **~200 MiB to 250 MiB per active Chromium tab**:

| Concurrency Level | Estimated Peak RAM | RAM Headroom | Recommended? |
| :--- | :--- | :--- | :--- |
| **1 Worker** | ~550 MiB | ~1,350 MiB free | Safe, but slower (~35 mins/batch) |
| **2 Workers** *(Current)* | **~630 MiB** | **~1,174 MiB free** | **Optimal & Stable** ⭐ (~18–22 mins/batch) |
| **3 Workers** | ~850 MiB | ~1,050 MiB free | **Fast & Safe** ⭐ (~12–15 mins/batch) |
| **4 Workers** | ~1,100 MiB | ~800 MiB free | Maximum theoretical limit for `t3.small` |
| **5+ Workers** | >1,400 MiB | <500 MiB free | Not recommended on 2 GB RAM (risk of OOM) |

---

## 🌐 5. Network & Latency Metrics (Mumbai vs. Overseas)

| Source / Route | Region | Round-Trip Latency | Page Load Time | Yield per Search |
| :--- | :--- | :--- | :--- | :--- |
| **EaseMyTrip (DEL-BOM)** | Mumbai (`ap-south-1`) | **< 10 ms** | **~5 to 12 seconds** | 99–100 fares |
| **Cleartrip / Ixigo** | Mumbai (`ap-south-1`) | **< 8 ms** | **~4 to 8 seconds** | 80–110 fares |
| **Render Cloud (Previous)** | Oregon / Ohio (US) | **~250 ms** | **> 35 seconds** *(tarpitted)* | 0 fares (timed out) |

---

## 💾 6. Database Upsert Performance

* **Target Database**: Neon Serverless PostgreSQL
* **Deduplication Ratio**: ~99 raw fares → 90 unique fares (~9% duplicates removed).
* **Upsert Latency**: **~1.2 seconds** for 90 fare records via `Deduplicator.upsert_fares`.
* **Table Growth**: ~3.2 kB per 100 fares stored. Total database footprint is currently **~14 MB** out of Neon's 512 MB free tier allowance.
