# Aura ML: Continuous-Learning Airfare Price Prediction Pipeline

An enterprise-grade, continuous-learning machine learning pipeline built for Indian domestic airfares. The system continuously ingests flight pricing observations from airline and OTA scrapers, generates multi-horizon price forecasts, logs predictions, verifies ground truth when flights are re-scraped, measures error metrics (MAE, RMSE, MAPE), and safely updates production models via a sliding-window Champion-vs-Challenger evaluation gate.

---

## The 11-Stage Pipeline

```
[ 1. Scraping ] ──► [ 2. Data Ingestion ] ──► [ 3. Database (PostgreSQL / SQLite) ]
                                                            │
                                                            ▼
                                                [ 4. Feature Engineering ]
                                                            │
                                                            ▼
[ 6. Store Prediction ] ◄────────────────────── [ 5. ML Prediction ]
         │
         ▼ (Wait 24h for scraper revisit)
[ 7. Actual Price Arrives ]
         │
         ▼
[ 8. Error Calculation ] (MAE, RMSE, MAPE)
         │
         ▼
[ 9. Periodic Model Retraining ] (Sliding Window: past 60 days)
         │
         ▼
[ 10. Model Evaluation ] (Challenger vs Champion Benchmark)
         │ (Promote if Challenger MAE < Champion MAE)
         ▼
[ 11. Model Deployment ] (Version Registry with Zero-Downtime Rollback)
```

---

## Project Structure

```
aura-ml/
├── aura_ml/
│   ├── config.py              # Central environment, paths & tuning constants
│   ├── cli.py                 # Unified Command Line Interface
│   ├── db/
│   │   ├── schema.sql         # Dual SQLite & PostgreSQL DDL
│   │   └── database.py        # Connection & transactional queries
│   ├── ingestion/
│   │   ├── normalizer.py      # Cleans prices ("₹5,200" -> 5200.0), airport IATA mapping
│   │   └── validator.py       # Batch validation & schema enforcement
│   ├── features/
│   │   └── engineer.py        # days_to_departure, time buckets, route averages, momentum
│   ├── models/
│   │   ├── base.py            # Error metrics (MAE, RMSE, MAPE)
│   │   ├── regressor.py       # Gradient boosting regressor with regularized fallback
│   │   └── registry.py        # Model artifact registry (v1, v2...) & champion management
│   └── pipeline/
│       ├── predict.py         # Feature extraction, inference, & prediction logging
│       ├── ground_truth.py    # Matches actual prices with prior predictions & calculates errors
│       ├── retrain.py         # Sliding-window retraining & champion vs challenger gate
│       └── orchestrator.py    # Master coordinator linking all 11 stages
├── run_demo.py                # 1-command live end-to-end demo of all 11 stages
├── requirements.txt           # Project dependencies
└── README.md                  # System documentation
```

---

## Quickstart

### 1. Run the Full 11-Stage Live Demo
Run the complete demonstration showcasing all 11 stages executing sequentially:
```bash
python3 run_demo.py
```

### 2. Using the CLI

#### Initialize Database
```bash
python3 -m aura_ml.cli init-db
```

#### Ingest Your Scraped Data (JSON or CSV)
Drop your scraped output file and ingest it:
```bash
python3 -m aura_ml.cli ingest --file path/to/scraped_flights.json
```
*Supports raw price strings (e.g. `₹5,200`), city names (`Kolkata`, `Delhi`), and flexible timestamp formats.*

#### Generate Predictions
Generate 24-hour future price forecasts for upcoming flights:
```bash
python3 -m aura_ml.cli predict --horizon 24
```

#### Match Ground Truth & Compute Error Metrics
When newer scrapes arrive, match them against past predictions:
```bash
python3 -m aura_ml.cli match-ground-truth
```

#### Trigger Retraining (Sliding Window & Champion Gate)
```bash
python3 -m aura_ml.cli retrain --force
```

#### Check System Status
```bash
python3 -m aura_ml.cli status
```

#### Rollback Production Model
If needed, instantly restore any prior version:
```bash
python3 -m aura_ml.cli rollback --version v1
```

---

## How to Ingest Your Real Scraped Data Later

Your scraped JSON file can look like this:
```json
[
  {
    "airline": "IndiGo",
    "flight_number": "6E-205",
    "origin": "Kolkata",
    "destination": "Delhi",
    "departure_time": "2026-09-20 18:30:00",
    "duration": "2h 15m",
    "stops": "non-stop",
    "class": "Economy",
    "scraped_at": "2026-09-12 10:00:00",
    "price": "₹5,200"
  }
]
```
Simply run:
```bash
python3 -m aura_ml.cli ingest --file your_data.json
```
The normalizer will automatically clean currency symbols, map airport names to standardized IATA codes (`CCU`, `DEL`), and format timestamps to ISO-8601 UTC.

---

## 30-Second Explanation for Judges

> *"Our platform combines continuous data collection with an automated, safe machine learning feedback loop.*
> *Playwright scrapers continuously capture live airfare across India, ingest and clean the data into our database, and engineer features like booking windows and price velocity.*
> *Our gradient boosting regression model predicts future prices, and every prediction is logged. When our scraper observes the actual flight price 24 hours later, the system automatically measures prediction error.*
> *Rather than naive single-record updates, our system retrains periodically using a sliding window of recent data, benchmarks the new candidate model against the current production model, and automatically promotes it only if its accuracy improves. This guarantees our predictions adapt to real-world airline pricing dynamics with zero downtime and full rollback safety."*
