from datetime import datetime, timezone

from app.extensions import db


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Asset(db.Model):
    """Berth / equipment site asset; belongs to a Location (PDF)."""

    __tablename__ = "assets"
    __table_args__ = (
        db.UniqueConstraint("location_id", "name", name="uq_asset_location_name"),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)

    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False, index=True)
    location = db.relationship("Location", backref=db.backref("assets", lazy=True))

    created_at = db.Column(db.DateTime, nullable=False, default=_utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=_utc_now, onupdate=_utc_now)
