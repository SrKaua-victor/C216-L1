from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.item import Item


class ItemRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self) -> list[Item]:
        return list(self.session.scalars(select(Item).order_by(Item.id)))

    def get(self, item_id: int) -> Item | None:
        return self.session.get(Item, item_id)

    def get_by_nome(self, nome: str) -> Item | None:
        return self.session.scalar(select(Item).where(func.lower(Item.nome) == nome.lower()))

    def save(self, item: Item) -> Item:
        self.session.add(item)
        try:
            self.session.commit()
        except IntegrityError:
            self.session.rollback()
            raise
        self.session.refresh(item)
        return item

    def delete(self, item: Item) -> None:
        self.session.delete(item)
        self.session.commit()
