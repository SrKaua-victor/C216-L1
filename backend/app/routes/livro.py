from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.livro import LivroRepository
from app.schemas.livro import LivroCreate, LivroResponse, LivroUpdate
from app.services.erros import RegraDeNegocioError
from app.services.livro import IsbnDuplicadoError, LivroNaoEncontradoError, LivroService

router = APIRouter(prefix="/livros", tags=["livros"])

LIVRO_NAO_ENCONTRADO = "Livro não encontrado."
ISBN_DUPLICADO = "Já existe um livro cadastrado com esse ISBN."


def get_livro_service(db: Session = Depends(get_db)) -> LivroService:
    return LivroService(LivroRepository(db))


def _nao_encontrado() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=LIVRO_NAO_ENCONTRADO)


def _isbn_duplicado() -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=ISBN_DUPLICADO)


@router.get("", response_model=list[LivroResponse])
def listar_livros(
    busca: str | None = Query(default=None, max_length=100),
    service: LivroService = Depends(get_livro_service),
):
    return service.listar(busca)


@router.get("/{livro_id}", response_model=LivroResponse)
def obter_livro(
    livro_id: int = Path(ge=1),
    service: LivroService = Depends(get_livro_service),
):
    try:
        return service.obter(livro_id)
    except LivroNaoEncontradoError:
        raise _nao_encontrado() from None


@router.post("", response_model=LivroResponse, status_code=status.HTTP_201_CREATED)
def criar_livro(dados: LivroCreate, service: LivroService = Depends(get_livro_service)):
    try:
        return service.criar(dados)
    except IsbnDuplicadoError:
        raise _isbn_duplicado() from None


@router.put("/{livro_id}", response_model=LivroResponse)
def atualizar_livro(
    dados: LivroUpdate,
    livro_id: int = Path(ge=1),
    service: LivroService = Depends(get_livro_service),
):
    try:
        return service.atualizar(livro_id, dados)
    except LivroNaoEncontradoError:
        raise _nao_encontrado() from None
    except IsbnDuplicadoError:
        raise _isbn_duplicado() from None
    except RegraDeNegocioError as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro)) from None


@router.delete("/{livro_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_livro(
    livro_id: int = Path(ge=1),
    service: LivroService = Depends(get_livro_service),
):
    try:
        service.remover(livro_id)
    except LivroNaoEncontradoError:
        raise _nao_encontrado() from None
    except RegraDeNegocioError as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro)) from None
