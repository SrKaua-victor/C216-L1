def test_raiz_responde_mensagem(client):
    resposta = client.get("/")
    assert resposta.status_code == 200
    assert resposta.json() == {"mensagem": "API da Biblioteca no ar"}


def test_health_responde_ok(client):
    resposta = client.get("/health")
    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}
