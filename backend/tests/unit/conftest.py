import pytest

from app.models.item import Item
from app.models.user import User
from app.services.item import ItemService
from app.services.user import UserService


class FakeUserRepository:
    def __init__(self):
        self.users: dict[int, User] = {}
        self._next_id = 1

    def list(self, nome: str | None = None, limit: int = 10) -> list[User]:
        users = sorted(self.users.values(), key=lambda user: user.id)
        if nome is not None:
            users = [user for user in users if nome.lower() in user.nome.lower()]
        return users[:limit]

    def get(self, user_id: int) -> User | None:
        return self.users.get(user_id)

    def get_by_email(self, email: str) -> User | None:
        return next((user for user in self.users.values() if user.email == email), None)

    def save(self, user: User) -> User:
        if user.id is None:
            user.id = self._next_id
            self._next_id += 1
        self.users[user.id] = user
        return user

    def delete(self, user: User) -> None:
        del self.users[user.id]


@pytest.fixture
def repository():
    return FakeUserRepository()


@pytest.fixture
def service(repository):
    return UserService(repository)


class FakeItemRepository:
    def __init__(self):
        self.items: dict[int, Item] = {}
        self._next_id = 1

    def list(self) -> list[Item]:
        return sorted(self.items.values(), key=lambda item: item.id)

    def get(self, item_id: int) -> Item | None:
        return self.items.get(item_id)

    def get_by_nome(self, nome: str) -> Item | None:
        return next(
            (item for item in self.items.values() if item.nome.lower() == nome.lower()),
            None,
        )

    def save(self, item: Item) -> Item:
        if item.id is None:
            item.id = self._next_id
            self._next_id += 1
        self.items[item.id] = item
        return item

    def delete(self, item: Item) -> None:
        del self.items[item.id]


@pytest.fixture
def item_repository():
    return FakeItemRepository()


@pytest.fixture
def item_service(item_repository):
    return ItemService(item_repository)
