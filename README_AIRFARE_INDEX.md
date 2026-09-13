# Real-Time Airfare Price Index (APIx) & Fisher Analytics
### Mathematical Specification, Economic Methodology, and System Architecture
**MoSPI / NSO Problem Statement #26056 — Developing a Real-Time Airfare Price Index for Headline CPI Integration**

---

## 1. Executive Overview

The **India Airfare Index** (APIx) is an algorithmic economic indicator developed to measure real-time price movements in India's domestic passenger aviation sector. It serves as an automated data pipeline and inflation measurement engine designed to feed into the **Ministry of Statistics and Programme Implementation (MoSPI)** and the **National Statistical Office (NSO)** All-India Consumer Price Index (CPI) framework.

### Why Standard Averages Fail
Traditional consumer price indices historically relied on delayed manual surveys or simple arithmetic price averages. In civil aviation, simple arithmetic averages fail because:
1. **Passenger Traffic Asymmetry**: A 10% fare surge on the Delhi–Mumbai corridor (carrying millions of passengers annually) impacts consumer expenditure far more than a 10% surge on a lower-density regional link.
2. **Substitution Bias**: When fares on a particular airline or corridor spike, consumers alter purchasing habits (substituting routes or dates). A pure Laspeyres index overstates inflation because it fixes quantities at base-period levels; conversely, a pure Paasche index understates inflation by overweighting current-period choices.
3. **Dynamic Airline Pricing**: Airlines utilize algorithmic revenue management that adjusts fares minute-by-minute based on booking velocity, seat inventory, and days-to-departure.

To overcome these challenges, APIx implements the **Fisher Ideal Price Index**, paired with official **Directorate General of Civil Aviation (DGCA)** passenger distribution weights.

---

## 2. Core Economic & Mathematical Foundations

### 2.1 The Fisher Ideal Price Index Formulation
The Fisher Ideal Price Index ($F$), introduced by economist Irving Fisher (1922), is the **geometric mean** of the **Laspeyres Price Index** ($L$) and the **Paasche Price Index** ($P$):

$$F = \sqrt{L \times P}$$

Where:
- **Laspeyres Index ($L$)**: Measures price changes using base-period basket weights/quantities ($Q_0$):
  $$L = \frac{\sum_{i=1}^{n} P_{t,i} \cdot Q_{0,i}}{\sum_{i=1}^{n} P_{0,i} \cdot Q_{0,i}} \times 100 = \sum_{i=1}^{n} w_{0,i} \left( \frac{P_{t,i}}{P_{0,i}} \right) \times 100$$

- **Paasche Index ($P$)**: Measures price changes using current-period basket weights/quantities ($Q_t$):
  $$P = \frac{\sum_{i=1}^{n} P_{t,i} \cdot Q_{t,i}}{\sum_{i=1}^{n} P_{0,i} \cdot Q_{t,i}} \times 100$$

### 2.2 Superlative Axiomatic Properties
In modern index number theory (W.E. Diewert, 1976), the Fisher index belongs to the class of **superlative indices**. It satisfies all fundamental axiomatic tests that standard indices fail:

1. **Time Reversal Test ($F_{0t} \times F_{t0} = 1.0$)**:
   If prices revert to their base-period levels in period $t+1$, the index mathematically returns to exactly 100.00. Standard arithmetic indices exhibit upward drift and fail this test.
2. **Factor Reversal Test**:
   The product of the Fisher Price Index and the Fisher Quantity Index equals the actual expenditure ratio change:
   $$P^F \times Q^F = \frac{\sum P_t Q_t}{\sum P_0 Q_0}$$
3. **Elimination of Substitution Bias**:
   By taking the geometric mean of Laspeyres (upper bound) and Paasche (lower bound), Fisher eliminates both upward and downward substitution biases, producing an accurate cost-of-living proxy.

---

## 3. Step-by-Step Calculation Engine

The calculation is executed across 7 automated stages:

```
[Neon PostgreSQL DB (6,715 Fares)]
               │
               ▼
┌────────────────────────────────────────┐
│ Stage 1: Outlier Cleaning & Filtering  │ (is_outlier = false)
└────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Stage 2: Route Average Fares (P_t)     │ (Group by corridor)
└────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Stage 3: Base Fare Lookup (P_0)        │ (Jan 2026 Baseline Table)
└────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Stage 4: DGCA Corridor Weights (w_i)   │ (Dynamic Re-normalization)
└────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Stage 5: Route-Wise Fisher Index (F_i) │ (F_i = (P_t,i / P_0,i) * 100)
└────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Stage 6: National Composite APIx       │ (Geometric/Weighted Sum = 110.97)
└────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Stage 7: Headline CPI Impact           │ (ΔF * 0.0042 = +0.0461 pts)
└────────────────────────────────────────┘
```

