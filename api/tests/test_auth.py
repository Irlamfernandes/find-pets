from datetime import UTC, datetime, timedelta

import jwt
import pytest

from findpets_api import create_app

CREDENTIALS = {"email": "Ana@X.com ", "password": "senha123"}


def test_cadastra_e_entra_com_email_sem_diferenciar_maiusculas(client):
    created = client.post("/auth/register", json=CREDENTIALS)
    assert created.status_code == 201
    assert created.get_json()["email"] == "ana@x.com"

    login = client.post(
        "/auth/login", json={"email": "ana@x.com", "password": "senha123"}
    )
    assert login.status_code == 200
    assert login.get_json()["token"]


def test_recusa_email_repetido(client):
    client.post("/auth/register", json=CREDENTIALS)

    response = client.post("/auth/register", json=CREDENTIALS)

    assert response.status_code == 409
    assert "já está cadastrado" in response.get_json()["error"]


@pytest.mark.parametrize(
    "password, email", [("errada", "ana@x.com"), ("senha123", "bia@x.com")]
)
def test_recusa_senha_errada_ou_conta_inexistente(client, password, email):
    client.post("/auth/register", json=CREDENTIALS)

    response = client.post("/auth/login", json={"email": email, "password": password})

    assert response.status_code == 401
    assert response.get_json() == {"error": "E-mail ou senha incorretos."}


@pytest.mark.parametrize(
    "body, message",
    [
        (None, "Envie os dados em JSON"),
        ({"email": "ana@x.com"}, "'password' é obrigatório"),
        ({"email": "sem-arroba", "password": "x"}, "e-mail válido"),
        ({"email": "ana@x", "password": "x"}, "e-mail válido"),
        ({"email": "ana@x.com", "password": "a" * 73}, "longa demais"),
    ],
)
def test_valida_os_dados_do_cadastro(client, body, message):
    response = client.post("/auth/register", json=body)

    assert response.status_code == 400
    assert message in response.get_json()["error"]


def test_rotas_protegidas_exigem_token_valido(client, app):
    assert client.get("/profile").status_code == 401

    invalid = client.get("/profile", headers={"Authorization": "Bearer lixo"})
    assert invalid.get_json() == {"error": "Token inválido."}

    expired = jwt.encode(
        {"sub": "1", "email": "a@x.com", "exp": datetime.now(UTC) - timedelta(1)},
        app.config["JWT_SECRET"],
        "HS256",
    )
    response = client.get("/profile", headers={"Authorization": f"Bearer {expired}"})
    assert response.status_code == 401
    assert "expirada" in response.get_json()["error"]


@pytest.mark.parametrize("secret", [None, "curta-demais"])
def test_nao_sobe_sem_uma_chave_segura(tmp_path, monkeypatch, secret):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    settings = {"DATABASE_URL": f"sqlite:///{tmp_path / 'x.db'}"}

    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        create_app({**settings, "JWT_SECRET": secret})
