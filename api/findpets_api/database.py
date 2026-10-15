"""Conexão com o banco de dados."""

from flask import current_app
from sqlalchemy import create_engine, insert, select, update

from .tables import metadata

# Colunas que não mudam depois que a linha existe
FIXED_COLUMNS = ("created_at",)


def init_database(app):
    """Conecta ao banco e cria as tabelas que ainda não existem."""
    engine = create_engine(app.config["DATABASE_URL"], pool_pre_ping=True)
    metadata.create_all(engine)
    app.extensions["database"] = engine


def transaction():
    """Conexão dentro de uma transação: tudo é gravado junto, ou nada.

    Uso: with transaction() as connection: ...
    """
    return current_app.extensions["database"].begin()


def insert_or_update(connection, table, key_column, row):
    """Atualiza a linha com a mesma chave ou, se ela não existir, insere.

    (O UPSERT nativo muda de um banco para outro; assim funciona em todos.)
    """
    key = table.c[key_column]
    where = key == row[key_column]
    if connection.execute(select(key).where(where)).first() is None:
        connection.execute(insert(table).values(row))
        return
    changes = {
        column: value
        for column, value in row.items()
        if column not in (key_column, *FIXED_COLUMNS)
    }
    connection.execute(update(table).where(where).values(changes))
