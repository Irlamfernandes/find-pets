from datetime import UTC, datetime

from .errors import ApiError


def to_iso(moment):
    utc = moment.astimezone(UTC)
    return utc.strftime("%Y-%m-%dT%H:%M:%S.") + f"{utc.microsecond // 1000:03d}Z"


def now_iso():
    return to_iso(datetime.now(UTC))


def normalize_iso(text, field):
    try:
        moment = datetime.fromisoformat(text)
    except (TypeError, ValueError) as error:
        raise ApiError(400, f"Data inválida em '{field}'.") from error
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=UTC)
    return to_iso(moment)