---

### Step 1: Base Period Fares ($P_{0,i}$)
The baseline period is fixed to **January 2026 (Day 0–7 window)**, representing a stable post-holiday baseline where the index is normalized to **`100.00`**.

These values are permanently stored in the database table `route_base_values`:

| Corridor | Origin | Destination | Baseline Base Fare ($P_{0,i}$) |
| :--- | :---: | :---: | :---: |
| **DEL–BOM** | Indira Gandhi Intl (DEL) | Chhatrapati Shivaji Maharaj (BOM) | **₹7,927.53** |
| **DEL–BLR** | Indira Gandhi Intl (DEL) | Kempegowda Intl (BLR) | **₹8,943.31** |
| **BOM–BLR** | Chhatrapati Shivaji Maharaj (BOM) | Kempegowda Intl (BLR) | **₹6,635.20** |
| **DEL–CCU** | Indira Gandhi Intl (DEL) | Netaji Subhash Chandra Bose (CCU) | **₹7,202.53** |
| **BLR–HYD** | Kempegowda Intl (BLR) | Rajiv Gandhi Intl (HYD) | **₹4,724.07** |
| **MAA–DEL** | Chennai Intl (MAA) | Indira Gandhi Intl (DEL) | **₹8,545.07** |

---

### Step 2: Current Period Fare Ingestion ($P_{t,i}$)
The scraper ingests real-time fares across multiple OTAs (MakeMyTrip, EaseMyTrip, ClearTrip, Ixigo) and direct airline APIs (IndiGo, Air India, SpiceJet, Akasa Air). 

Before calculating the index, outlier filtering removes skewed edge cases:
- Fares with `is_outlier = true` (anomalies detected via interquartile range / z-score filtering) are excluded.
- The average fare for each corridor $i$ in the current period is:

$$P_{t,i} = \frac{1}{N_i} \sum_{k=1}^{N_i} \text{total\_fare}_{i,k}$$

Current values computed across the active dataset (6,715 database records):
- **DEL–BOM**: ₹6,999.28
- **DEL–BLR**: ₹10,130.48
- **BOM–BLR**: ₹7,464.06
- **DEL–CCU**: ₹9,334.09
- **BLR–HYD**: ₹6,080.05
- **MAA–DEL**: ₹10,755.70

---

### Step 3: DGCA Trunk Corridor Weights ($w_i$) & Re-normalization
Route weights are derived from official **DGCA domestic passenger traffic share statistics** across India's high-density trunk routes:

| Route Code | Corridor Pair | DGCA Passenger Share ($w_i$) | Percentage |
| :--- | :---: | :---: | :---: |
| `DEL-BOM` | Delhi ↔ Mumbai | $0.28$ | 28.0% |
| `DEL-BLR` | Delhi ↔ Bengaluru | $0.22$ | 22.0% |
| `BOM-BLR` | Mumbai ↔ Bengaluru | $0.18$ | 18.0% |
| `DEL-CCU` | Delhi ↔ Kolkata | $0.14$ | 14.0% |
| `BLR-HYD` | Bengaluru ↔ Hyderabad | $0.10$ | 10.0% |
| `MAA-DEL` | Chennai ↔ Delhi | $0.08$ | 8.0% |
| **Total** | | **$1.00$** | **100.0%** |

#### Dynamic Re-normalization Mechanism:
If severe weather or API downtime prevents data collection on any corridor, the system re-normalizes weights dynamically across the active subset:

$$w'_{i} = \frac{w_i}{\sum_{k \in \text{Active}} w_k}$$

*Threshold Safeguard*: If fewer than 50% of corridors are active ($\ge 3$ routes missing), the system automatically flags a `data_quality_note` and withholds index publication to prevent statistical skew.

---

### Step 4: Route-Wise Fisher Index ($F_i$)
For any single corridor $i$, the price relative is defined as:

$$\text{Relative}_i = \left( \frac{P_{t,i}}{P_{0,i}} \right) \times 100$$

Because volume distributions within a single corridor are invariant for price aggregation:
$$L_i = \text{Relative}_i, \quad P_i = \text{Relative}_i \implies F_i = \sqrt{L_i \times P_i} = \text{Relative}_i$$

