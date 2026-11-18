import pytest
from sqlalchemy.exc import IntegrityError

from app.schemas.livro import LivroCreate, LivroUpdate
from app.services.livro import IsbnDuplicadoError, LivroNaoEncontradoError, LivroService

DOM_CASMURRO = LivroCreate(
    titulo="Dom Casmurro",
    autor="Machado de Assis",
    isbn="9788535910667",
    ano_publicacao=1899,
    total_exemplares=2,
)
GRANDE_SERTAO = LivroCreate(
    titulo="Grande Sertão: Veredas",
    autor="João Guimarães Rosa",
    isbn="9788535920499",
    ano_publicacao=1956,
)


def test_lista_em_ordem_alfabetica_e_filtra_por_titulo_ou_autor(livro_service):
    livro_service.criar(GRANDE_SERTAO)
    livro_service.criar(DOM_CASMURRO)
    assert [livro.titulo for livro in livro_service.listar()] == [
        "Dom Casmurro",
        "Grande Sertão: Veredas",
    ]
    assert [livro.titulo for livro in livro_service.listar(" MACHADO ")] == ["Dom Casmurro"]


def test_rejeita_isbn_repetido(livro_service):
    livro_service.criar(DOM_CASMURRO)
    with pytest.raises(IsbnDuplicadoError):
        livro_service.criar(DOM_CASMURRO.model_copy(update={"titulo": "Outro"}))


def test_conflito_detectado_pelo_banco_vira_isbn_duplicado(livro_repository):
    def save_com_conflito(livro):
        raise IntegrityError("INSERT INTO livros", {}, Exception("unique violation"))

    livro_repository.save = save_com_conflito
    with pytest.raises(IsbnDuplicadoError):
        LivroService(livro_repository).criar(DOM_CASMURRO)


def test_atualiza_livro_mantendo_o_proprio_isbn(livro_service):
    criado = livro_service.criar(DOM_CASMURRO)
    dados = LivroUpdate(**(DOM_CASMURRO.model_dump() | {"total_exemplares": 5}))
    assert livro_service.atualizar(criado.id, dados).total_exemplares == 5


def test_atualizar_com_isbn_de_outro_livro_e_rejeitado(livro_service):
    livro_service.criar(DOM_CASMURRO)
    outro = livro_service.criar(GRANDE_SERTAO)
    dados = LivroUpdate(**(GRANDE_SERTAO.model_dump() | {"isbn": DOM_CASMURRO.isbn}))
    with pytest.raises(IsbnDuplicadoError):
        livro_service.atualizar(outro.id, dados)


def test_remove_livro(livro_service, livro_repository):
    criado = livro_service.criar(DOM_CASMURRO)
    livro_service.remover(criado.id)
    assert livro_repository.get(criado.id) is None


def test_livro_inexistente_levanta_erro(livro_service):
    with pytest.raises(LivroNaoEncontradoError):
        livro_service.obter(99)
