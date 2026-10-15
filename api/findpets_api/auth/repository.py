"""Acesso à tabela users."""

from sqlalchemy import insert, select, update
from sqlalchemy.exc import IntegrityError

from ..clock import now_iso
from ..database import transaction
from ..errors import ApiError
from ..tables import users
from ..validation import new_id


def find_by_email(email):
    query = select(users).where(users.c.email == email, users.c.deleted_at.is_(None))
    with transaction() as connection:
        row = connection.execute(query).mappings().first()
    return dict(row) if row else None


def create_user(email, password_hash):
    now = now_iso()
    user = {
        "id": new_id(),
        "email": email,
        "password_hash": password_hash,
        "created_at": now,
        "updated_at": now,
        "server_updated_at": now,
    }
    try:
        with transaction() as connection:
            connection.execute(insert(users).values(user))
    except IntegrityError as error:
        # O e-mail é UNIQUE: o próprio banco recusa o repetido
        raise ApiError(409, "Este e-mail já está cadastrado. Faça login.") from error
    return user


def update_password(user_id, password_hash):
    now = now_iso()
    changes = {
        "password_hash": password_hash,
        "updated_at": now,
        "server_updated_at": now,
    }
    with transaction() as connection:
        connection.execute(update(users).where(users.c.id == user_id).values(changes))
