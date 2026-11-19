import pytest

from app.models.leitor import Leitor
from app.models.livro import Livro
from app.services.leitor import LeitorService
from app.services.livro import LivroService


class FakeRepository:
    def __init__(self):
        self.registros: dict[int, object] = {}
        self._proximo_id = 1

    def get(self, registro_id: int):
        return self.registros.get(registro_id)

    def save(self, registro):
        if registro.id is None:
            registro.id = self._proximo_id
            self._proximo_id += 1
        self.registros[registro.id] = registro
        return registro

    def delete(self, registro) -> None:
        del self.registros[registro.id]

    def _buscar(self, campos: tuple[str, ...], busca: str | None) -> list:
        def ordem(registro):
            return getattr(registro, campos[0]).lower(), registro.id

        registros = sorted(self.registros.values(), key=ordem)
        if not busca:
            return registros
        termo = busca.lower()
        return [
            registro
            for registro in registros
            if any(termo in getattr(registro, campo).lower() for campo in campos)
        ]


class FakeLivroRepository(FakeRepository):
    def list(self, busca: str | None = None) -> list[Livro]:
        return self._buscar(("titulo", "autor"), busca)

    def get_by_isbn(self, isbn: str) -> Livro | None:
        return next((livro for livro in self.registros.values() if livro.isbn == isbn), None)


class FakeLeitorRepository(FakeRepository):
    def list(self, busca: str | None = None) -> list[Leitor]:
        return self._buscar(("nome", "email"), busca)

    def get_by_email(self, email: str) -> Leitor | None:
        return next((leitor for leitor in self.registros.values() if leitor.email == email), None)


@pytest.fixture
def livro_repository():
    return FakeLivroRepository()


@pytest.fixture
def livro_service(livro_repository):
    return LivroService(livro_repository)


@pytest.fixture
def leitor_repository():
    return FakeLeitorRepository()


@pytest.fixture
def leitor_service(leitor_repository):
    return LeitorService(leitor_repository)
