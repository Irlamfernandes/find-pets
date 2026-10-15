"""Regras dos registros de pets."""

from ..errors import ApiError
from . import repository


def ensure_owner(post, user):
    if post["author_id"] != user["id"]:
        raise ApiError(403, "Só quem publicou pode alterar este registro.")


def is_outdated(current, row):
    """A versão recebida é mais antiga do que a do servidor?

    Vale sempre a alteração mais recente (pela data em que foi feita no
    celular), mesmo que chegue depois por causa de um celular offline.
    """
    return current["updated_at"] > row["updated_at"]


def save_post(user, post_id, row, images):
    """Cria ou atualiza. Devolve (registro como ficou, se foi criado agora).

    Repetir o envio do mesmo registro não cria duplicata: o id vem do app.
    """
    current = repository.find(post_id, include_deleted=True)
    if current is None:
        repository.save({**row, "id": post_id, "author_id": user["id"]}, images)
        return repository.find(post_id, include_deleted=True), True

    ensure_owner(current, user)
    if not is_outdated(current, row):
        repository.save({**row, "id": post_id, "author_id": user["id"]}, images)
    return repository.find(post_id, include_deleted=True), False


def delete_post(user, post_id):
    """Exclusão lógica: some das listas, mas continua no banco."""
    current = repository.find(post_id)
    if current is None:
        raise ApiError(404, "Registro não encontrado.")
    ensure_owner(current, user)
    repository.soft_delete(post_id)
    return repository.find(post_id, include_deleted=True)
