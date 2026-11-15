from sqlalchemy.exc import IntegrityError

from app.models.item import Item
from app.repositories.item import ItemRepository
from app.schemas.item import ItemCreate


class ItemNotFoundError(Exception):
    pass


class ItemAlreadyExistsError(Exception):
    pass


class ItemService:
    def __init__(self, repository: ItemRepository):
        self.repository = repository

    def list_items(self) -> list[Item]:
        return self.repository.list()

    def create_item(self, data: ItemCreate) -> Item:
        if self.repository.get_by_nome(data.nome) is not None:
            raise ItemAlreadyExistsError(data.nome)
        try:
            return self.repository.save(Item(**data.model_dump()))
        except IntegrityError as erro:
            raise ItemAlreadyExistsError(data.nome) from erro

    def delete_item(self, item_id: int) -> None:
        item = self.repository.get(item_id)
        if item is None:
            raise ItemNotFoundError(item_id)
        self.repository.delete(item)
