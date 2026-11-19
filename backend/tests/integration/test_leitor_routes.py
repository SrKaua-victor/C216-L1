import pytest

ANA = {"nome": "Ana Souza", "email": "Ana@Email.com", "telefone": "(35) 99876-5432"}
BRUNO = {"nome": "Bruno Lima", "email": "bruno@email.com"}


def _criar(client, dados):
    resposta = client.post("/leitores", json=dados)
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def test_cria_e_consulta_leitor_com_dados_normalizados(client):
    criado = _criar(client, ANA)
    assert (criado["email"], criado["telefone"]) == ("ana@email.com", "35998765432")
    resposta = client.get(f"/leitores/{criado['id']}")
    assert resposta.status_code == 200
    assert resposta.json() == criado


def test_lista_com_busca_por_nome(client):
    _criar(client, ANA)
    _criar(client, BRUNO)
    assert len(client.get("/leitores").json()) == 2
    assert [leitor["nome"] for leitor in client.get("/leitores?busca=lima").json()] == [
        "Bruno Lima"
    ]


def test_email_repetido_sem_diferenciar_maiusculas_retorna_409(client):
    _criar(client, ANA)
    resposta = client.post("/leitores", json=BRUNO | {"email": "ANA@email.com"})
    assert resposta.status_code == 409
    assert resposta.json() == {"detail": "Já existe um leitor cadastrado com esse e-mail."}


@pytest.mark.parametrize("alteracao", [{"email": "ana"}, {"nome": "A"}, {"telefone": "123"}])
def test_dados_invalidos_retornam_422(client, alteracao):
    assert client.post("/leitores", json=ANA | alteracao).status_code == 422


def test_atualiza_leitor(client):
    criado = _criar(client, ANA)
    resposta = client.put(f"/leitores/{criado['id']}", json=ANA | {"nome": "Ana Souza Lima"})
    assert resposta.status_code == 200
    assert client.get(f"/leitores/{criado['id']}").json()["nome"] == "Ana Souza Lima"


def test_remove_leitor(client):
    criado = _criar(client, ANA)
    assert client.delete(f"/leitores/{criado['id']}").status_code == 204
    resposta = client.get(f"/leitores/{criado['id']}")
    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Leitor não encontrado."}
