#!/usr/bin/env python3
"""
Aura ML - Web Standalone Predictor Runner
Allows testing or running model predictions using Python and the serialized scikit-learn model.
Usage:
    python3 web/ml/predict.py --origin DEL --dest BOM --airline IndiGo --days 7 --price 5400
"""

import sys
import json
import pickle
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PKL = BASE_DIR / "artifacts" / "models" / "v2.pkl"
MODEL_JSON = BASE_DIR / "artifacts" / "models" / "v2.json"

AIRLINES_LIST = ["IndiGo", "Air India", "Vistara", "SpiceJet", "Akasa Air", "AirAsia India"]
ROUTES_TOP = [
    "DEL_BOM", "BOM_DEL",
    "CCU_DEL", "DEL_CCU",
    "BLR_DEL", "DEL_BLR",
    "BOM_BLR", "BLR_BOM",
    "HYD_DEL", "DEL_HYD",
    "MAA_DEL", "DEL_MAA",
]

ROUTE_BENCHMARKS = {
    "DEL_BOM": 5500.0,
    "BOM_DEL": 5500.0,
    "CCU_DEL": 5100.0,
    "DEL_CCU": 5100.0,
    "BLR_DEL": 6200.0,
    "DEL_BLR": 6200.0,
    "BOM_BLR": 4200.0,
    "BLR_BOM": 4200.0,
    "HYD_DEL": 4800.0,
    "DEL_HYD": 4800.0,
    "MAA_DEL": 5600.0,
    "DEL_MAA": 5600.0,
}

def predict_single(
    origin: str,
    destination: str,
    airline: str,
    days_to_departure: float,
    current_price: float,
    stops: int = 0,
    duration_minutes: int = 130,
    hour_of_day: int = 10,
    day_of_week: int = 2,
    month: int = 9
) -> float:
    if not MODEL_PKL.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PKL}")

    with open(MODEL_PKL, "rb") as f:
        model = pickle.load(f)

    route_key = f"{origin}_{destination}"
    route_avg = ROUTE_BENCHMARKS.get(route_key, 5000.0)
    price_ratio = current_price / route_avg if route_avg > 0 else 1.0

    airline_idx = float(AIRLINES_LIST.index(airline)) if airline in AIRLINES_LIST else 0.0
    route_idx = float(ROUTES_TOP.index(route_key)) if route_key in ROUTES_TOP else 99.0

    is_weekend = 1.0 if day_of_week in (5, 6) else 0.0
    is_morning = 1.0 if 6 <= hour_of_day <= 10 else 0.0
    is_evening = 1.0 if 17 <= hour_of_day <= 21 else 0.0

    vector = [
        float(days_to_departure),
        float(hour_of_day),
        float(day_of_week),
        is_weekend,
        float(month),
        float(stops),
        float(duration_minutes),
        is_morning,
        is_evening,
        route_avg,
        price_ratio,
        airline_idx,
        route_idx,
        float(current_price)
    ]

    predicted = model.predict([vector])[0]
    return max(1000.0, round(float(predicted), 2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict flight price using Champion v2 ML Model")
    parser.add_argument("--origin", default="DEL")
    parser.add_argument("--dest", default="BOM")
    parser.add_argument("--airline", default="IndiGo")
    parser.add_argument("--days", type=float, default=7.0)
    parser.add_argument("--price", type=float, default=5200.0)
    parser.add_argument("--stops", type=int, default=0)
    parser.add_argument("--duration", type=int, default=130)

    args = parser.parse_args()
    pred = predict_single(
        origin=args.origin,
        destination=args.dest,
        airline=args.airline,
        days_to_departure=args.days,
        current_price=args.price,
        stops=args.stops,
        duration_minutes=args.duration
    )
    result = {
        "status": "success",
        "model_version": "v2",
        "input": vars(args),
        "predicted_price": pred
    }
    print(json.dumps(result, indent=2))
