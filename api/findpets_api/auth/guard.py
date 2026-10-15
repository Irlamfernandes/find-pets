"""Proteção das rotas: só entra quem envia um token válido."""

from functools import wraps

from flask import g, request

from ..errors import ApiError
from .tokens import read_token

PREFIX = "Bearer "


def bearer_token():
    header = request.headers.get("Authorization", "")
    if not header.startswith(PREFIX):
        raise ApiError(401, "Faça login para continuar.")
    return header[len(PREFIX) :]


def require_auth(route):
    """Decorator: a rota só roda com login; o usuário fica em g.user."""

    @wraps(route)
    def protected(*args, **kwargs):
        g.user = read_token(bearer_token())
        return route(*args, **kwargs)

    return protected
