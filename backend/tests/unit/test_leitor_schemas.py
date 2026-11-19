import pytest
from pydantic import ValidationError

from app.schemas.leitor import LeitorCreate

DADOS = {"nome": "Ana Souza", "email": "ana@email.com", "telefone": "(35) 99876-5432"}


def _criar(**alteracoes) -> LeitorCreate:
    return LeitorCreate(**(DADOS | alteracoes))


def test_normaliza_email_e_telefone():
    leitor = _criar(email="  Ana@Email.COM ")
    assert (leitor.email, leitor.telefone) == ("ana@email.com", "35998765432")


@pytest.mark.parametrize("telefone", [None, "", "   "])
def test_telefone_e_opcional(telefone):
    assert _criar(telefone=telefone).telefone is None


@pytest.mark.parametrize("email", ["ana", "ana@email", "ana @email.com"])
def test_rejeita_email_invalido(email):
    with pytest.raises(ValidationError):
        _criar(email=email)


def test_rejeita_telefone_sem_ddd():
    with pytest.raises(ValidationError, match="Telefone inválido"):
        _criar(telefone="99876-5432")
