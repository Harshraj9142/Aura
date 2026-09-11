# APIx Web Application — Next.js Full-Stack Backend & Dashboard

This repository contains the Next.js 16 (App Router) application for the **Real-Time Airfare Price Index (APIx)** for India.

It functions as both:
1. **API Backend**: Next.js Route Handlers (`app/api/...`) providing RESTful JSON endpoints for external consumption.
2. **Frontend Dashboard**: Server Components and interactive client charts displaying real-time price indices, route heatmaps, and lead-time elasticity.

---

## Shared Database Schema

This application shares a PostgreSQL database with the standalone Python scraper service (`../scraper/`).

### Models (via Prisma Introspection):
- `fares`: Granular scraped flight fare records.
- `scrape_runs`: Scraping batch execution metadata.
- `index_values`: Daily/weekly/monthly aggregated price index time series.

---

## Architectural Principles

1. **Direct Service Layer Access**: Next.js Server Components call service functions in `lib/services/` directly without `fetch()`ing internal `/api` endpoints.
2. **Standard API Envelope**: Route handlers wrap responses with `ok(data, meta)` and `fail(message, code, status)`.
3. **Strict Validation**: All query parameters are validated using Zod schemas (`lib/validators/`).
4. **Caching & Revalidation**: Aggregated time-series calculations are wrapped with Next.js `unstable_cache` with a 1-hour revalidation tag.

---

## API Endpoints

- `GET /api/health` — Pings database connection
- `GET /api/routes` — Distinct tracked city-pairs
- `GET /api/sources` — Tracked airlines and OTAs
- `GET /api/fares` — Paginated and filtered fare records
- `GET /api/fares/[id]` — Single fare record by UUID
- `GET /api/index` — Index time series (daily, weekly, monthly)
- `GET /api/heatmap` — Route × date fare matrix
- `GET /api/elasticity` — Advance purchase lead-time elasticity data

---

## Getting Started

### 1. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
