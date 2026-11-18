from sqlalchemy import CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Livro(Base):
    __tablename__ = "livros"
    __table_args__ = (CheckConstraint("total_exemplares >= 1", name="total_exemplares_positivo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(200), index=True)
    autor: Mapped[str] = mapped_column(String(150))
    isbn: Mapped[str] = mapped_column(String(13), unique=True)
    ano_publicacao: Mapped[int] = mapped_column(Integer)
    total_exemplares: Mapped[int] = mapped_column(Integer, default=1)
