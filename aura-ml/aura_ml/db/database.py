import sqlite3
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from aura_ml.config import DATABASE_URL, BASE_DIR

class Database:
    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or DATABASE_URL

    @property
    def is_sqlite(self) -> bool:
        return self.db_url.startswith("sqlite:///")

    def get_connection(self):
        if self.is_sqlite:
            sqlite_path = self.db_url.replace("sqlite:///", "")
            path_obj = Path(sqlite_path)
            if not path_obj.is_absolute():
                path_obj = BASE_DIR / path_obj
            path_obj.parent.mkdir(parents=True, exist_ok=True)
            conn = sqlite3.connect(str(path_obj))
            conn.row_factory = sqlite3.Row
            return conn
        elif self.db_url.startswith("postgres://") or self.db_url.startswith("postgresql://"):
            try:
                import psycopg2
                conn = psycopg2.connect(self.db_url)
                return conn
            except ImportError:
                raise ImportError("psycopg2 is required for PostgreSQL. Please run: pip install psycopg2-binary")
        else:
            raise ValueError(f"Unsupported database scheme in URL: {self.db_url}")

    def _get_cursor(self, conn):
        if self.is_sqlite:
            return conn.cursor()
        else:
            import psycopg2.extras
            return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    def _format_query(self, query: str) -> str:
        if not self.is_sqlite:
            return query.replace("?", "%s")
        return query

    def init_db(self):
        """Execute schema.sql to initialize database tables and indexes."""
        schema_path = Path(__file__).parent / "schema.sql"
        with open(schema_path, "r") as f:
            ddl = f.read()

        with self.get_connection() as conn:
            cursor = self._get_cursor(conn)
            if self.is_sqlite:
                cursor.executescript(ddl)
            else:
                # PostgreSQL requires SERIAL instead of AUTOINCREMENT
                pg_ddl = ddl.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
                cursor.execute(pg_ddl)
            conn.commit()

    def execute(self, query: str, params: tuple = ()) -> None:
        formatted_query = self._format_query(query)
        with self.get_connection() as conn:
            cursor = self._get_cursor(conn)
            cursor.execute(formatted_query, params)
            conn.commit()

    def fetchall(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        formatted_query = self._format_query(query)
        with self.get_connection() as conn:
            cursor = self._get_cursor(conn)
            cursor.execute(formatted_query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def fetchone(self, query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        formatted_query = self._format_query(query)
        with self.get_connection() as conn:
            cursor = self._get_cursor(conn)
            cursor.execute(formatted_query, params)
            row = cursor.fetchone()
            return dict(row) if row else None

    def insert_many(self, table: str, records: List[Dict[str, Any]]) -> int:
        if not records:
            return 0
        keys = list(records[0].keys())
        columns = ", ".join(keys)
        placeholders = ", ".join(["?" if self.is_sqlite else "%s"] * len(keys))
        sql = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"

        values = [tuple(r.get(k) for k in keys) for r in records]
        with self.get_connection() as conn:
            cursor = self._get_cursor(conn)
            cursor.executemany(sql, values)
            conn.commit()
        return len(records)
