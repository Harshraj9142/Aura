from typing import List, Dict, Any, Optional
from aura_ml.db.database import Database
from aura_ml.ingestion.validator import FlightValidator
from aura_ml.pipeline.predict import PricePredictor
from aura_ml.pipeline.ground_truth import GroundTruthMatcher
from aura_ml.pipeline.retrain import ModelRetrainer
from aura_ml.models.registry import ModelRegistry

from aura_ml.ingestion.fares_sync import FaresTableSync

class PipelineOrchestrator:
    """Master orchestrator executing the 11-stage airfare continuous-learning pipeline."""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or Database()
        self.registry = ModelRegistry(self.db)
        self.predictor = PricePredictor(self.db, self.registry)
        self.matcher = GroundTruthMatcher(self.db)
        self.retrainer = ModelRetrainer(self.db, self.registry)
        self.fares_sync = FaresTableSync(self.db)

    def initialize_system(self):
        """Initialize database schema and directories."""
        self.db.init_db()

    def sync_fares_table(self, limit: int = 5000) -> Dict[str, Any]:
        """Directly sync flight records from the production fares table."""
        return self.fares_sync.sync(limit=limit)

    def ingest_records(self, raw_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Stage 1 & 2: Ingest, validate and normalize raw scraped flight records,
        Stage 3: Insert into database.
        """
        valid_records, stats = FlightValidator.process_batch(raw_records)
        inserted_count = 0
        if valid_records:
            inserted_count = self.db.insert_many("flight_observations", valid_records)
        return {
            "received": stats["total_received"],
            "normalized": stats["valid_records"],
            "dropped": stats["dropped_records"],
            "inserted": inserted_count
        }

    def generate_predictions(self, flight_records: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """
        Stage 4: Feature engineering,
        Stage 5: ML prediction,
        Stage 6: Store prediction in database.
        """
        return self.predictor.predict_and_store(flight_records=flight_records)

    def process_actual_outcomes(self) -> Dict[str, Any]:
        """
        Stage 7: Actual price arrives,
        Stage 8: Error calculation (MAE, RMSE, MAPE).
        """
        return self.matcher.match_and_calculate_errors()

    def run_retraining_cycle(self, force: bool = False) -> Dict[str, Any]:
        """
        Stage 9: Continuous/Periodic model retraining,
        Stage 10: Model evaluation (Champion vs Challenger),
        Stage 11: Deployment of superior model.
        """
        return self.retrainer.retrain_and_evaluate(force=force)

    def get_system_status(self) -> Dict[str, Any]:
        """Get summary status of database, active champion model, and prediction errors."""
        obs_count = self.db.fetchone("SELECT COUNT(*) as c FROM flight_observations")["c"]
        pred_count = self.db.fetchone("SELECT COUNT(*) as c FROM predictions")["c"]
        eval_count = self.db.fetchone("SELECT COUNT(*) as c FROM predictions WHERE actual_price IS NOT NULL")["c"]
        
        prod_tuple = self.registry.get_production_model()
        active_model = prod_tuple[1]["version"] if prod_tuple else "None (Uninitialized)"
        
        err_row = self.db.fetchone(
            "SELECT AVG(error) as avg_err, AVG(percentage_error) as avg_pct FROM predictions WHERE actual_price IS NOT NULL"
        )

        return {
            "total_observations": obs_count,
            "total_predictions": pred_count,
            "evaluated_predictions": eval_count,
            "active_production_model": active_model,
            "overall_mae": round(err_row["avg_err"], 2) if err_row and err_row["avg_err"] else None,
            "overall_mape": round(err_row["avg_pct"], 2) if err_row and err_row["avg_pct"] else None
        }
