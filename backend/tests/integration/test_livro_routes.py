import pytest

DOM_CASMURRO = {
    "titulo": "Dom Casmurro",
    "autor": "Machado de Assis",
    "isbn": "978-85-359-1066-7",
    "ano_publicacao": 1899,
    "total_exemplares": 2,
}
GRANDE_SERTAO = {
    "titulo": "Grande Sertão: Veredas",
    "autor": "João Guimarães Rosa",
    "isbn": "9788535920499",
    "ano_publicacao": 1956,
    "total_exemplares": 1,
}


def _criar(client, dados):
    resposta = client.post("/livros", json=dados)
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def test_cria_e_consulta_livro_com_isbn_normalizado(client):
    criado = _criar(client, DOM_CASMURRO)
    assert criado["isbn"] == "9788535910667"
    resposta = client.get(f"/livros/{criado['id']}")
    assert resposta.status_code == 200
    assert resposta.json() == criado


def test_lista_com_busca_por_titulo_ou_autor(client):
    _criar(client, DOM_CASMURRO)
    _criar(client, GRANDE_SERTAO)
    assert len(client.get("/livros").json()) == 2
    assert [livro["titulo"] for livro in client.get("/livros?busca=rosa").json()] == [
        "Grande Sertão: Veredas"
    ]


def test_isbn_repetido_retorna_409(client):
    _criar(client, DOM_CASMURRO)
    resposta = client.post("/livros", json=DOM_CASMURRO)
    assert resposta.status_code == 409
    assert resposta.json() == {"detail": "Já existe um livro cadastrado com esse ISBN."}


@pytest.mark.parametrize(
    "alteracao",
    [{"isbn": "9788535910663"}, {"titulo": ""}, {"total_exemplares": 0}],
)
def test_dados_invalidos_retornam_422(client, alteracao):
    resposta = client.post("/livros", json=DOM_CASMURRO | alteracao)
    assert resposta.status_code == 422
    assert client.get("/livros").json() == []


def test_atualiza_livro(client):
    criado = _criar(client, DOM_CASMURRO)
    resposta = client.put(f"/livros/{criado['id']}", json=DOM_CASMURRO | {"total_exemplares": 4})
    assert resposta.status_code == 200
    assert client.get(f"/livros/{criado['id']}").json()["total_exemplares"] == 4


def test_remove_livro(client):
    criado = _criar(client, DOM_CASMURRO)
    assert client.delete(f"/livros/{criado['id']}").status_code == 204
    assert client.get(f"/livros/{criado['id']}").status_code == 404


@pytest.mark.parametrize("metodo", ["get", "delete"])
def test_livro_inexistente_retorna_404(client, metodo):
    resposta = getattr(client, metodo)("/livros/999")
    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Livro não encontrado."}
