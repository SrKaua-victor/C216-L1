from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.emprestimo import Emprestimo


class Livro(Base):
    __tablename__ = "livros"
    __table_args__ = (CheckConstraint("total_exemplares >= 1", name="total_exemplares_positivo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(200), index=True)
    autor: Mapped[str] = mapped_column(String(150))
    isbn: Mapped[str] = mapped_column(String(13), unique=True)
    ano_publicacao: Mapped[int] = mapped_column(Integer)
    total_exemplares: Mapped[int] = mapped_column(Integer, default=1)

    emprestimos: Mapped[list["Emprestimo"]] = relationship(
        back_populates="livro", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def exemplares_emprestados(self) -> int:
        return sum(1 for emprestimo in self.emprestimos if emprestimo.ativo)

    @property
    def exemplares_disponiveis(self) -> int:
        return self.total_exemplares - self.exemplares_emprestados
