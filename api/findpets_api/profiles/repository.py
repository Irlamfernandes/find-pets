"""Acesso à tabela profiles (um perfil por conta)."""

from sqlalchemy import select

from ..clock import now_iso
from ..database import insert_or_update, transaction
from ..tables import profiles


# Perfil ativo da conta, ou None
def find_by_user(user_id):
    query = select(profiles).where(
        profiles.c.user_id == user_id, profiles.c.deleted_at.is_(None)
    )
    with transaction() as connection:
        row = connection.execute(query).mappings().first()
    return dict(row) if row else None


# Cria ou atualiza o perfil da conta
def save(user_id, profile):
    now = now_iso()
    row = {
        "user_id": user_id,
        **profile,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
        "server_updated_at": now,
    }
    with transaction() as connection:
        insert_or_update(connection, profiles, "user_id", row)
    return find_by_user(user_id)
