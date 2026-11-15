import pytest
from sqlalchemy.exc import IntegrityError

from app.models.item import Item
from app.repositories.item import ItemRepository


@pytest.fixture
def repository(db_session):
    return ItemRepository(db_session)


def test_save_persiste_e_gera_id(repository):
    salvo = repository.save(Item(nome="Caderno", descricao="Capa dura"))
    assert salvo.id is not None
    assert repository.get(salvo.id).descricao == "Capa dura"


def test_list_ordena_por_id(repository):
    for nome in ("Caderno", "Caneta", "Mochila"):
        repository.save(Item(nome=nome, descricao=""))
    assert [item.nome for item in repository.list()] == ["Caderno", "Caneta", "Mochila"]


@pytest.mark.parametrize("busca", ["Caderno", "CADERNO", "caderno"])
def test_get_by_nome_nao_diferencia_maiusculas(repository, busca):
    repository.save(Item(nome="Caderno", descricao=""))
    assert repository.get_by_nome(busca).nome == "Caderno"


def test_get_by_nome_inexistente_retorna_none(repository):
    assert repository.get_by_nome("Caderno") is None


def test_nome_repetido_e_barrado_pela_constraint_do_banco(repository):
    repository.save(Item(nome="Caderno", descricao=""))
    with pytest.raises(IntegrityError):
        repository.save(Item(nome="Caderno", descricao="outro"))
    assert len(repository.list()) == 1


def test_delete_remove_do_banco(repository):
    salvo = repository.save(Item(nome="Caderno", descricao=""))
    repository.delete(salvo)
    assert repository.get(salvo.id) is None
