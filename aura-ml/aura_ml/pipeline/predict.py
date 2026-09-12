import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from aura_ml.config import DEFAULT_PREDICTION_HORIZON_HOURS
from aura_ml.db.database import Database
from aura_ml.features.engineer import FeatureEngineer
from aura_ml.models.registry import ModelRegistry

class PricePredictor:
    def __init__(self, db: Optional[Database] = None, registry: Optional[ModelRegistry] = None):
        self.db = db or Database()
        self.registry = registry or ModelRegistry(self.db)

    def predict_and_store(
        self,
        flight_records: Optional[List[Dict[str, Any]]] = None,
        horizon_hours: int = DEFAULT_PREDICTION_HORIZON_HOURS
    ) -> List[Dict[str, Any]]:
        """
        Generate price predictions for flight records and store in predictions table.
        If flight_records is None, predicts for the latest unpredicted flight observations.
        """
        prod_tuple = self.registry.get_production_model()
        if not prod_tuple:
            raise RuntimeError("No production model found in registry. Please run initial training first.")
        
        model, model_info = prod_tuple
        model_version = model_info["version"]

        if flight_records is None:
            # Query recent flight observations
            flight_records = self.db.fetchall(
                """
                SELECT * FROM flight_observations
                ORDER BY scraped_at DESC LIMIT 50
                """
            )

        if not flight_records:
            return []

        predictions_to_insert = []
        now = datetime.now(timezone.utc)
        target_time = now + timedelta(hours=horizon_hours)
        now_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        target_iso = target_time.strftime("%Y-%m-%dT%H:%M:%SZ")

        for record in flight_records:
            feat_dict = FeatureEngineer.extract_features(record, db=self.db)
            vector = FeatureEngineer.to_vector(feat_dict)
            predicted_price = model.predict_one(vector)

            flight_sig = f"{record['flight_number']}_{record['origin']}_{record['destination']}_{record['departure_time']}"
            pred_id = f"pred_{uuid.uuid4().hex[:10]}"

            pred_record = {
                "prediction_id": pred_id,
                "flight_signature": flight_sig,
                "predicted_at": now_iso,
                "target_horizon_hours": horizon_hours,
                "target_time": target_iso,
                "predicted_price": round(predicted_price, 2),
                "model_version": model_version,
                "actual_price": None,
                "error": None,
                "percentage_error": None,
                "evaluated_at": None
            }
            predictions_to_insert.append(pred_record)

        self.db.insert_many("predictions", predictions_to_insert)
        return predictions_to_insert
