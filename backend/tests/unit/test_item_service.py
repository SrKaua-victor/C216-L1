import pytest
from sqlalchemy.exc import IntegrityError

from app.schemas.item import ItemCreate
from app.services.item import ItemAlreadyExistsError, ItemNotFoundError, ItemService

CADERNO = ItemCreate(nome="Caderno", descricao="Capa dura")


def test_lista_comeca_vazia(item_service):
    assert item_service.list_items() == []


def test_cria_e_lista_na_ordem_de_criacao(item_service):
    item_service.create_item(CADERNO)
    item_service.create_item(ItemCreate(nome="Caneta"))
    assert [item.nome for item in item_service.list_items()] == ["Caderno", "Caneta"]


def test_item_criado_recebe_id_e_mantem_os_dados(item_service):
    criado = item_service.create_item(CADERNO)
    assert (criado.id, criado.nome, criado.descricao) == (1, "Caderno", "Capa dura")


@pytest.mark.parametrize("nome", ["Caderno", "CADERNO", "caderno"])
def test_rejeita_nome_repetido_sem_diferenciar_maiusculas(item_service, nome):
    item_service.create_item(CADERNO)
    with pytest.raises(ItemAlreadyExistsError):
        item_service.create_item(ItemCreate(nome=nome))


def test_conflito_detectado_pelo_banco_vira_item_repetido(item_repository):
    def save_com_conflito(item):
        raise IntegrityError("INSERT INTO items", {}, Exception("unique violation"))

    item_repository.save = save_com_conflito
    with pytest.raises(ItemAlreadyExistsError):
        ItemService(item_repository).create_item(CADERNO)


def test_remove_item(item_service, item_repository):
    criado = item_service.create_item(CADERNO)
    item_service.delete_item(criado.id)
    assert item_repository.get(criado.id) is None


def test_remover_inexistente_levanta_erro(item_service):
    with pytest.raises(ItemNotFoundError):
        item_service.delete_item(1)


def test_nome_removido_pode_ser_usado_de_novo(item_service):
    criado = item_service.create_item(CADERNO)
    item_service.delete_item(criado.id)
    assert item_service.create_item(CADERNO).nome == "Caderno"
