from datetime import datetime, timezone

from app.extensions import db


class EmailJob(db.Model):
    __tablename__ = "email_jobs"

    id = db.Column(db.String(64), primary_key=True)
    status = db.Column(db.String(32), nullable=False, default="processing", index=True)
    evaluation_id = db.Column(db.Integer, nullable=False, index=True)
    recipients = db.Column(db.JSON, nullable=False, default=list)
    sent_recipients = db.Column(db.JSON, nullable=False, default=list)
    failed_recipients = db.Column(db.JSON, nullable=False, default=list)
    error = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

