from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.leitor import Leitor
    from app.models.livro import Livro


class Emprestimo(Base):
    __tablename__ = "emprestimos"
    __table_args__ = (
        CheckConstraint("data_prevista_devolucao >= data_emprestimo", name="prazo_valido"),
        CheckConstraint(
            "data_devolucao IS NULL OR data_devolucao >= data_emprestimo",
            name="devolucao_valida",
        ),
        CheckConstraint("renovacoes >= 0", name="renovacoes_nao_negativas"),
        CheckConstraint("multa >= 0", name="multa_nao_negativa"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    livro_id: Mapped[int] = mapped_column(ForeignKey("livros.id", ondelete="CASCADE"), index=True)
    leitor_id: Mapped[int] = mapped_column(
        ForeignKey("leitores.id", ondelete="CASCADE"), index=True
    )
    data_emprestimo: Mapped[date] = mapped_column(Date)
    data_prevista_devolucao: Mapped[date] = mapped_column(Date)
    data_devolucao: Mapped[date | None] = mapped_column(Date)
    renovacoes: Mapped[int] = mapped_column(Integer, default=0)
    multa: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("0.00"))

    livro: Mapped["Livro"] = relationship(back_populates="emprestimos")
    leitor: Mapped["Leitor"] = relationship(back_populates="emprestimos")
