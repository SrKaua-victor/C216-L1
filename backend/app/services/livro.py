from sqlalchemy.exc import IntegrityError

from app.models.livro import Livro
from app.repositories.livro import LivroRepository
from app.schemas.livro import LivroCreate, LivroUpdate
from app.services.erros import RegraDeNegocioError


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
        if dados.total_exemplares < livro.exemplares_emprestados:
            raise RegraDeNegocioError(
                "O total de exemplares não pode ser menor que a quantidade emprestada "
                f"({livro.exemplares_emprestados})."
            )
        for campo, valor in dados.model_dump().items():
            setattr(livro, campo, valor)
        try:
            return self.repository.save(livro)
        except IntegrityError as erro:
            raise IsbnDuplicadoError(dados.isbn) from erro

    def remover(self, livro_id: int) -> None:
        livro = self.obter(livro_id)
        if livro.exemplares_emprestados > 0:
            raise RegraDeNegocioError("Não é possível remover um livro com empréstimos ativos.")
        self.repository.delete(livro)
