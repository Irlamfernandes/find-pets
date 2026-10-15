import pytest

PROFILE = {"name": " Ana ", "whatsapp": "5511999999999"}


def test_cria_e_atualiza_o_perfil_da_conta(client, sign_up):
    headers = sign_up()
    assert client.get("/profile", headers=headers).status_code == 404

    created = client.put("/profile", json=PROFILE, headers=headers)
    assert created.status_code == 200
    assert created.get_json()["name"] == "Ana"

    client.put(
        "/profile",
        json={**PROFILE, "name": "Ana B", "photoUrl": "http://x/f.jpg"},
        headers=headers,
    )
    profile = client.get("/profile", headers=headers).get_json()
    assert profile["name"] == "Ana B"
    assert profile["photoUrl"] == "http://x/f.jpg"


def test_cada_conta_ve_so_o_proprio_perfil(client, sign_up):
    client.put("/profile", json=PROFILE, headers=sign_up())

    other = sign_up("bia@x.com")

    assert client.get("/profile", headers=other).status_code == 404


@pytest.mark.parametrize(
    "body, message",
    [
        ({"whatsapp": "5511999999999"}, "'name' é obrigatório"),
        ({"name": "Ana", "whatsapp": "11999999999"}, "com país e DDD"),
        ({"name": "Ana", "whatsapp": "+55 11 99999"}, "com país e DDD"),
        ({"name": "A" * 121, "whatsapp": "5511999999999"}, "até 120"),
        ({**PROFILE, "photoUrl": 10}, "precisa ser um texto"),
    ],
)
def test_valida_o_perfil(client, sign_up, body, message):
    response = client.put("/profile", json=body, headers=sign_up())

    assert response.status_code == 400
    assert message in response.get_json()["error"]
