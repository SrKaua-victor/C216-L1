import pytest

USUARIO_ANA = {"nome": "Ana", "email": "ana@email.com"}
USUARIO_BIA = {"nome": "Bia", "email": "bia@email.com"}


@pytest.fixture
def ana(client, user_service):
    return client.post("/users", json=USUARIO_ANA).json()


def test_lista_usuarios_comeca_vazia(client, user_service):
    resposta = client.get("/users")
    assert resposta.status_code == 200
    assert resposta.json() == []


def test_cria_usuario_retorna_201(client, user_service):
    resposta = client.post("/users", json=USUARIO_ANA)
    assert resposta.status_code == 201
    assert resposta.json() == {"id": 1, **USUARIO_ANA}


def test_busca_usuario_criado(client, user_service):
    criado = client.post("/users", json=USUARIO_ANA).json()
    resposta = client.get(f"/users/{criado['id']}")
    assert resposta.status_code == 200
    assert resposta.json() == criado


def test_busca_usuario_inexistente_retorna_404(client, user_service):
    resposta = client.get("/users/999")
    assert resposta.status_code == 404
    assert resposta.json()["detail"] == "Usuario nao encontrado"


def test_email_duplicado_retorna_409(client, user_service):
    client.post("/users", json=USUARIO_ANA)
    resposta = client.post("/users", json=USUARIO_ANA)
    assert resposta.status_code == 409
    assert resposta.json()["detail"] == "Email ja cadastrado"


def test_remove_usuario(client, user_service):
    criado = client.post("/users", json=USUARIO_ANA).json()
    resposta = client.delete(f"/users/{criado['id']}")
    assert resposta.status_code == 204
    assert client.get(f"/users/{criado['id']}").status_code == 404


def test_remove_usuario_inexistente_retorna_404(client, user_service):
    resposta = client.delete("/users/999")
    assert resposta.status_code == 404


@pytest.mark.parametrize(
    "payload",
    [
        {"nome": "", "email": "ana@email.com"},
        {"nome": "Ana", "email": "sem-arroba"},
        {"nome": "Ana", "email": "ana@semdominio"},
        {"nome": "Ana"},
        {"email": "ana@email.com"},
    ],
)
def test_payload_invalido_retorna_422(client, user_service, payload):
    resposta = client.post("/users", json=payload)
    assert resposta.status_code == 422


def test_filtra_usuarios_por_nome(client, ana):
    client.post("/users", json=USUARIO_BIA)
    resposta = client.get("/users", params={"nome": "AN"})
    assert resposta.status_code == 200
    assert [usuario["nome"] for usuario in resposta.json()] == ["Ana"]


def test_limita_quantidade_de_usuarios(client, ana):
    client.post("/users", json=USUARIO_BIA)
    resposta = client.get("/users", params={"limit": 1})
    assert resposta.status_code == 200
    assert len(resposta.json()) == 1


@pytest.mark.parametrize(
    "params",
    [{"limit": 0}, {"limit": 101}, {"limit": "abc"}, {"nome": ""}],
)
def test_query_invalida_retorna_422(client, user_service, params):
    resposta = client.get("/users", params=params)
    assert resposta.status_code == 422


@pytest.mark.parametrize("user_id", ["0", "-1", "abc"])
def test_path_invalido_retorna_422(client, user_service, user_id):
    resposta = client.get(f"/users/{user_id}")
    assert resposta.status_code == 422


def test_put_substitui_usuario(client, ana):
    novo = {"nome": "Ana Maria", "email": "anamaria@email.com"}
    resposta = client.put(f"/users/{ana['id']}", json=novo)
    assert resposta.status_code == 200
    assert resposta.json() == {"id": ana["id"], **novo}


def test_put_mantendo_o_proprio_email_nao_gera_conflito(client, ana):
    resposta = client.put(f"/users/{ana['id']}", json={"nome": "Ana Maria", "email": ana["email"]})
    assert resposta.status_code == 200


def test_put_sem_todos_os_campos_retorna_422(client, ana):
    resposta = client.put(f"/users/{ana['id']}", json={"nome": "Ana Maria"})
    assert resposta.status_code == 422


def test_put_usuario_inexistente_retorna_404(client, user_service):
    resposta = client.put("/users/999", json=USUARIO_ANA)
    assert resposta.status_code == 404


def test_put_com_email_de_outro_usuario_retorna_409(client, ana):
    bia = client.post("/users", json=USUARIO_BIA).json()
    resposta = client.put(f"/users/{bia['id']}", json={"nome": "Bia", "email": ana["email"]})
    assert resposta.status_code == 409


def test_patch_altera_apenas_o_campo_enviado(client, ana):
    resposta = client.patch(f"/users/{ana['id']}", json={"nome": "Ana Maria"})
    assert resposta.status_code == 200
    assert resposta.json() == {**ana, "nome": "Ana Maria"}


def test_patch_com_null_nao_apaga_o_campo(client, ana):
    resposta = client.patch(f"/users/{ana['id']}", json={"nome": None})
    assert resposta.status_code == 200
    assert resposta.json() == ana


def test_patch_email_invalido_retorna_422(client, ana):
    resposta = client.patch(f"/users/{ana['id']}", json={"email": "sem-arroba"})
    assert resposta.status_code == 422


def test_patch_usuario_inexistente_retorna_404(client, user_service):
    resposta = client.patch("/users/999", json={"nome": "Ninguem"})
    assert resposta.status_code == 404


def test_patch_com_email_de_outro_usuario_retorna_409(client, ana):
    bia = client.post("/users", json=USUARIO_BIA).json()
    resposta = client.patch(f"/users/{bia['id']}", json={"email": ana["email"]})
    assert resposta.status_code == 409
