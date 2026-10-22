"""Lê o registro enviado pelo app (JSON) e monta a linha da tabela posts."""

import json

from ..clock import normalize_iso, now_iso
from ..errors import ApiError
from ..validation import optional_number, optional_object, optional_text

STATUSES = ("Perdido", "Encontrado")
MAX_IMAGES = 5
MAX_URL_LENGTH = 500

# Campo do JSON -> (coluna, tamanho máximo)
TEXT_FIELDS = {
    "petName": ("pet_name", 120),
    "species": ("species", 30),
    "size": ("size", 30),
    "sex": ("sex", 30),
    "color": ("color", 60),
    "breed": ("breed", 120),
    "description": ("description", None),
    "location": ("location", 255),
    "contactPhone": ("contact_phone", 20),
}
NUMBER_FIELDS = {"latitude": "latitude", "longitude": "longitude"}
# Objetos gravados como texto JSON
OBJECT_FIELDS = {"occurredZone": "occurred_zone", "foundInfo": "found_info"}
DATE_FIELDS = {
    "occurredAt": "occurred_at",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "deletedAt": "deleted_at",
}


# Data opcional, convertida para ISO em UTC
def optional_date(data, field):
    value = data.get(field)
    return None if value is None else normalize_iso(value, field)


# Objeto -> texto JSON para a coluna
def encode_object(value):
    return None if value is None else json.dumps(value, ensure_ascii=False)


# Status do registro ("Perdido" quando não informado)
def read_status(data):
    status = data.get("status", STATUSES[0])
    if status not in STATUSES:
        raise ApiError(400, "O status precisa ser 'Perdido' ou 'Encontrado'.")
    return status


# Endereço de foto válido (texto não vazio e não muito longo)
def is_url(value):
    return isinstance(value, str) and 0 < len(value) <= MAX_URL_LENGTH


# Lista de fotos validada, sem repetidas
def read_images(data):
    images = data.get("images", [])
    if not isinstance(images, list) or not all(map(is_url, images)):
        raise ApiError(400, "O campo 'images' precisa ser uma lista de endereços.")
    if len(images) > MAX_IMAGES:
        raise ApiError(400, f"Um registro aceita até {MAX_IMAGES} fotos.")
    # A mesma foto entra uma vez só, na primeira posição em que aparece
    return list(dict.fromkeys(images))


# Colunas da tabela a partir dos campos validados do JSON
def read_columns(data):
    texts = {
        column: optional_text(data, field, max_length)
        for field, (column, max_length) in TEXT_FIELDS.items()
    }
    numbers = {
        col: optional_number(data, field) for field, col in NUMBER_FIELDS.items()
    }
    objects = {
        col: encode_object(optional_object(data, field))
        for field, col in OBJECT_FIELDS.items()
    }
    dates = {col: optional_date(data, field) for field, col in DATE_FIELDS.items()}
    return {**texts, **numbers, **objects, **dates, "status": read_status(data)}


def read_post(data):
    """Devolve (linha da tabela posts, lista de fotos).

    Sem as datas de criação/alteração (registro feito agora), usa a atual.
    """
    row = read_columns(data)
    now = now_iso()
    row["created_at"] = row["created_at"] or now
    row["updated_at"] = row["updated_at"] or now
    return row, read_images(data)
