from flask import current_app
from sqlalchemy import create_engine, insert, select, update

from .tables import metadata

FIXED_COLUMNS = ("created_at",)


def init_database(app):
    engine = create_engine(app.config["DATABASE_URL"], pool_pre_ping=True)
    metadata.create_all(engine)
    app.extensions["database"] = engine


def transaction():
    return current_app.extensions["database"].begin()


def insert_or_update(connection, table, key_column, row):
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
