import pytest


def test_raiz_retorna_status_200(client):
    resposta = client.get("/")
    assert resposta.status_code == 200


def test_raiz_retorna_mensagem_esperada(client):
    resposta = client.get("/")
    assert resposta.json() == {"mensagem": "Backend C216 L1 no ar"}


def test_health_retorna_status_ok(client):
    resposta = client.get("/health")
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "ok"


@pytest.mark.parametrize("rota", ["/", "/health"])
def test_rotas_existentes_respondem_200(client, rota):
    resposta = client.get(rota)
    assert resposta.status_code == 200


@pytest.mark.parametrize(
    "rota, chave_esperada",
    [
        ("/", "mensagem"),
        ("/health", "status"),
    ],
)
def test_rotas_retornam_chave_esperada(client, rota, chave_esperada):
    resposta = client.get(rota)
    assert chave_esperada in resposta.json()


@pytest.mark.parametrize(
    "rota_inexistente",
    ["/inexistente", "/health/extra", "/api/v1", "/HEALTH"],
)
def test_rota_inexistente_retorna_404(client, rota_inexistente):
    resposta = client.get(rota_inexistente)
    assert resposta.status_code == 404


def test_metodo_nao_permitido_retorna_405(client):
    resposta = client.post("/health")
    assert resposta.status_code == 405


def test_rotas_validas_retornam_json(client, rotas_validas):
    for rota in rotas_validas:
        resposta = client.get(rota)
        assert resposta.headers["content-type"].startswith("application/json")
