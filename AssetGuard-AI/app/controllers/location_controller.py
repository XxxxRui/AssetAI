from flask import Blueprint, request

from app.models.user import UserRole
from app.services.location_service import LocationService
from app.utils.auth import get_auth_context, require_roles
from app.utils.errors import ApiError
from app.utils.responses import ok

locations_bp = Blueprint("locations", __name__)


@locations_bp.get("/")
def list_locations():
    """List all shared locations."""
    get_auth_context()
    data = LocationService.list_locations()
    return ok(data)


@locations_bp.post("/")
@require_roles(UserRole.SYSTEM_ADMIN.value, UserRole.ASSET_MANAGER.value)
def create_location():
    """Create a location (admin/manager)."""
    get_auth_context()
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    if not name:
        raise ApiError("name is required", 400, code="validation_error")
    data = LocationService.create_location(name=str(name))
    return ok(data, status_code=201)


@locations_bp.put("/<int:location_id>")
@require_roles(UserRole.SYSTEM_ADMIN.value, UserRole.ASSET_MANAGER.value)
def update_location(location_id: int):
    """Rename a location (admin/manager)."""
    get_auth_context()
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    if not name:
        raise ApiError("name is required", 400, code="validation_error")
    data = LocationService.update_location(location_id=location_id, name=str(name))
    return ok(data)


@locations_bp.delete("/<int:location_id>")
@require_roles(UserRole.SYSTEM_ADMIN.value)
def delete_location(location_id: int):
    """Delete a location (System_Admin only). Fails if assets still reference it."""
    get_auth_context()
    LocationService.delete_location(location_id=location_id)
    return ok({"deleted": True})
