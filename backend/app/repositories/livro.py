from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.livro import Livro


class LivroRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self, busca: str | None = None) -> list[Livro]:
        consulta = (
            select(Livro)
            .options(selectinload(Livro.emprestimos))
            .order_by(func.lower(Livro.titulo), Livro.id)
        )
        if busca:
            termo = f"%{busca.lower()}%"
            consulta = consulta.where(
                or_(func.lower(Livro.titulo).like(termo), func.lower(Livro.autor).like(termo))
            )
        return list(self.session.scalars(consulta))

    def get(self, livro_id: int) -> Livro | None:
        return self.session.get(Livro, livro_id)

    def get_by_isbn(self, isbn: str) -> Livro | None:
        return self.session.scalar(select(Livro).where(Livro.isbn == isbn))

    def save(self, livro: Livro) -> Livro:
        self.session.add(livro)
        try:
            self.session.commit()
        except IntegrityError:
            self.session.rollback()
            raise
        self.session.refresh(livro)
        return livro

    def delete(self, livro: Livro) -> None:
        self.session.delete(livro)
        self.session.commit()
