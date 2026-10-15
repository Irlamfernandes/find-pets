"""Tabelas do banco. As mesmas do app (SQLite), mais a de usuários.

Escritas com o SQLAlchemy, viram o CREATE TABLE certo para MySQL,
Postgres (Supabase) ou SQLite.
"""

from sqlalchemy import (
    Column,
    Float,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
)

metadata = MetaData()


def control_columns():
    """Colunas presentes em todas as tabelas.

    - created_at / updated_at: quando foi criado e alterado (no celular);
    - deleted_at: exclusão lógica, nada é apagado de verdade;
    - server_updated_at: quando o servidor gravou; a sincronização busca
      "o que mudou desde" esta data, que não depende do relógio do celular.
    """
    return [
        Column("created_at", String(30), nullable=False),
        Column("updated_at", String(30), nullable=False),
        Column("deleted_at", String(30)),
        Column("server_updated_at", String(30), nullable=False, index=True),
    ]


users = Table(
    "users",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("email", String(255), nullable=False, unique=True),
    Column("password_hash", String(100), nullable=False),
    *control_columns(),
)

profiles = Table(
    "profiles",
    metadata,
    Column("user_id", String(36), ForeignKey("users.id"), primary_key=True),
    Column("name", String(120), nullable=False),
    Column("whatsapp", String(20), nullable=False),
    Column("photo_url", String(500)),
    *control_columns(),
)

posts = Table(
    "posts",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("author_id", String(36), ForeignKey("users.id"), nullable=False),
    Column("pet_name", String(120)),
    Column("species", String(30)),
    Column("size", String(30)),
    Column("sex", String(30)),
    Column("color", String(60)),
    Column("breed", String(120)),
    Column("description", Text),
    Column("latitude", Float),
    Column("longitude", Float),
    Column("location", String(255)),
    Column("occurred_at", String(30)),
    # Objetos (fuso e dados do reencontro) gravados como texto JSON
    Column("occurred_zone", Text),
    Column("status", String(20), nullable=False),
    Column("contact_phone", String(20)),
    Column("found_info", Text),
    *control_columns(),
)

# Fotos de cada registro (1 registro : N fotos)
post_images = Table(
    "post_images",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("post_id", String(36), ForeignKey("posts.id"), nullable=False),
    Column("url", String(500), nullable=False),
    Column("position", Integer, nullable=False),
    *control_columns(),
    UniqueConstraint("post_id", "url"),
)
