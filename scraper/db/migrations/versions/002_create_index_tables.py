"""Create index_values and route_base_values tables

Revision ID: 002_create_index_tables
Revises: 001_initial
Create Date: 2026-09-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic
revision: str = "002_create_index_tables"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create route_base_values table
    op.create_table(
        "route_base_values",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("route_origin", sa.String(3), nullable=False, comment="IATA code of origin airport"),
        sa.Column("route_destination", sa.String(3), nullable=False, comment="IATA code of destination airport"),
        sa.Column("base_avg_fare", sa.Numeric(10, 2), nullable=False, comment="Base period average fare (INR)"),
        sa.Column("base_period_start", sa.Date(), nullable=False, comment="Base period start date"),
        sa.Column("base_period_end", sa.Date(), nullable=False, comment="Base period end date"),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), comment="Timestamp when base value was calculated"),
        sa.UniqueConstraint("route_origin", "route_destination", name="uq_route_base_values"),
    )

    # Create index_values table (or update existing schema to support requirements)
    # Check if index_values already exists from Prisma db push, otherwise create it
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "index_values" not in tables:
        op.create_table(
            "index_values",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("frequency", sa.String(20), nullable=False, server_default="daily", comment="Frequency: daily, weekly, monthly"),
            sa.Column("period_date", sa.Date(), nullable=False, comment="Start date of period represented"),
            sa.Column("index_score", sa.Numeric(10, 2), nullable=True, comment="Computed APIx index score (base = 100)"),
            sa.Column("routes_included", sa.Integer(), nullable=False, server_default="6", comment="Count of routes with valid data"),
            sa.Column("data_quality_note", sa.Text(), nullable=True, comment="Notes on missing routes or weight re-normalization"),
            sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), comment="Computation timestamp"),
        )
        op.create_index("ix_index_values_freq_period", "index_values", ["frequency", "period_date"], unique=True)
    else:
        # If table exists from earlier scaffold, ensure columns exist
        columns = [c["name"] for c in inspector.get_columns("index_values")]
        if "period_date" not in columns and "date" in columns:
            op.alter_column("index_values", "date", new_column_name="period_date")
        if "index_score" not in columns and "index_value" in columns:
            op.alter_column("index_values", "index_value", new_column_name="index_score")
        if "routes_included" not in columns:
            op.add_column("index_values", sa.Column("routes_included", sa.Integer(), nullable=False, server_default="6"))
        if "data_quality_note" not in columns:
            op.add_column("index_values", sa.Column("data_quality_note", sa.Text(), nullable=True))
        if "computed_at" not in columns and "created_at" in columns:
            op.alter_column("index_values", "created_at", new_column_name="computed_at")


def downgrade() -> None:
    op.drop_table("route_base_values")
    op.drop_table("index_values")
