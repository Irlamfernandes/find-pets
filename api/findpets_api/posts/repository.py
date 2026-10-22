"""Acesso às tabelas posts e post_images."""

from sqlalchemy import select, update

from ..clock import now_iso
from ..database import insert_or_update, transaction
from ..tables import post_images, posts, users
from ..validation import new_id

# Registros com o e-mail de quem publicou (JOIN com users)
SELECT_POSTS = select(posts, users.c.email.label("author_email")).join(
    users, users.c.id == posts.c.author_id
)
NEWEST_FIRST = (posts.c.created_at.desc(), posts.c.id)


def active_images(connection, post_ids):
    """{ post_id: [url, ...] } com as fotos ativas, na ordem escolhida."""
    query = (
        select(post_images.c.post_id, post_images.c.url)
        .where(post_images.c.post_id.in_(post_ids), post_images.c.deleted_at.is_(None))
        .order_by(post_images.c.position)
    )
    groups = {post_id: [] for post_id in post_ids}
    for post_id, url in connection.execute(query):
        groups[post_id].append(url)
    return groups


# Executa a consulta e junta as fotos de cada registro
def fetch(query):
    with transaction() as connection:
        rows = [dict(row) for row in connection.execute(query).mappings()]
        images = active_images(connection, [row["id"] for row in rows])
    return [{**row, "images": images[row["id"]]} for row in rows]


# Registros ativos, do mais novo para o mais antigo
def list_active():
    return fetch(
        SELECT_POSTS.where(posts.c.deleted_at.is_(None)).order_by(*NEWEST_FIRST)
    )


def list_changed_since(since):
    """Tudo o que o servidor gravou a partir de `since`, inclusive exclusões.

    Usa ">=" para não perder gravações feitas no mesmo milissegundo; receber
    de novo o último registro não causa problema (o app só o regrava).
    """
    query = SELECT_POSTS.where(posts.c.server_updated_at >= since)
    return fetch(query.order_by(posts.c.server_updated_at))


# Um registro pelo id (com os excluídos, se pedido), ou None
def find(post_id, include_deleted=False):
    query = SELECT_POSTS.where(posts.c.id == post_id)
    if not include_deleted:
        query = query.where(posts.c.deleted_at.is_(None))
    found = fetch(query)
    return found[0] if found else None


def replace_images(connection, post_id, urls, now):
    """Deixa o registro com estas fotos, nesta ordem. As que saíram ficam
    marcadas como excluídas; uma foto que volta reaproveita a mesma linha."""
    known = dict(
        connection.execute(
            select(post_images.c.url, post_images.c.id).where(
                post_images.c.post_id == post_id
            )
        ).all()
    )
    deleted = {"deleted_at": now, "updated_at": now, "server_updated_at": now}
    connection.execute(
        update(post_images)
        .where(post_images.c.post_id == post_id, post_images.c.deleted_at.is_(None))
        .values(deleted)
    )
    for position, url in enumerate(urls):
        row = {
            "id": known.get(url) or new_id(),
            "post_id": post_id,
            "url": url,
            "position": position,
            "created_at": now,
            **deleted,
            "deleted_at": None,
        }
        insert_or_update(connection, post_images, "id", row)


def save(row, images):
    """Cria ou atualiza o registro e as fotos, tudo numa transação."""
    now = now_iso()
    with transaction() as connection:
        insert_or_update(connection, posts, "id", {**row, "server_updated_at": now})
        replace_images(connection, row["id"], images, now)


# Exclusão lógica: preenche deleted_at, o registro continua no banco
def soft_delete(post_id):
    now = now_iso()
    deleted = {"deleted_at": now, "updated_at": now, "server_updated_at": now}
    with transaction() as connection:
        connection.execute(update(posts).where(posts.c.id == post_id).values(deleted))
