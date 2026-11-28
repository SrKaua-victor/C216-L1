from datetime import date

import pytest
from pydantic import ValidationError

from app.schemas.livro import LivroCreate

DADOS = {
    "titulo": "Dom Casmurro",
    "autor": "Machado de Assis",
    "isbn": "9788535910667",
    "ano_publicacao": 1899,
    "total_exemplares": 3,
}


def _criar(**alteracoes) -> LivroCreate:
    return LivroCreate(**(DADOS | alteracoes))


def test_aceita_livro_valido_e_remove_espacos():
    livro = _criar(titulo="  Dom Casmurro  ")
    assert (livro.titulo, livro.isbn, livro.total_exemplares) == ("Dom Casmurro", DADOS["isbn"], 3)


@pytest.mark.parametrize(
    ("entrada", "esperado"),
    [("978-85-359-1066-7", "9788535910667"), ("85-359-0915-x", "853590915X")],
)
def test_normaliza_isbn_13_e_isbn_10(entrada, esperado):
    assert _criar(isbn=entrada).isbn == esperado


@pytest.mark.parametrize("isbn", ["9788535910663", "123", "ABCDEFGHIJ"])
def test_rejeita_isbn_invalido(isbn):
    with pytest.raises(ValidationError, match="ISBN inválido"):
        _criar(isbn=isbn)


def test_rejeita_ano_no_futuro():
    with pytest.raises(ValidationError, match="futuro"):
        _criar(ano_publicacao=date.today().year + 1)


@pytest.mark.parametrize("total", [0, 1001])
def test_rejeita_quantidade_de_exemplares_fora_do_limite(total):
    with pytest.raises(ValidationError):
        _criar(total_exemplares=total)
