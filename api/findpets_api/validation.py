"""Leitura e validação dos dados recebidos nas requisições."""

import uuid

from flask import request

from .errors import ApiError


# Corpo da requisição em JSON (precisa ser um objeto)
def json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(400, "Envie os dados em JSON no corpo da requisição.")
    return data


# Recusa textos maiores que o limite do campo
def check_length(value, field, max_length):
    if max_length is not None and len(value) > max_length:
        raise ApiError(400, f"O campo '{field}' aceita até {max_length} caracteres.")
    return value


# Texto obrigatório, sem espaços nas pontas
def required_text(data, field, max_length=None):
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ApiError(400, f"O campo '{field}' é obrigatório.")
    return check_length(value.strip(), field, max_length)


def required_password(data, field):
    """Senha obrigatória, guardada exatamente como digitada (com espaços)."""
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ApiError(400, f"O campo '{field}' é obrigatório.")
    return value


# Texto opcional (None quando não enviado)
def optional_text(data, field, max_length=None):
    value = data.get(field)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ApiError(400, f"O campo '{field}' precisa ser um texto.")
    return check_length(value.strip(), field, max_length)


# Número opcional (None quando não enviado)
def optional_number(data, field):
    value = data.get(field)
    is_number = isinstance(value, int | float) and not isinstance(value, bool)
    if value is None or is_number:
        return value
    raise ApiError(400, f"O campo '{field}' precisa ser um número.")


# Objeto opcional (None quando não enviado)
def optional_object(data, field):
    value = data.get(field)
    if value is None or isinstance(value, dict):
        return value
    raise ApiError(400, f"O campo '{field}' precisa ser um objeto.")


# Id no formato UUID (recusa outros formatos)
def require_uuid(value):
    try:
        return str(uuid.UUID(value))
    except ValueError as error:
        raise ApiError(400, "Identificador inválido.") from error


# Id novo no formato UUID
def new_id():
    return str(uuid.uuid4())
