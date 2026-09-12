#!/usr/bin/env python3
"""
Complete 11-Stage Continuous-Learning Airfare Prediction Demo for Aura ML.
Executes the full feedback loop from scraping simulation to deployment.
"""

import time
import json
from datetime import datetime, timedelta, timezone
from aura_ml.pipeline.orchestrator import PipelineOrchestrator
from aura_ml.features.engineer import FeatureEngineer

def print_banner(step_num: int, title: str):
    print("\n" + "=" * 75)
    print(f"  STAGE {step_num}: {title.upper()}")
    print("=" * 75)

def main():
    print("""
    =====================================================================
          AURA ML: CONTINUOUS-LEARNING AIRFARE PRICE PREDICTION
          Demonstrating Full 11-Stage Real-Time Feedback Loop
    =====================================================================
    """)

    orchestrator = PipelineOrchestrator()
    orchestrator.initialize_system()

    now = datetime.now(timezone.utc)
    base_time_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    # -------------------------------------------------------------
    # STAGE 1: SCRAPING (Simulating live Playwright scraper cycle)
    # -------------------------------------------------------------
    print_banner(1, "Scraping (Live Airline & OTA Observations)")
    print("Collecting live flights across Indian metro routes (CCU->DEL, BOM->DEL, BLR->DEL)...")
    
    # We create raw, messy observations as extracted from websites
    raw_scrapes_day1 = [
        {
            "airline": "IndiGo",
            "flight_number": "6E-205",
            "origin": "Kolkata",
            "destination": "Delhi",
            "departure_time": (now + timedelta(days=8, hours=4)).strftime("%Y-%m-%d %H:%M:%S"),
            "duration": "2h 15m",
            "stops": "non-stop",
            "class": "Economy",
            "scraped_at": base_time_iso,
            "price": "₹5,200"
        },
        {
            "airline": "Air India",
            "flight_number": "AI-401",
            "origin": "Mumbai",
            "destination": "Delhi",
            "departure_time": (now + timedelta(days=5, hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
            "duration": "2h 10m",
            "stops": "0",
            "class": "Economy",
            "scraped_at": base_time_iso,
            "price": "₹6,400"
        },
        {
            "airline": "Vistara",
            "flight_number": "UK-812",
            "origin": "Bengaluru",
            "destination": "Delhi",
            "departure_time": (now + timedelta(days=12, hours=6)).strftime("%Y-%m-%d %H:%M:%S"),
            "duration": "2h 45m",
            "stops": "0",
            "class": "Economy",
            "scraped_at": base_time_iso,
            "price": "₹5,900"
        },
        {
            "airline": "SpiceJet",
            "flight_number": "SG-123",
            "origin": "Kolkata",
            "destination": "Delhi",
            "departure_time": (now + timedelta(days=2, hours=1)).strftime("%Y-%m-%d %H:%M:%S"),
            "duration": "2h 20m",
            "stops": "0",
            "class": "Economy",
            "scraped_at": base_time_iso,
            "price": "₹8,100"  # Higher price due to 2 days left
        }
    ]

    # Generate additional historical training rows for robust initial baseline
    for i in range(1, 30):
        days_left = (i % 25) + 1
        raw_scrapes_day1.append({
            "airline": "IndiGo" if i % 2 == 0 else "Air India",
            "flight_number": f"6E-{100 + i}",
            "origin": "Kolkata" if i % 3 == 0 else "Mumbai",
            "destination": "Delhi",
            "departure_time": (now + timedelta(days=days_left, hours=(i % 12))).strftime("%Y-%m-%d %H:%M:%S"),
            "duration": "2h 15m",
            "stops": "0",
            "class": "Economy",
            "scraped_at": (now - timedelta(days=1, hours=i % 6)).strftime("%Y-%m-%d %H:%M:%S"),
            # Simulating realistic price curve: higher price when days_left is small
            "price": f"₹{int(4500 + (30 - days_left) * 120 + (i % 5) * 80)}"
        })

    print(f"Extracted {len(raw_scrapes_day1)} raw flight observations from scraper.")
    print(f"Sample raw record: {raw_scrapes_day1[0]}")

    # -------------------------------------------------------------
    # STAGE 2: DATA INGESTION (Validation & Normalization)
    # -------------------------------------------------------------
    print_banner(2, "Data Ingestion & Normalization")
    print("Normalizing messy raw values:")
    print("  '₹5,200'  --> Float 5200.00")
    print("  'Kolkata' --> IATA Code 'CCU'")
    print("  'non-stop'--> Integer stops 0")
    print("  '2h 15m'  --> Integer duration 135 minutes")

    ingest_result = orchestrator.ingest_records(raw_scrapes_day1)
    print(f"Validation summary: {ingest_result}")

    # -------------------------------------------------------------
    # STAGE 3: DATABASE (PostgreSQL / SQLite Storage)
    # -------------------------------------------------------------
    print_banner(3, "Database Persistence")
    print(f"Stored {ingest_result['inserted']} clean observations into 'flight_observations' table.")
    print("These accumulated historical records form the ground truth training set.")

    # -------------------------------------------------------------
    # INITIAL MODEL BOOTSTRAP (v1 baseline)
    # -------------------------------------------------------------
    print("\n[Bootstrapping Base Model v1]")
    init_retrain = orchestrator.run_retraining_cycle(force=True)
    print(f"Initial Model Status: {init_retrain['decision']}")
    print(f"Active Production Champion: {init_retrain['champion_version']} (MAE: ₹{init_retrain['challenger_mae']})")

    # -------------------------------------------------------------
    # STAGE 4: FEATURE ENGINEERING
    # -------------------------------------------------------------
    print_banner(4, "Feature Engineering")
    sample_flight = orchestrator.db.fetchone(
        "SELECT * FROM flight_observations WHERE flight_number = '6E-205' ORDER BY id DESC LIMIT 1"
    )
    features = FeatureEngineer.extract_features(sample_flight, db=orchestrator.db)
    print("Extracted mathematical feature vector for IndiGo 6E-205 (CCU -> DEL):")
    for k, v in features.items():
        print(f"  • {k:22}: {v}")

    # -------------------------------------------------------------
    # STAGE 5: ML PREDICTION
    # -------------------------------------------------------------
    print_banner(5, "ML Prediction (Gradient Boosting Regressor)")
    print("Estimating future airfare price 24 hours ahead...")
    predictions = orchestrator.generate_predictions([sample_flight])
    pred = predictions[0]
    print(f"Current Scraped Price : ₹{sample_flight['price']}")
    print(f"Predicted Price (+24h): ₹{pred['predicted_price']}")
    print(f"Model Version Used    : {pred['model_version']}")

    # -------------------------------------------------------------
    # STAGE 6: STORE PREDICTION
    # -------------------------------------------------------------
    print_banner(6, "Store Prediction")
    print(f"Logged prediction to database with ID: {pred['prediction_id']}")
    print(f"Flight Signature: {pred['flight_signature']}")
    print("Awaiting 24-hour scraper revisit to obtain ground truth...")

    # -------------------------------------------------------------
    # STAGE 7: ACTUAL PRICE ARRIVES (Ground Truth)
    # -------------------------------------------------------------
    print_banner(7, "Actual Price Arrives (Next Scraping Cycle)")
    time_24h_later = (now + timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%SZ")
    actual_scraped_price = 5450.0  # Real market price recorded 24h later

    print(f"Scraper visits the same flight 24 hours later at {time_24h_later}.")
    print(f"Actual observed fare on airline website: ₹{actual_scraped_price}")

    # Insert the actual ground truth observation into the database
    orchestrator.ingest_records([{
        "airline": sample_flight["airline"],
        "flight_number": sample_flight["flight_number"],
        "origin": sample_flight["origin"],
        "destination": sample_flight["destination"],
        "departure_time": sample_flight["departure_time"],
        "duration": sample_flight["duration_minutes"],
        "stops": sample_flight["stops"],
        "class": sample_flight["cabin_class"],
        "scraped_at": time_24h_later,
        "price": actual_scraped_price
    }])

    # -------------------------------------------------------------
    # STAGE 8: ERROR CALCULATION
    # -------------------------------------------------------------
    print_banner(8, "Error Calculation (Ground Truth Matching)")
    match_res = orchestrator.process_actual_outcomes()
    print(f"Matched Ground Truth: {match_res['matched_count']} record(s)")
    print(f"Predicted Price : ₹{pred['predicted_price']}")
    print(f"Actual Price    : ₹{actual_scraped_price}")
    error = abs(pred['predicted_price'] - actual_scraped_price)
    mape = (error / actual_scraped_price) * 100.0
    print(f"Absolute Error  : ₹{round(error, 2)}")
    print(f"Percentage Error: {round(mape, 2)}%")

    # -------------------------------------------------------------
    # STAGE 9: CONTINUOUS / PERIODIC MODEL RETRAINING
    # -------------------------------------------------------------
    print_banner(9, "Continuous / Periodic Model Retraining (Sliding Window)")
    print("Accumulating newly validated price points into the sliding window training dataset.")
    print("Training candidate model (Challenger) with updated market data...")
    retrain_res = orchestrator.run_retraining_cycle(force=True)

    # -------------------------------------------------------------
    # STAGE 10: MODEL EVALUATION (Champion vs Challenger Benchmark)
    # -------------------------------------------------------------
    print_banner(10, "Model Evaluation (Quality Gate)")
    print(f"Champion Model ({retrain_res['champion_version'] if not retrain_res['promoted'] else 'v1'}) Benchmark MAE: ₹{retrain_res['champion_mae']}")
    print(f"Challenger Model ({retrain_res['candidate_version']}) Evaluation MAE: ₹{retrain_res['challenger_mae']}")
    print(f"Challenger RMSE: ₹{retrain_res['challenger_rmse']} | MAPE: {retrain_res['challenger_mape']}%")
    print(f"Evaluation Decision: {retrain_res['decision']}")

    # -------------------------------------------------------------
    # STAGE 11: MODEL DEPLOYMENT
    # -------------------------------------------------------------
    print_banner(11, "Model Deployment & Version Registry")
    status = orchestrator.get_system_status()
    print(f"Active Production Model: {status['active_production_model']}")
    print(f"Total Observations in DB: {status['total_observations']}")
    print(f"Total Predictions Tracked: {status['total_predictions']}")
    print(f"Evaluated Error (Overall MAE): ₹{status['overall_mae']}")
    print("Rollback Capability: Any prior model version can be instantly restored via CLI.")

    print("""
    =====================================================================
       DEMO COMPLETE: All 11 stages of the pipeline executed safely!
    =====================================================================
    """)

if __name__ == "__main__":
    main()
