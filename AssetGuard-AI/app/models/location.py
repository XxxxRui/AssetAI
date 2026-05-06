from datetime import datetime, timezone

from app.extensions import db


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Location(db.Model):
    """Global site (e.g. port). Shared across all assets."""

    __tablename__ = "locations"
    __table_args__ = (db.UniqueConstraint("name", name="uq_location_name"),)

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=_utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=_utc_now, onupdate=_utc_now)
