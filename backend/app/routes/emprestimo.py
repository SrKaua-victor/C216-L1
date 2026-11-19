from collections.abc import Iterator
from contextlib import contextmanager
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.emprestimo import SituacaoEmprestimo
from app.repositories.emprestimo import EmprestimoRepository
from app.repositories.leitor import LeitorRepository
from app.repositories.livro import LivroRepository
from app.routes.leitor import LEITOR_NAO_ENCONTRADO
from app.routes.livro import LIVRO_NAO_ENCONTRADO
from app.schemas.emprestimo import EmprestimoCreate, EmprestimoResponse
from app.services.emprestimo import EmprestimoNaoEncontradoError, EmprestimoService
from app.services.erros import RegraDeNegocioError
from app.services.leitor import LeitorNaoEncontradoError
from app.services.livro import LivroNaoEncontradoError

router = APIRouter(prefix="/emprestimos", tags=["emprestimos"])

EMPRESTIMO_NAO_ENCONTRADO = "Empréstimo não encontrado."

MENSAGENS_NAO_ENCONTRADO = {
    EmprestimoNaoEncontradoError: EMPRESTIMO_NAO_ENCONTRADO,
    LivroNaoEncontradoError: LIVRO_NAO_ENCONTRADO,
    LeitorNaoEncontradoError: LEITOR_NAO_ENCONTRADO,
}


def data_atual() -> date:
    return date.today()


def get_emprestimo_service(
    db: Session = Depends(get_db), hoje: date = Depends(data_atual)
) -> EmprestimoService:
    return EmprestimoService(
        EmprestimoRepository(db), LivroRepository(db), LeitorRepository(db), hoje
    )


@contextmanager
def _traduzir_erros() -> Iterator[None]:
    try:
        yield
    except tuple(MENSAGENS_NAO_ENCONTRADO) as erro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=MENSAGENS_NAO_ENCONTRADO[type(erro)]
        ) from None
    except RegraDeNegocioError as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro)) from None


@router.get("", response_model=list[EmprestimoResponse])
def listar_emprestimos(
    situacao: SituacaoEmprestimo | None = Query(default=None),
    service: EmprestimoService = Depends(get_emprestimo_service),
):
    return service.listar(situacao)


@router.get("/{emprestimo_id}", response_model=EmprestimoResponse)
def obter_emprestimo(
    emprestimo_id: int = Path(ge=1),
    service: EmprestimoService = Depends(get_emprestimo_service),
):
    with _traduzir_erros():
        return service.obter(emprestimo_id)


@router.post("", response_model=EmprestimoResponse, status_code=status.HTTP_201_CREATED)
def criar_emprestimo(
    dados: EmprestimoCreate, service: EmprestimoService = Depends(get_emprestimo_service)
):
    with _traduzir_erros():
        return service.emprestar(dados)


@router.post("/{emprestimo_id}/renovacao", response_model=EmprestimoResponse)
def renovar_emprestimo(
    emprestimo_id: int = Path(ge=1),
    service: EmprestimoService = Depends(get_emprestimo_service),
):
    with _traduzir_erros():
        return service.renovar(emprestimo_id)


@router.post("/{emprestimo_id}/devolucao", response_model=EmprestimoResponse)
def devolver_emprestimo(
    emprestimo_id: int = Path(ge=1),
    service: EmprestimoService = Depends(get_emprestimo_service),
):
    with _traduzir_erros():
        return service.devolver(emprestimo_id)
