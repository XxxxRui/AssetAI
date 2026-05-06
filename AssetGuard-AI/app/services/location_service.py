from datetime import datetime, timezone

from sqlalchemy import select

from app.extensions import db
from app.models import Asset, Location
from app.utils.errors import ApiError


def _iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone().replace(microsecond=0).isoformat()


class LocationService:
    @staticmethod
    def _get_location(location_id: int) -> Location:
        loc = Location.query.filter_by(id=location_id).first()
        if loc is None:
            raise ApiError("Location not found", 404, code="location_not_found")
        return loc

    @staticmethod
    def _to_dict(loc: Location) -> dict:
        return {
            "id": loc.id,
            "name": loc.name,
            "createdAt": _iso(loc.created_at),
            "updatedAt": _iso(loc.updated_at),
        }

    @staticmethod
    def list_locations() -> list[dict]:
        stmt = select(Location).order_by(Location.name)
        rows = db.session.scalars(stmt).all()
        return [LocationService._to_dict(loc) for loc in rows]

    @staticmethod
    def create_location(*, name: str) -> dict:
        n = (name or "").strip()
        if not n:
            raise ApiError("name is required", 400, code="validation_error")
        if Location.query.filter_by(name=n).first():
            raise ApiError("Location name already exists", 409, code="location_exists")
        loc = Location(name=n)
        db.session.add(loc)
        db.session.commit()
        return LocationService._to_dict(loc)

    @staticmethod
    def update_location(*, location_id: int, name: str) -> dict:
        loc = LocationService._get_location(location_id)
        n = (name or "").strip()
        if not n:
            raise ApiError("name is required", 400, code="validation_error")
        existing = Location.query.filter(Location.name == n, Location.id != location_id).first()
        if existing is not None:
            raise ApiError("Location name already exists", 409, code="location_exists")
        loc.name = n
        db.session.commit()
        return LocationService._to_dict(loc)

    @staticmethod
    def delete_location(*, location_id: int) -> None:
        loc = LocationService._get_location(location_id)
        asset_count = Asset.query.filter_by(location_id=location_id).count()
        if asset_count > 0:
            raise ApiError(
                f"Cannot delete location with {asset_count} existing asset(s). "
                "Reassign or delete the assets first.",
                409,
                code="location_has_assets",
            )
        db.session.delete(loc)
        db.session.commit()
