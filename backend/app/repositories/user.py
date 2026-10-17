from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self, nome: str | None = None, limit: int = 10) -> list[User]:
        consulta = select(User).order_by(User.id).limit(limit)
        if nome is not None:
            consulta = consulta.where(User.nome.icontains(nome, autoescape=True))
        return list(self.session.scalars(consulta))

    def get(self, user_id: int) -> User | None:
        return self.session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.session.scalar(select(User).where(User.email == email))

    def save(self, user: User) -> User:
        self.session.add(user)
        try:
            self.session.commit()
        except IntegrityError:
            self.session.rollback()
            raise
        self.session.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.session.delete(user)
        self.session.commit()
