from datetime import datetime, timezone
from typing import Dict, Any, Optional
from aura_ml.db.database import Database
from aura_ml.models.base import calculate_mae, calculate_rmse, calculate_mape

class GroundTruthMatcher:
    def __init__(self, db: Optional[Database] = None):
        self.db = db or Database()

    def match_and_calculate_errors(self) -> Dict[str, Any]:
        """
        Match pending predictions with newly arrived scraped ground-truth prices
        and calculate error metrics (MAE, RMSE, MAPE).
        """
        # Fetch all pending predictions
        pending_preds = self.db.fetchall(
            """
            SELECT * FROM predictions
            WHERE actual_price IS NULL
            """
        )

        if not pending_preds:
            return {
                "matched_count": 0,
                "pending_count": 0,
                "mae": None,
                "rmse": None,
                "mape": None
            }

        matched_count = 0
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        y_true_batch = []
        y_pred_batch = []

        for pred in pending_preds:
            # Parse flight signature: {flight_number}_{origin}_{destination}_{departure_time}
            parts = pred["flight_signature"].split("_", 3)
            if len(parts) != 4:
                continue
            flight_num, origin, dest, dep_time = parts

            # Search for an actual observation scraped after the prediction was made
            # ideally close to target_time
            actual_row = self.db.fetchone(
                """
                SELECT price, scraped_at FROM flight_observations
                WHERE flight_number = ? AND origin = ? AND destination = ? AND departure_time = ?
                  AND scraped_at >= ?
                ORDER BY scraped_at ASC LIMIT 1
                """,
                (flight_num, origin, dest, dep_time, pred["predicted_at"])
            )

            if actual_row:
                actual_price = float(actual_row["price"])
                pred_price = float(pred["predicted_price"])
                error = abs(pred_price - actual_price)
                pct_err = (error / actual_price * 100.0) if actual_price > 0 else 0.0

                self.db.execute(
                    """
                    UPDATE predictions
                    SET actual_price = ?, error = ?, percentage_error = ?, evaluated_at = ?
                    WHERE prediction_id = ?
                    """,
                    (round(actual_price, 2), round(error, 2), round(pct_err, 2), now_iso, pred["prediction_id"])
                )

                matched_count += 1
                y_true_batch.append(actual_price)
                y_pred_batch.append(pred_price)

        # Aggregate metrics on all evaluated predictions to date
        all_evaluated = self.db.fetchall(
            "SELECT actual_price, predicted_price FROM predictions WHERE actual_price IS NOT NULL"
        )
        all_true = [float(r["actual_price"]) for r in all_evaluated]
        all_pred = [float(r["predicted_price"]) for r in all_evaluated]

        return {
            "matched_count": matched_count,
            "pending_count": len(pending_preds) - matched_count,
            "batch_mae": round(calculate_mae(y_true_batch, y_pred_batch), 2) if y_true_batch else None,
            "overall_mae": round(calculate_mae(all_true, all_pred), 2) if all_true else None,
            "overall_rmse": round(calculate_rmse(all_true, all_pred), 2) if all_true else None,
            "overall_mape": round(calculate_mape(all_true, all_pred), 2) if all_true else None,
            "total_evaluated": len(all_evaluated)
        }
