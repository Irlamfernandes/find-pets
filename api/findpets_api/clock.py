"""Datas sempre em UTC, no mesmo formato do app: 2026-10-15T14:30:00.000Z.

Nesse formato, comparar os textos equivale a comparar as datas, o que
funciona igual em qualquer banco.
"""

from datetime import UTC, datetime

from .errors import ApiError


def to_iso(moment):
    utc = moment.astimezone(UTC)
    return utc.strftime("%Y-%m-%dT%H:%M:%S.") + f"{utc.microsecond // 1000:03d}Z"


def now_iso():
    return to_iso(datetime.now(UTC))


def normalize_iso(text, field):
    """Converte uma data recebida para o formato padrão (sem fuso = UTC)."""
    try:
        moment = datetime.fromisoformat(text)
    except (TypeError, ValueError) as error:
        raise ApiError(400, f"Data inválida em '{field}'.") from error
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=UTC)
    return to_iso(moment)
