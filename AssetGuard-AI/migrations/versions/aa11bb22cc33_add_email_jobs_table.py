"""add email jobs table

Revision ID: aa11bb22cc33
Revises: f5a6b7c8d9e0
Create Date: 2026-05-07
"""

from alembic import op
import sqlalchemy as sa


revision = "aa11bb22cc33"
down_revision = "f5a6b7c8d9e0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "email_jobs",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("evaluation_id", sa.Integer(), nullable=False),
        sa.Column("recipients", sa.JSON(), nullable=False),
        sa.Column("sent_recipients", sa.JSON(), nullable=False),
        sa.Column("failed_recipients", sa.JSON(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_jobs_evaluation_id"), "email_jobs", ["evaluation_id"], unique=False)
    op.create_index(op.f("ix_email_jobs_status"), "email_jobs", ["status"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_email_jobs_status"), table_name="email_jobs")
    op.drop_index(op.f("ix_email_jobs_evaluation_id"), table_name="email_jobs")
    op.drop_table("email_jobs")
