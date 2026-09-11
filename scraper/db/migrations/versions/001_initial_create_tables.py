"""Initial migration — create fares and scrape_runs tables

Revision ID: 001_initial
Revises: None
Create Date: 2026-09-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

# revision identifiers, used by Alembic
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -----------------------------------------------------------------------
    # Create source_type_enum and scrape_run_status_enum
    # -----------------------------------------------------------------------
    source_type_enum = sa.Enum("airline", "ota", name="source_type_enum")
    source_type_enum.create(op.get_bind(), checkfirst=True)

    scrape_run_status_enum = sa.Enum("running", "completed", "failed", name="scrape_run_status_enum")
    scrape_run_status_enum.create(op.get_bind(), checkfirst=True)

    # -----------------------------------------------------------------------
    # Create fares table
    # -----------------------------------------------------------------------
    op.create_table(
        "fares",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("route_origin", sa.String(3), nullable=False, comment="IATA code of origin airport"),
        sa.Column("route_destination", sa.String(3), nullable=False, comment="IATA code of destination airport"),
        sa.Column("travel_date", sa.Date(), nullable=False, comment="Date of travel"),
        sa.Column("advance_purchase_days", sa.Integer(), nullable=False, comment="Days between scrape and travel"),
        sa.Column("source", sa.String(50), nullable=False, comment="Source name (e.g. indigo, makemytrip)"),
        sa.Column(
            "source_type",
            sa.Enum("airline", "ota", name="source_type_enum", create_type=False),
            nullable=False,
            comment="airline or ota",
        ),
        sa.Column("carrier", sa.String(50), nullable=True, comment="Operating carrier"),
        sa.Column("flight_number", sa.String(20), nullable=True, comment="Flight number"),
        sa.Column("fare_class", sa.String(50), nullable=True, comment="Fare class/cabin"),
        sa.Column("base_fare", sa.Numeric(10, 2), nullable=True, comment="Base fare (INR)"),
        sa.Column("taxes_and_fees", sa.Numeric(10, 2), nullable=True, comment="Taxes and fees (INR)"),
        sa.Column("total_fare", sa.Numeric(10, 2), nullable=False, comment="Total fare (INR)"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR", comment="Currency code"),
        sa.Column("scraped_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_outlier", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("validation_warnings", JSON, nullable=True),
    )

    # Indexes for fares
    op.create_index(
        "ix_fares_route_source_date",
        "fares",
        ["route_origin", "route_destination", "source", "travel_date"],
    )
    op.create_index("ix_fares_scraped_at", "fares", ["scraped_at"])
    op.create_index(
        "ix_fares_dedup",
        "fares",
        ["route_origin", "route_destination", "source", "travel_date", "advance_purchase_days", "flight_number"],
    )

    # -----------------------------------------------------------------------
    # Create scrape_runs table
    # -----------------------------------------------------------------------
    op.create_table(
        "scrape_runs",
        sa.Column("run_id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_attempted", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_success", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_failed", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_blocked", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "status",
            sa.Enum("running", "completed", "failed", name="scrape_run_status_enum", create_type=False),
            nullable=False,
            server_default="running",
        ),
        sa.Column("summary", JSON, nullable=True),
    )

    # Indexes for scrape_runs
    op.create_index("ix_scrape_runs_started_at", "scrape_runs", ["started_at"])


def downgrade() -> None:
    op.drop_table("scrape_runs")
    op.drop_table("fares")

    # Drop enums
    sa.Enum(name="scrape_run_status_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="source_type_enum").drop(op.get_bind(), checkfirst=True)
