from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.leitor import Leitor


class LeitorRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self, busca: str | None = None) -> list[Leitor]:
        consulta = select(Leitor).order_by(func.lower(Leitor.nome), Leitor.id)
        if busca:
            termo = f"%{busca.lower()}%"
            consulta = consulta.where(
                or_(func.lower(Leitor.nome).like(termo), Leitor.email.like(termo))
            )
        return list(self.session.scalars(consulta))

    def get(self, leitor_id: int) -> Leitor | None:
        return self.session.get(Leitor, leitor_id)

    def get_by_email(self, email: str) -> Leitor | None:
        return self.session.scalar(select(Leitor).where(Leitor.email == email))

    def save(self, leitor: Leitor) -> Leitor:
        self.session.add(leitor)
        try:
            self.session.commit()
        except IntegrityError:
            self.session.rollback()
            raise
        self.session.refresh(leitor)
        return leitor

    def delete(self, leitor: Leitor) -> None:
        self.session.delete(leitor)
        self.session.commit()
