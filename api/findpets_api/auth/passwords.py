"""Senhas guardadas só como hash (bcrypt), nunca o texto digitado."""

import bcrypt

from ..errors import ApiError

# O bcrypt só considera os primeiros 72 bytes da senha
MAX_PASSWORD_BYTES = 72


# Hash da senha com bcrypt (a senha nunca é gravada como texto)
def hash_password(password):
    encoded = password.encode("utf-8")
    if len(encoded) > MAX_PASSWORD_BYTES:
        raise ApiError(400, "A senha é longa demais.")
    return bcrypt.hashpw(encoded, bcrypt.gensalt()).decode("utf-8")


# True se a senha confere com o hash guardado
def check_password(password, password_hash):
    encoded = password.encode("utf-8")[:MAX_PASSWORD_BYTES]
    return bcrypt.checkpw(encoded, password_hash.encode("utf-8"))
