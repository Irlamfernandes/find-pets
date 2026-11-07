import os

FIVE_MEGABYTES = 5 * 1024 * 1024


def load_settings():
    return {
        "DATABASE_URL": os.environ.get("DATABASE_URL", "sqlite:///findpets.db"),
        "JWT_SECRET": os.environ.get("JWT_SECRET"),
        "JWT_EXPIRES_HOURS": int(os.environ.get("JWT_EXPIRES_HOURS", "720")),
        "UPLOAD_DIR": os.environ.get("UPLOAD_DIR", "uploads"),
        "MAX_CONTENT_LENGTH": FIVE_MEGABYTES,
        "CORS_ORIGINS": split_list(os.environ.get("CORS_ORIGINS", "")),
    }


def split_list(text):
    return [item.strip() for item in text.split(",") if item.strip()]


MIN_SECRET_LENGTH = 32


def require_secret(settings):
    if len(settings.get("JWT_SECRET") or "") < MIN_SECRET_LENGTH:
        raise RuntimeError("Defina JWT_SECRET com pelo menos 32 caracteres aleatórios.")
