"""Token de acesso (JWT): o app envia em cada requisição para provar quem é."""

from datetime import UTC, datetime, timedelta

import jwt
from flask import current_app

from ..errors import ApiError

ALGORITHM = "HS256"


def create_token(user):
    hours = current_app.config["JWT_EXPIRES_HOURS"]
    claims = {
        "sub": user["id"],
        "email": user["email"],
        "exp": datetime.now(UTC) + timedelta(hours=hours),
    }
    return jwt.encode(claims, current_app.config["JWT_SECRET"], ALGORITHM)


def read_token(token):
    """Devolve { id, email } do dono do token, ou erro 401."""
    try:
        claims = jwt.decode(
            token, current_app.config["JWT_SECRET"], algorithms=[ALGORITHM]
        )
    except jwt.ExpiredSignatureError as error:
        raise ApiError(401, "Sessão expirada. Entre novamente.") from error
    except jwt.InvalidTokenError as error:
        raise ApiError(401, "Token inválido.") from error
    return {"id": claims["sub"], "email": claims["email"]}
