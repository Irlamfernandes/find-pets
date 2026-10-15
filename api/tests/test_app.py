from findpets_api import create_app
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


def test_cors_fica_desligado_sem_sites_liberados(client):
    response = client.get("/health", headers={"Origin": "https://outro.site"})

    assert "Access-Control-Allow-Origin" not in response.headers


def test_cors_libera_so_os_sites_configurados(app):
    app = create_app({**app.config, "CORS_ORIGINS": ["http://localhost:8081"]})
    client = app.test_client()

    allowed = client.get("/health", headers={"Origin": "http://localhost:8081"})
    other = client.get("/health", headers={"Origin": "https://outro.site"})

    assert allowed.headers["Access-Control-Allow-Origin"] == "http://localhost:8081"
    assert "Access-Control-Allow-Origin" not in other.headers


def test_le_os_sites_liberados_do_ambiente(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://a.com, ,http://b.com")

    assert load_settings()["CORS_ORIGINS"] == ["http://a.com", "http://b.com"]
