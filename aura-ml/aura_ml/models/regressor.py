import json
import math
from pathlib import Path
from typing import List, Dict, Any, Optional

class AirfarePriceRegressor:
    """Regression model for flight price prediction with optional scikit-learn backend."""
    
    def __init__(self, algorithm: str = "gradient_boosting"):
        self.algorithm = algorithm
        self.feature_names = []
        self.weights = []
        self.intercept = 0.0
        self.scaling_means = []
        self.scaling_stds = []
        self.is_fitted = False
        self._sklearn_model = None

    def fit(self, X: List[List[float]], y: List[float], feature_names: Optional[List[str]] = None) -> "AirfarePriceRegressor":
        """Fit regression model on feature matrix X and target y."""
        if not X or not y or len(X) != len(y):
            raise ValueError("X and y must be non-empty and of identical length.")
        
        self.feature_names = feature_names or [f"f_{i}" for i in range(len(X[0]))]
        n_samples = len(X)
        n_features = len(X[0])

        # Try using scikit-learn GradientBoosting or RandomForest if installed
        try:
            from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
            if self.algorithm == "random_forest":
                model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
            else:
                model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=5, random_state=42)
            
            model.fit(X, y)
            self._sklearn_model = model
            self.is_fitted = True
            return self
        except ImportError:
            pass

        # Standard Robust Regularized Regression Implementation
        # 1. Feature normalization (z-score)
        self.scaling_means = [sum(X[i][j] for i in range(n_samples)) / n_samples for j in range(n_features)]
        self.scaling_stds = []
        for j in range(n_features):
            variance = sum((X[i][j] - self.scaling_means[j]) ** 2 for i in range(n_samples)) / n_samples
            self.scaling_stds.append(math.sqrt(variance) if variance > 1e-6 else 1.0)

        # Standardize X
        X_scaled = [
            [(X[i][j] - self.scaling_means[j]) / self.scaling_stds[j] for j in range(n_features)]
            for i in range(n_samples)
        ]

        # Target mean
        y_mean = sum(y) / n_samples
        self.intercept = y_mean
        self.weights = [0.0] * n_features

        # Gradient descent with L2 regularization (Ridge)
        lr = 0.05
        l2_reg = 0.01
        epochs = 250

        for epoch in range(epochs):
            grad_w = [0.0] * n_features
            grad_b = 0.0
            for i in range(n_samples):
                pred = self.intercept + sum(w * x for w, x in zip(self.weights, X_scaled[i]))
                err = pred - y[i]
                grad_b += err
                for j in range(n_features):
                    grad_w[j] += err * X_scaled[i][j]
            
            self.intercept -= (lr / n_samples) * grad_b
            for j in range(n_features):
                self.weights[j] = self.weights[j] * (1.0 - lr * l2_reg) - (lr / n_samples) * grad_w[j]

        self.is_fitted = True
        return self

    def predict_one(self, x: List[float]) -> float:
        """Predict for a single feature vector."""
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted yet.")
        if self._sklearn_model is not None:
            return float(self._sklearn_model.predict([x])[0])
        
        # Scale input
        x_scaled = [
            (val - mean) / std
            for val, mean, std in zip(x, self.scaling_means, self.scaling_stds)
        ]
        pred = self.intercept + sum(w * val for w, val in zip(self.weights, x_scaled))
        return max(1000.0, round(pred, 2))  # Ensure minimum realistic airfare

    def predict(self, X: List[List[float]]) -> List[float]:
        """Predict for a batch of feature vectors."""
        return [self.predict_one(x) for x in X]

    def save(self, filepath: Path) -> None:
        """Serialize model parameters and sklearn model if present."""
        filepath.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "algorithm": self.algorithm,
            "feature_names": self.feature_names,
            "weights": self.weights,
            "intercept": self.intercept,
            "scaling_means": self.scaling_means,
            "scaling_stds": self.scaling_stds,
            "is_fitted": self.is_fitted,
            "has_sklearn_model": self._sklearn_model is not None
        }
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)

        if self._sklearn_model is not None:
            import pickle
            pkl_path = filepath.with_suffix(".pkl")
            with open(pkl_path, "wb") as pf:
                pickle.dump(self._sklearn_model, pf)

    @classmethod
    def load(cls, filepath: Path) -> "AirfarePriceRegressor":
        """Deserialize model from file."""
        with open(filepath, "r") as f:
            data = json.load(f)
        reg = cls(algorithm=data.get("algorithm", "gradient_boosting"))
        reg.feature_names = data.get("feature_names", [])
        reg.weights = data.get("weights", [])
        reg.intercept = data.get("intercept", 0.0)
        reg.scaling_means = data.get("scaling_means", [])
        reg.scaling_stds = data.get("scaling_stds", [])
        reg.is_fitted = data.get("is_fitted", False)

        pkl_path = filepath.with_suffix(".pkl")
        if pkl_path.exists():
            import pickle
            try:
                with open(pkl_path, "rb") as pf:
                    reg._sklearn_model = pickle.load(pf)
            except Exception:
                pass
        return reg
