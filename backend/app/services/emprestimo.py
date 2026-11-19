from datetime import date, timedelta
from decimal import Decimal

from app.models.emprestimo import Emprestimo, SituacaoEmprestimo
from app.repositories.emprestimo import EmprestimoRepository
from app.repositories.leitor import LeitorRepository
from app.repositories.livro import LivroRepository
from app.schemas.emprestimo import EmprestimoCreate
from app.services.erros import RegraDeNegocioError
from app.services.leitor import LeitorNaoEncontradoError
from app.services.livro import LivroNaoEncontradoError

PRAZO_EM_DIAS = 14
DIAS_POR_RENOVACAO = 7
LIMITE_DE_RENOVACOES = 2
LIMITE_DE_EMPRESTIMOS_ATIVOS = 3
MULTA_POR_DIA = Decimal("1.00")


class EmprestimoNaoEncontradoError(Exception):
    pass


class EmprestimoService:
    def __init__(
        self,
        repository: EmprestimoRepository,
        livros: LivroRepository,
        leitores: LeitorRepository,
        hoje: date,
    ):
        self.repository = repository
        self.livros = livros
        self.leitores = leitores
        self.hoje = hoje

    def listar(self, situacao: SituacaoEmprestimo | None = None) -> list[Emprestimo]:
        return self.repository.list(situacao, self.hoje)

    def obter(self, emprestimo_id: int) -> Emprestimo:
        emprestimo = self.repository.get(emprestimo_id)
        if emprestimo is None:
            raise EmprestimoNaoEncontradoError(emprestimo_id)
        return emprestimo

    def emprestar(self, dados: EmprestimoCreate) -> Emprestimo:
        livro = self.livros.get(dados.livro_id)
        if livro is None:
            raise LivroNaoEncontradoError(dados.livro_id)
        leitor = self.leitores.get(dados.leitor_id)
        if leitor is None:
            raise LeitorNaoEncontradoError(dados.leitor_id)

        ativos = leitor.emprestimos_ativos
        if any(emprestimo.atrasado_em(self.hoje) for emprestimo in ativos):
            raise RegraDeNegocioError("O leitor possui empréstimos em atraso.")
        if len(ativos) >= LIMITE_DE_EMPRESTIMOS_ATIVOS:
            raise RegraDeNegocioError(
                f"O leitor já atingiu o limite de {LIMITE_DE_EMPRESTIMOS_ATIVOS} "
                "empréstimos ativos."
            )
        if any(emprestimo.livro.id == livro.id for emprestimo in ativos):
            raise RegraDeNegocioError("O leitor já está com um exemplar deste livro.")
        if livro.exemplares_disponiveis <= 0:
            raise RegraDeNegocioError("Não há exemplares disponíveis deste livro.")

        emprestimo = Emprestimo(
            livro=livro,
            leitor=leitor,
            data_emprestimo=self.hoje,
            data_prevista_devolucao=self.hoje + timedelta(days=PRAZO_EM_DIAS),
            renovacoes=0,
            multa=Decimal("0.00"),
        )
        return self.repository.save(emprestimo)

    def renovar(self, emprestimo_id: int) -> Emprestimo:
        emprestimo = self._obter_ativo(emprestimo_id)
        if emprestimo.atrasado_em(self.hoje):
            raise RegraDeNegocioError("Não é possível renovar um empréstimo em atraso.")
        if emprestimo.renovacoes >= LIMITE_DE_RENOVACOES:
            raise RegraDeNegocioError(
                f"O limite de {LIMITE_DE_RENOVACOES} renovações já foi atingido."
            )
        emprestimo.data_prevista_devolucao += timedelta(days=DIAS_POR_RENOVACAO)
        emprestimo.renovacoes += 1
        return self.repository.save(emprestimo)

    def devolver(self, emprestimo_id: int) -> Emprestimo:
        emprestimo = self._obter_ativo(emprestimo_id)
        dias_de_atraso = max((self.hoje - emprestimo.data_prevista_devolucao).days, 0)
        emprestimo.data_devolucao = self.hoje
        emprestimo.multa = MULTA_POR_DIA * dias_de_atraso
        return self.repository.save(emprestimo)

    def _obter_ativo(self, emprestimo_id: int) -> Emprestimo:
        emprestimo = self.obter(emprestimo_id)
        if not emprestimo.ativo:
            raise RegraDeNegocioError("Este empréstimo já foi devolvido.")
        return emprestimo
