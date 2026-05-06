from flask import Blueprint, request

from app.models.user import UserRole
from app.services.auth_service import AuthService
from app.utils.auth import get_auth_context, require_roles
from app.utils.errors import ApiError
from app.utils.responses import ok

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
def login():
    """Sign in with email/password; returns Bearer token and minimal user info."""
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    if not email or not password:
        raise ApiError("email and password are required", 400, code="validation_error")

    data = AuthService.login(email=email, password=password)
    return ok(data)


@auth_bp.post("/change-password")
def change_password():
    """
    Change the authenticated user's password.

    JSON body: currentPassword, newPassword.
    Any authenticated user may call this endpoint.
    """
    ctx = get_auth_context()
    body = request.get_json(silent=True) or {}

    current_password = body.get("currentPassword") or ""
    new_password = body.get("newPassword") or ""

    if not current_password or not new_password:
        raise ApiError("currentPassword and newPassword are required", 400, code="validation_error")

    AuthService.change_password(
        user_id=ctx.user_id,
        current_password=current_password,
        new_password=new_password,
    )
    return ok({"message": "Password changed successfully"})


@auth_bp.post("/set-initial-password")
def set_initial_password():
    """
    Set a personal password on first login and clear the is_first_login flag.

    No old password required — the caller is already authenticated via token.
    Returns 400 if is_first_login is already False (use /change-password instead).
    """
    ctx = get_auth_context()
    body = request.get_json(silent=True) or {}

    new_password = body.get("newPassword") or ""
    if not new_password:
        raise ApiError("newPassword is required", 400, code="validation_error")

    AuthService.set_initial_password(
        user_id=ctx.user_id,
        new_password=new_password,
    )
    return ok({"message": "Password set successfully. You can now use your new password."})


@auth_bp.post("/users")
@require_roles(UserRole.SYSTEM_ADMIN.value)
def create_user():
    """
    Create a user (System_Admin only).

    JSON body: email, password, role (System_Admin | Asset_Manager | Contractors).
    """
    _ = get_auth_context()
    body = request.get_json(silent=True) or {}

    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    role_str = (body.get("role") or "").strip()

    if not email or not password or not role_str:
        raise ApiError("email, password, and role are required", 400, code="validation_error")

    try:
        role = UserRole(role_str)
    except ValueError as e:
        raise ApiError(
            "Invalid role; allowed: System_Admin, Asset_Manager, Contractors",
            400,
            code="validation_error",
        ) from e

    user = AuthService.create_user(
        email=email,
        password=password,
        role=role,
    )

    return ok(
        {
            "id": user.id,
            "email": user.email,
            "role": user.role.value,
            "isFirstLogin": user.is_first_login,
        },
        status_code=201,
    )


@auth_bp.get("/users")
@require_roles(UserRole.SYSTEM_ADMIN.value)
def list_users():
    """
    List all users (System_Admin only).

    Query parameters: page (default 1), pageSize (default 20).
    """
    _ = get_auth_context()
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 20, type=int)

    users, total = AuthService.list_users(page=page, page_size=page_size)

    pages = (total + page_size - 1) // page_size if page_size > 0 else 1

    return ok(
        {
            "items": [
                {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role.value,
                    "isFirstLogin": user.is_first_login,
                }
                for user in users
            ],
            "page": page,
            "pageSize": page_size,
            "total": total,
            "pages": pages,
        }
    )


@auth_bp.put("/users/<int:user_id>")
@require_roles(UserRole.SYSTEM_ADMIN.value)
def update_user(user_id: int):
    """
    Update a user's email, role, or password (System_Admin only).

    JSON body: email?, role?, password?
    """
    _ = get_auth_context()
    body = request.get_json(silent=True) or {}
    email = body.get("email")
    role_str = body.get("role")
    password = body.get("password")

    if email is None and role_str is None and password is None:
        raise ApiError(
            "At least one of email, role, or password must be provided",
            400,
            code="validation_error",
        )

    user = AuthService.update_user(
        user_id=user_id,
        email=email,
        role=role_str,
        password=password,
    )

    return ok({
        "id": user.id,
        "email": user.email,
        "role": user.role.value,
        "isFirstLogin": user.is_first_login,
    })


@auth_bp.delete("/users/<int:user_id>")
@require_roles(UserRole.SYSTEM_ADMIN.value)
def delete_user(user_id: int):
    """
    Delete a user (System_Admin only). Cannot delete own account.
    """
    ctx = get_auth_context()
    AuthService.delete_user(user_id=user_id, current_user_id=ctx.user_id)
    return ok({"deleted": True})
