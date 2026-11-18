import pytest

from app.models.livro import Livro
from app.services.livro import LivroService


class FakeLivroRepository:
    def __init__(self):
        self.livros: dict[int, Livro] = {}
        self._proximo_id = 1

    def list(self, busca: str | None = None) -> list[Livro]:
        livros = sorted(self.livros.values(), key=lambda livro: (livro.titulo.lower(), livro.id))
        if busca:
            termo = busca.lower()
            livros = [
                livro
                for livro in livros
                if termo in livro.titulo.lower() or termo in livro.autor.lower()
            ]
        return livros

    def get(self, livro_id: int) -> Livro | None:
        return self.livros.get(livro_id)

    def get_by_isbn(self, isbn: str) -> Livro | None:
        return next((livro for livro in self.livros.values() if livro.isbn == isbn), None)

    def save(self, livro: Livro) -> Livro:
        if livro.id is None:
            livro.id = self._proximo_id
            self._proximo_id += 1
        self.livros[livro.id] = livro
        return livro

    def delete(self, livro: Livro) -> None:
        del self.livros[livro.id]


@pytest.fixture
def livro_repository():
    return FakeLivroRepository()


@pytest.fixture
def livro_service(livro_repository):
    return LivroService(livro_repository)
