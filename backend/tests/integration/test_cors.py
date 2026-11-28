import pytest

ORIGEM_DO_FRONTEND = "http://localhost:5173"


@pytest.mark.parametrize("metodo", ["GET", "POST", "PUT", "DELETE"])
def test_preflight_libera_metodos_para_o_frontend(client, metodo):
    resposta = client.options(
        "/health",
        headers={
            "Origin": ORIGEM_DO_FRONTEND,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert resposta.status_code == 200
    assert resposta.headers["access-control-allow-origin"] == ORIGEM_DO_FRONTEND
    assert metodo in resposta.headers["access-control-allow-methods"]


@pytest.mark.parametrize(
    ("origem", "metodo"),
    [("http://site-desconhecido.example", "POST"), (ORIGEM_DO_FRONTEND, "PATCH")],
)
def test_preflight_rejeita_origem_desconhecida_ou_metodo_nao_utilizado(client, origem, metodo):
    resposta = client.options(
        "/health",
        headers={"Origin": origem, "Access-Control-Request-Method": metodo},
    )
    assert resposta.status_code == 400


def test_requisicao_simples_recebe_cabecalho_de_origem(client):
    resposta = client.get("/health", headers={"Origin": ORIGEM_DO_FRONTEND})
    assert resposta.headers["access-control-allow-origin"] == ORIGEM_DO_FRONTEND