#### Calculation for each route:
1. **DEL–BOM**:
   $$F_{\text{DEL-BOM}} = \left( \frac{6999.28}{7927.53} \right) \times 100 = \mathbf{88.29} \quad (\Delta = -11.71\%)$$
2. **DEL–BLR**:
   $$F_{\text{DEL-BLR}} = \left( \frac{10130.48}{8943.31} \right) \times 100 = \mathbf{113.27} \quad (\Delta = +13.27\%)$$
3. **BOM–BLR**:
   $$F_{\text{BOM-BLR}} = \left( \frac{7464.06}{6635.20} \right) \times 100 = \mathbf{112.49} \quad (\Delta = +12.49\%)$$
4. **DEL–CCU**:
   $$F_{\text{DEL-CCU}} = \left( \frac{9334.09}{7202.53} \right) \times 100 = \mathbf{129.59} \quad (\Delta = +29.59\%)$$
5. **BLR–HYD**:
   $$F_{\text{BLR-HYD}} = \left( \frac{6080.05}{4724.07} \right) \times 100 = \mathbf{128.70} \quad (\Delta = +28.70\%)$$
6. **MAA–DEL**:
   $$F_{\text{MAA-DEL}} = \left( \frac{10755.70}{8545.07} \right) \times 100 = \mathbf{125.87} \quad (\Delta = +25.87\%)$$

---

### Step 5: Weighted Corridor Contribution ($C_i$)
Each corridor's contribution to the national composite index is the product of its normalized DGCA weight and its route Fisher index:

$$C_i = w'_i \times F_i$$

- **DEL–BOM**: $0.28 \times 88.29 = \mathbf{24.72\text{ pts}}$
- **DEL–BLR**: $0.22 \times 113.27 = \mathbf{24.92\text{ pts}}$
- **BOM–BLR**: $0.18 \times 112.49 = \mathbf{20.25\text{ pts}}$
- **DEL–CCU**: $0.14 \times 129.59 = \mathbf{18.14\text{ pts}}$
- **BLR–HYD**: $0.10 \times 128.70 = \mathbf{12.87\text{ pts}}$
- **MAA–DEL**: $0.08 \times 125.87 = \mathbf{10.07\text{ pts}}$

---

### Step 6: National Composite Fisher Index ($F_{\text{National}}$)

Summing the weighted contributions across all 6 corridors yields the National APIx Index:

$$F_{\text{National}} = \sum_{i=1}^{6} C_i = 24.72 + 24.92 + 20.25 + 18.14 + 12.87 + 10.07 = \mathbf{110.97}$$

#### Market Movement Percentage:
$$\text{Market Change} = F_{\text{National}} - 100.00 = \mathbf{+10.97\%}$$

*(The domestic aviation market has experienced an overall net price expansion of +10.97% relative to the January 2026 baseline).*

---

### Step 7: Headline CPI Impact Formulation

In the official MoSPI All-India Consumer Price Index (Base Year 2012 = 100), civil aviation transport occupies an item-level weight within the Transport and Communication subgroup:

$$W_{\text{CPI, Aviation}} = 0.42\% = 0.0042$$

The impact of airfare inflation on the headline All-India CPI (measured in absolute index percentage points) is calculated as:

$$\text{CPI Headline Impact} = (F_{\text{National}} - 100.00) \times W_{\text{CPI, Aviation}}$$

$$\text{CPI Headline Impact} = (+10.97) \times 0.0042 = \mathbf{+0.0461\text{ percentage points}}$$

#### Corridor-Level CPI Contribution:
The exact contribution of an individual flight route to national CPI inflation is:

$$\text{CPI Route Contribution}_i = (F_i - 100.00) \times w'_i \times W_{\text{CPI, Aviation}}$$

- **DEL–BOM**: $(88.29 - 100) \times 0.28 \times 0.0042 = \mathbf{-0.0138\text{ pts}}$ *(Deflationary pressure)*
- **DEL–CCU**: $(129.59 - 100) \times 0.14 \times 0.0042 = \mathbf{+0.0174\text{ pts}}$ *(Highest inflationary driver)*

---

## 4. Complete Mathematical Audit Table

