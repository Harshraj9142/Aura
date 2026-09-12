import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env if present
env_file = BASE_DIR / ".env"
if env_file.exists():
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip("\"'")
            if key not in os.environ:
                os.environ[key] = val

DATA_DIR = BASE_DIR / os.getenv("DATA_DIR", "data")
ARTIFACTS_DIR = BASE_DIR / os.getenv("ARTIFACTS_DIR", "artifacts")
MODELS_DIR = ARTIFACTS_DIR / "models"

# Ensure runtime directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/aura_ml.db")

# ML & Continuous Learning Configs
DEFAULT_PREDICTION_HORIZON_HOURS = int(os.getenv("PREDICTION_HORIZON_HOURS", "24"))
RETRAIN_BATCH_THRESHOLD = int(os.getenv("RETRAIN_BATCH_THRESHOLD", "100"))
SLIDING_WINDOW_DAYS = int(os.getenv("SLIDING_WINDOW_DAYS", "60"))
