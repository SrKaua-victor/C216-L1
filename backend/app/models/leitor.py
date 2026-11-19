from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.emprestimo import Emprestimo


class Leitor(Base):
    __tablename__ = "leitores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    telefone: Mapped[str | None] = mapped_column(String(11))

    emprestimos: Mapped[list["Emprestimo"]] = relationship(
        back_populates="leitor", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def emprestimos_ativos(self) -> list["Emprestimo"]:
        return [emprestimo for emprestimo in self.emprestimos if emprestimo.ativo]
