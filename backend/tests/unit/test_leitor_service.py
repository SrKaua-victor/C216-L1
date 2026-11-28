import pytest
from sqlalchemy.exc import IntegrityError

from app.schemas.leitor import LeitorCreate, LeitorUpdate
from app.services.leitor import EmailDuplicadoError, LeitorNaoEncontradoError, LeitorService

ANA = LeitorCreate(nome="Ana Souza", email="ana@email.com")
BRUNO = LeitorCreate(nome="Bruno Lima", email="bruno@email.com", telefone="3534711234")


def test_lista_em_ordem_alfabetica_e_filtra_por_nome_ou_email(leitor_service):
    leitor_service.criar(BRUNO)
    leitor_service.criar(ANA)
    assert [leitor.nome for leitor in leitor_service.listar()] == ["Ana Souza", "Bruno Lima"]
    assert [leitor.nome for leitor in leitor_service.listar("bruno@")] == ["Bruno Lima"]


def test_rejeita_email_repetido(leitor_service):
    leitor_service.criar(ANA)
    with pytest.raises(EmailDuplicadoError):
        leitor_service.criar(ANA.model_copy(update={"nome": "Ana Clara"}))


def test_conflito_detectado_pelo_banco_vira_email_duplicado(leitor_repository):
    def save_com_conflito(leitor):
        raise IntegrityError("INSERT INTO leitores", {}, Exception("unique violation"))

    leitor_repository.save = save_com_conflito
    with pytest.raises(EmailDuplicadoError):
        LeitorService(leitor_repository).criar(ANA)


def test_atualiza_leitor_mantendo_o_proprio_email(leitor_service):
    criado = leitor_service.criar(ANA)
    dados = LeitorUpdate(**(ANA.model_dump() | {"telefone": "35998765432"}))
    assert leitor_service.atualizar(criado.id, dados).telefone == "35998765432"


def test_atualizar_com_email_de_outro_leitor_e_rejeitado(leitor_service):
    leitor_service.criar(ANA)
    outro = leitor_service.criar(BRUNO)
    dados = LeitorUpdate(**(BRUNO.model_dump() | {"email": ANA.email}))
    with pytest.raises(EmailDuplicadoError):
        leitor_service.atualizar(outro.id, dados)


def test_remove_leitor(leitor_service, leitor_repository):
    criado = leitor_service.criar(ANA)
    leitor_service.remover(criado.id)
    assert leitor_repository.get(criado.id) is None


def test_leitor_inexistente_levanta_erro(leitor_service):
    with pytest.raises(LeitorNaoEncontradoError):
        leitor_service.obter(99)
