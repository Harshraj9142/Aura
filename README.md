<div align="center">

# AURA — Airfare Unified Real-time Analytics

### Real-Time Airfare Price Index for India's Consumer Price Index (CPI)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-aura--jet--three.vercel.app-2ea44f?style=for-the-badge&logo=vercel)](https://aura-jet-three.vercel.app/)
[![SIH 2026](https://img.shields.io/badge/SIH%202026-Submission-FF9933?style=for-the-badge)](#)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.49-2EAD33?style=flat-square&logo=playwright)](https://playwright.dev)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-4169E1?style=flat-square&logo=postgresql)](https://neon.tech)

**Problem Statement ID: SIH26056** — *Developing a Real-Time Airfare Price Index for Headline CPI Integration*
**Submitted to:** Ministry of Statistics & Programme Implementation (MoSPI) / National Statistical Office (NSO)

[Live Dashboard](https://aura-jet-three.vercel.app/) · [API Docs](https://aura-jet-three.vercel.app/api/docs) · [Mathematical Specification](README_AIRFARE_INDEX.md) · [Project Status](PROJECT_STATUS.md)

</div>

---

## 📸 AURA Dashboard

<p align="center">
  <a href="https://aura-jet-three.vercel.app/">
    <img src="https://i.ibb.co/XxmdmkSn/Screenshot-2026-10-03-233826.png" alt="AURA Dashboard — Real-Time Airfare Price Index" width="100%" />
  </a>
</p>

> Live dashboard for economists: route-level fare volatility, Fisher Ideal index, inflation impact and MCP/REST delivery for MoSPI's eSankhyiki portal.

---

## 🚨 The Problem: India's CPI has a blind spot in the sky

India's domestic civil aviation market grows ~15% annually and is the **3rd largest in the world**. Transport spending now accounts for **10.9%** of the Indian household expenditure framework (MoSPI HCES). Yet airfare inflation is measured by **delayed, point-in-time manual surveys** conducted at physical ticket offices.

This creates **structural temporal blindness**:

| What CPI misses | Why it matters |
|---|---|
| **200–400% intra-day surges** | A monthly sample sees one price point on one day |
| **Holiday & festival gouging** | Diwali / year-end peaks are entirely invisible |
| **Lead-time elasticity** | Prices move non-linearly across 7 → 60 day horizons |
| **Substitution bias** | Passengers switch routes/dates exactly when fares spike |

A single monthly observation cannot detect any of this. MoSPI needs a **modernised, high-frequency Airfare Price Index** to augment the CPI.

---

## 💡 The Solution: AURA

**AURA (Airfare Unified Real-time Analytics)** is an automated data-intelligence and price-indexing platform that turns fragmented airfare data into a real-time national intelligence layer.

```
Live Web → Headless Scrapers → Cleaning Pipeline → Fisher Index Engine → Dashboard + REST/MCP APIs
   24/7       11 sources          IQR validation      DGCA-weighted        MoSPI / RBI
```

**Core capabilities**

- **24/7 automated collection** — Playwright headless scrapers hitting **11 major airline & OTA sources** on an hourly schedule.
- **Anti-blocking resilience** — interleaved round-robin source scheduling with domain jitter, calibrated concurrency, 3-strike circuit breakers, and a **Browserbase cloud-browser fallback**.
- **Statistical hygiene** — a custom `FareCleaner` engine applies **Interquartile Range (IQR)** outlier detection to strip invalid promo codes and luxury-cabin anomalies from base fares.
- **Economically correct indices** — **Laspeyres**, **Paasche**, and the superlative **Fisher Ideal Index** (`F = √(L × P)`), dynamically weighted by official **DGCA** domestic passenger traffic shares.
- **Machine-learning nowcasts** — Gradient Boosting models forecast fares at **T+1 → T+45** horizons under a Champion-vs-Challenger evaluation loop.
- **Institutional delivery** — a secure **Next.js dashboard** for economists plus **REST & MCP APIs** for direct integration into **eSankhyiki**.

---

## 🏗️ Architecture

### Scraping & Automation
Deployed on a lightweight **AWS EC2 (t3.small)** production host. A **systemd**-supervised daemon drives **APScheduler** hourly batches, with the runtime sandboxed via **UV (Astral)** for dependency isolation.

| Challenge | Engineering response |
|---|---|
| WAF / bot detection | **Interleaved round-robin** source scheduling with per-domain jitter (Decision 6) |
| IP-level blocking | **Browserbase** cloud-browser fallback for hard blocks |
| Rate limits / node failure | Self-healing **3-strike circuit breaker** that skips the node and logs telemetry instead of crashing (Decision 4) |
| Memory spikes on EC2 | Dedicated **2 GB SSD swap** + local write-ahead queueing so no fare is lost on network outage (Decision 3) |
| Resource leaks | **Triple-layered** process & browser lifecycle cleanup (Decision 7) |
| Silent downtime | Non-intrusive **health observability** surfaced in the dashboard (Decision 5) |

### Data Pipeline & Storage
Raw scraped records (**60,000+ historical fares** held) are validated against strict route schemas using **Pydantic v2** and **Pandas**. Cleaned fares are written to **Neon Serverless PostgreSQL** via **SQLAlchemy 2.0** + **Alembic** migrations — auto-scaling storage that grows with the historical series.

### Index Engine
```
Laspeyres  L = Σ w₀ · (Pₜ / P₀) × 100      (upper bound, base-period weights)
Paasche   P = Σ PₜQₜ / Σ P₀Qₜ × 100        (lower bound, current-period weights)
Fisher    F = √(L × P)                     (superlative — no upward bias)
```
Weights come from official DGCA traffic data, so a 10% surge on Delhi–Mumbai correctly outweighs a 10% surge on a low-density regional link. See [`README_AIRFARE_INDEX.md`](README_AIRFARE_INDEX.md) for the full mathematical treatment and axiomatic proofs.

### Machine Learning (`aura-ml/`)
A continuous-learning Gradient Boosting pipeline generates multi-horizon fare nowcasts, benchmarked with a **Champion-vs-Challenger** harness so only models that beat the incumbent are promoted.

### Frontend & APIs
A **Next.js 16 / React 19** application styled with **Tailwind CSS v4**, visualised with **Recharts** and **D3**, deployed on **Vercel**. Institutional consumers get first-class **REST** endpoints and an **MCP server**.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Scraping | Python 3.11, Playwright 1.49, Browserbase, httpx |
| Validation | Pydantic v2, Pandas 2.2 |
| Database | Neon Serverless PostgreSQL, SQLAlchemy 2.0, Alembic |
| Scheduling | APScheduler, systemd, UV (Astral) |
| Index / Math | Laspeyres · Paasche · Fisher Ideal · IQR outlier detection |
| ML | Gradient Boosting, Champion-vs-Challenger |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Recharts, D3, Framer Motion |
| Auth | NextAuth, role-based access control |
| API | REST + MCP (Scalar API reference) |

---

## 🗂️ Repository Layout

```
├── scraper/            # Playwright scraping engine (airlines/ + otas/ adapters)
│   ├── config/         # sources.yaml · routes.yaml · settings.py
│   ├── core/           # Browser pool, circuit breaker, scheduler
│   ├── pipeline/       # FareCleaner · IQR outlier detection
│   ├── index/          # Laspeyres / Paasche / Fisher index engine
│   ├── db/             # SQLAlchemy models, Neon persistence
│   └── cli.py          # Operator CLI + interactive terminal UI
├── aura-ml/            # Gradient Boosting nowcast models (T+1 → T+45)
├── web/                # Next.js dashboard, REST API and MCP server
├── airline_data/       # Reference datasets (DGCA traffic weights, route basket)
├── scripts/            # Deployment & maintenance automation
└── main.py             # Pipeline entrypoint
```

---

## 🚀 Quick Start

```bash
# 1) Web dashboard
npm install
npm run dev            # http://localhost:3000

# 2) Scraper engine
pip install -r requirements.txt
playwright install chromium
python scraper/cli.py --help
```

Production operations on EC2:

```bash
sudo systemctl start aura-scraper   # start the supervised daemon
sudo systemctl status aura-scraper  # health check
journalctl -u aura-scraper -f       # live scrape logs
```

---

## 💡 Why It Matters

| Stakeholder | Value |
|---|---|
| **MoSPI / NSO** | A digital, auditable, high-frequency Airfare Price Index ready for CPI integration and eSankhyiki publication |
| **RBI Monetary Policy Committee** | Accurate **leading indicators** between official monthly CPI prints, reducing the risk of costly policy errors |
| **Consumers** | Multi-platform comparison that unmasks hidden markups and surge gouging, supporting anti-profiteering audits for **150M+** annual domestic travellers |
| **Environment** | Replaces manual field surveys across 100+ airport offices with a **100% digital** pipeline — eliminating field-survey transport emissions (**SDG 11** & **SDG 13**) |

---

## 💰 Viability

Operating on EC2 + Neon keeps recurring infrastructure cost **under $20/month** — **80%+ cheaper** than licensing proprietary commercial data APIs, while delivering strictly higher frequency and full methodological transparency.

**Security & compliance:** end-to-end **SSL/TLS**, role-based authentication restricting telemetry to verified institutional endpoints, adherence to **UN/IMF CPI guidelines**, and scraping engineered to respect `robots.txt` directives, OTA terms of service and responsible data-ingestion ethics.

---

## 📚 Documentation

- [`README_AIRFARE_INDEX.md`](README_AIRFARE_INDEX.md) — mathematical specification, economic methodology, axiomatic proofs
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — architecture, live deployment status, and all recorded engineering decisions
- [`AWS_EC2_DEPLOYMENT_GUIDE.md`](AWS_EC2_DEPLOYMENT_GUIDE.md) — production deployment runbook
- [`EC2_PERFORMANCE_METRICS.md`](EC2_PERFORMANCE_METRICS.md) — resource benchmarks

---

<div align="center">

**Built for SIH 2026** · AURA turns high-frequency dynamic pricing into actionable intelligence for national economic governance.

**Live at [aura-jet-three.vercel.app](https://aura-jet-three.vercel.app/)**

</div>
