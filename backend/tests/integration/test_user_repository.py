import pytest
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.repositories.user import UserRepository


@pytest.fixture
def repository(db_session):
    return UserRepository(db_session)


def test_save_persiste_e_gera_id(repository):
    salvo = repository.save(User(nome="Ana", email="ana@email.com"))
    assert salvo.id is not None
    assert repository.get(salvo.id).email == "ana@email.com"


def test_get_inexistente_retorna_none(repository):
    assert repository.get(999) is None


def test_get_by_email(repository):
    repository.save(User(nome="Ana", email="ana@email.com"))
    assert repository.get_by_email("ana@email.com").nome == "Ana"
    assert repository.get_by_email("ninguem@email.com") is None


def test_list_ordena_por_id_e_respeita_o_limite(repository):
    for nome in ("Ana", "Bia", "Caio"):
        repository.save(User(nome=nome, email=f"{nome.lower()}@email.com"))
    assert [user.nome for user in repository.list()] == ["Ana", "Bia", "Caio"]
    assert [user.nome for user in repository.list(limit=2)] == ["Ana", "Bia"]


def test_list_filtra_por_nome_sem_diferenciar_maiusculas(repository):
    repository.save(User(nome="Ana", email="ana@email.com"))
    repository.save(User(nome="Bia", email="bia@email.com"))
    assert [user.nome for user in repository.list(nome="AN")] == ["Ana"]


def test_list_trata_curinga_do_like_como_texto(repository):
    repository.save(User(nome="Ana", email="ana@email.com"))
    repository.save(User(nome="100% Bia", email="bia@email.com"))
    assert [user.nome for user in repository.list(nome="%")] == ["100% Bia"]


def test_email_duplicado_e_barrado_pela_constraint_do_banco(repository):
    repository.save(User(nome="Ana", email="ana@email.com"))
    with pytest.raises(IntegrityError):
        repository.save(User(nome="Outra Ana", email="ana@email.com"))
    assert repository.get_by_email("ana@email.com").nome == "Ana"


def test_delete_remove_do_banco(repository):
    salvo = repository.save(User(nome="Ana", email="ana@email.com"))
    repository.delete(salvo)
    assert repository.get(salvo.id) is None
