"""
APIx Scraper — Database Session Management

Provides engine creation, session factory, and context managers for
database session lifecycle. All database access should go through
the helpers in this module.
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from loguru import logger
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from config.settings import settings
from db.models import Base

# ---------------------------------------------------------------------------
# Engine and session factory
# ---------------------------------------------------------------------------

# Create the SQLAlchemy engine from DATABASE_URL
engine = create_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Check connections are alive before using them
    echo=False,  # Set True for SQL debug logging
)

# Session factory — creates new sessions bound to the engine
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ---------------------------------------------------------------------------
# Session context managers
# ---------------------------------------------------------------------------
@contextmanager
def get_session() -> Generator[Session, None, None]:
    """
    Provide a transactional scope around a series of operations.

    Usage:
        with get_session() as session:
            session.add(fare)
            session.commit()

    Automatically rolls back on exception and always closes the session.
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        logger.exception("Database session error — rolled back")
        raise
    finally:
        session.close()


def get_raw_session() -> Session:
    """
    Return a raw session (caller is responsible for commit/rollback/close).

    Prefer get_session() context manager for most use cases.
    """
    return SessionLocal()


# ---------------------------------------------------------------------------
# Table creation helper (for development/testing — use Alembic in production)
# ---------------------------------------------------------------------------
def create_all_tables() -> None:
    """Create all tables defined in ORM models. Use only for dev/testing."""
    logger.info("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


def drop_all_tables() -> None:
    """Drop all tables. USE WITH CAUTION — development only."""
    logger.warning("Dropping all database tables!")
    Base.metadata.drop_all(bind=engine)
    logger.info("All database tables dropped")
