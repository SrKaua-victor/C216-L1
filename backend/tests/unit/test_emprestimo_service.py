from datetime import timedelta
from decimal import Decimal

import pytest

from app.schemas.emprestimo import EmprestimoCreate
from app.schemas.leitor import LeitorCreate
from app.schemas.livro import LivroCreate, LivroUpdate
from app.services.erros import RegraDeNegocioError
from app.services.leitor import LeitorNaoEncontradoError
from app.services.livro import LivroNaoEncontradoError

ISBNS = ["9788535910667", "9788572322270", "9788535920499", "9780143039433"]


@pytest.fixture
def novo_livro(livro_service):
    def criar(total_exemplares=1):
        isbn = ISBNS[len(livro_service.listar())]
        dados = LivroCreate(
            titulo=f"Livro {isbn}",
            autor="Machado de Assis",
            isbn=isbn,
            ano_publicacao=1899,
            total_exemplares=total_exemplares,
        )
        return livro_service.criar(dados)

    return criar


@pytest.fixture
def novo_leitor(leitor_service):
    def criar():
        numero = len(leitor_service.listar()) + 1
        return leitor_service.criar(
            LeitorCreate(nome=f"Leitor {numero}", email=f"leitor{numero}@email.com")
        )

    return criar


@pytest.fixture
def emprestar(emprestimo_service):
    def executar(livro, leitor):
        dados = EmprestimoCreate(livro_id=livro.id, leitor_id=leitor.id)
        return emprestimo_service.emprestar(dados)

    return executar


def test_empresta_por_14_dias_e_reduz_exemplares_disponiveis(
    emprestimo_service, emprestar, novo_livro, novo_leitor
):
    livro = novo_livro(total_exemplares=2)
    emprestimo = emprestar(livro, novo_leitor())
    assert emprestimo.data_prevista_devolucao == emprestimo_service.hoje + timedelta(days=14)
    assert livro.exemplares_disponiveis == 1


def test_bloqueia_livro_sem_exemplar_disponivel(emprestar, novo_livro, novo_leitor):
    livro = novo_livro()
    emprestar(livro, novo_leitor())
    with pytest.raises(RegraDeNegocioError, match="exemplares disponíveis"):
        emprestar(livro, novo_leitor())


def test_bloqueia_o_mesmo_livro_duas_vezes_para_o_leitor(emprestar, novo_livro, novo_leitor):
    livro = novo_livro(total_exemplares=2)
    leitor = novo_leitor()
    emprestar(livro, leitor)
    with pytest.raises(RegraDeNegocioError, match="já está com um exemplar"):
        emprestar(livro, leitor)


def test_bloqueia_o_quarto_emprestimo_ativo(emprestar, novo_livro, novo_leitor):
    leitor = novo_leitor()
    for _ in range(3):
        emprestar(novo_livro(), leitor)
    with pytest.raises(RegraDeNegocioError, match="limite de 3"):
        emprestar(novo_livro(), leitor)


def test_bloqueia_leitor_com_emprestimo_atrasado(
    emprestimo_service, emprestar, novo_livro, novo_leitor
):
    leitor = novo_leitor()
    emprestar(novo_livro(), leitor)
    emprestimo_service.hoje += timedelta(days=15)
    with pytest.raises(RegraDeNegocioError, match="em atraso"):
        emprestar(novo_livro(), leitor)


def test_livro_ou_leitor_inexistente_levanta_erro(emprestimo_service, novo_livro, novo_leitor):
    with pytest.raises(LivroNaoEncontradoError):
        emprestimo_service.emprestar(EmprestimoCreate(livro_id=99, leitor_id=novo_leitor().id))
    with pytest.raises(LeitorNaoEncontradoError):
        emprestimo_service.emprestar(EmprestimoCreate(livro_id=novo_livro().id, leitor_id=99))


def test_renova_por_mais_7_dias_no_maximo_duas_vezes(
    emprestimo_service, emprestar, novo_livro, novo_leitor
):
    emprestimo = emprestar(novo_livro(), novo_leitor())
    for _ in range(2):
        emprestimo_service.renovar(emprestimo.id)
    assert emprestimo.data_prevista_devolucao == emprestimo_service.hoje + timedelta(days=28)
    with pytest.raises(RegraDeNegocioError, match="limite de 2 renovações"):
        emprestimo_service.renovar(emprestimo.id)


def test_nao_renova_emprestimo_atrasado(emprestimo_service, emprestar, novo_livro, novo_leitor):
    emprestimo = emprestar(novo_livro(), novo_leitor())
    emprestimo_service.hoje += timedelta(days=15)
    with pytest.raises(RegraDeNegocioError, match="em atraso"):
        emprestimo_service.renovar(emprestimo.id)


@pytest.mark.parametrize(("dias", "multa"), [(14, Decimal("0.00")), (17, Decimal("3.00"))])
def test_devolucao_cobra_um_real_por_dia_de_atraso(
    emprestimo_service, emprestar, novo_livro, novo_leitor, dias, multa
):
    livro = novo_livro()
    emprestimo = emprestar(livro, novo_leitor())
    emprestimo_service.hoje += timedelta(days=dias)
    emprestimo_service.devolver(emprestimo.id)
    assert (emprestimo.multa, livro.exemplares_disponiveis) == (multa, 1)
    with pytest.raises(RegraDeNegocioError, match="já foi devolvido"):
        emprestimo_service.devolver(emprestimo.id)


def test_livro_e_leitor_com_emprestimo_ativo_ficam_protegidos(
    livro_service, leitor_service, emprestar, novo_livro, novo_leitor
):
    livro = novo_livro(total_exemplares=2)
    leitor = novo_leitor()
    emprestar(livro, leitor)
    emprestar(livro, novo_leitor())
    reduzido = LivroUpdate(
        titulo=livro.titulo,
        autor=livro.autor,
        isbn=livro.isbn,
        ano_publicacao=livro.ano_publicacao,
        total_exemplares=1,
    )

    with pytest.raises(RegraDeNegocioError, match="quantidade emprestada"):
        livro_service.atualizar(livro.id, reduzido)
    with pytest.raises(RegraDeNegocioError, match="remover um livro"):
        livro_service.remover(livro.id)
    with pytest.raises(RegraDeNegocioError, match="remover um leitor"):
        leitor_service.remover(leitor.id)
