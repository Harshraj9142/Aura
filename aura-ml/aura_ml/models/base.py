import math
from typing import List

def calculate_mae(y_true: List[float], y_pred: List[float]) -> float:
    """Mean Absolute Error (in Rupees)."""
    if not y_true or len(y_true) != len(y_pred):
        return 0.0
    return sum(abs(t - p) for t, p in zip(y_true, y_pred)) / len(y_true)

def calculate_rmse(y_true: List[float], y_pred: List[float]) -> float:
    """Root Mean Squared Error (penalizes large outlier errors)."""
    if not y_true or len(y_true) != len(y_pred):
        return 0.0
    mse = sum((t - p) ** 2 for t, p in zip(y_true, y_pred)) / len(y_true)
    return math.sqrt(mse)

def calculate_mape(y_true: List[float], y_pred: List[float]) -> float:
    """Mean Absolute Percentage Error (in percentage, e.g. 3.2%)."""
    if not y_true or len(y_true) != len(y_pred):
        return 0.0
    errors = []
    for t, p in zip(y_true, y_pred):
        if t != 0:
            errors.append(abs((t - p) / t))
    return (sum(errors) / len(errors) * 100.0) if errors else 0.0
