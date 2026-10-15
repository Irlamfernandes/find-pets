from findpets_api.config import load_settings


def test_informa_que_esta_no_ar(client):
    assert client.get("/health").get_json() == {"status": "ok"}


def test_responde_json_em_rota_inexistente(client):
    response = client.get("/nao-existe")

    assert response.status_code == 404
    assert "error" in response.get_json()


def test_publica_a_documentacao_swagger(client):
    spec = client.get("/apispec_1.json").get_json()

    assert spec["info"]["title"] == "FindPets API"
    assert "/posts/{post_id}" in spec["paths"]


def test_le_as_configuracoes_do_ambiente(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "mysql+pymysql://u:s@db/findpets")
    monkeypatch.setenv("JWT_EXPIRES_HOURS", "2")

    settings = load_settings()

    assert settings["DATABASE_URL"] == "mysql+pymysql://u:s@db/findpets"
    assert settings["JWT_EXPIRES_HOURS"] == 2
