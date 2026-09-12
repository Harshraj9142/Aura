import argparse
import csv
import json
import sys
from pathlib import Path
from aura_ml.pipeline.orchestrator import PipelineOrchestrator

def load_file_records(filepath: str):
    p = Path(filepath)
    if not p.exists():
        print(f"Error: File not found: {filepath}", file=sys.stderr)
        sys.exit(1)
    
    if p.suffix.lower() == ".json":
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else [data]
    elif p.suffix.lower() == ".csv":
        records = []
        with open(p, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append(dict(row))
        return records
    else:
        print("Error: Unsupported file format. Please use .json or .csv", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Aura ML - Continuous-Learning Airfare Prediction Pipeline")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # init-db
    subparsers.add_parser("init-db", help="Initialize database schema and directories")

    # status
    subparsers.add_parser("status", help="Print current status of the ML pipeline")

    # ingest
    ingest_parser = subparsers.add_parser("ingest", help="Ingest and normalize raw scraped flight records")
    ingest_parser.add_argument("--file", required=True, help="Path to JSON or CSV file of scraped records")

    # predict
    predict_parser = subparsers.add_parser("predict", help="Generate future price predictions")
    predict_parser.add_argument("--horizon", type=int, default=24, help="Prediction horizon in hours (default: 24)")

    # match-ground-truth
    subparsers.add_parser("match-ground-truth", help="Match pending predictions with actual prices and compute errors")

    # retrain
    retrain_parser = subparsers.add_parser("retrain", help="Retrain candidate model and benchmark against champion")
    retrain_parser.add_argument("--force", action="store_true", help="Force retraining even if below batch threshold")

    # sync-fares
    sync_parser = subparsers.add_parser("sync-fares", help="Sync scraped flight records from production 'fares' table")
    sync_parser.add_argument("--limit", type=int, default=5000, help="Maximum fares to sync (default: 5000)")

    # rollback
    rollback_parser = subparsers.add_parser("rollback", help="Roll back production model to a prior version")
    rollback_parser.add_argument("--version", required=True, help="Model version to restore (e.g. v1)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    orchestrator = PipelineOrchestrator()

    if args.command == "init-db":
        orchestrator.initialize_system()
        print("✓ Database initialized successfully.")

    elif args.command == "sync-fares":
        res = orchestrator.sync_fares_table(limit=args.limit)
        if res.get("status") == "success":
            print(f"✓ Fares sync complete: Scanned {res['total_fares_scanned']} fares, inserted {res['inserted_observations']} observations.")
        else:
            print(f"Fares sync message: {res}")

    elif args.command == "status":
        status = orchestrator.get_system_status()
        print("\n=== Aura ML System Status ===")
        for k, v in status.items():
            print(f"  {k}: {v}")
        print("=============================\n")

    elif args.command == "ingest":
        records = load_file_records(args.file)
        res = orchestrator.ingest_records(records)
        print(f"✓ Ingestion complete: Received {res['received']}, Normalized & Inserted: {res['inserted']}, Dropped: {res['dropped']}")

    elif args.command == "predict":
        preds = orchestrator.generate_predictions()
        print(f"✓ Generated and logged {len(preds)} predictions to database.")
        if preds:
            print("  Latest prediction sample:")
            print(f"    Flight: {preds[0]['flight_signature']}")
            print(f"    Predicted Price: ₹{preds[0]['predicted_price']}")
            print(f"    Model Version: {preds[0]['model_version']}")

    elif args.command == "match-ground-truth":
        res = orchestrator.process_actual_outcomes()
        print(f"✓ Ground Truth Matching: Matched {res['matched_count']} predictions (Pending: {res['pending_count']})")
        if res["overall_mae"] is not None:
            print(f"  Overall MAE: ₹{res['overall_mae']} | RMSE: ₹{res['overall_rmse']} | MAPE: {res['overall_mape']}%")

    elif args.command == "retrain":
        res = orchestrator.run_retraining_cycle(force=args.force)
        if res.get("status") == "skipped":
            print(f"Retraining skipped: {res['reason']}")
        else:
            print(f"✓ Retraining complete: {res['decision']}")
            print(f"  Candidate: {res['candidate_version']} (MAE: ₹{res['challenger_mae']})")
            if res["champion_mae"] is not None:
                print(f"  Champion Benchmark: MAE ₹{res['champion_mae']}")
            print(f"  Active Champion: {res['champion_version']}")

    elif args.command == "rollback":
        ok = orchestrator.registry.rollback_to_version(args.version)
        if ok:
            print(f"✓ Successfully rolled back production to version {args.version}.")
        else:
            print(f"Error: Version {args.version} not found.", file=sys.stderr)

if __name__ == "__main__":
    main()
