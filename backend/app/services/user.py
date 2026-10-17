from app.schemas.user import UserCreate, UserPatch, UserResponse, UserUpdate


class UserNotFoundError(Exception):
    pass


class EmailAlreadyRegisteredError(Exception):
    pass


class UserService:
    def __init__(self):
        self._users: dict[int, UserResponse] = {}
        self._next_id = 1

    def list_users(self, nome: str | None = None, limit: int = 10) -> list[UserResponse]:
        users = list(self._users.values())
        if nome is not None:
            users = [user for user in users if nome.lower() in user.nome.lower()]
        return users[:limit]

    def get_user(self, user_id: int) -> UserResponse:
        user = self._users.get(user_id)
        if user is None:
            raise UserNotFoundError(user_id)
        return user

    def create_user(self, data: UserCreate) -> UserResponse:
        self._ensure_email_available(data.email)
        user = UserResponse(id=self._next_id, **data.model_dump())
        self._users[user.id] = user
        self._next_id += 1
        return user

    def update_user(self, user_id: int, data: UserUpdate) -> UserResponse:
        self.get_user(user_id)
        self._ensure_email_available(data.email, ignore_id=user_id)
        user = UserResponse(id=user_id, **data.model_dump())
        self._users[user_id] = user
        return user

    def patch_user(self, user_id: int, data: UserPatch) -> UserResponse:
        current = self.get_user(user_id)
        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        if "email" in changes:
            self._ensure_email_available(changes["email"], ignore_id=user_id)
        user = UserResponse(**{**current.model_dump(), **changes})
        self._users[user_id] = user
        return user

    def delete_user(self, user_id: int) -> None:
        self.get_user(user_id)
        del self._users[user_id]

    def _ensure_email_available(self, email: str, ignore_id: int | None = None) -> None:
        for user in self._users.values():
            if user.email == email and user.id != ignore_id:
                raise EmailAlreadyRegisteredError(email)


user_service = UserService()
