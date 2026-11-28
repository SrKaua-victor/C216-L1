from sqlalchemy.exc import IntegrityError

from app.models.leitor import Leitor
from app.repositories.leitor import LeitorRepository
from app.schemas.leitor import LeitorCreate, LeitorUpdate
from app.services.erros import RegraDeNegocioError


class LeitorNaoEncontradoError(Exception):
    pass


class EmailDuplicadoError(Exception):
    pass


class LeitorService:
    def __init__(self, repository: LeitorRepository):
        self.repository = repository

    def listar(self, busca: str | None = None) -> list[Leitor]:
        termo = busca.strip() if busca else None
        return self.repository.list(termo or None)

    def obter(self, leitor_id: int) -> Leitor:
        leitor = self.repository.get(leitor_id)
        if leitor is None:
            raise LeitorNaoEncontradoError(leitor_id)
        return leitor

    def criar(self, dados: LeitorCreate) -> Leitor:
        self._garantir_email_livre(dados.email)
        return self._salvar(Leitor(**dados.model_dump()))

    def atualizar(self, leitor_id: int, dados: LeitorUpdate) -> Leitor:
        leitor = self.obter(leitor_id)
        self._garantir_email_livre(dados.email, ignorar_id=leitor.id)
        for campo, valor in dados.model_dump().items():
            setattr(leitor, campo, valor)
        return self._salvar(leitor)

    def remover(self, leitor_id: int) -> None:
        leitor = self.obter(leitor_id)
        if leitor.emprestimos_ativos:
            raise RegraDeNegocioError("Não é possível remover um leitor com empréstimos ativos.")
        self.repository.delete(leitor)

    def _garantir_email_livre(self, email: str, ignorar_id: int | None = None) -> None:
        existente = self.repository.get_by_email(email)
        if existente is not None and existente.id != ignorar_id:
            raise EmailDuplicadoError(email)

    def _salvar(self, leitor: Leitor) -> Leitor:
        try:
            return self.repository.save(leitor)
        except IntegrityError as erro:
            raise EmailDuplicadoError(leitor.email) from erro
