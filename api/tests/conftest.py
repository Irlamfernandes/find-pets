import pytest

from findpets_api import create_app


@pytest.fixture
def app(tmp_path):
    return create_app(
        {
            "TESTING": True,
            "DATABASE_URL": f"sqlite:///{tmp_path / 'test.db'}",
            "JWT_SECRET": "chave-dos-testes-com-32-caracteres!",
            "UPLOAD_DIR": str(tmp_path / "uploads"),
        }
    )


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def sign_up(client):

    def create(email="ana@x.com", password="senha123"):
        response = client.post(
            "/auth/register", json={"email": email, "password": password}
        )
        return {"Authorization": f"Bearer {response.get_json()['token']}"}

    return create
