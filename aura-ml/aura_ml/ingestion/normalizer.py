import re
from datetime import datetime, timezone
from typing import Optional, Union

# Common Indian Airport Name to IATA mapping
AIRPORT_MAP = {
    "kolkata": "CCU", "ccu": "CCU",
    "delhi": "DEL", "del": "DEL", "new delhi": "DEL",
    "mumbai": "BOM", "bom": "BOM",
    "bangalore": "BLR", "bengaluru": "BLR", "blr": "BLR",
    "hyderabad": "HYD", "hyd": "HYD",
    "chennai": "MAA", "maa": "MAA",
    "ahmedabad": "AMD", "amd": "AMD",
    "pune": "PNQ", "pnq": "PNQ",
    "goa": "GOI", "goi": "GOI", "dabolim": "GOI", "mopa": "GOX",
    "jaipur": "JAI", "jai": "JAI",
    "lucknow": "LKO", "lko": "LKO",
    "kochi": "COK", "cok": "COK", "cochin": "COK",
    "guwahati": "GAU", "gau": "GAU",
    "patna": "PAT", "pat": "PAT",
    "bhubaneswar": "BBI", "bbi": "BBI",
    "chandigarh": "IXC", "ixc": "IXC",
    "srinagar": "SXR", "sxr": "SXR",
    "varanasi": "VNS", "vns": "VNS",
}

class FlightNormalizer:
    @staticmethod
    def clean_price(price_val: Union[str, int, float]) -> Optional[float]:
        """Convert '₹5,200', 'Rs. 5200', '5200.5' to float 5200.0."""
        if price_val is None:
            return None
        if isinstance(price_val, (int, float)):
            return float(price_val)
        
        # Remove currency symbols, commas, whitespace, text
        cleaned = re.sub(r"[^\d.]", "", str(price_val))
        try:
            return float(cleaned) if cleaned else None
        except ValueError:
            return None

    @staticmethod
    def normalize_airport(airport: str) -> str:
        """Standardize airport name/code to 3-letter IATA code."""
        if not airport:
            return "UNKNOWN"
        cleaned = airport.strip().lower()
        return AIRPORT_MAP.get(cleaned, airport.strip().upper())

    @staticmethod
    def normalize_datetime(dt_val: Union[str, datetime]) -> Optional[str]:
        """Standardize timestamps to ISO-8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)."""
        if not dt_val:
            return None
        if isinstance(dt_val, datetime):
            if dt_val.tzinfo is None:
                dt_val = dt_val.replace(tzinfo=timezone.utc)
            return dt_val.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Parse common string patterns
        formats = [
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%d-%m-%Y %H:%M:%S",
            "%d/%m/%Y %H:%M:%S",
            "%Y-%m-%d",
        ]
        s = str(dt_val).strip()
        for fmt in formats:
            try:
                parsed = datetime.strptime(s, fmt)
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                return parsed.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            except ValueError:
                continue
        return None

    @staticmethod
    def normalize_stops(stops_val: Union[str, int]) -> int:
        """Convert 'non-stop', 'direct', '1 stop', '2 stops', 1 -> integer stops."""
        if stops_val is None:
            return 0
        if isinstance(stops_val, int):
            return stops_val
        s = str(stops_val).strip().lower()
        if "non" in s or "direct" in s or "0" in s:
            return 0
        match = re.search(r"\d+", s)
        return int(match.group()) if match else 1

    @staticmethod
    def normalize_duration(dur_val: Union[str, int]) -> int:
        """Convert '2h 15m', '135 mins', '2.5h' -> integer minutes."""
        if dur_val is None:
            return 120  # Default 2 hours if missing
        if isinstance(dur_val, (int, float)):
            return int(dur_val)
        s = str(dur_val).strip().lower()
        hours = 0
        mins = 0
        h_match = re.search(r"(\d+)\s*h", s)
        if h_match:
            hours = int(h_match.group(1))
        m_match = re.search(r"(\d+)\s*m", s)
        if m_match:
            mins = int(m_match.group(1))
        if hours or mins:
            return hours * 60 + mins
        num_match = re.search(r"\d+", s)
        return int(num_match.group()) if num_match else 120
