import pytest

ORIGEM_DO_FRONTEND = "http://localhost:5173"


@pytest.mark.parametrize("metodo", ["GET", "POST", "PUT", "PATCH", "DELETE"])
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


def test_preflight_rejeita_origem_desconhecida(client):
    resposta = client.options(
        "/health",
        headers={
            "Origin": "http://site-desconhecido.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert resposta.status_code == 400
    assert "access-control-allow-origin" not in resposta.headers


def test_requisicao_simples_recebe_cabecalho_de_origem(client):
    resposta = client.get("/health", headers={"Origin": ORIGEM_DO_FRONTEND})
    assert resposta.headers["access-control-allow-origin"] == ORIGEM_DO_FRONTEND
