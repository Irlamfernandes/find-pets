import uuid

import pytest
from sqlalchemy import select

from findpets_api.database import transaction
from findpets_api.tables import post_images

POST = {
    "petName": "Rex",
    "species": "Cachorro",
    "status": "Perdido",
    "latitude": -23.5,
    "longitude": -46.6,
    "location": "Rua A, 10",
    "occurredAt": "2026-10-14T10:00:00-03:00",
    "occurredZone": {"offsetMinutes": -180, "abbreviation": "BRT"},
    "images": ["http://x/1.jpg", "http://x/2.jpg"],
    "updatedAt": "2026-10-15T12:00:00.000Z",
}


def new_id():
    return str(uuid.uuid4())


def put(client, headers, post_id, **changes):
    return client.put(f"/posts/{post_id}", json={**POST, **changes}, headers=headers)


def test_cria_registro_com_id_do_app_e_lista_para_todos(client, sign_up):
    post_id = new_id()

    created = put(client, sign_up(), post_id)

    assert created.status_code == 201
    post = created.get_json()
    assert post["id"] == post_id
    assert post["author"] == "ana@x.com"
    assert post["occurredAt"] == "2026-10-14T13:00:00.000Z"
    assert post["occurredZone"] == POST["occurredZone"]
    assert post["images"] == POST["images"]
    assert post["deletedAt"] is None
    # Outra conta vê o registro (o feed é de todos)
    listed = client.get("/posts", headers=sign_up("bia@x.com")).get_json()
    assert [item["id"] for item in listed] == [post_id]


def test_reenviar_o_mesmo_registro_nao_duplica(client, sign_up):
    headers, post_id = sign_up(), new_id()

    put(client, headers, post_id)
    again = put(client, headers, post_id, updatedAt="2026-10-15T13:00:00Z")

    assert again.status_code == 200
    assert len(client.get("/posts", headers=headers).get_json()) == 1


def test_vale_a_alteracao_mais_recente(client, sign_up):
    headers, post_id = sign_up(), new_id()
    put(client, headers, post_id, petName="Novo", updatedAt="2026-10-15T15:00:00Z")

    # Alteração feita antes, num celular que estava offline
    stale = put(client, headers, post_id, petName="Velho")

    assert stale.status_code == 200
    assert stale.get_json()["petName"] == "Novo"


def test_troca_as_fotos_guardando_as_que_sairam(client, sign_up, app):
    headers, post_id = sign_up(), new_id()
    put(client, headers, post_id)

    put(
        client,
        headers,
        post_id,
        images=["http://x/2.jpg", "http://x/3.jpg"],
        updatedAt="2026-10-15T13:00:00Z",
    )
    updated = put(
        client,
        headers,
        post_id,
        images=["http://x/1.jpg", "http://x/2.jpg"],
        updatedAt="2026-10-15T14:00:00Z",
    )

    assert updated.get_json()["images"] == ["http://x/1.jpg", "http://x/2.jpg"]
    with app.app_context(), transaction() as connection:
        rows = connection.execute(select(post_images.c.url, post_images.c.deleted_at))
        state = {url: deleted_at is None for url, deleted_at in rows}
    # A foto que voltou reaproveita a linha; a que saiu fica como histórico
    assert state == {
        "http://x/1.jpg": True,
        "http://x/2.jpg": True,
        "http://x/3.jpg": False,
    }


def test_so_o_autor_altera_ou_exclui(client, sign_up):
    post_id = new_id()
    put(client, sign_up(), post_id)
    other = sign_up("bia@x.com")

    updated = put(client, other, post_id)
    deleted = client.delete(f"/posts/{post_id}", headers=other)

    assert updated.status_code == 403
    assert deleted.status_code == 403


def test_exclusao_logica_e_sincronizacao(client, sign_up):
    headers, post_id = sign_up(), new_id()
    first = put(client, headers, post_id).get_json()

    deleted = client.delete(f"/posts/{post_id}", headers=headers)

    assert deleted.status_code == 200
    assert deleted.get_json()["deletedAt"]
    assert client.get("/posts", headers=headers).get_json() == []
    assert client.get(f"/posts/{post_id}", headers=headers).status_code == 404
    deleted_again = client.delete(f"/posts/{post_id}", headers=headers)
    assert deleted_again.status_code == 404
    # A sincronização recebe a exclusão, para tirar o registro dos celulares
    since = first["serverUpdatedAt"]
    changes = client.get(f"/posts?since={since}", headers=headers).get_json()
    assert [(item["id"], bool(item["deletedAt"])) for item in changes] == [
        (post_id, True)
    ]


def test_busca_um_registro(client, sign_up):
    headers, post_id = sign_up(), new_id()
    put(client, headers, post_id, foundInfo={"receiverName": "Bia"})

    post = client.get(f"/posts/{post_id}", headers=headers).get_json()

    assert post["foundInfo"] == {"receiverName": "Bia"}


@pytest.mark.parametrize(
    "changes, message",
    [
        ({"status": "Sumido"}, "'Perdido' ou 'Encontrado'"),
        ({"images": "http://x/1.jpg"}, "lista de endereços"),
        ({"images": [""]}, "lista de endereços"),
        ({"images": [f"http://x/{n}.jpg" for n in range(6)]}, "até 5 fotos"),
        ({"latitude": "-23"}, "precisa ser um número"),
        ({"latitude": True}, "precisa ser um número"),
        ({"foundInfo": "Bia"}, "precisa ser um objeto"),
        ({"petName": "R" * 121}, "até 120"),
        ({"updatedAt": "ontem"}, "Data inválida"),
    ],
)
def test_valida_o_registro(client, sign_up, changes, message):
    response = put(client, sign_up(), new_id(), **changes)

    assert response.status_code == 400
    assert message in response.get_json()["error"]


def test_aceita_registro_minimo_e_fotos_repetidas(client, sign_up):
    body = {"images": ["http://x/1.jpg", "http://x/1.jpg"]}
    headers = sign_up()

    post = client.put(f"/posts/{new_id()}", json=body, headers=headers).get_json()

    assert post["status"] == "Perdido"
    assert post["images"] == ["http://x/1.jpg"]
    assert post["createdAt"] == post["updatedAt"]


def test_data_sem_fuso_e_considerada_utc(client, sign_up):
    response = put(client, sign_up(), new_id(), occurredAt="2026-10-14T10:00:00")

    assert response.get_json()["occurredAt"] == "2026-10-14T10:00:00.000Z"


def test_recusa_id_ou_data_de_sincronizacao_invalidos(client, sign_up):
    headers = sign_up()

    assert client.get("/posts/123", headers=headers).status_code == 400
    assert client.get("/posts?since=ontem", headers=headers).status_code == 400
