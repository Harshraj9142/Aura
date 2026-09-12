from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
from .normalizer import FlightNormalizer

class FlightValidator:
    REQUIRED_FIELDS = ["airline", "origin", "destination", "departure_time", "price"]

    @classmethod
    def validate_and_normalize(cls, raw: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Validate a single raw record and return (is_valid, normalized_dict, error_reason)."""
        for field in cls.REQUIRED_FIELDS:
            if field not in raw or raw[field] is None or str(raw[field]).strip() == "":
                return False, None, f"Missing required field: {field}"

        price = FlightNormalizer.clean_price(raw.get("price"))
        if price is None or price <= 0:
            return False, None, f"Invalid price value: {raw.get('price')}"

        dep_time = FlightNormalizer.normalize_datetime(raw.get("departure_time"))
        if not dep_time:
            return False, None, f"Invalid departure_time format: {raw.get('departure_time')}"

        arr_time = FlightNormalizer.normalize_datetime(raw.get("arrival_time"))
        if not arr_time:
            # Approximate arrival as dep_time + duration
            dur_mins = FlightNormalizer.normalize_duration(raw.get("duration_minutes") or raw.get("duration"))
            dep_dt = datetime.strptime(dep_time, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
            arr_time = (dep_dt.timestamp() + dur_mins * 60)
            arr_time = datetime.fromtimestamp(arr_time, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        scraped_at = FlightNormalizer.normalize_datetime(raw.get("scraped_at"))
        if not scraped_at:
            scraped_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        airline = str(raw.get("airline", "IndiGo")).strip()
        flight_number = str(raw.get("flight_number") or raw.get("flightNumber") or f"{airline[:2].upper()}-101").strip()
        origin = FlightNormalizer.normalize_airport(str(raw.get("origin")))
        dest = FlightNormalizer.normalize_airport(str(raw.get("destination")))

        stops = FlightNormalizer.normalize_stops(raw.get("stops", 0))
        duration = FlightNormalizer.normalize_duration(raw.get("duration_minutes") or raw.get("duration"))
        cabin_class = str(raw.get("cabin_class") or raw.get("class") or "Economy").capitalize()
        source = str(raw.get("source") or "scraper")

        normalized = {
            "airline": airline,
            "flight_number": flight_number,
            "origin": origin,
            "destination": dest,
            "departure_time": dep_time,
            "arrival_time": arr_time,
            "duration_minutes": duration,
            "stops": stops,
            "cabin_class": cabin_class,
            "scraped_at": scraped_at,
            "price": price,
            "source": source
        }
        return True, normalized, None

    @classmethod
    def process_batch(cls, raw_list: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        """Process a batch of raw records, returning valid records and statistics."""
        valid_records = []
        dropped_count = 0
        for raw in raw_list:
            is_valid, record, _ = cls.validate_and_normalize(raw)
            if is_valid and record:
                valid_records.append(record)
            else:
                dropped_count += 1
        stats = {
            "total_received": len(raw_list),
            "valid_records": len(valid_records),
            "dropped_records": dropped_count
        }
        return valid_records, stats
