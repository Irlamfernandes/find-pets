import io

import pytest


def send(client, headers, name="foto.JPG", content=b"imagem"):
    data = {"file": (io.BytesIO(content), name)}
    return client.post("/uploads", data=data, headers=headers)


def test_envia_e_devolve_a_foto(client, sign_up):
    response = send(client, sign_up())

    assert response.status_code == 201
    url = response.get_json()["url"]
    assert url.startswith("http://localhost/uploads/") and url.endswith(".jpg")
    # A foto é pública: aparece no feed de todos
    photo = client.get(url.removeprefix("http://localhost"))
    assert photo.status_code == 200
    assert photo.data == b"imagem"


@pytest.mark.parametrize("name", ["virus.exe", "sem-extensao", ""])
def test_aceita_so_imagens(client, sign_up, name):
    response = send(client, sign_up(), name=name)

    assert response.status_code == 400


def test_exige_arquivo_login_e_tamanho_maximo(client, sign_up, app):
    headers = sign_up()
    assert client.post("/uploads", headers=headers).status_code == 400
    assert send(client, {}).status_code == 401

    app.config["MAX_CONTENT_LENGTH"] = 10
    assert send(client, headers, content=b"x" * 100).status_code == 413


def test_nao_sai_da_pasta_de_fotos(client):
    assert client.get("/uploads/..%2Fapp.py").status_code == 404
    assert client.get("/uploads/nao-existe.jpg").status_code == 404
