import random
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from aura_ml.config import SLIDING_WINDOW_DAYS, RETRAIN_BATCH_THRESHOLD
from aura_ml.db.database import Database
from aura_ml.features.engineer import FeatureEngineer
from aura_ml.models.base import calculate_mae, calculate_rmse, calculate_mape
from aura_ml.models.regressor import AirfarePriceRegressor
from aura_ml.models.registry import ModelRegistry

class ModelRetrainer:
    def __init__(self, db: Optional[Database] = None, registry: Optional[ModelRegistry] = None):
        self.db = db or Database()
        self.registry = registry or ModelRegistry(self.db)

    def retrain_and_evaluate(self, force: bool = False) -> Dict[str, Any]:
        """
        Extract sliding window dataset, train challenger model,
        benchmark against champion on holdout set, and promote if superior.
        """
        # 1. Fetch observations within sliding window
        window_cutoff = (datetime.now(timezone.utc) - timedelta(days=SLIDING_WINDOW_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
        records = self.db.fetchall(
            """
            SELECT * FROM flight_observations
            WHERE scraped_at >= ?
            ORDER BY scraped_at ASC
            """,
            (window_cutoff,)
        )

        # Fallback if window has few records (e.g. initial setup)
        if len(records) < RETRAIN_BATCH_THRESHOLD and not force:
            # Check total records in table
            all_records = self.db.fetchall("SELECT * FROM flight_observations ORDER BY scraped_at ASC")
            if len(all_records) < 10 and not force:
                return {
                    "status": "skipped",
                    "reason": f"Insufficient observations ({len(all_records)} < 10 required for retraining)."
                }
            records = all_records

        if len(records) < 5:
            return {
                "status": "skipped",
                "reason": f"Insufficient observations ({len(records)} < 5)."
            }

        # 2. Extract features and target
        X = []
        y = []
        for r in records:
            f_dict = FeatureEngineer.extract_features(r, db=self.db)
            X.append(FeatureEngineer.to_vector(f_dict))
            y.append(float(r["price"]))

        # 3. Train/Test Split (80/20 deterministic split)
        indices = list(range(len(X)))
        random.seed(42)
        random.shuffle(indices)
        split_idx = max(1, int(len(indices) * 0.8))
        train_idx = indices[:split_idx]
        test_idx = indices[split_idx:] if split_idx < len(indices) else indices

        X_train = [X[i] for i in train_idx]
        y_train = [y[i] for i in train_idx]
        X_test = [X[i] for i in test_idx]
        y_test = [y[i] for i in test_idx]

        # 4. Benchmark Current Production Champion
        prod_tuple = self.registry.get_production_model()
        champion_mae = None
        champion_version = None

        if prod_tuple:
            champion_model, champion_info = prod_tuple
            champion_version = champion_info["version"]
            champ_preds = champion_model.predict(X_test)
            champion_mae = round(calculate_mae(y_test, champ_preds), 2)

        # 5. Train Challenger Model
        challenger = AirfarePriceRegressor(algorithm="gradient_boosting")
        challenger.fit(X_train, y_train, feature_names=FeatureEngineer.FEATURE_NAMES)
        challenger_preds = challenger.predict(X_test)

        chal_mae = round(calculate_mae(y_test, challenger_preds), 2)
        chal_rmse = round(calculate_rmse(y_test, challenger_preds), 2)
        chal_mape = round(calculate_mape(y_test, challenger_preds), 2)

        metrics = {
            "mae": chal_mae,
            "rmse": chal_rmse,
            "mape": chal_mape
        }

        # 6. Evaluation Decision Gate
        promote = False
        decision = ""

        if champion_mae is None:
            # First model becomes production
            promote = True
            decision = "Initial model training: promoted to production champion."
        elif chal_mae < champion_mae:
            promote = True
            decision = f"Challenger outperformed champion (MAE ₹{chal_mae} < ₹{champion_mae}). Promoted to production!"
        else:
            promote = False
            decision = f"Challenger failed to beat champion (MAE ₹{chal_mae} >= ₹{champion_mae}). Champion preserved."

        version_str, artifact_path = self.registry.register_model(
            model=challenger,
            algorithm=challenger.algorithm,
            metrics=metrics,
            sample_count=len(records),
            make_production=promote
        )

        return {
            "status": "success",
            "decision": decision,
            "promoted": promote,
            "candidate_version": version_str,
            "champion_version": version_str if promote else champion_version,
            "champion_mae": champion_mae,
            "challenger_mae": chal_mae,
            "challenger_rmse": chal_rmse,
            "challenger_mape": chal_mape,
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "artifact_path": str(artifact_path)
        }
