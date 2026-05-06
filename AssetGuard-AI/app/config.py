import os
from pathlib import Path


class Config:
    """
    Central configuration (environment variables).

    - DATABASE_URL / SQLALCHEMY_DATABASE_URI: DB connection (default SQLite file)
    - SECRET_KEY: token signing secret (override in production)
    - TOKEN_EXPIRES_SECONDS: Bearer token lifetime
    """

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///assetguard.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    TOKEN_EXPIRES_SECONDS = int(os.getenv("TOKEN_EXPIRES_SECONDS", "86400"))
    AI_IMPORT_BASE_URL = os.getenv("AI_IMPORT_BASE_URL", "http://127.0.0.1:5001")
    AI_IMPORT_TIMEOUT_SECONDS = int(os.getenv("AI_IMPORT_TIMEOUT_SECONDS", "60"))
    AI_JSON_UPLOADS_DIR = os.getenv(
        "AI_JSON_UPLOADS_DIR",
        str(Path(__file__).resolve().parents[2] / "gjp-assetguard-extraction-tool" / "uploads"),
    )

    # SMTP settings (defaults point to Mailtrap sandbox for testing)
    SMTP_SUPPRESS_SEND = os.getenv("SMTP_SUPPRESS_SEND", "false").lower() == "true"
    SMTP_HOST = os.getenv("SMTP_HOST", os.getenv("MAIL_SERVER", "sandbox.smtp.mailtrap.io"))
    SMTP_PORT = int(os.getenv("SMTP_PORT", os.getenv("MAIL_PORT", "2525")))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", os.getenv("MAIL_USERNAME", "2096e750101120"))
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", os.getenv("MAIL_PASSWORD", "2811e435f6d0b5"))
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
