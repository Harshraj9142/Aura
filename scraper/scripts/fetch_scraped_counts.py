import json
import sys
from pathlib import Path

# Ensure the parent directory is in sys.path so we can import from db
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func
from db.session import get_session
from db.models import Fare

def main():
    with get_session() as session:
        counts = session.query(
            Fare.source, 
            func.count(Fare.id)
        ).group_by(Fare.source).all()
        
        result = {source: count for source, count in counts}
        print(json.dumps(result, indent=4))

if __name__ == "__main__":
    main()
