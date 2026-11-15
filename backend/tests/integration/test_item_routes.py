import pytest

CADERNO = {"nome": "Caderno", "descricao": "Capa dura"}


def test_lista_comeca_vazia(client):
    resposta = client.get("/items/")
    assert resposta.status_code == 200
    assert resposta.json() == []


def test_cria_item_retorna_201(client):
    resposta = client.post("/items/", json=CADERNO)
    assert resposta.status_code == 201
    corpo = resposta.json()
    assert isinstance(corpo.pop("id"), int)
    assert corpo == CADERNO


def test_item_criado_aparece_na_listagem(client):
    criado = client.post("/items/", json=CADERNO).json()
    assert client.get("/items/").json() == [criado]


def test_lista_na_ordem_de_criacao(client):
    for nome in ("Caderno", "Caneta", "Mochila"):
        client.post("/items/", json={"nome": nome})
    assert [item["nome"] for item in client.get("/items/").json()] == [
        "Caderno",
        "Caneta",
        "Mochila",
    ]


def test_descricao_e_opcional(client):
    resposta = client.post("/items/", json={"nome": "Caneta"})
    assert resposta.status_code == 201
    assert resposta.json()["descricao"] == ""


def test_remove_os_espacos_das_pontas(client):
    resposta = client.post("/items/", json={"nome": "  Caderno  ", "descricao": " Capa dura "})
    assert (resposta.json()["nome"], resposta.json()["descricao"]) == ("Caderno", "Capa dura")


@pytest.mark.parametrize("nome", ["Caderno", "CADERNO", "  caderno  "])
def test_nome_repetido_retorna_409(client, nome):
    client.post("/items/", json=CADERNO)
    resposta = client.post("/items/", json={"nome": nome})
    assert resposta.status_code == 409
    assert resposta.json()["detail"] == "Já existe um item com esse nome."


@pytest.mark.parametrize(
    "payload",
    [
        {"nome": "ab"},
        {"nome": "a" * 51},
        {"nome": "Caderno", "descricao": "a" * 201},
        {"descricao": "Capa dura"},
    ],
)
def test_payload_invalido_retorna_422(client, payload):
    resposta = client.post("/items/", json=payload)
    assert resposta.status_code == 422


def test_remove_item(client):
    criado = client.post("/items/", json=CADERNO).json()
    resposta = client.delete(f"/items/{criado['id']}")
    assert resposta.status_code == 204
    assert client.get("/items/").json() == []


def test_remover_inexistente_retorna_404(client):
    resposta = client.delete("/items/999")
    assert resposta.status_code == 404
    assert resposta.json()["detail"] == "Item não encontrado."


def test_rota_sem_barra_final_redireciona_para_a_canonica(client):
    resposta = client.get("/items", follow_redirects=False)
    assert resposta.status_code == 307
    assert resposta.headers["location"].endswith("/items/")


@pytest.mark.parametrize("item_id", ["0", "-1", "abc"])
def test_id_invalido_retorna_422(client, item_id):
    assert client.delete(f"/items/{item_id}").status_code == 422
