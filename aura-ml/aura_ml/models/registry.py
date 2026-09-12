import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from aura_ml.config import MODELS_DIR
from aura_ml.db.database import Database
from .regressor import AirfarePriceRegressor

class ModelRegistry:
    def __init__(self, db: Optional[Database] = None):
        self.db = db or Database()

    def get_latest_version(self) -> int:
        """Get the highest integer version number existing in the registry."""
        row = self.db.fetchone("SELECT version FROM model_registry ORDER BY created_at DESC LIMIT 1")
        if not row or not row["version"]:
            return 0
        try:
            return int(row["version"].replace("v", ""))
        except ValueError:
            return 0

    def register_model(
        self,
        model: AirfarePriceRegressor,
        algorithm: str,
        metrics: Dict[str, float],
        sample_count: int,
        make_production: bool = False
    ) -> Tuple[str, Path]:
        """Save a new model, register in DB, and optionally promote to production."""
        new_version_num = self.get_latest_version() + 1
        version_str = f"v{new_version_num}"
        model_id = f"model_{uuid.uuid4().hex[:8]}"

        artifact_path = MODELS_DIR / f"{version_str}.json"
        model.save(artifact_path)

        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        status = "production" if make_production else "candidate"

        if make_production:
            # Archive previous production models
            self.db.execute("UPDATE model_registry SET status = 'archived' WHERE status = 'production'")

        self.db.execute(
            """
            INSERT INTO model_registry (model_id, version, algorithm, metrics_mae, metrics_rmse, metrics_mape, sample_count, status, artifact_path, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                model_id,
                version_str,
                algorithm,
                metrics.get("mae", 0.0),
                metrics.get("rmse", 0.0),
                metrics.get("mape", 0.0),
                sample_count,
                status,
                str(artifact_path),
                now_iso
            )
        )
        return version_str, artifact_path

    def get_production_model(self) -> Optional[Tuple[AirfarePriceRegressor, Dict[str, Any]]]:
        """Load the currently active production champion model."""
        row = self.db.fetchone("SELECT * FROM model_registry WHERE status = 'production' ORDER BY created_at DESC LIMIT 1")
        if not row:
            return None
        artifact_path = Path(row["artifact_path"])
        if not artifact_path.exists():
            return None
        model = AirfarePriceRegressor.load(artifact_path)
        return model, row

    def promote_to_production(self, version: str) -> bool:
        """Promote a specific model version to production and archive the former champion."""
        target = self.db.fetchone("SELECT * FROM model_registry WHERE version = ?", (version,))
        if not target:
            return False
        
        self.db.execute("UPDATE model_registry SET status = 'archived' WHERE status = 'production'")
        self.db.execute("UPDATE model_registry SET status = 'production' WHERE version = ?", (version,))
        return True

    def rollback_to_version(self, target_version: str) -> bool:
        """Roll back production to a prior verified version."""
        return self.promote_to_production(target_version)
