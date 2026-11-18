from sqlalchemy.exc import IntegrityError

from app.models.livro import Livro
from app.repositories.livro import LivroRepository
from app.schemas.livro import LivroCreate, LivroUpdate


class LivroNaoEncontradoError(Exception):
    pass


class IsbnDuplicadoError(Exception):
    pass


class LivroService:
    def __init__(self, repository: LivroRepository):
        self.repository = repository

    def listar(self, busca: str | None = None) -> list[Livro]:
        termo = busca.strip() if busca else None
        return self.repository.list(termo or None)

    def obter(self, livro_id: int) -> Livro:
        livro = self.repository.get(livro_id)
        if livro is None:
            raise LivroNaoEncontradoError(livro_id)
        return livro

    def criar(self, dados: LivroCreate) -> Livro:
        if self.repository.get_by_isbn(dados.isbn) is not None:
            raise IsbnDuplicadoError(dados.isbn)
        try:
            return self.repository.save(Livro(**dados.model_dump()))
        except IntegrityError as erro:
            raise IsbnDuplicadoError(dados.isbn) from erro

    def atualizar(self, livro_id: int, dados: LivroUpdate) -> Livro:
        livro = self.obter(livro_id)
        outro = self.repository.get_by_isbn(dados.isbn)
        if outro is not None and outro.id != livro.id:
            raise IsbnDuplicadoError(dados.isbn)
        for campo, valor in dados.model_dump().items():
            setattr(livro, campo, valor)
        try:
            return self.repository.save(livro)
        except IntegrityError as erro:
            raise IsbnDuplicadoError(dados.isbn) from erro

    def remover(self, livro_id: int) -> None:
        self.repository.delete(self.obter(livro_id))
