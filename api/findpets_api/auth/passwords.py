import bcrypt

from ..errors import ApiError

MAX_PASSWORD_BYTES = 72


def hash_password(password):
    encoded = password.encode("utf-8")
    if len(encoded) > MAX_PASSWORD_BYTES:
        raise ApiError(400, "A senha é longa demais.")
    return bcrypt.hashpw(encoded, bcrypt.gensalt()).decode("utf-8")


def check_password(password, password_hash):
    encoded = password.encode("utf-8")[:MAX_PASSWORD_BYTES]
    return bcrypt.checkpw(encoded, password_hash.encode("utf-8"))
