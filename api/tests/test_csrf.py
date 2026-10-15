import pytest

LOGIN = {"email": "ana@x.com", "password": "senha123"}


def register(client, origin=None):
    headers = {"Origin": origin} if origin else {}
    return client.post("/auth/register", json=LOGIN, headers=headers)


def test_app_de_celular_sem_origin_passa(client):
    assert register(client).status_code == 201


@pytest.mark.parametrize("origin", ["http://localhost", "http://localhost:8081"])
def test_aceita_a_propria_api_e_os_sites_liberados(app, origin):
    app.config["CORS_ORIGINS"] = ["http://localhost:8081"]

    assert register(app.test_client(), origin).status_code == 201


def test_recusa_alteracao_pedida_por_outro_site(client):
    response = register(client, "https://site-malicioso.com")

    assert response.status_code == 403
    assert response.get_json() == {"error": "Origem não permitida."}


def test_leitura_de_outro_site_nao_e_bloqueada(client):
    response = client.get("/health", headers={"Origin": "https://outro.site"})

    assert response.status_code == 200
