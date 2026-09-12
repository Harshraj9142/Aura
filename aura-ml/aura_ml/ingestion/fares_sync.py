from datetime import datetime, time, timezone
from typing import Dict, Any, List
from aura_ml.db.database import Database
from aura_ml.ingestion.normalizer import FlightNormalizer

AIRLINE_PREFIXES = {
    "6E": "IndiGo",
    "AI": "Air India",
    "UK": "Vistara",
    "SG": "SpiceJet",
    "QP": "Akasa Air",
    "IX": "Air India Express",
    "I5": "AirAsia India",
    "S9": "Star Air",
    "9I": "Alliance Air"
}

class FaresTableSync:
    """Synchronizes scraped flight data from production 'fares' table into 'flight_observations'."""

    def __init__(self, db: Database):
        self.db = db

    def sync(self, limit: int = 5000) -> Dict[str, Any]:
        # Check if fares table exists
        check = self.db.fetchone(
            """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'fares';
            """
        )
        if not check:
            return {"status": "error", "message": "Table 'fares' does not exist in the database."}

        # Fetch clean fares from the scraper
        raw_fares = self.db.fetchall(
            """
            SELECT * FROM fares
            WHERE is_outlier = false AND total_fare IS NOT NULL AND total_fare > 0
            ORDER BY scraped_at DESC
            LIMIT ?
            """,
            (limit,)
        )

        if not raw_fares:
            return {"status": "no_data", "count": 0}

        records_to_insert = []
        for row in raw_fares:
            flight_num = str(row.get("flight_number") or "AI-101").strip()
            carrier = str(row.get("carrier") or "").strip()

            # Infer carrier from flight number if carrier is an OTA name or generic
            prefix = flight_num.split("-")[0].strip().upper() if "-" in flight_num else flight_num[:2].upper()
            if carrier in ("MakeMyTrip", "EaseMyTrip", "Unknown Airline", "Enjoy Free Meals", ""):
                carrier = AIRLINE_PREFIXES.get(prefix, carrier or "IndiGo")

            travel_date = row.get("travel_date")
            if isinstance(travel_date, str):
                travel_date_obj = datetime.strptime(travel_date, "%Y-%m-%d").date()
            else:
                travel_date_obj = travel_date

            dep_dt = datetime.combine(travel_date_obj, time(12, 0)).replace(tzinfo=timezone.utc)
            dep_iso = dep_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            scraped_dt = row.get("scraped_at")
            if isinstance(scraped_dt, datetime):
                scraped_iso = scraped_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            else:
                scraped_iso = str(scraped_dt)

            price = float(row.get("total_fare"))
            origin = FlightNormalizer.normalize_airport(str(row.get("route_origin", "DEL")))
            dest = FlightNormalizer.normalize_airport(str(row.get("route_destination", "BOM")))

            records_to_insert.append({
                "airline": carrier,
                "flight_number": flight_num,
                "origin": origin,
                "destination": dest,
                "departure_time": dep_iso,
                "arrival_time": dep_iso,
                "duration_minutes": 130,
                "stops": 0,
                "cabin_class": str(row.get("fare_class") or "Economy").capitalize(),
                "scraped_at": scraped_iso,
                "price": price,
                "source": str(row.get("source") or "scraper")
            })

        inserted = self.db.insert_many("flight_observations", records_to_insert)
        return {
            "status": "success",
            "total_fares_scanned": len(raw_fares),
            "inserted_observations": inserted
        }
