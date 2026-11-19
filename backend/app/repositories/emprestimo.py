from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.emprestimo import Emprestimo, SituacaoEmprestimo


class EmprestimoRepository:
    def __init__(self, session: Session):
        self.session = session

    def list(self, situacao: SituacaoEmprestimo | None, hoje: date) -> list[Emprestimo]:
        consulta = (
            select(Emprestimo)
            .options(joinedload(Emprestimo.livro), joinedload(Emprestimo.leitor))
            .order_by(Emprestimo.data_emprestimo.desc(), Emprestimo.id.desc())
        )
        if situacao == SituacaoEmprestimo.ATIVOS:
            consulta = consulta.where(Emprestimo.data_devolucao.is_(None))
        elif situacao == SituacaoEmprestimo.ATRASADOS:
            consulta = consulta.where(
                Emprestimo.data_devolucao.is_(None), Emprestimo.data_prevista_devolucao < hoje
            )
        elif situacao == SituacaoEmprestimo.DEVOLVIDOS:
            consulta = consulta.where(Emprestimo.data_devolucao.is_not(None))
        return list(self.session.scalars(consulta))

    def get(self, emprestimo_id: int) -> Emprestimo | None:
        return self.session.get(Emprestimo, emprestimo_id)

    def save(self, emprestimo: Emprestimo) -> Emprestimo:
        self.session.add(emprestimo)
        self.session.commit()
        self.session.refresh(emprestimo)
        return emprestimo
