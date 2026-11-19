from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.leitor import LeitorRepository
from app.schemas.leitor import LeitorCreate, LeitorResponse, LeitorUpdate
from app.services.leitor import EmailDuplicadoError, LeitorNaoEncontradoError, LeitorService

router = APIRouter(prefix="/leitores", tags=["leitores"])

LEITOR_NAO_ENCONTRADO = "Leitor não encontrado."
EMAIL_DUPLICADO = "Já existe um leitor cadastrado com esse e-mail."


def get_leitor_service(db: Session = Depends(get_db)) -> LeitorService:
    return LeitorService(LeitorRepository(db))


def _nao_encontrado() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=LEITOR_NAO_ENCONTRADO)


def _email_duplicado() -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=EMAIL_DUPLICADO)


@router.get("", response_model=list[LeitorResponse])
def listar_leitores(
    busca: str | None = Query(default=None, max_length=100),
    service: LeitorService = Depends(get_leitor_service),
):
    return service.listar(busca)


@router.get("/{leitor_id}", response_model=LeitorResponse)
def obter_leitor(
    leitor_id: int = Path(ge=1),
    service: LeitorService = Depends(get_leitor_service),
):
    try:
        return service.obter(leitor_id)
    except LeitorNaoEncontradoError:
        raise _nao_encontrado() from None


@router.post("", response_model=LeitorResponse, status_code=status.HTTP_201_CREATED)
def criar_leitor(dados: LeitorCreate, service: LeitorService = Depends(get_leitor_service)):
    try:
        return service.criar(dados)
    except EmailDuplicadoError:
        raise _email_duplicado() from None


@router.put("/{leitor_id}", response_model=LeitorResponse)
def atualizar_leitor(
    dados: LeitorUpdate,
    leitor_id: int = Path(ge=1),
    service: LeitorService = Depends(get_leitor_service),
):
    try:
        return service.atualizar(leitor_id, dados)
    except LeitorNaoEncontradoError:
        raise _nao_encontrado() from None
    except EmailDuplicadoError:
        raise _email_duplicado() from None


@router.delete("/{leitor_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_leitor(
    leitor_id: int = Path(ge=1),
    service: LeitorService = Depends(get_leitor_service),
):
    try:
        service.remover(leitor_id)
    except LeitorNaoEncontradoError:
        raise _nao_encontrado() from None
