from app.core.config import settings

ORIGEM_PERMITIDA = settings.cors_origins[0]
ORIGEM_NAO_PERMITIDA = "http://site-desconhecido.example"


def preflight(client, origem, metodo="POST"):
    return client.options(
        "/items/",
        headers={
            "Origin": origem,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": "content-type",
        },
    )


def test_preflight_de_origem_permitida_e_liberado(client):
    resposta = preflight(client, ORIGEM_PERMITIDA)
    assert resposta.status_code == 200
    assert resposta.headers["access-control-allow-origin"] == ORIGEM_PERMITIDA
    assert "POST" in resposta.headers["access-control-allow-methods"]


def test_preflight_de_origem_nao_permitida_e_recusado(client):
    resposta = preflight(client, ORIGEM_NAO_PERMITIDA)
    assert resposta.status_code == 400
    assert "access-control-allow-origin" not in resposta.headers


def test_resposta_para_origem_permitida_traz_o_cabecalho(client):
    resposta = client.get("/items/", headers={"Origin": ORIGEM_PERMITIDA})
    assert resposta.headers["access-control-allow-origin"] == ORIGEM_PERMITIDA


def test_resposta_para_origem_nao_permitida_nao_traz_o_cabecalho(client):
    resposta = client.get("/items/", headers={"Origin": ORIGEM_NAO_PERMITIDA})
    assert "access-control-allow-origin" not in resposta.headers


def test_nao_libera_qualquer_origem(client):
    resposta = client.get("/items/", headers={"Origin": ORIGEM_NAO_PERMITIDA})
    assert resposta.headers.get("access-control-allow-origin") != "*"
