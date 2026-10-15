"""Configurações da API, lidas das variáveis de ambiente (ver .env.example)."""

import os

FIVE_MEGABYTES = 5 * 1024 * 1024


def load_settings():
    return {
        # Trocando só esta URL, a API usa MySQL, Postgres (Supabase) ou SQLite
        "DATABASE_URL": os.environ.get("DATABASE_URL", "sqlite:///findpets.db"),
        "JWT_SECRET": os.environ.get("JWT_SECRET"),
        "JWT_EXPIRES_HOURS": int(os.environ.get("JWT_EXPIRES_HOURS", "720")),
        "UPLOAD_DIR": os.environ.get("UPLOAD_DIR", "uploads"),
        # Tamanho máximo de uma requisição (fotos)
        "MAX_CONTENT_LENGTH": FIVE_MEGABYTES,
        # Sites que podem chamar a API pelo navegador (separados por vírgula).
        # O app de celular não precisa: CORS só vale para navegadores.
        "CORS_ORIGINS": split_list(os.environ.get("CORS_ORIGINS", "")),
    }


def split_list(text):
    return [item.strip() for item in text.split(",") if item.strip()]


# Mínimo recomendado para assinar tokens com HS256
MIN_SECRET_LENGTH = 32


def require_secret(settings):
    if len(settings.get("JWT_SECRET") or "") < MIN_SECRET_LENGTH:
        raise RuntimeError("Defina JWT_SECRET com pelo menos 32 caracteres aleatórios.")
