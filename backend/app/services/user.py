from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserPatch, UserUpdate


class UserNotFoundError(Exception):
    pass


class EmailAlreadyRegisteredError(Exception):
    pass


class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def list_users(self, nome: str | None = None, limit: int = 10) -> list[User]:
        return self.repository.list(nome=nome, limit=limit)

    def get_user(self, user_id: int) -> User:
        user = self.repository.get(user_id)
        if user is None:
            raise UserNotFoundError(user_id)
        return user

    def create_user(self, data: UserCreate) -> User:
        self._ensure_email_available(data.email)
        return self._save(User(**data.model_dump()))

    def update_user(self, user_id: int, data: UserUpdate) -> User:
        user = self.get_user(user_id)
        self._ensure_email_available(data.email, ignore_id=user_id)
        user.nome = data.nome
        user.email = data.email
        return self._save(user)

    def patch_user(self, user_id: int, data: UserPatch) -> User:
        user = self.get_user(user_id)
        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        if "email" in changes:
            self._ensure_email_available(changes["email"], ignore_id=user_id)
        for campo, valor in changes.items():
            setattr(user, campo, valor)
        return self._save(user)

    def delete_user(self, user_id: int) -> None:
        self.repository.delete(self.get_user(user_id))

    def _ensure_email_available(self, email: str, ignore_id: int | None = None) -> None:
        existente = self.repository.get_by_email(email)
        if existente is not None and existente.id != ignore_id:
            raise EmailAlreadyRegisteredError(email)

    def _save(self, user: User) -> User:
        try:
            return self.repository.save(user)
        except IntegrityError as erro:
            raise EmailAlreadyRegisteredError(user.email) from erro
