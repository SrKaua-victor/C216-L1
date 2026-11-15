import pytest
from pydantic import ValidationError

from app.schemas.item import ItemCreate


def test_descricao_e_opcional():
    assert ItemCreate(nome="Caderno").descricao == ""


def test_remove_os_espacos_das_pontas():
    item = ItemCreate(nome="  Caderno  ", descricao="  Capa dura  ")
    assert (item.nome, item.descricao) == ("Caderno", "Capa dura")


@pytest.mark.parametrize("nome", ["abc", "a" * 50])
def test_aceita_nome_nos_limites(nome):
    assert ItemCreate(nome=nome).nome == nome


@pytest.mark.parametrize(
    "dados",
    [
        {"nome": ""},
        {"nome": "   "},
        {"nome": "ab"},
        {"nome": "  ab  "},
        {"nome": "a" * 51},
        {"nome": "Caderno", "descricao": "a" * 201},
        {"descricao": "Capa dura"},
    ],
)
def test_rejeita_dados_invalidos(dados):
    with pytest.raises(ValidationError):
        ItemCreate(**dados)
