import enum
from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    """RBAC roles."""

    SYSTEM_ADMIN = "System_Admin"
    ASSET_MANAGER = "Asset_Manager"
    CONTRACTORS = "Contractors"


class User(db.Model):
    """Application user: email login, hashed password, role."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.CONTRACTORS)
    is_first_login = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=_utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=_utc_now, onupdate=_utc_now)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
