"""Proteção contra CSRF: recusa alterações pedidas por outro site no navegador.

O navegador manda o cabeçalho Origin nas requisições POST, PUT e DELETE. Se ele
vier de um site que não é a própria API nem um dos CORS_ORIGINS, a requisição é
recusada. O app de celular não manda Origin, então passa normalmente.
"""

from flask import current_app, request

from .errors import ApiError

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


# Liga a verificação em todas as requisições
def init_app(app):
    app.before_request(reject_cross_site_changes)


# Recusa POST, PUT e DELETE vindos de um site que não é confiável
def reject_cross_site_changes():
    origin = request.headers.get("Origin")
    if request.method in SAFE_METHODS or not origin:
        return
    if not is_trusted(origin):
        raise ApiError(403, "Origem não permitida.")


# A própria API ou um dos sites liberados em CORS_ORIGINS
def is_trusted(origin):
    own_origin = request.host_url.rstrip("/")
    return origin == own_origin or origin in current_app.config["CORS_ORIGINS"]
