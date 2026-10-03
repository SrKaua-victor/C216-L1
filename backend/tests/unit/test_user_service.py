import pytest

from app.schemas.user import UserCreate, UserPatch, UserUpdate
from app.services.user import (
    EmailAlreadyRegisteredError,
    UserNotFoundError,
    UserService,
)

ANA = UserCreate(nome="Ana", email="ana@email.com")
BIA = UserCreate(nome="Bia", email="bia@email.com")


@pytest.fixture
def service():
    return UserService()


@pytest.fixture
def service_com_usuarios(service):
    service.create_user(ANA)
    service.create_user(BIA)
    return service


def test_gera_ids_sequenciais(service):
    primeiro = service.create_user(ANA)
    segundo = service.create_user(BIA)
    assert (primeiro.id, segundo.id) == (1, 2)


def test_rejeita_email_duplicado(service):
    service.create_user(ANA)
    with pytest.raises(EmailAlreadyRegisteredError):
        service.create_user(ANA)


def test_busca_inexistente_levanta_erro(service):
    with pytest.raises(UserNotFoundError):
        service.get_user(1)


def test_remove_inexistente_levanta_erro(service):
    with pytest.raises(UserNotFoundError):
        service.delete_user(1)


@pytest.mark.parametrize(
    "nome, esperados",
    [
        ("an", ["Ana"]),
        ("A", ["Ana", "Bia"]),
        ("zzz", []),
    ],
)
def test_lista_filtra_por_nome_sem_diferenciar_maiusculas(service_com_usuarios, nome, esperados):
    assert [usuario.nome for usuario in service_com_usuarios.list_users(nome=nome)] == esperados


def test_lista_respeita_o_limite(service_com_usuarios):
    assert len(service_com_usuarios.list_users(limit=1)) == 1


def test_update_substitui_todos_os_campos(service):
    criado = service.create_user(ANA)
    atualizado = service.update_user(criado.id, UserUpdate(nome="Ana Maria", email="anamaria@email.com"))
    assert atualizado.model_dump() == {"id": criado.id, "nome": "Ana Maria", "email": "anamaria@email.com"}


def test_update_permite_manter_o_proprio_email(service):
    criado = service.create_user(ANA)
    atualizado = service.update_user(criado.id, UserUpdate(nome="Ana Maria", email=ANA.email))
    assert atualizado.email == ANA.email


def test_update_inexistente_levanta_erro(service):
    with pytest.raises(UserNotFoundError):
        service.update_user(1, UserUpdate(nome="Ana", email="ana@email.com"))


def test_patch_preserva_campos_nao_enviados(service):
    criado = service.create_user(ANA)
    atualizado = service.patch_user(criado.id, UserPatch(nome="Ana Maria"))
    assert (atualizado.nome, atualizado.email) == ("Ana Maria", ANA.email)


def test_patch_rejeita_email_de_outro_usuario(service_com_usuarios):
    with pytest.raises(EmailAlreadyRegisteredError):
        service_com_usuarios.patch_user(2, UserPatch(email=ANA.email))
