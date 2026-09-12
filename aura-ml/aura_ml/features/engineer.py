import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

AIRLINES_LIST = ["IndiGo", "Air India", "Vistara", "SpiceJet", "Akasa Air", "AirAsia India"]
ROUTES_TOP = [
    "DEL_BOM", "BOM_DEL",
    "CCU_DEL", "DEL_CCU",
    "BLR_DEL", "DEL_BLR",
    "BOM_BLR", "BLR_BOM",
    "HYD_DEL", "DEL_HYD",
    "MAA_DEL", "DEL_MAA",
]

class FeatureEngineer:
    FEATURE_NAMES = [
        "days_to_departure",
        "hour_of_day",
        "day_of_week",
        "is_weekend",
        "month",
        "stops",
        "duration_minutes",
        "is_morning",
        "is_evening",
        "route_avg_price",
        "price_ratio_to_route",
        "airline_idx",
        "route_idx",
        "current_price"
    ]

    @staticmethod
    def parse_iso_dt(dt_str: str) -> datetime:
        """Parse ISO-8601 UTC timestamp."""
        try:
            return datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        except Exception:
            # Fallback for alternative formats
            clean = dt_str.replace("Z", "+00:00")
            return datetime.fromisoformat(clean)

    _ROUTE_AVG_CACHE: Dict[str, float] = {}

    @classmethod
    def get_route_avg_price(cls, origin: str, dest: str, db=None) -> float:
        """Retrieve historical average price for a route from cache or single DB query."""
        key = f"{origin}_{dest}"
        if key in cls._ROUTE_AVG_CACHE:
            return cls._ROUTE_AVG_CACHE[key]

        if db and not cls._ROUTE_AVG_CACHE:
            try:
                rows = db.fetchall(
                    "SELECT origin, destination, AVG(price) as avg_p FROM flight_observations GROUP BY origin, destination"
                )
                for r in rows:
                    k = f"{r['origin']}_{r['destination']}"
                    cls._ROUTE_AVG_CACHE[k] = float(r["avg_p"])
                if key in cls._ROUTE_AVG_CACHE:
                    return cls._ROUTE_AVG_CACHE[key]
            except Exception:
                pass

        return cls._ROUTE_AVG_CACHE.get(key, 5000.0)

    @classmethod
    def extract_features(cls, record: Dict[str, Any], db=None) -> Dict[str, float]:
        """Extract a structured feature dictionary from a single flight record."""
        dep_dt = cls.parse_iso_dt(record["departure_time"])
        scraped_dt = cls.parse_iso_dt(record.get("scraped_at", datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")))
        
        # Days to departure (continuous float)
        delta_sec = (dep_dt - scraped_dt).total_seconds()
        days_to_dep = max(0.0, delta_sec / 86400.0)

        hour = dep_dt.hour
        dow = dep_dt.weekday() # 0 = Monday, 6 = Sunday
        is_wknd = 1.0 if dow in (5, 6) else 0.0
        month = dep_dt.month
        stops = float(record.get("stops", 0))
        duration = float(record.get("duration_minutes", 120))
        curr_price = float(record.get("price", 5000.0))

        # Time of day indicators
        is_morning = 1.0 if 6 <= hour <= 10 else 0.0
        is_evening = 1.0 if 17 <= hour <= 21 else 0.0

        # Route & Airline indices
        airline = str(record.get("airline", "IndiGo"))
        airline_idx = float(AIRLINES_LIST.index(airline)) if airline in AIRLINES_LIST else 0.0

        route_key = f"{record.get('origin', 'CCU')}_{record.get('destination', 'DEL')}"
        route_idx = float(ROUTES_TOP.index(route_key)) if route_key in ROUTES_TOP else 99.0

        route_avg = cls.get_route_avg_price(record.get("origin", "CCU"), record.get("destination", "DEL"), db=db)
        price_ratio = curr_price / route_avg if route_avg > 0 else 1.0

        return {
            "days_to_departure": round(days_to_dep, 2),
            "hour_of_day": float(hour),
            "day_of_week": float(dow),
            "is_weekend": is_wknd,
            "month": float(month),
            "stops": stops,
            "duration_minutes": duration,
            "is_morning": is_morning,
            "is_evening": is_evening,
            "route_avg_price": round(route_avg, 2),
            "price_ratio_to_route": round(price_ratio, 3),
            "airline_idx": airline_idx,
            "route_idx": route_idx,
            "current_price": curr_price
        }

    @classmethod
    def to_vector(cls, feature_dict: Dict[str, float]) -> List[float]:
        """Convert feature dict to an ordered numerical vector."""
        return [feature_dict.get(name, 0.0) for name in cls.FEATURE_NAMES]
