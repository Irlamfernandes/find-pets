"""Converte a linha do banco no JSON devolvido ao app."""

import json

from .payload import DATE_FIELDS, NUMBER_FIELDS, OBJECT_FIELDS, TEXT_FIELDS

COLUMNS = {
    **{field: column for field, (column, _) in TEXT_FIELDS.items()},
    **NUMBER_FIELDS,
    **DATE_FIELDS,
    "serverUpdatedAt": "server_updated_at",
    "status": "status",
}


def decode_object(value):
    return None if value is None else json.loads(value)


def to_json(row):
    post = {field: row[column] for field, column in COLUMNS.items()}
    objects = {
        field: decode_object(row[column]) for field, column in OBJECT_FIELDS.items()
    }
    return {
        "id": row["id"],
        "author": row["author_email"],
        **post,
        **objects,
        "images": row["images"],
    }
