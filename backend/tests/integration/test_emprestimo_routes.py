from datetime import date, timedelta

import pytest

from app.main import app
from app.routes.emprestimo import data_atual

LIVRO = {
    "titulo": "Dom Casmurro",
    "autor": "Machado de Assis",
    "isbn": "9788535910667",
    "ano_publicacao": 1899,
    "total_exemplares": 1,
}
OUTRO_LIVRO = LIVRO | {"titulo": "O Cortiço", "isbn": "9788572322270"}


class Relogio:
    def __init__(self):
        self.hoje = date(2026, 11, 2)

    def __call__(self) -> date:
        return self.hoje

    def avancar(self, dias: int) -> None:
        self.hoje += timedelta(days=dias)


@pytest.fixture
def relogio(client):
    relogio = Relogio()
    app.dependency_overrides[data_atual] = relogio
    return relogio


def _criar(client, rota, dados):
    resposta = client.post(rota, json=dados)
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


@pytest.fixture
def livro_e_leitor(client):
    livro = _criar(client, "/livros", LIVRO)
    leitor = _criar(client, "/leitores", {"nome": "Ana Souza", "email": "ana@email.com"})
    return livro, leitor


def _emprestar(client, livro, leitor):
    return client.post("/emprestimos", json={"livro_id": livro["id"], "leitor_id": leitor["id"]})


def test_fluxo_de_emprestimo_renovacao_e_devolucao_com_multa(client, relogio, livro_e_leitor):
    livro, leitor = livro_e_leitor
    emprestimo = _emprestar(client, livro, leitor).json()
    assert emprestimo["data_prevista_devolucao"] == "2026-11-16"
    assert emprestimo["livro"] == {"id": livro["id"], "titulo": "Dom Casmurro"}
    assert client.get(f"/livros/{livro['id']}").json()["exemplares_disponiveis"] == 0

    renovado = client.post(f"/emprestimos/{emprestimo['id']}/renovacao").json()
    assert (renovado["data_prevista_devolucao"], renovado["renovacoes"]) == ("2026-11-23", 1)

    relogio.avancar(23)
    devolvido = client.post(f"/emprestimos/{emprestimo['id']}/devolucao").json()
    assert (devolvido["data_devolucao"], devolvido["multa"]) == ("2026-11-25", 2.0)
    assert client.get(f"/livros/{livro['id']}").json()["exemplares_disponiveis"] == 1


def test_lista_por_situacao(client, relogio, livro_e_leitor):
    livro, leitor = livro_e_leitor
    devolvido = _emprestar(client, livro, leitor).json()
    client.post(f"/emprestimos/{devolvido['id']}/devolucao")
    atrasado = _emprestar(client, _criar(client, "/livros", OUTRO_LIVRO), leitor).json()
    relogio.avancar(15)

    def ids(situacao):
        return [item["id"] for item in client.get(f"/emprestimos?situacao={situacao}").json()]

    assert ids("ativos") == ids("atrasados") == [atrasado["id"]]
    assert ids("devolvidos") == [devolvido["id"]]
    assert len(client.get("/emprestimos").json()) == 2


def test_regra_violada_retorna_409_com_mensagem(client, livro_e_leitor):
    livro, leitor = livro_e_leitor
    _emprestar(client, livro, leitor)
    outro = _criar(client, "/leitores", {"nome": "Bruno Lima", "email": "bruno@email.com"})
    resposta = _emprestar(client, livro, outro)
    assert resposta.status_code == 409
    assert resposta.json() == {"detail": "Não há exemplares disponíveis deste livro."}


def test_livro_e_leitor_com_emprestimo_ativo_nao_podem_ser_removidos(client, livro_e_leitor):
    livro, leitor = livro_e_leitor
    _emprestar(client, livro, leitor)
    assert client.delete(f"/livros/{livro['id']}").status_code == 409
    assert client.delete(f"/leitores/{leitor['id']}").status_code == 409


@pytest.mark.parametrize(
    ("campo", "detalhe"),
    [("livro_id", "Livro não encontrado."), ("leitor_id", "Leitor não encontrado.")],
)
def test_livro_ou_leitor_inexistente_retorna_404(client, livro_e_leitor, campo, detalhe):
    livro, leitor = livro_e_leitor
    corpo = {"livro_id": livro["id"], "leitor_id": leitor["id"], campo: 999}
    resposta = client.post("/emprestimos", json=corpo)
    assert resposta.status_code == 404
    assert resposta.json() == {"detail": detalhe}


def test_emprestimo_inexistente_e_situacao_invalida(client):
    assert client.post("/emprestimos/99/devolucao").status_code == 404
    assert client.get("/emprestimos?situacao=perdidos").status_code == 422