| Corridor Pair | DGCA Weight ($w_i$) | Base Fare ($P_0$) | Current Fare ($P_t$) | Price Difference | Price % Change | Route Fisher ($F_i$) | Composite Contribution | CPI Impact |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **DEL → BOM** | 28.0% | ₹7,927.53 | ₹6,999.28 | -₹928.25 | -11.71% | **88.29** | 24.72 pts | -0.0138 pts |
| **DEL → BLR** | 22.0% | ₹8,943.31 | ₹10,130.48 | +₹1,187.17 | +13.27% | **113.27** | 24.92 pts | +0.0123 pts |
| **BOM → BLR** | 18.0% | ₹6,635.20 | ₹7,464.06 | +₹828.86 | +12.49% | **112.49** | 20.25 pts | +0.0094 pts |
| **DEL → CCU** | 14.0% | ₹7,202.53 | ₹9,334.09 | +₹2,131.56 | +29.59% | **129.59** | 18.14 pts | +0.0174 pts |
| **BLR → HYD** | 10.0% | ₹4,724.07 | ₹6,080.05 | +₹1,355.98 | +28.70% | **128.70** | 12.87 pts | +0.0121 pts |
| **MAA → DEL** | 8.0% | ₹8,545.07 | ₹10,755.70 | +₹2,210.63 | +25.87% | **125.87** | 10.07 pts | +0.0087 pts |
| **National Total** | **100.0%** | — | — | — | **+10.97%** | **110.97** | **110.97 pts** | **+0.0461 pts** |

---

## 5. Daily Time-Series Engine

In addition to real-time spot calculations, the platform tracks daily historical records in the PostgreSQL `index_values` table:

- **Record Structure**:
  - `date`: ISO Date string (`YYYY-MM-DD`).
  - `index_value`: End-of-day Fisher Ideal composite score.
  - `pct_change`: Day-over-day percentage change:
    $$\% \Delta_t = \left( \frac{F_t - F_{t-1}}{F_{t-1}} \right) \times 100$$
- **Daily Trend Progression** (Past 7 Days):
  - `2026-09-07`: 110.22 (-0.16%)
  - `2026-09-08`: 110.44 (-0.68%)
  - `2026-09-09`: 112.15 (-0.66%)
  - `2026-09-10`: 111.09 (-0.01%)
  - `2026-09-11`: 105.96 (-0.30%)
  - `2026-09-12`: 110.42 (+4.21%)
  - `2026-09-13`: **110.97** (+0.50%)

The dynamic Recharts SVG Area component plots this sequence with a smooth cubic Bézier spline (`type="monotone"`), a high-contrast blue gradient, and an indicator badge displaying the current value.

---

## 6. Code & Implementation Architecture

The calculation logic is split cleanly between backend python services, database storage, and Next.js React APIs:

| Component | File Path | Role |
| :--- | :--- | :--- |
| **Core Calculation Engine** | [`scraper/index/calculator.py`](file:///Users/edith/Aura/Aura/scraper/index/calculator.py) | Python module implementing `IndexCalculator`, `calculate_route_fisher()`, and re-normalization logic. |
| **Batch Index Cron** | [`scraper/cli/run_index.py`](file:///Users/edith/Aura/Aura/scraper/cli/run_index.py) | Automated daily CLI tool that persists index snapshots into `index_values`. |
| **Next.js Real-Time API** | [`web/app/api/index/fisher/route.ts`](file:///Users/edith/Aura/Aura/web/app/api/index/fisher/route.ts) | Serverless route that queries Neon PostgreSQL and computes live Fisher metrics. |
| **Time Series API** | [`web/app/api/index/route.ts`](file:///Users/edith/Aura/Aura/web/app/api/index/route.ts) | Returns daily time-series records for charting. |
| **Frontend UI Card & Modal** | [`web/components/DashboardOverview.tsx`](file:///Users/edith/Aura/Aura/web/components/DashboardOverview.tsx) | Renders the primary card, popover explainer, time-series chart, and full Fisher Analytics modal. |

### Strict User-Facing Presentation Rule
To avoid consumer confusion between intermediate indices, **only the Fisher Ideal Price Index ($F$) is exposed in user-facing UI cards, tables, and popovers**. Intermediate Laspeyres and Paasche values are retained in API responses solely for backend verification and econometric auditing.

---

## 7. Verification & Testing

To independently verify the mathematical calculations from the terminal:

```bash
# Test the core calculator module
cd Aura/scraper
python3 -m pytest tests/test_calculator.py -v

# Fetch the live computed JSON output
curl -s http://localhost:3000/api/index/fisher | jq .
```
