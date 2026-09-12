-- Flight Observations (Cleaned Historical Scrapes)
CREATE TABLE IF NOT EXISTS flight_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    airline TEXT NOT NULL,
    flight_number TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    stops INTEGER NOT NULL DEFAULT 0,
    cabin_class TEXT NOT NULL DEFAULT 'Economy',
    scraped_at TEXT NOT NULL,
    price REAL NOT NULL,
    source TEXT DEFAULT 'scraper'
);

CREATE INDEX IF NOT EXISTS idx_flight_route ON flight_observations(origin, destination);
CREATE INDEX IF NOT EXISTS idx_flight_dep_time ON flight_observations(departure_time);
CREATE INDEX IF NOT EXISTS idx_flight_scraped ON flight_observations(scraped_at);
CREATE INDEX IF NOT EXISTS idx_flight_signature ON flight_observations(flight_number, departure_time, origin, destination);

-- Logged Predictions
CREATE TABLE IF NOT EXISTS predictions (
    prediction_id TEXT PRIMARY KEY,
    flight_signature TEXT NOT NULL,
    predicted_at TEXT NOT NULL,
    target_horizon_hours INTEGER NOT NULL DEFAULT 24,
    target_time TEXT NOT NULL,
    predicted_price REAL NOT NULL,
    model_version TEXT NOT NULL,
    actual_price REAL,
    error REAL,
    percentage_error REAL,
    evaluated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pred_signature ON predictions(flight_signature);
CREATE INDEX IF NOT EXISTS idx_pred_target ON predictions(target_time);
CREATE INDEX IF NOT EXISTS idx_pred_evaluated ON predictions(evaluated_at);

-- Model Registry & Audit
CREATE TABLE IF NOT EXISTS model_registry (
    model_id TEXT PRIMARY KEY,
    version TEXT UNIQUE NOT NULL,
    algorithm TEXT NOT NULL,
    metrics_mae REAL,
    metrics_rmse REAL,
    metrics_mape REAL,
    sample_count INTEGER,
    status TEXT NOT NULL DEFAULT 'candidate', -- 'production', 'candidate', 'archived'
    artifact_path TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_status ON model_registry(status);
